"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const zod_1 = require("zod");
const transaction_service_1 = require("../services/transaction.service");
const transactionService = new transaction_service_1.TransactionService();
const createTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string(),
    creditCardId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().min(1, 'Descrição é obrigatória'),
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    date: zod_1.z.string().transform((val) => new Date(val)),
    type: zod_1.z.enum(['INCOME', 'EXPENSE']),
    isPaid: zod_1.z.boolean().optional(),
    installments: zod_1.z.number().int().positive().optional(),
    installmentNum: zod_1.z.number().int().positive().optional(),
    notes: zod_1.z.string().optional(),
});
const updateTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid().optional(),
    categoryId: zod_1.z.string().optional(),
    creditCardId: zod_1.z.string().uuid().optional(),
    description: zod_1.z.string().min(1).optional(),
    amount: zod_1.z.number().positive().optional(),
    date: zod_1.z.string().transform((val) => new Date(val)).optional(),
    type: zod_1.z.enum(['INCOME', 'EXPENSE']).optional(),
    isPaid: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
});
class TransactionController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = createTransactionSchema.parse(req.body);
            const transaction = await transactionService.create(req.userId, data);
            return res.status(201).json(transaction);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async findAll(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const filters = {};
            if (req.query.accountId) {
                filters.accountId = req.query.accountId;
            }
            if (req.query.categoryId) {
                filters.categoryId = req.query.categoryId;
            }
            if (req.query.type) {
                filters.type = req.query.type;
            }
            if (req.query.isPaid) {
                filters.isPaid = req.query.isPaid === 'true';
            }
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate);
            }
            const transactions = await transactionService.findAll(req.userId, filters);
            return res.json(transactions);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async findById(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const transaction = await transactionService.findById(id, req.userId);
            return res.json(transaction);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(404).json({ error: error.message });
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
            const data = updateTransactionSchema.parse(req.body);
            const transaction = await transactionService.update(id, req.userId, data);
            return res.json(transaction);
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
            await transactionService.delete(id, req.userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getStats(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            let startDate;
            let endDate;
            if (req.query.startDate) {
                startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                endDate = new Date(req.query.endDate);
            }
            const stats = await transactionService.getStats(req.userId, startDate, endDate);
            return res.json(stats);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map