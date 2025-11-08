"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetService = void 0;
const database_1 = __importDefault(require("../config/database"));
const library_1 = require("@prisma/client/runtime/library");
class BudgetService {
    async create(userId, data) {
        // Verificar se já existe orçamento para este período
        const existing = await database_1.default.budget.findFirst({
            where: {
                userId,
                categoryId: data.categoryId || null,
                month: data.month,
                year: data.year,
            },
        });
        if (existing) {
            throw new Error('Já existe um orçamento para este período');
        }
        // Se categoryId foi informado, verificar se categoria existe
        if (data.categoryId) {
            const category = await database_1.default.category.findFirst({
                where: {
                    id: data.categoryId,
                    OR: [{ userId }, { isDefault: true }],
                },
            });
            if (!category) {
                throw new Error('Categoria não encontrada');
            }
        }
        return await database_1.default.budget.create({
            data: {
                userId,
                categoryId: data.categoryId || null,
                month: data.month,
                year: data.year,
                amount: data.amount,
            },
            include: {
                category: true,
            },
        });
    }
    async getAll(userId, filters) {
        const where = { userId };
        if (filters?.month)
            where.month = filters.month;
        if (filters?.year)
            where.year = filters.year;
        if (filters?.categoryId)
            where.categoryId = filters.categoryId;
        return await database_1.default.budget.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
        });
    }
    async getById(userId, id) {
        const budget = await database_1.default.budget.findFirst({
            where: { id, userId },
            include: {
                category: true,
            },
        });
        if (!budget) {
            throw new Error('Orçamento não encontrado');
        }
        return budget;
    }
    async update(userId, id, data) {
        const budget = await this.getById(userId, id);
        return await database_1.default.budget.update({
            where: { id: budget.id },
            data: {
                amount: data.amount,
            },
            include: {
                category: true,
            },
        });
    }
    async delete(userId, id) {
        const budget = await this.getById(userId, id);
        await database_1.default.budget.delete({
            where: { id: budget.id },
        });
    }
    /**
     * Obtém orçamentos com gastos reais do período
     */
    async getBudgetsWithSpending(userId, month, year) {
        // Buscar orçamentos do período
        const budgets = await database_1.default.budget.findMany({
            where: {
                userId,
                month,
                year,
            },
            include: {
                category: true,
            },
        });
        // Calcular data inicial e final do período
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        // Para cada orçamento, calcular o gasto real
        const budgetsWithSpending = [];
        for (const budget of budgets) {
            // Buscar transações do período
            const where = {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                type: 'EXPENSE',
                isPaid: true,
            };
            // Se tem categoryId, filtrar por categoria
            if (budget.categoryId) {
                where.categoryId = budget.categoryId;
            }
            // Buscar transações de contas (não cartões de crédito)
            where.accountId = { not: null };
            const transactions = await database_1.default.transaction.findMany({
                where,
                select: {
                    amount: true,
                },
            });
            // Calcular total gasto
            const spent = transactions.reduce((sum, t) => sum.add(t.amount), new library_1.Decimal(0));
            const remaining = new library_1.Decimal(budget.amount).sub(spent);
            const percentage = Number(budget.amount) > 0
                ? (Number(spent) / Number(budget.amount)) * 100
                : 0;
            budgetsWithSpending.push({
                id: budget.id,
                userId: budget.userId,
                categoryId: budget.categoryId,
                month: budget.month,
                year: budget.year,
                amount: budget.amount,
                spent,
                remaining,
                percentage,
                category: budget.category
                    ? {
                        id: budget.category.id,
                        name: budget.category.name,
                        color: budget.category.color,
                        icon: budget.category.icon,
                    }
                    : undefined,
            });
        }
        return budgetsWithSpending;
    }
    /**
     * Obtém resumo geral do orçamento do período
     */
    async getBudgetSummary(userId, month, year) {
        const budgetsWithSpending = await this.getBudgetsWithSpending(userId, month, year);
        const totalBudget = budgetsWithSpending.reduce((sum, b) => sum.add(b.amount), new library_1.Decimal(0));
        const totalSpent = budgetsWithSpending.reduce((sum, b) => sum.add(b.spent), new library_1.Decimal(0));
        const totalRemaining = totalBudget.sub(totalSpent);
        const totalPercentage = Number(totalBudget) > 0
            ? (Number(totalSpent) / Number(totalBudget)) * 100
            : 0;
        return {
            month,
            year,
            totalBudget,
            totalSpent,
            totalRemaining,
            totalPercentage,
            budgets: budgetsWithSpending,
        };
    }
}
exports.BudgetService = BudgetService;
//# sourceMappingURL=budget.service.js.map