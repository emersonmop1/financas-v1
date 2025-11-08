-- AlterTable: Add new fields to credit_cards
ALTER TABLE "credit_cards" ADD COLUMN "card_number_last4" TEXT,
ADD COLUMN "cardholder_name" TEXT,
ADD COLUMN "card_brand" TEXT,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add new fields to transactions
ALTER TABLE "transactions" ADD COLUMN "invoice_id" TEXT,
ADD COLUMN "is_international" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "original_currency" TEXT,
ADD COLUMN "original_amount" DECIMAL(15,2);

-- CreateTable: Create invoices table
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credit_card_id" TEXT NOT NULL,
    "statement_month" INTEGER NOT NULL,
    "statement_year" INTEGER NOT NULL,
    "closing_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint for invoice detection
CREATE UNIQUE INDEX "invoices_user_id_credit_card_id_statement_month_statement_key" ON "invoices"("user_id", "credit_card_id", "statement_month", "statement_year");

-- AddForeignKey: Link invoice to user
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link invoice to credit card
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link transaction to invoice
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
