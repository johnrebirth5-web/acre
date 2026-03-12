-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('system', 'task', 'offer', 'signature', 'incoming_update', 'follow_up', 'onboarding', 'event');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('follow_up_task', 'transaction_task', 'offer', 'signature_request', 'incoming_update', 'agent_onboarding_item', 'event');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'task_review_requested';
ALTER TYPE "NotificationType" ADD VALUE 'task_second_review_requested';
ALTER TYPE "NotificationType" ADD VALUE 'task_rejected';
ALTER TYPE "NotificationType" ADD VALUE 'offer_created';
ALTER TYPE "NotificationType" ADD VALUE 'offer_received';
ALTER TYPE "NotificationType" ADD VALUE 'offer_expiring_soon';
ALTER TYPE "NotificationType" ADD VALUE 'signature_pending';
ALTER TYPE "NotificationType" ADD VALUE 'signature_completed';
ALTER TYPE "NotificationType" ADD VALUE 'incoming_update_pending_review';
ALTER TYPE "NotificationType" ADD VALUE 'follow_up_assigned';
ALTER TYPE "NotificationType" ADD VALUE 'follow_up_overdue';
ALTER TYPE "NotificationType" ADD VALUE 'onboarding_assigned';
ALTER TYPE "NotificationType" ADD VALUE 'onboarding_due_soon';

-- AlterTable
ALTER TABLE "Notification"
  ADD COLUMN "category" "NotificationCategory",
  ADD COLUMN "entityId" TEXT,
  ADD COLUMN "entityType" "NotificationEntityType",
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "officeId" TEXT,
  ADD COLUMN "severity" "NotificationSeverity";

-- CreateIndex
CREATE INDEX "Notification_organizationId_membershipId_officeId_createdAt_idx"
  ON "Notification"("organizationId", "membershipId", "officeId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_membershipId_readAt_createdAt_idx"
  ON "Notification"("organizationId", "membershipId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_membershipId_category_idx"
  ON "Notification"("organizationId", "membershipId", "category");

-- CreateIndex
CREATE INDEX "Notification_organizationId_membershipId_entityType_entityId_idx"
  ON "Notification"("organizationId", "membershipId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_officeId_fkey"
  FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
