import prisma from '../config/database';
import { TransactionType } from '@prisma/client';

interface CreateTransactionDTO {
  accountId?: string;
  categoryId: string;
  creditCardId?: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  isPaid?: boolean;
  installments?: number;
  installmentNum?: number;
  notes?: string;
  tags?: string[];
  isReconciled?: boolean;
  bankReference?: string;
}

interface UpdateTransactionDTO {
  accountId?: string;
  categoryId?: string;
  creditCardId?: string;
  description?: string;
  amount?: number;
  date?: Date;
  type?: TransactionType;
  isPaid?: boolean;
  notes?: string;
  tags?: string[];
  isReconciled?: boolean;
  bankReference?: string;
}

interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
}

export class TransactionService {
  async create(userId: string, data: CreateTransactionDTO) {
    // Validar: deve ter OU accountId OU creditCardId (não ambos, não nenhum)
    if (!data.accountId && !data.creditCardId) {
      throw new Error('Informe uma conta ou cartão de crédito');
    }

    if (data.accountId && data.creditCardId) {
      throw new Error('Informe apenas uma conta OU um cartão de crédito, não ambos');
    }

    // Verificar se a conta pertence ao usuário (se fornecida)
    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, userId },
      });

      if (!account) {
        throw new Error('Conta não encontrada');
      }
    }

    // Verificar se o cartão pertence ao usuário (se fornecido)
    if (data.creditCardId) {
      const creditCard = await prisma.creditCard.findFirst({
        where: { id: data.creditCardId, userId },
      });

      if (!creditCard) {
        throw new Error('Cartão de crédito não encontrado');
      }
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId }, { isDefault: true }],
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Criar transação e atualizar saldo da conta (se houver)
    const result = await prisma.$transaction(async (tx) => {
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
          tags: data.tags ?? [],
          isReconciled: data.isReconciled ?? false,
          bankReference: data.bankReference,
        },
        include: {
          category: true,
          account: true,
          creditCard: true,
        },
      });

      // Atualizar saldo da conta se a transação estiver paga E tiver conta
      if (data.isPaid && data.accountId) {
        const balanceChange =
          data.type === 'INCOME' ? data.amount : -data.amount;

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

  async findAll(userId: string, filters?: TransactionFilters) {
    // Usar JOIN direto ao invés de buscar IDs primeiro - elimina 2 queries!
    const where: any = {
      OR: [
        { account: { userId } },
        { creditCard: { userId } },
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

    const transactions = await prisma.transaction.findMany({
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

  async findById(id: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
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

  async update(id: string, userId: string, data: UpdateTransactionDTO) {
    // Buscar transação atual
    const currentTransaction = await this.findById(id, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Reverter o saldo da transação anterior se estava paga E tinha conta
      if (currentTransaction.isPaid && currentTransaction.accountId) {
        const balanceChange =
          currentTransaction.type === 'INCOME'
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

  async delete(id: string, userId: string) {
    const transaction = await this.findById(id, userId);

    await prisma.$transaction(async (tx) => {
      // Reverter o saldo se a transação estava paga E tinha conta
      if (transaction.isPaid && transaction.accountId) {
        const balanceChange =
          transaction.type === 'INCOME'
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

  async getStats(userId: string, startDate?: Date, endDate?: Date) {
    // Usar JOIN direto ao invés de buscar IDs primeiro - elimina 2 queries!
    const where: any = {
      OR: [
        { account: { userId } },
        { creditCard: { userId } },
      ],
      // Removido filtro isPaid para incluir transações de cartão não pagas
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
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
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

  async deleteAll(userId: string) {
    // Deletar todas as transações do usuário usando JOIN direto - elimina 2 queries!
    const result = await prisma.transaction.deleteMany({
      where: {
        OR: [
          { account: { userId } },
          { creditCard: { userId } },
        ],
      },
    });

    return { count: result.count };
  }
}
