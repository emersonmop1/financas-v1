"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditCardService = void 0;
const database_1 = __importDefault(require("../config/database"));
const date_fns_1 = require("date-fns");
class CreditCardService {
    async create(userId, data) {
        const creditCard = await database_1.default.creditCard.create({
            data: {
                userId,
                name: data.name,
                limit: data.limit,
                closingDay: data.closingDay,
                dueDay: data.dueDay,
            },
        });
        return creditCard;
    }
    async findAll(userId) {
        const creditCards = await database_1.default.creditCard.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        // Adicionar informações de limite disponível para cada cartão
        const cardsWithLimits = await Promise.all(creditCards.map(async (card) => {
            const currentBillAmount = await this.getCurrentBillAmount(card.id);
            const availableLimit = Number(card.limit) - currentBillAmount;
            return {
                ...card,
                currentBillAmount,
                availableLimit,
                limit: Number(card.limit),
            };
        }));
        return cardsWithLimits;
    }
    async findById(id, userId) {
        const creditCard = await database_1.default.creditCard.findFirst({
            where: { id, userId },
        });
        if (!creditCard) {
            throw new Error('Cartão de crédito não encontrado');
        }
        const currentBillAmount = await this.getCurrentBillAmount(id);
        const availableLimit = Number(creditCard.limit) - currentBillAmount;
        return {
            ...creditCard,
            currentBillAmount,
            availableLimit,
            limit: Number(creditCard.limit),
        };
    }
    async update(id, userId, data) {
        // Verificar se o cartão pertence ao usuário
        await this.findById(id, userId);
        const creditCard = await database_1.default.creditCard.update({
            where: { id },
            data,
        });
        return creditCard;
    }
    async delete(id, userId) {
        // Verificar se o cartão pertence ao usuário
        await this.findById(id, userId);
        // Verificar se há transações vinculadas
        const transactionsCount = await database_1.default.transaction.count({
            where: { creditCardId: id },
        });
        if (transactionsCount > 0) {
            throw new Error('Não é possível deletar um cartão com transações vinculadas');
        }
        await database_1.default.creditCard.delete({
            where: { id },
        });
    }
    // Obter valor da fatura atual
    async getCurrentBillAmount(creditCardId) {
        const { startDate, endDate } = this.getCurrentBillPeriod(await this.getCardClosingDay(creditCardId));
        const transactions = await database_1.default.transaction.findMany({
            where: {
                creditCardId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                type: 'EXPENSE',
            },
        });
        const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        return total;
    }
    // Obter transações da fatura atual
    async getCurrentBillTransactions(creditCardId, userId) {
        // Verificar se o cartão pertence ao usuário
        await this.findById(creditCardId, userId);
        const card = await database_1.default.creditCard.findUnique({
            where: { id: creditCardId },
        });
        if (!card) {
            throw new Error('Cartão não encontrado');
        }
        const { startDate, endDate } = this.getCurrentBillPeriod(card.closingDay);
        const transactions = await database_1.default.transaction.findMany({
            where: {
                creditCardId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                type: 'EXPENSE',
            },
            include: {
                category: true,
                account: true,
            },
            orderBy: { date: 'desc' },
        });
        return {
            transactions,
            total: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
            closingDate: endDate,
            dueDate: this.getDueDate(card.closingDay, card.dueDay),
        };
    }
    // Calcular período da fatura atual
    getCurrentBillPeriod(closingDay) {
        const now = new Date();
        const currentDay = now.getDate();
        let startDate;
        let endDate;
        if (currentDay <= closingDay) {
            // Fatura do mês passado ao dia de fechamento deste mês
            const lastMonth = (0, date_fns_1.addMonths)(now, -1);
            startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), closingDay + 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), closingDay);
        }
        else {
            // Fatura do dia de fechamento deste mês ao dia de fechamento do próximo mês
            startDate = new Date(now.getFullYear(), now.getMonth(), closingDay + 1);
            const nextMonth = (0, date_fns_1.addMonths)(now, 1);
            endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), closingDay);
        }
        return { startDate, endDate };
    }
    // Calcular data de vencimento
    getDueDate(closingDay, dueDay) {
        const now = new Date();
        const currentDay = now.getDate();
        let dueDate;
        if (currentDay <= closingDay) {
            // Vencimento neste mês
            dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
        }
        else {
            // Vencimento no próximo mês
            const nextMonth = (0, date_fns_1.addMonths)(now, 1);
            dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dueDay);
        }
        return dueDate;
    }
    async getCardClosingDay(creditCardId) {
        const card = await database_1.default.creditCard.findUnique({
            where: { id: creditCardId },
        });
        if (!card) {
            throw new Error('Cartão não encontrado');
        }
        return card.closingDay;
    }
}
exports.CreditCardService = CreditCardService;
//# sourceMappingURL=creditCard.service.js.map