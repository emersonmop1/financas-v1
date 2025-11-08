import { EventEmitter } from 'events';
export interface ImportProgress {
    jobId: string;
    totalBatches: number;
    completedBatches: number;
    percentage: number;
    estimatedTimeRemaining: number;
    status: 'processing' | 'completed' | 'error';
    startTime: number;
    message?: string;
}
declare class ProgressManager extends EventEmitter {
    private jobs;
    createJob(jobId: string, totalBatches: number): void;
    updateProgress(jobId: string, completedBatches: number): void;
    completeJob(jobId: string, message?: string): void;
    errorJob(jobId: string, error: string): void;
    getJob(jobId: string): ImportProgress | undefined;
    deleteJob(jobId: string): void;
}
export declare const progressManager: ProgressManager;
export {};
//# sourceMappingURL=progressManager.service.d.ts.map