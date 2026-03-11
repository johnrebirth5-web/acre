-- CreateEnum
CREATE TYPE "TransactionTaskReviewStatus" AS ENUM ('not_required', 'pending', 'review_requested', 'first_approved', 'second_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionTaskComplianceStatus" AS ENUM ('not_applicable', 'pending', 'in_review', 'approved', 'rejected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionTaskStatus" ADD VALUE 'review_requested';
ALTER TYPE "TransactionTaskStatus" ADD VALUE 'reopened';

-- AlterTable
ALTER TABLE "TransactionTask" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedByMembershipId" TEXT,
ADD COLUMN     "complianceStatus" "TransactionTaskComplianceStatus" NOT NULL DEFAULT 'not_applicable',
ADD COLUMN     "firstApprovedAt" TIMESTAMP(3),
ADD COLUMN     "firstApprovedByMembershipId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedByMembershipId" TEXT,
ADD COLUMN     "reopenedAt" TIMESTAMP(3),
ADD COLUMN     "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresDocumentApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresSecondaryApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewStatus" "TransactionTaskReviewStatus" NOT NULL DEFAULT 'not_required',
ADD COLUMN     "secondApprovedAt" TIMESTAMP(3),
ADD COLUMN     "secondApprovedByMembershipId" TEXT,
ADD COLUMN     "submittedForReviewAt" TIMESTAMP(3);

UPDATE "TransactionTask"
SET
  "completedAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" = 'completed'
  AND "completedAt" IS NULL;

-- CreateTable
CREATE TABLE "TaskListView" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "filters" JSONB NOT NULL,
    "visibleColumns" JSONB,
    "sort" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskListView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskListView_organizationId_membershipId_officeId_idx" ON "TaskListView"("organizationId", "membershipId", "officeId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskListView_organizationId_membershipId_name_key" ON "TaskListView"("organizationId", "membershipId", "name");

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_dueAt_idx" ON "TransactionTask"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "TransactionTask_organizationId_complianceStatus_idx" ON "TransactionTask"("organizationId", "complianceStatus");

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_completedByMembershipId_fkey" FOREIGN KEY ("completedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_firstApprovedByMembershipId_fkey" FOREIGN KEY ("firstApprovedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_secondApprovedByMembershipId_fkey" FOREIGN KEY ("secondApprovedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTask" ADD CONSTRAINT "TransactionTask_rejectedByMembershipId_fkey" FOREIGN KEY ("rejectedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskListView" ADD CONSTRAINT "TaskListView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskListView" ADD CONSTRAINT "TaskListView_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskListView" ADD CONSTRAINT "TaskListView_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
