import { GoalStatus } from '@prisma/client';
interface CreateGoalDTO {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: Date;
}
interface UpdateGoalDTO {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: Date;
    status?: GoalStatus;
}
export declare class GoalService {
    create(userId: string, data: CreateGoalDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
    }>;
    findAll(userId: string, status?: GoalStatus): Promise<{
        targetAmount: number;
        currentAmount: number;
        progress: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        deadline: Date | null;
    }[]>;
    findById(id: string, userId: string): Promise<{
        targetAmount: number;
        currentAmount: number;
        progress: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        deadline: Date | null;
    }>;
    update(id: string, userId: string, data: UpdateGoalDTO): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        deadline: Date | null;
    }>;
    delete(id: string, userId: string): Promise<void>;
    addProgress(id: string, userId: string, amount: number): Promise<{
        targetAmount: number;
        currentAmount: number;
        progress: number;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.GoalStatus;
        deadline: Date | null;
    }>;
    getStats(userId: string): Promise<{
        total: number;
        active: number;
        completed: number;
        cancelled: number;
        totalTarget: number;
        totalSaved: number;
        overallProgress: number;
    }>;
    private calculateProgress;
}
export {};
//# sourceMappingURL=goal.service.d.ts.map