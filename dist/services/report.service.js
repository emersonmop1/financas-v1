"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const database_1 = __importDefault(require("../config/database"));
const date_fns_1 = require("date-fns");
class ReportService {
    // Estatísticas por categoria
    async getExpensesByCategory(userId, startDate, endDate) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((acc) => acc.id);
        const where = {
            accountId: { in: accountIds },
            type: 'EXPENSE',
            isPaid: true,
        };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        const transactions = await database_1.default.transaction.findMany({
            where,
            include: {
                category: true,
            },
        });
        // Agrupar por categoria
        const categoryMap = new Map();
        transactions.forEach((transaction) => {
            const categoryId = transaction.categoryId;
            const amount = Number(transaction.amount);
            if (categoryMap.has(categoryId)) {
                const existing = categoryMap.get(categoryId);
                existing.total += amount;
            }
            else {
                categoryMap.set(categoryId, {
                    name: transaction.category.name,
                    total: amount,
                    color: transaction.category.color,
                    icon: transaction.category.icon,
                });
            }
        });
        return Array.from(categoryMap.values());
    }
    // Evolução mensal (últimos 6 meses)
    async getMonthlyEvolution(userId) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((acc) => acc.id);
        const months = [];
        const data = [];
        // Gerar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = (0, date_fns_1.subMonths)(new Date(), i);
            const startDate = (0, date_fns_1.startOfMonth)(date);
            const endDate = (0, date_fns_1.endOfMonth)(date);
            const [income, expense] = await Promise.all([
                database_1.default.transaction.aggregate({
                    where: {
                        accountId: { in: accountIds },
                        type: 'INCOME',
                        isPaid: true,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: { amount: true },
                }),
                database_1.default.transaction.aggregate({
                    where: {
                        accountId: { in: accountIds },
                        type: 'EXPENSE',
                        isPaid: true,
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: { amount: true },
                }),
            ]);
            const incomeValue = Number(income._sum.amount || 0);
            const expenseValue = Number(expense._sum.amount || 0);
            data.push({
                month: (0, date_fns_1.format)(date, 'MMM/yy'),
                income: incomeValue,
                expense: expenseValue,
                balance: incomeValue - expenseValue,
            });
        }
        return data;
    }
    // Comparação mensal (mês atual vs anterior)
    async getMonthlyComparison(userId) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((acc) => acc.id);
        const currentMonth = {
            start: (0, date_fns_1.startOfMonth)(new Date()),
            end: (0, date_fns_1.endOfMonth)(new Date()),
        };
        const previousMonth = {
            start: (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(new Date(), 1)),
            end: (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(new Date(), 1)),
        };
        const [currentStats, previousStats] = await Promise.all([
            this.getStatsForPeriod(accountIds, currentMonth.start, currentMonth.end),
            this.getStatsForPeriod(accountIds, previousMonth.start, previousMonth.end),
        ]);
        return {
            current: currentStats,
            previous: previousStats,
            changes: {
                income: currentStats.income - previousStats.income,
                expense: currentStats.expense - previousStats.expense,
                balance: currentStats.balance - previousStats.balance,
            },
        };
    }
    async getStatsForPeriod(accountIds, startDate, endDate) {
        const [income, expense] = await Promise.all([
            database_1.default.transaction.aggregate({
                where: {
                    accountId: { in: accountIds },
                    type: 'INCOME',
                    isPaid: true,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: { amount: true },
            }),
            database_1.default.transaction.aggregate({
                where: {
                    accountId: { in: accountIds },
                    type: 'EXPENSE',
                    isPaid: true,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _sum: { amount: true },
            }),
        ]);
        const incomeValue = Number(income._sum.amount || 0);
        const expenseValue = Number(expense._sum.amount || 0);
        return {
            income: incomeValue,
            expense: expenseValue,
            balance: incomeValue - expenseValue,
        };
    }
    // Top categorias de despesas
    async getTopExpenseCategories(userId, limit = 5, startDate, endDate) {
        const categories = await this.getExpensesByCategory(userId, startDate, endDate);
        return categories
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map