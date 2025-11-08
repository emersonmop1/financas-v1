import { AccountType } from '@prisma/client';
interface CreateAccountDTO {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: string;
}
interface UpdateAccountDTO {
    name?: string;
    type?: AccountType;
    balance?: number;
    currency?: string;
}
export declare class AccountService {
    create(userId: string, data: CreateAccountDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }[]>;
    findById(id: string, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    update(id: string, userId: string, data: UpdateAccountDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    delete(id: string, userId: string): Promise<void>;
    getTotalBalance(userId: string): Promise<number>;
}
export {};
//# sourceMappingURL=account.service.d.ts.map