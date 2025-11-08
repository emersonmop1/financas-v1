import { CategoryType } from '@prisma/client';
interface CreateCategoryDTO {
    name: string;
    type: CategoryType;
    color?: string;
    icon?: string;
}
interface UpdateCategoryDTO {
    name?: string;
    color?: string;
    icon?: string;
}
export declare class CategoryService {
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        type: import(".prisma/client").$Enums.CategoryType;
        color: string;
        icon: string;
        isDefault: boolean;
    }[]>;
    findByType(userId: string, type: CategoryType): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        type: import(".prisma/client").$Enums.CategoryType;
        color: string;
        icon: string;
        isDefault: boolean;
    }[]>;
    create(userId: string, data: CreateCategoryDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        type: import(".prisma/client").$Enums.CategoryType;
        color: string;
        icon: string;
        isDefault: boolean;
    }>;
    update(id: string, userId: string, data: UpdateCategoryDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        type: import(".prisma/client").$Enums.CategoryType;
        color: string;
        icon: string;
        isDefault: boolean;
    }>;
    delete(id: string, userId: string): Promise<void>;
}
export {};
//# sourceMappingURL=category.service.d.ts.map