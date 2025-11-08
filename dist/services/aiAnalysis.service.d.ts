export declare class AIAnalysisService {
    analyzeFinancialHealth(userId: string, startDate: Date, endDate: Date): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        summary: {
            totalIncome: any;
            totalExpense: any;
            balance: number;
            totalInAccounts: any;
            topExpenseCategories: {
                name: string;
                amount: number;
            }[];
        };
        analysis: string;
    }>;
}
//# sourceMappingURL=aiAnalysis.service.d.ts.map