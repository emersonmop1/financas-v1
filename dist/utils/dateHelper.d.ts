/**
 * Date Helper Utilities
 * Handles edge cases for recurring transactions
 */
/**
 * Get the last day of a specific month
 */
export declare function getLastDayOfMonth(year: number, month: number): number;
/**
 * Check if a year is a leap year
 */
export declare function isLeapYear(year: number): boolean;
/**
 * Adjust day to be valid for the given month
 * Example: Day 31 in April (30 days) → returns 30
 * Example: Day 31 in February → returns 28 or 29
 */
export declare function adjustDayToMonthEnd(dayOfMonth: number, month: number, year: number): number;
/**
 * Calculate the next execution date for a recurring transaction
 * Handles edge cases like day 31 in 30-day months
 */
export declare function calculateNextExecutionDate(dayOfMonth: number, frequency: 'MONTHLY' | 'YEARLY', fromDate?: Date): Date;
/**
 * Calculate the next execution date after a successful execution
 */
export declare function calculateNextExecutionAfterExecution(dayOfMonth: number, frequency: 'MONTHLY' | 'YEARLY', lastExecutionDate: Date): Date;
/**
 * Check if a date should trigger execution
 * Compares only year, month, and day (ignores time)
 */
export declare function shouldExecuteToday(nextExecutionDate: Date | null, today?: Date): boolean;
/**
 * Check if a recurring transaction is within its active period
 */
export declare function isWithinActivePeriod(startDate: Date, endDate: Date | null, checkDate?: Date): boolean;
/**
 * Get a human-readable description of the next execution
 */
export declare function getExecutionDescription(dayOfMonth: number, frequency: 'MONTHLY' | 'YEARLY', nextExecutionDate: Date | null): string;
//# sourceMappingURL=dateHelper.d.ts.map