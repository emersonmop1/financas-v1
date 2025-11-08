"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const database_1 = __importDefault(require("../config/database"));
class TransactionService {
    async create(userId, data) {
        // Validar: deve ter OU accountId OU creditCardId (não ambos, não nenhum)
        if (!data.accountId && !data.creditCardId) {
            throw new Error('Informe uma conta ou cartão de crédito');
        }
        if (data.accountId && data.creditCardId) {
            throw new Error('Informe apenas uma conta OU um cartão de crédito, não ambos');
        }
        // Verificar se a conta pertence ao usuário (se fornecida)
        if (data.accountId) {
            const account = await database_1.default.account.findFirst({
                where: { id: data.accountId, userId },
            });
            if (!account) {
                throw new Error('Conta não encontrada');
            }
        }
        // Verificar se o cartão pertence ao usuário (se fornecido)
        if (data.creditCardId) {
            const creditCard = await database_1.default.creditCard.findFirst({
                where: { id: data.creditCardId, userId },
            });
            if (!creditCard) {
                throw new Error('Cartão de crédito não encontrado');
            }
        }
        // Verificar se a categoria existe
        const category = await database_1.default.category.findFirst({
            where: {
                id: data.categoryId,
                OR: [{ userId }, { isDefault: true }],
            },
        });
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        // Criar transação e atualizar saldo da conta (se houver)
        const result = await database_1.default.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    accountId: data.accountId,
                    categoryId: data.categoryId,
                    creditCardId: data.creditCardId,
                    description: data.description,
                    amount: data.amount,
                    date: data.date,
                    type: data.type,
                    isPaid: data.isPaid ?? true,
                    installments: data.installments,
                    installmentNum: data.installmentNum,
                    notes: data.notes,
                },
                include: {
                    category: true,
                    account: true,
                    creditCard: true,
                },
            });
            // Atualizar saldo da conta se a transação estiver paga E tiver conta
            if (data.isPaid && data.accountId) {
                const balanceChange = data.type === 'INCOME' ? data.amount : -data.amount;
                await tx.account.update({
                    where: { id: data.accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
            return transaction;
        });
        return result;
    }
    async findAll(userId, filters) {
        // Buscar todas as contas e cartões do usuário
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const creditCards = await database_1.default.creditCard.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((acc) => acc.id);
        const creditCardIds = creditCards.map((card) => card.id);
        const where = {
            OR: [
                { accountId: { in: accountIds } },
                { creditCardId: { in: creditCardIds } },
            ],
        };
        if (filters) {
            if (filters.accountId) {
                where.accountId = filters.accountId;
            }
            if (filters.categoryId) {
                where.categoryId = filters.categoryId;
            }
            if (filters.type) {
                where.type = filters.type;
            }
            if (filters.isPaid !== undefined) {
                where.isPaid = filters.isPaid;
            }
            if (filters.startDate || filters.endDate) {
                where.date = {};
                if (filters.startDate) {
                    where.date.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.date.lte = filters.endDate;
                }
            }
        }
        const transactions = await database_1.default.transaction.findMany({
            where,
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
            orderBy: { date: 'desc' },
        });
        return transactions;
    }
    async findById(id, userId) {
        const transaction = await database_1.default.transaction.findFirst({
            where: {
                id,
                OR: [
                    { account: { userId } },
                    { creditCard: { userId } },
                ],
            },
            include: {
                category: true,
                account: true,
                creditCard: true,
            },
        });
        if (!transaction) {
            throw new Error('Transação não encontrada');
        }
        return transaction;
    }
    async update(id, userId, data) {
        // Buscar transação atual
        const currentTransaction = await this.findById(id, userId);
        const result = await database_1.default.$transaction(async (tx) => {
            // Reverter o saldo da transação anterior se estava paga E tinha conta
            if (currentTransaction.isPaid && currentTransaction.accountId) {
                const balanceChange = currentTransaction.type === 'INCOME'
                    ? -Number(currentTransaction.amount)
                    : Number(currentTransaction.amount);
                await tx.account.update({
                    where: { id: currentTransaction.accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
            // Atualizar transação
            const transaction = await tx.transaction.update({
                where: { id },
                data,
                include: {
                    category: true,
                    account: true,
                    creditCard: true,
                },
            });
            // Aplicar novo saldo se está paga E tem conta (não cartão)
            const newAccountId = data.accountId ?? transaction.accountId;
            if ((data.isPaid ?? transaction.isPaid) && newAccountId) {
                const newAmount = data.amount ?? Number(transaction.amount);
                const newType = data.type ?? transaction.type;
                const balanceChange = newType === 'INCOME' ? newAmount : -newAmount;
                await tx.account.update({
                    where: { id: newAccountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
            return transaction;
        });
        return result;
    }
    async delete(id, userId) {
        const transaction = await this.findById(id, userId);
        await database_1.default.$transaction(async (tx) => {
            // Reverter o saldo se a transação estava paga E tinha conta
            if (transaction.isPaid && transaction.accountId) {
                const balanceChange = transaction.type === 'INCOME'
                    ? -Number(transaction.amount)
                    : Number(transaction.amount);
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: {
                        balance: {
                            increment: balanceChange,
                        },
                    },
                });
            }
            await tx.transaction.delete({
                where: { id },
            });
        });
    }
    async getStats(userId, startDate, endDate) {
        const accounts = await database_1.default.account.findMany({
            where: { userId },
            select: { id: true },
        });
        const accountIds = accounts.map((acc) => acc.id);
        const where = {
            accountId: { in: accountIds },
            isPaid: true,
        };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = startDate;
            }
            if (endDate) {
                where.date.lte = endDate;
            }
        }
        const [income, expense] = await Promise.all([
            database_1.default.transaction.aggregate({
                where: { ...where, type: 'INCOME' },
                _sum: { amount: true },
            }),
            database_1.default.transaction.aggregate({
                where: { ...where, type: 'EXPENSE' },
                _sum: { amount: true },
            }),
        ]);
        return {
            income: Number(income._sum.amount || 0),
            expense: Number(expense._sum.amount || 0),
            balance: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
        };
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transaction.service.js.map