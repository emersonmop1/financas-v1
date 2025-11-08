"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const database_1 = __importDefault(require("../config/database"));
class AccountService {
    async create(userId, data) {
        const account = await database_1.default.account.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                balance: data.balance || 0,
                currency: data.currency || 'BRL',
            },
        });
        return account;
    }
    async findAll(userId) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return accounts;
    }
    async findById(id, userId) {
        const account = await database_1.default.account.findFirst({
            where: { id, userId },
        });
        if (!account) {
            throw new Error('Conta não encontrada');
        }
        return account;
    }
    async update(id, userId, data) {
        // Verificar se a conta pertence ao usuário
        await this.findById(id, userId);
        const account = await database_1.default.account.update({
            where: { id },
            data,
        });
        return account;
    }
    async delete(id, userId) {
        // Verificar se a conta pertence ao usuário
        await this.findById(id, userId);
        await database_1.default.account.delete({
            where: { id },
        });
    }
    async getTotalBalance(userId) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
        });
        const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
        return total;
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.service.js.map