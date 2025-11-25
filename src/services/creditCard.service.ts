import prisma from '../config/database';
import { startOfMonth, endOfMonth, addMonths, isBefore, isAfter } from 'date-fns';

interface CreateCreditCardDTO {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

interface UpdateCreditCardDTO {
  name?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
}

export class CreditCardService {
  async create(userId: string, data: CreateCreditCardDTO) {
    const creditCard = await prisma.creditCard.create({
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

  async findAll(userId: string) {
    const creditCards = await prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Se não há cartões, retornar vazio
    if (creditCards.length === 0) {
      return [];
    }

    // Buscar todas as transações de todos os cartões em UMA ÚNICA query!
    const now = new Date();

    // Calcular períodos para cada cartão
    const cardPeriods = creditCards.map(card => {
      const { startDate, endDate } = this.getCurrentBillPeriod(card.closingDay);
      return { cardId: card.id, startDate, endDate };
    });

    // Buscar TODAS as transações de TODOS os cartões em UMA query
    const allTransactions = await prisma.transaction.findMany({
      where: {
        OR: cardPeriods.map(period => ({
          creditCardId: period.cardId,
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
          type: 'EXPENSE',
        })),
      },
    });

    // Agrupar transações por cartão
    const transactionsByCard = new Map<string, any[]>();
    allTransactions.forEach(transaction => {
      if (!transactionsByCard.has(transaction.creditCardId!)) {
        transactionsByCard.set(transaction.creditCardId!, []);
      }
      transactionsByCard.get(transaction.creditCardId!)!.push(transaction);
    });

    // Calcular totais para cada cartão
    const cardsWithLimits = creditCards.map(card => {
      const cardTransactions = transactionsByCard.get(card.id) || [];
      const currentBillAmount = cardTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      const availableLimit = Number(card.limit) - currentBillAmount;

      return {
        ...card,
        currentBillAmount,
        availableLimit,
        limit: Number(card.limit),
      };
    });

    return cardsWithLimits;
  }

  async findById(id: string, userId: string) {
    const creditCard = await prisma.creditCard.findFirst({
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

  async update(id: string, userId: string, data: UpdateCreditCardDTO) {
    // Verificar se o cartão pertence ao usuário
    await this.findById(id, userId);

    const creditCard = await prisma.creditCard.update({
      where: { id },
      data,
    });

    return creditCard;
  }

  async delete(id: string, userId: string) {
    // Verificar se o cartão pertence ao usuário
    await this.findById(id, userId);

    // Verificar se há transações vinculadas
    const transactionsCount = await prisma.transaction.count({
      where: { creditCardId: id },
    });

    if (transactionsCount > 0) {
      throw new Error(
        'Não é possível deletar um cartão com transações vinculadas'
      );
    }

    await prisma.creditCard.delete({
      where: { id },
    });
  }

  // Obter valor da fatura atual
  async getCurrentBillAmount(creditCardId: string): Promise<number> {
    const { startDate, endDate } = this.getCurrentBillPeriod(
      await this.getCardClosingDay(creditCardId)
    );

    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'EXPENSE',
      },
    });

    const total = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    return total;
  }

  // Obter transações da fatura atual
  async getCurrentBillTransactions(creditCardId: string, userId: string) {
    // Verificar se o cartão pertence ao usuário
    await this.findById(creditCardId, userId);

    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
    });

    if (!card) {
      throw new Error('Cartão não encontrado');
    }

    const { startDate, endDate } = this.getCurrentBillPeriod(card.closingDay);

    const transactions = await prisma.transaction.findMany({
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
      total: transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      ),
      closingDate: endDate,
      dueDate: this.getDueDate(card.closingDay, card.dueDay),
    };
  }

  // Calcular período da fatura atual
  private getCurrentBillPeriod(closingDay: number) {
    const now = new Date();
    const currentDay = now.getDate();

    let startDate: Date;
    let endDate: Date;

    if (currentDay <= closingDay) {
      // Fatura do mês passado ao dia de fechamento deste mês
      const lastMonth = addMonths(now, -1);
      startDate = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth(),
        closingDay + 1
      );
      endDate = new Date(now.getFullYear(), now.getMonth(), closingDay);
    } else {
      // Fatura do dia de fechamento deste mês ao dia de fechamento do próximo mês
      startDate = new Date(now.getFullYear(), now.getMonth(), closingDay + 1);
      const nextMonth = addMonths(now, 1);
      endDate = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        closingDay
      );
    }

    return { startDate, endDate };
  }

  // Calcular data de vencimento
  private getDueDate(closingDay: number, dueDay: number): Date {
    const now = new Date();
    const currentDay = now.getDate();

    let dueDate: Date;

    if (currentDay <= closingDay) {
      // Vencimento neste mês
      dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
    } else {
      // Vencimento no próximo mês
      const nextMonth = addMonths(now, 1);
      dueDate = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        dueDay
      );
    }

    return dueDate;
  }

  private async getCardClosingDay(creditCardId: string): Promise<number> {
    const card = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
    });

    if (!card) {
      throw new Error('Cartão não encontrado');
    }

    return card.closingDay;
  }
}
