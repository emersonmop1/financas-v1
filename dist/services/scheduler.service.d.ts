export declare class SchedulerService {
    private job;
    /**
     * Initialize the scheduler to run daily at 00:01
     */
    start(): void;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Process all active recurring transactions
     */
    processRecurringTransactions(): Promise<void>;
    /**
     * Execute a single recurring transaction
     */
    executeRecurringTransaction(recurringId: string): Promise<void>;
    /**
     * Log execution attempt
     */
    private logExecution;
    /**
     * Get execution logs for a recurring transaction
     */
    getExecutionLogs(recurringTransId: string): Promise<any>;
    /**
     * Clean up old execution logs (older than 90 days)
     */
    cleanupOldLogs(): Promise<number>;
}
export declare const schedulerService: SchedulerService;
//# sourceMappingURL=scheduler.service.d.ts.map