import { Decimal } from '@prisma/client/runtime/library';
export interface CreateBudgetDTO {
    categoryId?: string;
    month: number;
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
export declare class BudgetService {
    create(userId: string, data: CreateBudgetDTO): Promise<any>;
    getAll(userId: string, filters?: {
        month?: number;
        year?: number;
        categoryId?: string;
    }): Promise<any>;
    getById(userId: string, id: string): Promise<any>;
    update(userId: string, id: string, data: UpdateBudgetDTO): Promise<any>;
    delete(userId: string, id: string): Promise<void>;
    /**
     * Obtém orçamentos com gastos reais do período
     */
    getBudgetsWithSpending(userId: string, month: number, year: number): Promise<BudgetWithSpending[]>;
    /**
     * Obtém resumo geral do orçamento do período
     */
    getBudgetSummary(userId: string, month: number, year: number): Promise<{
        month: number;
        year: number;
        totalBudget: Decimal;
        totalSpent: Decimal;
        totalRemaining: Decimal;
        totalPercentage: number;
        budgets: BudgetWithSpending[];
    }>;
}
//# sourceMappingURL=budget.service.d.ts.map