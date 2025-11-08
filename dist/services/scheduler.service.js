"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerService = exports.SchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const client_1 = require("@prisma/client");
const transaction_service_1 = require("./transaction.service");
const dateHelper_1 = require("../utils/dateHelper");
const prisma = new client_1.PrismaClient();
const transactionService = new transaction_service_1.TransactionService();
class SchedulerService {
    job = null;
    /**
     * Initialize the scheduler to run daily at 00:01
     */
    start() {
        if (this.job) {
            console.log('Scheduler is already running');
            return;
        }
        // Run every day at 00:01 (1 minute past midnight)
        this.job = cron.schedule('1 0 * * *', async () => {
            console.log('Starting recurring transactions job...');
            await this.processRecurringTransactions();
        });
        console.log('Scheduler started: Recurring transactions will be processed daily at 00:01');
    }
    /**
     * Stop the scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            console.log('Scheduler stopped');
        }
    }
    /**
     * Process all active recurring transactions
     */
    async processRecurringTransactions() {
        try {
            const today = new Date();
            console.log(`Processing recurring transactions for ${today.toISOString().split('T')[0]}`);
            // Get all active recurring transactions
            const recurringTransactions = await prisma.recurringTransaction.findMany({
                where: {
                    isActive: true,
                },
                include: {
                    account: true,
                    category: true,
                    creditCard: true,
                },
            });
            console.log(`Found ${recurringTransactions.length} active recurring transactions`);
            for (const recurring of recurringTransactions) {
                // Check if within active period
                if (!(0, dateHelper_1.isWithinActivePeriod)(recurring.startDate, recurring.endDate, today)) {
                    console.log(`Skipping recurring transaction ${recurring.id}: Outside active period`);
                    continue;
                }
                // Check if should execute today
                if (!(0, dateHelper_1.shouldExecuteToday)(recurring.nextExecutionDate, today)) {
                    console.log(`Skipping recurring transaction ${recurring.id}: Not scheduled for today`);
                    continue;
                }
                // Check if max failures reached
                if (recurring.failureCount >= recurring.maxFailures) {
                    console.log(`Skipping recurring transaction ${recurring.id}: Max failures reached (${recurring.failureCount}/${recurring.maxFailures})`);
                    await this.logExecution(recurring.id, today, null, client_1.ExecutionStatus.SKIPPED, `Max failures reached (${recurring.failureCount}/${recurring.maxFailures})`, 0);
                    continue;
                }
                // Execute the transaction
                await this.executeRecurringTransaction(recurring.id);
            }
            console.log('Finished processing recurring transactions');
        }
        catch (error) {
            console.error('Error processing recurring transactions:', error);
        }
    }
    /**
     * Execute a single recurring transaction
     */
    async executeRecurringTransaction(recurringId) {
        try {
            const recurring = await prisma.recurringTransaction.findUnique({
                where: { id: recurringId },
                include: {
                    account: true,
                    category: true,
                    creditCard: true,
                },
            });
            if (!recurring) {
                throw new Error(`Recurring transaction ${recurringId} not found`);
            }
            console.log(`Executing recurring transaction: ${recurring.description}`);
            // Check if account exists (if not credit card transaction)
            if (!recurring.creditCardId && !recurring.account) {
                throw new Error('Account not found or deleted');
            }
            // Check if credit card exists (if credit card transaction)
            if (recurring.creditCardId && !recurring.creditCard) {
                throw new Error('Credit card not found or deleted');
            }
            // Create the transaction
            const transaction = await transactionService.create(recurring.userId, {
                accountId: recurring.accountId || undefined,
                categoryId: recurring.categoryId,
                creditCardId: recurring.creditCardId || undefined,
                description: recurring.description,
                amount: Number(recurring.amount),
                date: new Date().toISOString(),
                type: recurring.type,
                isPaid: true,
                notes: `Transação recorrente (ID: ${recurring.id})`,
            });
            // Calculate next execution date
            const nextExecution = (0, dateHelper_1.calculateNextExecutionAfterExecution)(recurring.dayOfMonth, recurring.frequency, new Date());
            // Update recurring transaction
            await prisma.recurringTransaction.update({
                where: { id: recurringId },
                data: {
                    lastExecutedDate: new Date(),
                    nextExecutionDate: nextExecution,
                    failureCount: 0, // Reset failure count on success
                },
            });
            // Log successful execution
            await this.logExecution(recurringId, new Date(), transaction.id, client_1.ExecutionStatus.SUCCESS, null, 0);
            console.log(`Successfully executed recurring transaction ${recurringId}. Next execution: ${nextExecution.toISOString()}`);
        }
        catch (error) {
            console.error(`Error executing recurring transaction ${recurringId}:`, error);
            // Get current recurring transaction to check retry count
            const recurring = await prisma.recurringTransaction.findUnique({
                where: { id: recurringId },
            });
            if (!recurring)
                return;
            const newFailureCount = recurring.failureCount + 1;
            // Update failure count
            await prisma.recurringTransaction.update({
                where: { id: recurringId },
                data: {
                    failureCount: newFailureCount,
                },
            });
            // Log failed execution
            await this.logExecution(recurringId, new Date(), null, client_1.ExecutionStatus.FAILED, error.message, newFailureCount);
            // If max failures reached, deactivate
            if (newFailureCount >= recurring.maxFailures) {
                await prisma.recurringTransaction.update({
                    where: { id: recurringId },
                    data: {
                        isActive: false,
                    },
                });
                console.log(`Recurring transaction ${recurringId} deactivated after ${newFailureCount} failures`);
            }
        }
    }
    /**
     * Log execution attempt
     */
    async logExecution(recurringTransId, executionDate, transactionId, status, errorMessage, retryCount) {
        try {
            await prisma.executionLog.create({
                data: {
                    recurringTransId,
                    executionDate,
                    transactionId,
                    status,
                    errorMessage,
                    retryCount,
                },
            });
        }
        catch (error) {
            console.error('Error logging execution:', error);
        }
    }
    /**
     * Get execution logs for a recurring transaction
     */
    async getExecutionLogs(recurringTransId) {
        return prisma.executionLog.findMany({
            where: { recurringTransId },
            orderBy: { executionDate: 'desc' },
            take: 50,
        });
    }
    /**
     * Clean up old execution logs (older than 90 days)
     */
    async cleanupOldLogs() {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const result = await prisma.executionLog.deleteMany({
            where: {
                createdAt: {
                    lt: ninetyDaysAgo,
                },
            },
        });
        console.log(`Cleaned up ${result.count} old execution logs`);
        return result.count;
    }
}
exports.SchedulerService = SchedulerService;
// Singleton instance
exports.schedulerService = new SchedulerService();
//# sourceMappingURL=scheduler.service.js.map