"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringTransactionController = void 0;
const recurringTransaction_service_1 = require("../services/recurringTransaction.service");
const scheduler_service_1 = require("../services/scheduler.service");
const recurringTransactionService = new recurringTransaction_service_1.RecurringTransactionService();
class RecurringTransactionController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const recurringTransaction = await recurringTransactionService.create(req.userId, req.body);
            return res.status(201).json(recurringTransaction);
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
            const includeInactive = req.query.includeInactive === 'true';
            const recurringTransactions = await recurringTransactionService.getAll(req.userId, includeInactive);
            return res.json(recurringTransactions);
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
            const recurringTransaction = await recurringTransactionService.getById(req.userId, id);
            return res.json(recurringTransaction);
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
            const recurringTransaction = await recurringTransactionService.update(req.userId, id, req.body);
            return res.json(recurringTransaction);
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
            await recurringTransactionService.delete(req.userId, id);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async toggleActive(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const recurringTransaction = await recurringTransactionService.toggleActive(req.userId, id);
            return res.json(recurringTransaction);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async triggerExecution(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            // Verify user owns this recurring transaction
            await recurringTransactionService.getById(req.userId, id);
            // Execute the recurring transaction
            await scheduler_service_1.schedulerService.executeRecurringTransaction(id);
            return res.json({
                message: 'Transação recorrente executada com sucesso',
                executedAt: new Date().toISOString(),
            });
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getExecutionLogs(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            // Verify user owns this recurring transaction
            await recurringTransactionService.getById(req.userId, id);
            // Get execution logs
            const logs = await scheduler_service_1.schedulerService.getExecutionLogs(id);
            return res.json(logs);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.RecurringTransactionController = RecurringTransactionController;
//# sourceMappingURL=recurringTransaction.controller.js.map