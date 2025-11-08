-- CreateTable
CREATE TABLE "categorization_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorization_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categorization_preferences_user_id_idx" ON "categorization_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorization_preferences_user_id_description_key" ON "categorization_preferences"("user_id", "description");

-- AddForeignKey
ALTER TABLE "categorization_preferences" ADD CONSTRAINT "categorization_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorization_preferences" ADD CONSTRAINT "categorization_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
