"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const zod_1 = require("zod");
const goal_service_1 = require("../services/goal.service");
const goalService = new goal_service_1.GoalService();
const createGoalSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    targetAmount: zod_1.z.number().positive('Valor meta deve ser positivo'),
    currentAmount: zod_1.z.number().min(0).optional(),
    deadline: zod_1.z.string().transform((val) => new Date(val)).optional(),
});
const updateGoalSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    targetAmount: zod_1.z.number().positive().optional(),
    currentAmount: zod_1.z.number().min(0).optional(),
    deadline: zod_1.z.string().transform((val) => new Date(val)).optional(),
    status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});
const addProgressSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
});
class GoalController {
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = createGoalSchema.parse(req.body);
            const goal = await goalService.create(req.userId, data);
            return res.status(201).json(goal);
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
            const status = req.query.status;
            const goals = await goalService.findAll(req.userId, status);
            return res.json(goals);
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
            const goal = await goalService.findById(id, req.userId);
            return res.json(goal);
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
            const data = updateGoalSchema.parse(req.body);
            const goal = await goalService.update(id, req.userId, data);
            return res.json(goal);
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
            await goalService.delete(id, req.userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async addProgress(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const { amount } = addProgressSchema.parse(req.body);
            const goal = await goalService.addProgress(id, req.userId, amount);
            return res.json(goal);
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
            const stats = await goalService.getStats(req.userId);
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
exports.GoalController = GoalController;
//# sourceMappingURL=goal.controller.js.map