interface CreateCreditCardDTO {
    name: string;
    limit: number;
    closingDay: number;
    dueDay: number;
}
interface UpdateCreditCardDTO {
    name?: string;
    limit?: number;
    closingDay?: number;
    dueDay?: number;
}
export declare class CreditCardService {
    create(userId: string, data: CreateCreditCardDTO): Promise<{
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
    }>;
    findAll(userId: string): Promise<{
        currentBillAmount: number;
        availableLimit: number;
        limit: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        closingDay: number;
        dueDay: number;
        cardNumberLast4: string | null;
        cardholderName: string | null;
        cardBrand: string | null;
        isActive: boolean;
    }[]>;
    findById(id: string, userId: string): Promise<{
        currentBillAmount: number;
        availableLimit: number;
        limit: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        closingDay: number;
        dueDay: number;
        cardNumberLast4: string | null;
        cardholderName: string | null;
        cardBrand: string | null;
        isActive: boolean;
    }>;
    update(id: string, userId: string, data: UpdateCreditCardDTO): Promise<{
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
    }>;
    delete(id: string, userId: string): Promise<void>;
    getCurrentBillAmount(creditCardId: string): Promise<number>;
    getCurrentBillTransactions(creditCardId: string, userId: string): Promise<{
        transactions: ({
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
        })[];
        total: number;
        closingDate: Date;
        dueDate: Date;
    }>;
    private getCurrentBillPeriod;
    private getDueDate;
    private getCardClosingDay;
}
export {};
//# sourceMappingURL=creditCard.service.d.ts.map