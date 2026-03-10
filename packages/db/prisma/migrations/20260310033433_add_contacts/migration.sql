-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "contactType" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "primaryClientId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_organizationId_primaryClientId_idx" ON "Transaction"("organizationId", "primaryClientId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_primaryClientId_fkey" FOREIGN KEY ("primaryClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
