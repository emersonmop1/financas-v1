import prisma from '../config/database';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIAnalysisService {
  async analyzeFinancialHealth(userId: string, startDate: Date, endDate: Date) {
    // Buscar todos os dados financeiros do período
    const [transactions, budgets, goals, accounts, recurringTransactions] = await Promise.all([
      // Transações
      prisma.transaction.findMany({
        where: {
          account: { userId },
          date: { gte: startDate, lte: endDate },
          category: {
            type: { not: 'NEUTRAL' }, // Exclude NEUTRAL categories
          },
        },
        include: {
          category: true,
          account: true,
        },
      }),
      // Orçamentos
      prisma.budget.findMany({
        where: {
          userId,
          year: { in: [startDate.getFullYear(), endDate.getFullYear()] },
        },
        include: {
          category: true,
        },
      }),
      // Metas
      prisma.goal.findMany({
        where: { userId },
      }),
      // Contas
      prisma.account.findMany({
        where: { userId },
      }),
      // Transações recorrentes
      prisma.recurringTransaction.findMany({
        where: { userId, isActive: true },
        include: {
          category: true,
        },
      }),
    ]);

    // Calcular estatísticas
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME' && t.isPaid)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE' && t.isPaid)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Agrupar despesas por categoria
    const expensesByCategory: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === 'EXPENSE' && t.isPaid)
      .forEach((t) => {
        const categoryName = t.category?.name || 'Sem categoria';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + Number(t.amount);
      });

    const topExpenseCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Calcular orçamentos
    const budgetData = budgets.map((b) => ({
      category: b.category?.name || 'Geral',
      budgeted: Number(b.amount),
    }));

    // Calcular metas
    const goalsData = goals.map((g) => ({
      name: g.name,
      target: Number(g.targetAmount),
      current: Number(g.currentAmount),
      percentage: (Number(g.currentAmount) / Number(g.targetAmount)) * 100,
      status: g.status,
    }));

    // Transações recorrentes
    const recurringData = recurringTransactions.map((r) => ({
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      frequency: r.frequency,
      category: r.category?.name,
    }));

    // Total em contas
    const totalInAccounts = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    // Montar contexto para a IA
    const context = `
Análise Financeira - Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

RESUMO GERAL:
- Receitas totais: R$ ${totalIncome.toFixed(2)}
- Despesas totais: R$ ${totalExpense.toFixed(2)}
- Saldo do período: R$ ${balance.toFixed(2)}
- Total em contas: R$ ${totalInAccounts.toFixed(2)}

TOP 5 CATEGORIAS DE DESPESA:
${topExpenseCategories.map((c, i) => `${i + 1}. ${c.name}: R$ ${c.amount.toFixed(2)} (${((c.amount / totalExpense) * 100).toFixed(1)}%)`).join('\n')}

ORÇAMENTOS:
${budgetData.length > 0 ? budgetData.map((b) => `- ${b.category}: R$ ${b.budgeted.toFixed(2)}`).join('\n') : 'Nenhum orçamento definido'}

METAS:
${goalsData.length > 0 ? goalsData.map((g) => `- ${g.name}: ${g.percentage.toFixed(1)}% (R$ ${g.current.toFixed(2)} de R$ ${g.target.toFixed(2)}) - Status: ${g.status}`).join('\n') : 'Nenhuma meta definida'}

DESPESAS RECORRENTES:
${recurringData.filter((r) => r.type === 'EXPENSE').length > 0
  ? recurringData.filter((r) => r.type === 'EXPENSE').map((r) => `- ${r.description}: R$ ${r.amount.toFixed(2)} (${r.frequency === 'MONTHLY' ? 'Mensal' : 'Anual'})`).join('\n')
  : 'Nenhuma despesa recorrente'}

RECEITAS RECORRENTES:
${recurringData.filter((r) => r.type === 'INCOME').length > 0
  ? recurringData.filter((r) => r.type === 'INCOME').map((r) => `- ${r.description}: R$ ${r.amount.toFixed(2)} (${r.frequency === 'MONTHLY' ? 'Mensal' : 'Anual'})`).join('\n')
  : 'Nenhuma receita recorrente'}
`;

    // Chamar OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um consultor financeiro expert em finanças pessoais.
Analise os dados financeiros fornecidos e forneça uma análise completa e personalizada.

Sua resposta deve conter EXATAMENTE 4 seções em formato markdown:

## 📊 Saúde Financeira
Avalie a saúde financeira geral (Excelente/Boa/Regular/Preocupante) e explique o motivo.

## ⚠️ Pontos de Atenção
Liste os principais problemas ou áreas que precisam de atenção imediata.

## 💡 Sugestões de Melhoria
Forneça sugestões práticas e específicas baseadas nos dados analisados.

## 🎯 Dicas Personalizadas
Dê dicas personalizadas para melhorar a gestão financeira desta pessoa.

Seja direto, prático e use os dados fornecidos. Use emojis apenas nos títulos das seções.`,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      max_tokens: 1500,
    });

    const analysis = completion.choices[0].message.content || 'Não foi possível gerar a análise.';

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
        totalInAccounts,
        topExpenseCategories,
      },
      analysis,
    };
  }
}
