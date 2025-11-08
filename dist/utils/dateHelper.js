"use strict";
/**
 * Date Helper Utilities
 * Handles edge cases for recurring transactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastDayOfMonth = getLastDayOfMonth;
exports.isLeapYear = isLeapYear;
exports.adjustDayToMonthEnd = adjustDayToMonthEnd;
exports.calculateNextExecutionDate = calculateNextExecutionDate;
exports.calculateNextExecutionAfterExecution = calculateNextExecutionAfterExecution;
exports.shouldExecuteToday = shouldExecuteToday;
exports.isWithinActivePeriod = isWithinActivePeriod;
exports.getExecutionDescription = getExecutionDescription;
/**
 * Get the last day of a specific month
 */
function getLastDayOfMonth(year, month) {
    // month is 0-indexed (0 = Jan, 11 = Dec)
    return new Date(year, month + 1, 0).getDate();
}
/**
 * Check if a year is a leap year
 */
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
/**
 * Adjust day to be valid for the given month
 * Example: Day 31 in April (30 days) → returns 30
 * Example: Day 31 in February → returns 28 or 29
 */
function adjustDayToMonthEnd(dayOfMonth, month, year) {
    const lastDay = getLastDayOfMonth(year, month);
    return Math.min(dayOfMonth, lastDay);
}
/**
 * Calculate the next execution date for a recurring transaction
 * Handles edge cases like day 31 in 30-day months
 */
function calculateNextExecutionDate(dayOfMonth, frequency, fromDate = new Date()) {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const currentDay = fromDate.getDate();
    if (frequency === 'MONTHLY') {
        // Check if we should execute this month or next month
        const adjustedDay = adjustDayToMonthEnd(dayOfMonth, month, year);
        if (currentDay < adjustedDay) {
            // Execute this month
            return new Date(year, month, adjustedDay);
        }
        else {
            // Execute next month
            const nextMonth = month + 1;
            const nextYear = nextMonth > 11 ? year + 1 : year;
            const finalMonth = nextMonth > 11 ? 0 : nextMonth;
            const finalDay = adjustDayToMonthEnd(dayOfMonth, finalMonth, nextYear);
            return new Date(nextYear, finalMonth, finalDay);
        }
    }
    else {
        // YEARLY
        const adjustedDay = adjustDayToMonthEnd(dayOfMonth, month, year);
        if (currentDay < adjustedDay) {
            // Execute this year
            return new Date(year, month, adjustedDay);
        }
        else {
            // Execute next year
            const nextYear = year + 1;
            const finalDay = adjustDayToMonthEnd(dayOfMonth, month, nextYear);
            return new Date(nextYear, month, finalDay);
        }
    }
}
/**
 * Calculate the next execution date after a successful execution
 */
function calculateNextExecutionAfterExecution(dayOfMonth, frequency, lastExecutionDate) {
    const year = lastExecutionDate.getFullYear();
    const month = lastExecutionDate.getMonth();
    if (frequency === 'MONTHLY') {
        // Next month
        const nextMonth = month + 1;
        const nextYear = nextMonth > 11 ? year + 1 : year;
        const finalMonth = nextMonth > 11 ? 0 : nextMonth;
        const finalDay = adjustDayToMonthEnd(dayOfMonth, finalMonth, nextYear);
        return new Date(nextYear, finalMonth, finalDay);
    }
    else {
        // YEARLY - same month, next year
        const nextYear = year + 1;
        const finalDay = adjustDayToMonthEnd(dayOfMonth, month, nextYear);
        return new Date(nextYear, month, finalDay);
    }
}
/**
 * Check if a date should trigger execution
 * Compares only year, month, and day (ignores time)
 */
function shouldExecuteToday(nextExecutionDate, today = new Date()) {
    if (!nextExecutionDate)
        return false;
    const todayStr = today.toISOString().split('T')[0];
    const nextStr = nextExecutionDate.toISOString().split('T')[0];
    return todayStr >= nextStr;
}
/**
 * Check if a recurring transaction is within its active period
 */
function isWithinActivePeriod(startDate, endDate, checkDate = new Date()) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const check = new Date(checkDate);
    check.setHours(0, 0, 0, 0);
    // Check if we're after start date
    if (check < start) {
        return false;
    }
    // If no end date, it's active indefinitely
    if (!endDate) {
        return true;
    }
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    // Check if we're before end date
    return check <= end;
}
/**
 * Get a human-readable description of the next execution
 */
function getExecutionDescription(dayOfMonth, frequency, nextExecutionDate) {
    if (!nextExecutionDate) {
        return frequency === 'MONTHLY'
            ? `Todo dia ${dayOfMonth} de cada mês`
            : `Todo ano no dia ${dayOfMonth}`;
    }
    const date = nextExecutionDate.toLocaleDateString('pt-BR');
    return `Próxima execução: ${date}`;
}
//# sourceMappingURL=dateHelper.js.map