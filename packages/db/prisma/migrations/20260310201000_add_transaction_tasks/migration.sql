-- CreateEnum
CREATE TYPE "TransactionTaskStatus" AS ENUM ('todo', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "TransactionTask" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "checklistGroup" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeMembershipId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" "TransactionTaskStatus" NOT NULL DEFAULT 'todo',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_transactionId_idx" ON "TransactionTask"("organizationId", "transactionId");

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_assigneeMembershipId_idx" ON "TransactionTask"("organizationId", "assigneeMembershipId");

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_transactionId_status_idx" ON "TransactionTask"("organizationId", "transactionId", "status");

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_transactionId_sortOrder_idx" ON "TransactionTask"("organizationId", "transactionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_assigneeMembershipId_fkey" FOREIGN KEY ("assigneeMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
