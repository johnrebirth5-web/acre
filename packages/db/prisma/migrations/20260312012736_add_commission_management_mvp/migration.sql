-- CreateEnum
CREATE TYPE "CommissionCalculationMode" AS ENUM ('split_and_fees', 'flat_net');

-- CreateEnum
CREATE TYPE "CommissionPlanRuleType" AS ENUM ('base_split', 'brokerage_fee', 'referral_fee', 'flat_fee_deduction', 'sliding_scale');

-- CreateEnum
CREATE TYPE "CommissionRuleFeeType" AS ENUM ('percentage', 'flat');

-- CreateEnum
CREATE TYPE "CommissionRecipientType" AS ENUM ('agent', 'brokerage', 'referral');

-- CreateEnum
CREATE TYPE "CommissionCalculationStatus" AS ENUM ('draft', 'calculated', 'reviewed', 'statement_ready', 'payable', 'paid');

-- CreateTable
CREATE TABLE "CommissionPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "calculationMode" "CommissionCalculationMode" NOT NULL DEFAULT 'split_and_fees',
    "defaultCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlanAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "commissionPlanId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlanAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlanRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commissionPlanId" TEXT NOT NULL,
    "ruleType" "CommissionPlanRuleType" NOT NULL,
    "ruleName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "splitPercent" DECIMAL(7,4),
    "flatAmount" DECIMAL(12,2),
    "feeType" "CommissionRuleFeeType",
    "feeAmount" DECIMAL(12,2),
    "thresholdStart" DECIMAL(12,2),
    "thresholdEnd" DECIMAL(12,2),
    "appliesToRole" TEXT,
    "recipientType" "CommissionRecipientType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlanRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionCalculation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "membershipId" TEXT,
    "commissionPlanId" TEXT,
    "accountingTransactionId" TEXT,
    "recipientType" "CommissionRecipientType" NOT NULL,
    "recipientRole" TEXT,
    "recipientName" TEXT,
    "grossCommission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "referralFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "officeNet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "agentNet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "statementAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CommissionCalculationStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionPlan_organizationId_officeId_isActive_idx" ON "CommissionPlan"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPlan_organizationId_officeId_name_key" ON "CommissionPlan"("organizationId", "officeId", "name");

-- CreateIndex
CREATE INDEX "CommissionPlanAssignment_organizationId_officeId_membership_idx" ON "CommissionPlanAssignment"("organizationId", "officeId", "membershipId");

-- CreateIndex
CREATE INDEX "CommissionPlanAssignment_organizationId_commissionPlanId_idx" ON "CommissionPlanAssignment"("organizationId", "commissionPlanId");

-- CreateIndex
CREATE INDEX "CommissionPlanAssignment_organizationId_effectiveFrom_effec_idx" ON "CommissionPlanAssignment"("organizationId", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "CommissionPlanRule_organizationId_commissionPlanId_sortOrde_idx" ON "CommissionPlanRule"("organizationId", "commissionPlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "CommissionPlanRule_organizationId_ruleType_isActive_idx" ON "CommissionPlanRule"("organizationId", "ruleType", "isActive");

-- CreateIndex
CREATE INDEX "CommissionCalculation_organizationId_officeId_status_idx" ON "CommissionCalculation"("organizationId", "officeId", "status");

-- CreateIndex
CREATE INDEX "CommissionCalculation_organizationId_transactionId_idx" ON "CommissionCalculation"("organizationId", "transactionId");

-- CreateIndex
CREATE INDEX "CommissionCalculation_organizationId_membershipId_idx" ON "CommissionCalculation"("organizationId", "membershipId");

-- CreateIndex
CREATE INDEX "CommissionCalculation_organizationId_commissionPlanId_idx" ON "CommissionCalculation"("organizationId", "commissionPlanId");

-- CreateIndex
CREATE INDEX "CommissionCalculation_organizationId_calculatedAt_idx" ON "CommissionCalculation"("organizationId", "calculatedAt");

-- AddForeignKey
ALTER TABLE "CommissionPlan" ADD CONSTRAINT "CommissionPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlan" ADD CONSTRAINT "CommissionPlan_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanAssignment" ADD CONSTRAINT "CommissionPlanAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanAssignment" ADD CONSTRAINT "CommissionPlanAssignment_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanAssignment" ADD CONSTRAINT "CommissionPlanAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanAssignment" ADD CONSTRAINT "CommissionPlanAssignment_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanRule" ADD CONSTRAINT "CommissionPlanRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanRule" ADD CONSTRAINT "CommissionPlanRule_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_accountingTransactionId_fkey" FOREIGN KEY ("accountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCalculation" ADD CONSTRAINT "CommissionCalculation_calculatedByMembershipId_fkey" FOREIGN KEY ("calculatedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
