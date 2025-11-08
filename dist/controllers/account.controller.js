"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const zod_1 = require("zod");
const account_service_1 = require("../services/account.service");
const accountService = new account_service_1.AccountService();
const createAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    type: zod_1.z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH']),
    balance: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
});
const updateAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH']).optional(),
    balance: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
});
class AccountController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = createAccountSchema.parse(req.body);
            const account = await accountService.create(req.userId, data);
            return res.status(201).json(account);
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
            const accounts = await accountService.findAll(req.userId);
            return res.json(accounts);
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
            const account = await accountService.findById(id, req.userId);
            return res.json(account);
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
            const data = updateAccountSchema.parse(req.body);
            const account = await accountService.update(id, req.userId, data);
            return res.json(account);
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
            await accountService.delete(id, req.userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getTotalBalance(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const total = await accountService.getTotalBalance(req.userId);
            return res.json({ total });
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=account.controller.js.map