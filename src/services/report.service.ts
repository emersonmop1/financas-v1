import prisma from '../config/database';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export class ReportService {
  // Estatísticas por categoria
  async getExpensesByCategory(userId: string, startDate?: Date, endDate?: Date) {
    // OTIMIZAÇÃO: Usar JOIN direto - elimina 2 queries!
    const where: any = {
      OR: [
        { account: { userId } },
        { creditCard: { userId } },
      ],
      type: 'EXPENSE',
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
    // OTIMIZAÇÃO MÁXIMA: 1 única query ao invés de 12 queries (2 por mês × 6 meses)!
    const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5);

    // Buscar todas as transações dos últimos 6 meses de uma vez
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { account: { userId } },
          { creditCard: { userId } },
        ],
        date: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        date: true,
        type: true,
        amount: true,
      },
    });

    // Agrupar por mês em memória - muito mais rápido que múltiplas queries!
    const monthlyData = new Map<string, { income: number; expense: number }>();

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM/yy');
      monthlyData.set(monthKey, { income: 0, expense: 0 });
    }

    // Agrupar transações por mês
    transactions.forEach((t) => {
      const monthKey = format(t.date, 'MMM/yy');
      const data = monthlyData.get(monthKey);

      if (data) {
        if (t.type === 'INCOME') {
          data.income += Number(t.amount);
        } else {
          data.expense += Number(t.amount);
        }
      }
    });

    // Converter para array
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM/yy');
      const data = monthlyData.get(monthKey)!;

      result.push({
        month: monthKey,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      });
    }

    return result;
  }

  // Comparação mensal (mês atual vs anterior)
  async getMonthlyComparison(userId: string) {
    // OTIMIZAÇÃO: Usar JOIN direto - elimina 2 queries iniciais!
    const currentMonth = {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    };

    const previousMonth = {
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    };

    const [currentStats, previousStats] = await Promise.all([
      this.getStatsForPeriod(userId, currentMonth.start, currentMonth.end),
      this.getStatsForPeriod(userId, previousMonth.start, previousMonth.end),
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

  private async getStatsForPeriod(userId: string, startDate: Date, endDate: Date) {
    // Usar JOIN direto ao invés de IDs
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          OR: [
            { account: { userId } },
            { creditCard: { userId } },
          ],
          type: 'INCOME',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          OR: [
            { account: { userId } },
            { creditCard: { userId } },
          ],
          type: 'EXPENSE',
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
