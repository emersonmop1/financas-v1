"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalService = void 0;
const database_1 = __importDefault(require("../config/database"));
class GoalService {
    async create(userId, data) {
        const goal = await database_1.default.goal.create({
            data: {
                userId,
                name: data.name,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount || 0,
                deadline: data.deadline,
                status: 'ACTIVE',
            },
        });
        return goal;
    }
    async findAll(userId, status) {
        const where = { userId };
        if (status) {
            where.status = status;
        }
        const goals = await database_1.default.goal.findMany({
            where,
            orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
        });
        // Adicionar progresso calculado
        return goals.map((goal) => ({
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            progress: this.calculateProgress(Number(goal.currentAmount), Number(goal.targetAmount)),
        }));
    }
    async findById(id, userId) {
        const goal = await database_1.default.goal.findFirst({
            where: { id, userId },
        });
        if (!goal) {
            throw new Error('Meta não encontrada');
        }
        return {
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            progress: this.calculateProgress(Number(goal.currentAmount), Number(goal.targetAmount)),
        };
    }
    async update(id, userId, data) {
        // Verificar se a meta pertence ao usuário
        await this.findById(id, userId);
        const goal = await database_1.default.goal.update({
            where: { id },
            data,
        });
        // Verificar se a meta foi completada
        if (data.currentAmount &&
            data.currentAmount >= Number(goal.targetAmount) &&
            goal.status === 'ACTIVE') {
            await database_1.default.goal.update({
                where: { id },
                data: { status: 'COMPLETED' },
            });
        }
        return goal;
    }
    async delete(id, userId) {
        // Verificar se a meta pertence ao usuário
        await this.findById(id, userId);
        await database_1.default.goal.delete({
            where: { id },
        });
    }
    async addProgress(id, userId, amount) {
        const goal = await this.findById(id, userId);
        const newAmount = Number(goal.currentAmount) + amount;
        const isCompleted = newAmount >= Number(goal.targetAmount);
        await database_1.default.goal.update({
            where: { id },
            data: {
                currentAmount: newAmount,
                status: isCompleted ? 'COMPLETED' : goal.status,
            },
        });
        return this.findById(id, userId);
    }
    async getStats(userId) {
        const goals = await database_1.default.goal.findMany({
            where: { userId },
        });
        const active = goals.filter((g) => g.status === 'ACTIVE').length;
        const completed = goals.filter((g) => g.status === 'COMPLETED').length;
        const cancelled = goals.filter((g) => g.status === 'CANCELLED').length;
        const totalTarget = goals
            .filter((g) => g.status === 'ACTIVE')
            .reduce((sum, g) => sum + Number(g.targetAmount), 0);
        const totalSaved = goals
            .filter((g) => g.status === 'ACTIVE')
            .reduce((sum, g) => sum + Number(g.currentAmount), 0);
        return {
            total: goals.length,
            active,
            completed,
            cancelled,
            totalTarget,
            totalSaved,
            overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
        };
    }
    calculateProgress(current, target) {
        if (target === 0)
            return 0;
        return Math.min((current / target) * 100, 100);
    }
}
exports.GoalService = GoalService;
//# sourceMappingURL=goal.service.js.map