export declare class ReportService {
    getExpensesByCategory(userId: string, startDate?: Date, endDate?: Date): Promise<{
        name: string;
        total: number;
        color: string;
        icon: string;
    }[]>;
    getMonthlyEvolution(userId: string): Promise<{
        month: string;
        income: number;
        expense: number;
        balance: number;
    }[]>;
    getMonthlyComparison(userId: string): Promise<{
        current: {
            income: number;
            expense: number;
            balance: number;
        };
        previous: {
            income: number;
            expense: number;
            balance: number;
        };
        changes: {
            income: number;
            expense: number;
            balance: number;
        };
    }>;
    private getStatsForPeriod;
    getTopExpenseCategories(userId: string, limit?: number, startDate?: Date, endDate?: Date): Promise<{
        name: string;
        total: number;
        color: string;
        icon: string;
    }[]>;
}
//# sourceMappingURL=report.service.d.ts.map