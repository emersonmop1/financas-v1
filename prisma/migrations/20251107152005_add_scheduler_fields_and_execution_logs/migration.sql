-- CreateEnum
CREATE TYPE "execution_status" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "failure_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_executed_date" TIMESTAMP(3),
ADD COLUMN     "max_failures" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "next_execution_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "recurring_transaction_id" TEXT NOT NULL,
    "execution_date" TIMESTAMP(3) NOT NULL,
    "transaction_id" TEXT,
    "status" "execution_status" NOT NULL,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_logs_recurring_transaction_id_idx" ON "execution_logs"("recurring_transaction_id");

-- CreateIndex
CREATE INDEX "execution_logs_execution_date_idx" ON "execution_logs"("execution_date");

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_recurring_transaction_id_fkey" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
