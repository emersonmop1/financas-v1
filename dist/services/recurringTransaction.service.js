"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringTransactionService = void 0;
const database_1 = __importDefault(require("../config/database"));
const dateHelper_1 = require("../utils/dateHelper");
class RecurringTransactionService {
    async create(userId, data) {
        const frequency = data.frequency || 'MONTHLY';
        const startDate = new Date(data.startDate);
        // Calculate next execution date
        const nextExecutionDate = (0, dateHelper_1.calculateNextExecutionDate)(data.dayOfMonth, frequency, startDate);
        return await database_1.default.recurringTransaction.create({
            data: {
                userId,
                accountId: data.accountId || null,
                categoryId: data.categoryId,
                creditCardId: data.creditCardId || null,
                description: data.description,
                amount: data.amount,
                type: data.type,
                frequency,
                dayOfMonth: data.dayOfMonth,
                startDate,
                endDate: data.endDate ? new Date(data.endDate) : null,
                nextExecutionDate,
            },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
        });
    }
    async getAll(userId, includeInactive = false) {
        return await database_1.default.recurringTransaction.findMany({
            where: {
                userId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
            orderBy: {
                dayOfMonth: 'asc',
            },
        });
    }
    async getById(userId, id) {
        const recurringTransaction = await database_1.default.recurringTransaction.findFirst({
            where: { id, userId },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
        });
        if (!recurringTransaction) {
            throw new Error('Transação recorrente não encontrada');
        }
        return recurringTransaction;
    }
    async update(userId, id, data) {
        await this.getById(userId, id);
        return await database_1.default.recurringTransaction.update({
            where: { id },
            data: {
                description: data.description,
                amount: data.amount,
                categoryId: data.categoryId,
                dayOfMonth: data.dayOfMonth,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                isActive: data.isActive,
            },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
        });
    }
    async delete(userId, id) {
        await this.getById(userId, id);
        await database_1.default.recurringTransaction.delete({
            where: { id },
        });
    }
    async toggleActive(userId, id) {
        const recurringTransaction = await this.getById(userId, id);
        return await database_1.default.recurringTransaction.update({
            where: { id },
            data: {
                isActive: !recurringTransaction.isActive,
            },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
        });
    }
}
exports.RecurringTransactionService = RecurringTransactionService;
//# sourceMappingURL=recurringTransaction.service.js.map