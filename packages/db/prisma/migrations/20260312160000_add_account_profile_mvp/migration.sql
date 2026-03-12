-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "MembershipNotificationPreference" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "approvalAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taskRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "offerAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipNotificationPreference_membershipId_key" ON "MembershipNotificationPreference"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipNotificationPreference_organizationId_officeId_idx" ON "MembershipNotificationPreference"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "MembershipNotificationPreference_organizationId_membershipI_idx" ON "MembershipNotificationPreference"("organizationId", "membershipId");

-- AddForeignKey
ALTER TABLE "MembershipNotificationPreference" ADD CONSTRAINT "MembershipNotificationPreference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipNotificationPreference" ADD CONSTRAINT "MembershipNotificationPreference_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipNotificationPreference" ADD CONSTRAINT "MembershipNotificationPreference_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Notification_organizationId_membershipId_entityType_entityId_idx" RENAME TO "Notification_organizationId_membershipId_entityType_entityI_idx";
