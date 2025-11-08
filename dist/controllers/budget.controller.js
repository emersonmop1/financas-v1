"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetController = void 0;
const budget_service_1 = require("../services/budget.service");
const budgetService = new budget_service_1.BudgetService();
class BudgetController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { categoryId, month, year, amount } = req.body;
            if (!month || !year || !amount) {
                return res.status(400).json({
                    error: 'Mês, ano e valor são obrigatórios',
                });
            }
            if (month < 1 || month > 12) {
                return res.status(400).json({
                    error: 'Mês deve estar entre 1 e 12',
                });
            }
            if (amount <= 0) {
                return res.status(400).json({
                    error: 'Valor deve ser maior que zero',
                });
            }
            const budget = await budgetService.create(req.userId, {
                categoryId,
                month: Number(month),
                year: Number(year),
                amount: Number(amount),
            });
            return res.status(201).json(budget);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getAll(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { month, year, categoryId } = req.query;
            const filters = {};
            if (month)
                filters.month = Number(month);
            if (year)
                filters.year = Number(year);
            if (categoryId)
                filters.categoryId = String(categoryId);
            const budgets = await budgetService.getAll(req.userId, filters);
            return res.json(budgets);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getById(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const budget = await budgetService.getById(req.userId, id);
            return res.json(budget);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async update(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const { amount } = req.body;
            if (amount !== undefined && amount <= 0) {
                return res.status(400).json({
                    error: 'Valor deve ser maior que zero',
                });
            }
            const budget = await budgetService.update(req.userId, id, {
                amount: amount ? Number(amount) : undefined,
            });
            return res.json(budget);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async delete(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            await budgetService.delete(req.userId, id);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getWithSpending(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({
                    error: 'Mês e ano são obrigatórios',
                });
            }
            console.log('getBudgetsWithSpending - userId:', req.userId, 'month:', month, 'year:', year);
            const budgets = await budgetService.getBudgetsWithSpending(req.userId, Number(month), Number(year));
            console.log('budgets found:', budgets.length);
            return res.json(budgets);
        }
        catch (error) {
            console.error('Error in getWithSpending:', error);
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getSummary(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { month, year } = req.query;
            if (!month || !year) {
                return res.status(400).json({
                    error: 'Mês e ano são obrigatórios',
                });
            }
            const summary = await budgetService.getBudgetSummary(req.userId, Number(month), Number(year));
            return res.json(summary);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.BudgetController = BudgetController;
//# sourceMappingURL=budget.controller.js.map