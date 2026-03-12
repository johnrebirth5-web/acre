-- AlterTable
ALTER TABLE "CommissionPlanAssignment" ADD COLUMN     "teamId" TEXT,
ALTER COLUMN "membershipId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "CommissionPlanAssignment_organizationId_officeId_teamId_idx" ON "CommissionPlanAssignment"("organizationId", "officeId", "teamId");

-- AddForeignKey
ALTER TABLE "CommissionPlanAssignment" ADD CONSTRAINT "CommissionPlanAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "CommissionPlanAssignment"
ADD CONSTRAINT "CommissionPlanAssignment_exactly_one_target_check"
CHECK (
  ("membershipId" IS NOT NULL AND "teamId" IS NULL)
  OR ("membershipId" IS NULL AND "teamId" IS NOT NULL)
);
