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
export declare class RecurringTransactionService {
    create(userId: string, data: CreateRecurringTransactionDTO): Promise<any>;
    getAll(userId: string, includeInactive?: boolean): Promise<any>;
    getById(userId: string, id: string): Promise<any>;
    update(userId: string, id: string, data: UpdateRecurringTransactionDTO): Promise<any>;
    delete(userId: string, id: string): Promise<void>;
    toggleActive(userId: string, id: string): Promise<any>;
}
//# sourceMappingURL=recurringTransaction.service.d.ts.map