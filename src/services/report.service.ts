import prisma from '../config/database';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export class ReportService {
  // Estatísticas por categoria
  async getExpensesByCategory(userId: string, startDate?: Date, endDate?: Date) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = accounts.map((acc) => acc.id);

    const where: any = {
      accountId: { in: accountIds },
      type: 'EXPENSE',
      isPaid: true,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
    });

    // Agrupar por categoria
    const categoryMap = new Map<string, { name: string; total: number; color: string; icon: string }>();

    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId;
      const amount = Number(transaction.amount);

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.total += amount;
      } else {
        categoryMap.set(categoryId, {
          name: transaction.category.name,
          total: amount,
          color: transaction.category.color,
          icon: transaction.category.icon,
        });
      }
    });

    return Array.from(categoryMap.values());
  }

  // Evolução mensal (últimos 6 meses)
  async getMonthlyEvolution(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = accounts.map((acc) => acc.id);

    const months = [];
    const data = [];

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            accountId: { in: accountIds },
            type: 'INCOME',
            isPaid: true,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            accountId: { in: accountIds },
            type: 'EXPENSE',
            isPaid: true,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const incomeValue = Number(income._sum.amount || 0);
      const expenseValue = Number(expense._sum.amount || 0);

      data.push({
        month: format(date, 'MMM/yy'),
        income: incomeValue,
        expense: expenseValue,
        balance: incomeValue - expenseValue,
      });
    }

    return data;
  }

  // Comparação mensal (mês atual vs anterior)
  async getMonthlyComparison(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = accounts.map((acc) => acc.id);

    const currentMonth = {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    };

    const previousMonth = {
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    };

    const [currentStats, previousStats] = await Promise.all([
      this.getStatsForPeriod(accountIds, currentMonth.start, currentMonth.end),
      this.getStatsForPeriod(accountIds, previousMonth.start, previousMonth.end),
    ]);

    return {
      current: currentStats,
      previous: previousStats,
      changes: {
        income: currentStats.income - previousStats.income,
        expense: currentStats.expense - previousStats.expense,
        balance: currentStats.balance - previousStats.balance,
      },
    };
  }

  private async getStatsForPeriod(accountIds: string[], startDate: Date, endDate: Date) {
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          accountId: { in: accountIds },
          type: 'INCOME',
          isPaid: true,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          accountId: { in: accountIds },
          type: 'EXPENSE',
          isPaid: true,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const incomeValue = Number(income._sum.amount || 0);
    const expenseValue = Number(expense._sum.amount || 0);

    return {
      income: incomeValue,
      expense: expenseValue,
      balance: incomeValue - expenseValue,
    };
  }

  // Top categorias de despesas
  async getTopExpenseCategories(userId: string, limit: number = 5, startDate?: Date, endDate?: Date) {
    const categories = await this.getExpensesByCategory(userId, startDate, endDate);
    return categories
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }
}
