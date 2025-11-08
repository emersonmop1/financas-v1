import { TransactionType } from '@prisma/client';
interface CreateTransactionDTO {
    accountId?: string;
    categoryId: string;
    creditCardId?: string;
    description: string;
    amount: number;
    date: Date;
    type: TransactionType;
    isPaid?: boolean;
    installments?: number;
    installmentNum?: number;
    notes?: string;
}
interface UpdateTransactionDTO {
    accountId?: string;
    categoryId?: string;
    creditCardId?: string;
    description?: string;
    amount?: number;
    date?: Date;
    type?: TransactionType;
    isPaid?: boolean;
    notes?: string;
}
interface TransactionFilters {
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
    isPaid?: boolean;
}
export declare class TransactionService {
    create(userId: string, data: CreateTransactionDTO): Promise<{
        account: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
        creditCard: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            limit: import("@prisma/client/runtime/library").Decimal;
            closingDay: number;
            dueDay: number;
            cardNumberLast4: string | null;
            cardholderName: string | null;
            cardBrand: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            type: import(".prisma/client").$Enums.CategoryType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        installments: number | null;
        installmentNum: number | null;
        isInternational: boolean;
        originalCurrency: string | null;
        originalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        accountId: string | null;
        categoryId: string;
        creditCardId: string | null;
        invoiceId: string | null;
    }>;
    findAll(userId: string, filters?: TransactionFilters): Promise<({
        account: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
        creditCard: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            limit: import("@prisma/client/runtime/library").Decimal;
            closingDay: number;
            dueDay: number;
            cardNumberLast4: string | null;
            cardholderName: string | null;
            cardBrand: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            type: import(".prisma/client").$Enums.CategoryType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        installments: number | null;
        installmentNum: number | null;
        isInternational: boolean;
        originalCurrency: string | null;
        originalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        accountId: string | null;
        categoryId: string;
        creditCardId: string | null;
        invoiceId: string | null;
    })[]>;
    findById(id: string, userId: string): Promise<{
        account: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
        creditCard: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            limit: import("@prisma/client/runtime/library").Decimal;
            closingDay: number;
            dueDay: number;
            cardNumberLast4: string | null;
            cardholderName: string | null;
            cardBrand: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            type: import(".prisma/client").$Enums.CategoryType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        installments: number | null;
        installmentNum: number | null;
        isInternational: boolean;
        originalCurrency: string | null;
        originalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        accountId: string | null;
        categoryId: string;
        creditCardId: string | null;
        invoiceId: string | null;
    }>;
    update(id: string, userId: string, data: UpdateTransactionDTO): Promise<{
        account: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
        creditCard: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            limit: import("@prisma/client/runtime/library").Decimal;
            closingDay: number;
            dueDay: number;
            cardNumberLast4: string | null;
            cardholderName: string | null;
            cardBrand: string | null;
            isActive: boolean;
        } | null;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            userId: string | null;
            type: import(".prisma/client").$Enums.CategoryType;
            color: string;
            icon: string;
            isDefault: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        date: Date;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        installments: number | null;
        installmentNum: number | null;
        isInternational: boolean;
        originalCurrency: string | null;
        originalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        accountId: string | null;
        categoryId: string;
        creditCardId: string | null;
        invoiceId: string | null;
    }>;
    delete(id: string, userId: string): Promise<void>;
    getStats(userId: string, startDate?: Date, endDate?: Date): Promise<{
        income: number;
        expense: number;
        balance: number;
    }>;
}
export {};
//# sourceMappingURL=transaction.service.d.ts.map