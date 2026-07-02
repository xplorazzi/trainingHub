-- AlterTable
ALTER TABLE "training_modules" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "training_modules_slug_key" ON "training_modules"("slug");
