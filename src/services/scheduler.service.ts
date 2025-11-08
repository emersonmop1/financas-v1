import * as cron from 'node-cron';
import { PrismaClient, ExecutionStatus } from '@prisma/client';
import { TransactionService } from './transaction.service';
import {
  calculateNextExecutionAfterExecution,
  shouldExecuteToday,
  isWithinActivePeriod,
} from '../utils/dateHelper';

const prisma = new PrismaClient();
const transactionService = new TransactionService();

export class SchedulerService {
  private job: cron.ScheduledTask | null = null;

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
  async processRecurringTransactions(): Promise<void> {
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
        if (!isWithinActivePeriod(recurring.startDate, recurring.endDate, today)) {
          console.log(
            `Skipping recurring transaction ${recurring.id}: Outside active period`
          );
          continue;
        }

        // Check if should execute today
        if (!shouldExecuteToday(recurring.nextExecutionDate, today)) {
          console.log(
            `Skipping recurring transaction ${recurring.id}: Not scheduled for today`
          );
          continue;
        }

        // Check if max failures reached
        if (recurring.failureCount >= recurring.maxFailures) {
          console.log(
            `Skipping recurring transaction ${recurring.id}: Max failures reached (${recurring.failureCount}/${recurring.maxFailures})`
          );
          await this.logExecution(
            recurring.id,
            today,
            null,
            ExecutionStatus.SKIPPED,
            `Max failures reached (${recurring.failureCount}/${recurring.maxFailures})`,
            0
          );
          continue;
        }

        // Execute the transaction
        await this.executeRecurringTransaction(recurring.id);
      }

      console.log('Finished processing recurring transactions');
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
    }
  }

  /**
   * Execute a single recurring transaction
   */
  async executeRecurringTransaction(recurringId: string): Promise<void> {
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
      const nextExecution = calculateNextExecutionAfterExecution(
        recurring.dayOfMonth,
        recurring.frequency,
        new Date()
      );

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
      await this.logExecution(
        recurringId,
        new Date(),
        transaction.id,
        ExecutionStatus.SUCCESS,
        null,
        0
      );

      console.log(
        `Successfully executed recurring transaction ${recurringId}. Next execution: ${nextExecution.toISOString()}`
      );
    } catch (error: any) {
      console.error(`Error executing recurring transaction ${recurringId}:`, error);

      // Get current recurring transaction to check retry count
      const recurring = await prisma.recurringTransaction.findUnique({
        where: { id: recurringId },
      });

      if (!recurring) return;

      const newFailureCount = recurring.failureCount + 1;

      // Update failure count
      await prisma.recurringTransaction.update({
        where: { id: recurringId },
        data: {
          failureCount: newFailureCount,
        },
      });

      // Log failed execution
      await this.logExecution(
        recurringId,
        new Date(),
        null,
        ExecutionStatus.FAILED,
        error.message,
        newFailureCount
      );

      // If max failures reached, deactivate
      if (newFailureCount >= recurring.maxFailures) {
        await prisma.recurringTransaction.update({
          where: { id: recurringId },
          data: {
            isActive: false,
          },
        });
        console.log(
          `Recurring transaction ${recurringId} deactivated after ${newFailureCount} failures`
        );
      }
    }
  }

  /**
   * Log execution attempt
   */
  private async logExecution(
    recurringTransId: string,
    executionDate: Date,
    transactionId: string | null,
    status: ExecutionStatus,
    errorMessage: string | null,
    retryCount: number
  ): Promise<void> {
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
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  }

  /**
   * Get execution logs for a recurring transaction
   */
  async getExecutionLogs(recurringTransId: string) {
    return prisma.executionLog.findMany({
      where: { recurringTransId },
      orderBy: { executionDate: 'desc' },
      take: 50,
    });
  }

  /**
   * Clean up old execution logs (older than 90 days)
   */
  async cleanupOldLogs(): Promise<number> {
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

// Singleton instance
export const schedulerService = new SchedulerService();
