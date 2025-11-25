/*
  Warnings:

  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categorization_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `execution_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recurring_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "goal_type" AS ENUM ('SAVINGS', 'CATEGORY_LIMIT', 'BALANCE_TARGET', 'EXPENSE_REDUCTION');

-- CreateEnum
CREATE TYPE "goal_period" AS ENUM ('MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "piggy_bank_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "piggy_bank_transaction_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "investment_type" AS ENUM ('STOCK', 'FUND', 'FIXED_INCOME', 'CRYPTO', 'REAL_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "investment_status" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_category_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_user_id_fkey";

-- DropForeignKey
ALTER TABLE "categorization_preferences" DROP CONSTRAINT "categorization_preferences_category_id_fkey";

-- DropForeignKey
ALTER TABLE "categorization_preferences" DROP CONSTRAINT "categorization_preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "execution_logs" DROP CONSTRAINT "execution_logs_recurring_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_account_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_credit_card_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_transactions" DROP CONSTRAINT "recurring_transactions_user_id_fkey";

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '🎯',
ADD COLUMN     "period" "goal_period" NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "type" "goal_type" NOT NULL DEFAULT 'SAVINGS';

-- DropTable
DROP TABLE "budgets";

-- DropTable
DROP TABLE "categorization_preferences";

-- DropTable
DROP TABLE "execution_logs";

-- DropTable
DROP TABLE "recurring_transactions";

-- DropEnum
DROP TYPE "execution_status";

-- DropEnum
DROP TYPE "recurrence_frequency";

-- CreateTable
CREATE TABLE "piggy_banks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(15,2),
    "current_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT '🐷',
    "color" TEXT NOT NULL DEFAULT '#EC4899',
    "status" "piggy_bank_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "piggy_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piggy_bank_transactions" (
    "id" TEXT NOT NULL,
    "piggy_bank_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "piggy_bank_transaction_type" NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piggy_bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "investment_type" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ticker" TEXT,
    "quantity" DECIMAL(15,8) NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "current_price" DECIMAL(15,2),
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "sale_date" TIMESTAMP(3),
    "sale_price" DECIMAL(15,2),
    "broker" TEXT,
    "notes" TEXT,
    "status" "investment_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_credit_card_id_date_type_idx" ON "transactions"("credit_card_id", "date", "type");

-- CreateIndex
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piggy_banks" ADD CONSTRAINT "piggy_banks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "piggy_bank_transactions" ADD CONSTRAINT "piggy_bank_transactions_piggy_bank_id_fkey" FOREIGN KEY ("piggy_bank_id") REFERENCES "piggy_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "invoices_user_id_credit_card_id_statement_month_statement_key" RENAME TO "invoices_user_id_credit_card_id_statement_month_statement_y_key";
