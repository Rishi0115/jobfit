-- AlterTable
ALTER TABLE "Company" ADD COLUMN "normalizedName" TEXT,
ALTER COLUMN "recruiterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "sourceMetadata" JSONB;

-- CreateIndex
CREATE INDEX "Company_normalizedName_idx" ON "Company"("normalizedName");

-- CreateIndex
CREATE INDEX "Job_employmentType_idx" ON "Job"("employmentType");
