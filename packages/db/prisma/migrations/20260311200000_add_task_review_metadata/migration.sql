-- Add review workflow metadata to transaction tasks.
ALTER TABLE "TransactionTask"
ADD COLUMN "submittedForReviewByMembershipId" TEXT,
ADD COLUMN "rejectionReason" TEXT;

-- Add supporting index for review queue filtering.
CREATE INDEX "TransactionTask_organizationId_reviewStatus_idx"
ON "TransactionTask"("organizationId", "reviewStatus");

-- Add reviewer relation for submitted-by metadata.
ALTER TABLE "TransactionTask"
ADD CONSTRAINT "TransactionTask_submittedForReviewByMembershipId_fkey"
FOREIGN KEY ("submittedForReviewByMembershipId") REFERENCES "Membership"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
