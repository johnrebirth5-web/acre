-- CreateEnum
CREATE TYPE "AgentBillingFrequency" AS ENUM ('monthly', 'quarterly', 'annual', 'custom_interval');

-- CreateEnum
CREATE TYPE "AgentPaymentMethodType" AS ENUM ('card_on_file', 'bank_account', 'check', 'manual', 'other');

-- CreateEnum
CREATE TYPE "AgentPaymentMethodStatus" AS ENUM ('active', 'inactive', 'invalid', 'expired', 'removed');

-- AlterTable
ALTER TABLE "AccountingTransaction" ADD COLUMN     "billingCategory" TEXT,
ADD COLUMN     "isAgentBilling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originRecurringChargeRuleId" TEXT;

-- CreateTable
CREATE TABLE "AccountingTransactionApplication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "sourceAccountingTransactionId" TEXT NOT NULL,
    "targetAccountingTransactionId" TEXT NOT NULL,
    "createdByMembershipId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "memo" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingTransactionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRecurringChargeRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chargeType" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "AgentBillingFrequency" NOT NULL,
    "customIntervalDays" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastGeneratedAt" TIMESTAMP(3),
    "autoGenerateInvoice" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRecurringChargeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "type" "AgentPaymentMethodType" NOT NULL,
    "label" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "last4" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "autoPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "externalReferenceId" TEXT,
    "status" "AgentPaymentMethodStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingTransactionApplication_organizationId_sourceAccou_idx" ON "AccountingTransactionApplication"("organizationId", "sourceAccountingTransactionId");

-- CreateIndex
CREATE INDEX "AccountingTransactionApplication_organizationId_targetAccou_idx" ON "AccountingTransactionApplication"("organizationId", "targetAccountingTransactionId");

-- CreateIndex
CREATE INDEX "AccountingTransactionApplication_organizationId_officeId_idx" ON "AccountingTransactionApplication"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "AgentRecurringChargeRule_organizationId_officeId_isActive_idx" ON "AgentRecurringChargeRule"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE INDEX "AgentRecurringChargeRule_organizationId_membershipId_isActi_idx" ON "AgentRecurringChargeRule"("organizationId", "membershipId", "isActive");

-- CreateIndex
CREATE INDEX "AgentRecurringChargeRule_organizationId_nextDueDate_idx" ON "AgentRecurringChargeRule"("organizationId", "nextDueDate");

-- CreateIndex
CREATE UNIQUE INDEX "AgentRecurringChargeRule_organizationId_membershipId_name_key" ON "AgentRecurringChargeRule"("organizationId", "membershipId", "name");

-- CreateIndex
CREATE INDEX "AgentPaymentMethod_organizationId_officeId_idx" ON "AgentPaymentMethod"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "AgentPaymentMethod_organizationId_membershipId_status_idx" ON "AgentPaymentMethod"("organizationId", "membershipId", "status");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_isAgentBilling_related_idx" ON "AccountingTransaction"("organizationId", "isAgentBilling", "relatedMembershipId");

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_originRecurringChargeRuleId_fkey" FOREIGN KEY ("originRecurringChargeRuleId") REFERENCES "AgentRecurringChargeRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionApplication" ADD CONSTRAINT "AccountingTransactionApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionApplication" ADD CONSTRAINT "AccountingTransactionApplication_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionApplication" ADD CONSTRAINT "AccountingTransactionApplication_sourceAccountingTransacti_fkey" FOREIGN KEY ("sourceAccountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionApplication" ADD CONSTRAINT "AccountingTransactionApplication_targetAccountingTransacti_fkey" FOREIGN KEY ("targetAccountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionApplication" ADD CONSTRAINT "AccountingTransactionApplication_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecurringChargeRule" ADD CONSTRAINT "AgentRecurringChargeRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecurringChargeRule" ADD CONSTRAINT "AgentRecurringChargeRule_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecurringChargeRule" ADD CONSTRAINT "AgentRecurringChargeRule_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPaymentMethod" ADD CONSTRAINT "AgentPaymentMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPaymentMethod" ADD CONSTRAINT "AgentPaymentMethod_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPaymentMethod" ADD CONSTRAINT "AgentPaymentMethod_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
