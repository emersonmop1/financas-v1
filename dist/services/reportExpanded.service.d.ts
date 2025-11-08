export declare class ReportExpandedService {
    private getUserAccountsAndCards;
    /**
     * 1. Cash Flow Forecast - Previsão de fluxo de caixa
     * Projeta os próximos 3 meses baseado em médias e recorrências
     */
    getCashFlowForecast(userId: string, months?: number): Promise<{
        currentBalance: number;
        assumptions: {
            avgMonthlyIncome: number;
            avgMonthlyExpense: number;
            activeRecurringIncome: any;
            activeRecurringExpense: any;
        };
        projections: {
            month: string;
            date: string;
            projectedIncome: any;
            projectedExpense: any;
            projectedBalance: number;
            netChange: number;
        }[];
    }>;
    /**
     * 2. Anomaly Detection - Detectar gastos incomuns
     * Usa desvio padrão para identificar transações atípicas
     */
    detectAnomalies(userId: string, threshold?: number): Promise<{
        anomalies: {
            id: string;
            date: Date;
            description: string;
            amount: number;
            category: string;
            expectedRange: {
                min: number;
                max: number;
            };
            deviation: string;
            percentAboveAvg: string;
        }[];
        totalAnomalies: number;
        threshold: number;
        period: {
            start: Date;
            end: Date;
        };
    }>;
    /**
     * 3. Year-over-Year Comparison - Comparação ano a ano
     */
    getYoYComparison(userId: string, year1: number, year2: number): Promise<{
        comparison: {
            month: number;
            monthName: string;
            year1: {
                income: any;
                expense: any;
                balance: number;
            };
            year2: {
                income: any;
                expense: any;
                balance: number;
            };
            change: {
                income: string;
                expense: string;
            };
        }[];
        yearTotals: {
            [year1]: {
                income: any;
                expense: any;
            };
            [year2]: {
                income: any;
                expense: any;
            };
        };
    }>;
    /**
     * 4. Budget vs Actual Performance
     */
    getBudgetPerformance(userId: string, month: number, year: number): Promise<{
        categories: {
            categoryId: any;
            name: any;
            budgeted: number;
            actual: number;
            variance: number;
            variancePercent: string;
            status: string;
        }[];
        total: {
            budgeted: number;
            actual: number;
            variance: number;
            variancePercent: string;
        };
        period: {
            month: number;
            year: number;
            monthName: string;
        };
    }>;
    /**
     * 5. Income Distribution - Distribuição de receitas
     */
    getIncomeDistribution(userId: string, startDate: Date, endDate: Date): Promise<{
        byCategory: {
            percent: string;
            name: string;
            amount: number;
        }[];
        byAccount: {
            percent: string;
            name: string;
            amount: number;
        }[];
        total: number;
        period: {
            start: Date;
            end: Date;
        };
    }>;
    /**
     * 6. Savings Rate Analysis - Taxa de poupança
     */
    getSavingsRate(userId: string, startDate: Date, endDate: Date): Promise<{
        totalIncome: number;
        totalExpense: number;
        netSavings: number;
        savingsRate: string;
        trend: {
            month: string;
            income: number;
            expense: number;
            savings: number;
            rate: string;
        }[];
        period: {
            start: Date;
            end: Date;
        };
    }>;
}
//# sourceMappingURL=reportExpanded.service.d.ts.map