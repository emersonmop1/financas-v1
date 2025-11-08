import prisma from '../config/database';
import { endOfMonth, subMonths, addMonths, format } from 'date-fns';

export class ReportExpandedService {
  // Helper para buscar IDs de contas e cartões do usuário
  private async getUserAccountsAndCards(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const creditCards = await prisma.creditCard.findMany({
      where: { userId },
      select: { id: true },
    });

    return {
      accountIds: accounts.map((acc) => acc.id),
      creditCardIds: creditCards.map((card) => card.id),
    };
  }

  /**
   * 1. Cash Flow Forecast - Previsão de fluxo de caixa
   * Projeta os próximos 3 meses baseado em médias e recorrências
   */
  async getCashFlowForecast(userId: string, months: number = 3) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

    // Calcular saldo atual total
    const accounts = await prisma.account.findMany({
      where: { userId },
    });
    const currentBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    // Calcular média de income e expense dos últimos 6 meses
    // IMPORTANTE: Excluir categoria "Pagamento de Fatura" para não contar pagamentos como despesa
    const sixMonthsAgo = subMonths(new Date(), 6);
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { creditCardId: { in: creditCardIds } },
        ],
        isPaid: true,
        date: { gte: sixMonthsAgo },
      },
    });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const avgMonthlyIncome = totalIncome / 6;
    const avgMonthlyExpense = totalExpense / 6;

    // Get active recurring transactions
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Project future months
    const projections = [];
    let balance = currentBalance;

    for (let i = 1; i <= months; i++) {
      const targetMonth = addMonths(new Date(), i);

      // Calculate recurring transactions for this month
      const recurringIncome = recurringTransactions
        .filter(rt => rt.type === 'INCOME')
        .reduce((sum, rt) => sum + Number(rt.amount), 0);

      const recurringExpense = recurringTransactions
        .filter(rt => rt.type === 'EXPENSE')
        .reduce((sum, rt) => sum + Number(rt.amount), 0);

      const projectedIncome = avgMonthlyIncome + recurringIncome;
      const projectedExpense = avgMonthlyExpense + recurringExpense;

      balance = balance + projectedIncome - projectedExpense;

      projections.push({
        month: format(targetMonth, 'yyyy-MM'),
        date: targetMonth.toISOString(),
        projectedIncome,
        projectedExpense,
        projectedBalance: balance,
        netChange: projectedIncome - projectedExpense,
      });
    }

    return {
      currentBalance,
      assumptions: {
        avgMonthlyIncome,
        avgMonthlyExpense,
        activeRecurringIncome: recurringTransactions.filter(rt => rt.type === 'INCOME').length,
        activeRecurringExpense: recurringTransactions.filter(rt => rt.type === 'EXPENSE').length,
      },
      projections,
    };
  }

  /**
   * 2. Anomaly Detection - Detectar gastos incomuns
   * Usa desvio padrão para identificar transações atípicas
   */
  async detectAnomalies(userId: string, threshold: number = 2.0) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

    const sixMonthsAgo = subMonths(new Date(), 6);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { creditCardId: { in: creditCardIds } },
        ],
        type: 'EXPENSE',
        isPaid: true,
        date: { gte: sixMonthsAgo },
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Group by category
    const categoryStats = new Map<string, {
      name: string;
      amounts: number[];
      avg: number;
      stdDev: number;
    }>();

    // Calculate amounts per category
    transactions.forEach(t => {
      const categoryId = t.categoryId;
      const amount = Number(t.amount);

      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, {
          name: t.category.name,
          amounts: [],
          avg: 0,
          stdDev: 0,
        });
      }

      categoryStats.get(categoryId)!.amounts.push(amount);
    });

    // Calculate avg and standard deviation
    categoryStats.forEach((stats, categoryId) => {
      const amounts = stats.amounts;
      const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      stats.avg = avg;
      stats.stdDev = stdDev;
    });

    // Find anomalies
    const anomalies = [];

    for (const transaction of transactions) {
      const stats = categoryStats.get(transaction.categoryId);
      if (!stats || stats.stdDev === 0) continue;

      const amount = Number(transaction.amount);
      const deviation = (amount - stats.avg) / stats.stdDev;

      if (deviation > threshold) {
        anomalies.push({
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount,
          category: transaction.category.name,
          expectedRange: {
            min: Math.max(0, stats.avg - threshold * stats.stdDev),
            max: stats.avg + threshold * stats.stdDev,
          },
          deviation: deviation.toFixed(2),
          percentAboveAvg: ((amount - stats.avg) / stats.avg * 100).toFixed(1),
        });
      }
    }

    return {
      anomalies,
      totalAnomalies: anomalies.length,
      threshold,
      period: {
        start: sixMonthsAgo,
        end: new Date(),
      },
    };
  }

  /**
   * 3. Year-over-Year Comparison - Comparação ano a ano
   */
  async getYoYComparison(userId: string, year1: number, year2: number) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

    const months = [];

    for (let month = 0; month < 12; month++) {
      const startYear1 = new Date(year1, month, 1);
      const endYear1 = endOfMonth(startYear1);

      const startYear2 = new Date(year2, month, 1);
      const endYear2 = endOfMonth(startYear2);

      const [transactionsYear1, transactionsYear2] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            OR: [
              { accountId: { in: accountIds } },
              { creditCardId: { in: creditCardIds } },
            ],
            isPaid: true,
            date: { gte: startYear1, lte: endYear1 },
          },
        }),
        prisma.transaction.findMany({
          where: {
            OR: [
              { accountId: { in: accountIds } },
              { creditCardId: { in: creditCardIds } },
            ],
            isPaid: true,
            date: { gte: startYear2, lte: endYear2 },
          },
        }),
      ]);

      const calcStats = (transactions: any[]) => {
        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return { income, expense, balance: income - expense };
      };

      const year1Stats = calcStats(transactionsYear1);
      const year2Stats = calcStats(transactionsYear2);

      months.push({
        month: month + 1,
        monthName: format(new Date(year1, month, 1), 'MMMM'),
        year1: year1Stats,
        year2: year2Stats,
        change: {
          income: year1Stats.income !== 0
            ? ((year2Stats.income - year1Stats.income) / year1Stats.income * 100).toFixed(1)
            : 'N/A',
          expense: year1Stats.expense !== 0
            ? ((year2Stats.expense - year1Stats.expense) / year1Stats.expense * 100).toFixed(1)
            : 'N/A',
        },
      });
    }

    const totalYear1 = months.reduce((acc, m) => ({
      income: acc.income + m.year1.income,
      expense: acc.expense + m.year1.expense,
    }), { income: 0, expense: 0 });

    const totalYear2 = months.reduce((acc, m) => ({
      income: acc.income + m.year2.income,
      expense: acc.expense + m.year2.expense,
    }), { income: 0, expense: 0 });

    return {
      comparison: months,
      yearTotals: {
        [year1]: totalYear1,
        [year2]: totalYear2,
      },
    };
  }

  /**
   * 4. Budget vs Actual Performance
   */
  async getBudgetPerformance(userId: string, month: number, year: number) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

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

    const startDate = new Date(year, month - 1, 1);
    const endDate = endOfMonth(startDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { creditCardId: { in: creditCardIds } },
        ],
        type: 'EXPENSE',
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
    });

    const categories = [];
    let totalBudgeted = 0;
    let totalActual = 0;

    for (const budget of budgets) {
      const categoryTransactions = transactions.filter(
        t => t.categoryId === budget.categoryId
      );

      const actual = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      const budgeted = Number(budget.amount);
      const variance = actual - budgeted;
      const variancePercent = budgeted !== 0 ? (variance / budgeted * 100) : 0;

      totalBudgeted += budgeted;
      totalActual += actual;

      categories.push({
        categoryId: budget.categoryId,
        name: budget.category?.name || 'Sem categoria',
        budgeted,
        actual,
        variance,
        variancePercent: variancePercent.toFixed(1),
        status: actual > budgeted ? 'over' : actual < budgeted * 0.9 ? 'under' : 'on-track',
      });
    }

    return {
      categories,
      total: {
        budgeted: totalBudgeted,
        actual: totalActual,
        variance: totalActual - totalBudgeted,
        variancePercent: totalBudgeted !== 0
          ? ((totalActual - totalBudgeted) / totalBudgeted * 100).toFixed(1)
          : '0',
      },
      period: {
        month,
        year,
        monthName: format(startDate, 'MMMM'),
      },
    };
  }

  /**
   * 5. Income Distribution - Distribuição de receitas
   */
  async getIncomeDistribution(userId: string, startDate: Date, endDate: Date) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { creditCardId: { in: creditCardIds } },
        ],
        type: 'INCOME',
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
        account: true,
      },
    });

    const byCategory = new Map<string, { name: string; amount: number }>();
    const byAccount = new Map<string, { name: string; amount: number }>();
    let total = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount);
      total += amount;

      // By category
      const catId = t.categoryId;
      if (byCategory.has(catId)) {
        byCategory.get(catId)!.amount += amount;
      } else {
        byCategory.set(catId, {
          name: t.category.name,
          amount,
        });
      }

      // By account
      if (t.account) {
        const accId = t.account.id;
        if (byAccount.has(accId)) {
          byAccount.get(accId)!.amount += amount;
        } else {
          byAccount.set(accId, {
            name: t.account.name,
            amount,
          });
        }
      }
    });

    return {
      byCategory: Array.from(byCategory.values()).map(item => ({
        ...item,
        percent: total !== 0 ? ((item.amount / total) * 100).toFixed(1) : '0',
      })),
      byAccount: Array.from(byAccount.values()).map(item => ({
        ...item,
        percent: total !== 0 ? ((item.amount / total) * 100).toFixed(1) : '0',
      })),
      total,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  /**
   * 6. Savings Rate Analysis - Taxa de poupança
   */
  async getSavingsRate(userId: string, startDate: Date, endDate: Date) {
    const { accountIds, creditCardIds } = await this.getUserAccountsAndCards(userId);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: { in: accountIds } },
          { creditCardId: { in: creditCardIds } },
        ],
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome !== 0 ? (netSavings / totalIncome) * 100 : 0;

    // Calculate monthly trend
    const monthlyData = new Map<string, { income: number; expense: number }>();

    transactions.forEach(t => {
      const monthKey = format(t.date, 'yyyy-MM');
      const amount = Number(t.amount);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expense: 0 });
      }

      const data = monthlyData.get(monthKey)!;
      if (t.type === 'INCOME') {
        data.income += amount;
      } else {
        data.expense += amount;
      }
    });

    const trend = Array.from(monthlyData.entries()).map(([month, data]) => {
      const savings = data.income - data.expense;
      const rate = data.income !== 0 ? (savings / data.income) * 100 : 0;

      return {
        month,
        income: data.income,
        expense: data.expense,
        savings,
        rate: rate.toFixed(1),
      };
    });

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: savingsRate.toFixed(1),
      trend,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }
}
