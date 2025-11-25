-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_month_year_idx" ON "budgets"("user_id", "month", "year");

-- CreateIndex
CREATE INDEX "credit_cards_user_id_idx" ON "credit_cards"("user_id");

-- CreateIndex
CREATE INDEX "transactions_account_id_type_is_paid_date_idx" ON "transactions"("account_id", "type", "is_paid", "date");

-- CreateIndex
CREATE INDEX "transactions_category_id_type_date_idx" ON "transactions"("category_id", "type", "date");

-- CreateIndex
CREATE INDEX "transactions_type_is_paid_idx" ON "transactions"("type", "is_paid");
