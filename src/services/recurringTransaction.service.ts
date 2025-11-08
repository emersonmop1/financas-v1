import prisma from '../config/database';
import { calculateNextExecutionDate } from '../utils/dateHelper';

export interface CreateRecurringTransactionDTO {
  accountId?: string;
  categoryId: string;
  creditCardId?: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  frequency?: 'MONTHLY' | 'YEARLY';
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
}

export interface UpdateRecurringTransactionDTO {
  description?: string;
  amount?: number;
  categoryId?: string;
  dayOfMonth?: number;
  endDate?: string;
  isActive?: boolean;
}

export class RecurringTransactionService {
  async create(userId: string, data: CreateRecurringTransactionDTO) {
    const frequency = data.frequency || 'MONTHLY';
    const startDate = new Date(data.startDate);

    // Calculate next execution date
    const nextExecutionDate = calculateNextExecutionDate(
      data.dayOfMonth,
      frequency,
      startDate
    );

    return await prisma.recurringTransaction.create({
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

  async getAll(userId: string, includeInactive = false) {
    return await prisma.recurringTransaction.findMany({
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

  async getById(userId: string, id: string) {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
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

  async update(userId: string, id: string, data: UpdateRecurringTransactionDTO) {
    await this.getById(userId, id);

    return await prisma.recurringTransaction.update({
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

  async delete(userId: string, id: string) {
    await this.getById(userId, id);

    await prisma.recurringTransaction.delete({
      where: { id },
    });
  }

  async toggleActive(userId: string, id: string) {
    const recurringTransaction = await this.getById(userId, id);

    return await prisma.recurringTransaction.update({
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
