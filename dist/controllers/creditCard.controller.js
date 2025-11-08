"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCardController = void 0;
const zod_1 = require("zod");
const creditCard_service_1 = require("../services/creditCard.service");
const creditCardService = new creditCard_service_1.CreditCardService();
const createCreditCardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    limit: zod_1.z.number().positive('Limite deve ser positivo'),
    closingDay: zod_1.z.number().int().min(1).max(31, 'Dia de fechamento inválido'),
    dueDay: zod_1.z.number().int().min(1).max(31, 'Dia de vencimento inválido'),
});
const updateCreditCardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().positive().optional(),
    closingDay: zod_1.z.number().int().min(1).max(31).optional(),
    dueDay: zod_1.z.number().int().min(1).max(31).optional(),
});
class CreditCardController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = createCreditCardSchema.parse(req.body);
            const creditCard = await creditCardService.create(req.userId, data);
            return res.status(201).json(creditCard);
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
            const creditCards = await creditCardService.findAll(req.userId);
            return res.json(creditCards);
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
            const creditCard = await creditCardService.findById(id, req.userId);
            return res.json(creditCard);
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
            const data = updateCreditCardSchema.parse(req.body);
            const creditCard = await creditCardService.update(id, req.userId, data);
            return res.json(creditCard);
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
            await creditCardService.delete(id, req.userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getCurrentBill(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const bill = await creditCardService.getCurrentBillTransactions(id, req.userId);
            return res.json(bill);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.CreditCardController = CreditCardController;
//# sourceMappingURL=creditCard.controller.js.map