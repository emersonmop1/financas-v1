import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateBudgetDTO {
  categoryId?: string; // Se não informado, é um orçamento geral
  month: number; // 1-12
  year: number;
  amount: number;
}

export interface UpdateBudgetDTO {
  amount?: number;
}

export interface BudgetWithSpending {
  id: string;
  userId: string;
  categoryId: string | null;
  month: number;
  year: number;
  amount: Decimal;
  spent: Decimal;
  remaining: Decimal;
  percentage: number;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

export class BudgetService {
  async create(userId: string, data: CreateBudgetDTO) {
    // Verificar se já existe orçamento para este período
    const existing = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId: data.categoryId || null,
        month: data.month,
        year: data.year,
      },
    });

    if (existing) {
      throw new Error('Já existe um orçamento para este período');
    }

    // Se categoryId foi informado, verificar se categoria existe
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [{ userId }, { isDefault: true }],
        },
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }
    }

    return await prisma.budget.create({
      data: {
        userId,
        categoryId: data.categoryId || null,
        month: data.month,
        year: data.year,
        amount: data.amount,
      },
      include: {
        category: true,
      },
    });
  }

  async getAll(
    userId: string,
    filters?: {
      month?: number;
      year?: number;
      categoryId?: string;
    }
  ) {
    const where: any = { userId };

    if (filters?.month) where.month = filters.month;
    if (filters?.year) where.year = filters.year;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    return await prisma.budget.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getById(userId: string, id: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    return budget;
  }

  async update(userId: string, id: string, data: UpdateBudgetDTO) {
    const budget = await this.getById(userId, id);

    return await prisma.budget.update({
      where: { id: budget.id },
      data: {
        amount: data.amount,
      },
      include: {
        category: true,
      },
    });
  }

  async delete(userId: string, id: string) {
    const budget = await this.getById(userId, id);

    await prisma.budget.delete({
      where: { id: budget.id },
    });
  }

  /**
   * Obtém orçamentos com gastos reais do período
   */
  async getBudgetsWithSpending(
    userId: string,
    month: number,
    year: number
  ): Promise<BudgetWithSpending[]> {
    // Buscar orçamentos do período
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    // Calcular data inicial e final do período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Para cada orçamento, calcular o gasto real
    const budgetsWithSpending: BudgetWithSpending[] = [];

    for (const budget of budgets) {
      // Buscar transações do período
      const where: any = {
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'EXPENSE',
        isPaid: true,
      };

      // Se tem categoryId, filtrar por categoria
      if (budget.categoryId) {
        where.categoryId = budget.categoryId;
      }

      // Buscar transações de contas (não cartões de crédito)
      where.accountId = { not: null };

      const transactions = await prisma.transaction.findMany({
        where,
        select: {
          amount: true,
        },
      });

      // Calcular total gasto
      const spent = transactions.reduce(
        (sum, t) => sum.add(t.amount),
        new Decimal(0)
      );

      const remaining = new Decimal(budget.amount).sub(spent);
      const percentage =
        Number(budget.amount) > 0
          ? (Number(spent) / Number(budget.amount)) * 100
          : 0;

      budgetsWithSpending.push({
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        month: budget.month,
        year: budget.year,
        amount: budget.amount,
        spent,
        remaining,
        percentage,
        category: budget.category
          ? {
              id: budget.category.id,
              name: budget.category.name,
              color: budget.category.color,
              icon: budget.category.icon,
            }
          : undefined,
      });
    }

    return budgetsWithSpending;
  }

  /**
   * Obtém resumo geral do orçamento do período
   */
  async getBudgetSummary(userId: string, month: number, year: number) {
    const budgetsWithSpending = await this.getBudgetsWithSpending(
      userId,
      month,
      year
    );

    const totalBudget = budgetsWithSpending.reduce(
      (sum, b) => sum.add(b.amount),
      new Decimal(0)
    );

    const totalSpent = budgetsWithSpending.reduce(
      (sum, b) => sum.add(b.spent),
      new Decimal(0)
    );

    const totalRemaining = totalBudget.sub(totalSpent);
    const totalPercentage =
      Number(totalBudget) > 0
        ? (Number(totalSpent) / Number(totalBudget)) * 100
        : 0;

    return {
      month,
      year,
      totalBudget,
      totalSpent,
      totalRemaining,
      totalPercentage,
      budgets: budgetsWithSpending,
    };
  }
}
