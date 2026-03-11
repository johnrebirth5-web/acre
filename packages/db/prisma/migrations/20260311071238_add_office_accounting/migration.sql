-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('asset', 'liability', 'equity', 'income', 'expense', 'contra_income', 'contra_expense');

-- CreateEnum
CREATE TYPE "AccountingTransactionType" AS ENUM ('invoice', 'bill', 'credit_memo', 'deposit', 'received_payment', 'made_payment', 'journal_entry', 'transfer', 'refund');

-- CreateEnum
CREATE TYPE "AccountingTransactionStatus" AS ENUM ('draft', 'open', 'posted', 'completed', 'void');

-- CreateEnum
CREATE TYPE "AccountingLineEntrySide" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "AccountingPaymentMethod" AS ENUM ('ach', 'check', 'wire', 'cash', 'internal_transfer', 'other');

-- CreateEnum
CREATE TYPE "EarnestMoneyStatus" AS ENUM ('not_received', 'overdue', 'pending_bank_deposit', 'fully_deposited', 'distribute_balance', 'complete');

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "accountType" "LedgerAccountType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "relatedTransactionId" TEXT,
    "relatedMembershipId" TEXT,
    "type" "AccountingTransactionType" NOT NULL,
    "status" "AccountingTransactionStatus" NOT NULL DEFAULT 'draft',
    "accountingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" "AccountingPaymentMethod",
    "referenceNumber" TEXT,
    "counterpartyName" TEXT,
    "memo" TEXT,
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "externalSyncStatus" TEXT,
    "externalReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingTransactionLineItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "accountingTransactionId" TEXT NOT NULL,
    "relatedTransactionId" TEXT,
    "ledgerAccountId" TEXT NOT NULL,
    "description" TEXT,
    "entrySide" "AccountingLineEntrySide" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingTransactionLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralLedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "accountingTransactionId" TEXT NOT NULL,
    "relatedTransactionId" TEXT,
    "accountId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "debitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarnestMoneyRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "receivedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "depositDate" TIMESTAMP(3),
    "heldByOffice" BOOLEAN NOT NULL DEFAULT true,
    "heldExternally" BOOLEAN NOT NULL DEFAULT false,
    "trackInLedger" BOOLEAN NOT NULL DEFAULT true,
    "status" "EarnestMoneyStatus" NOT NULL DEFAULT 'not_received',
    "notes" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarnestMoneyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerAccount_organizationId_officeId_accountType_idx" ON "LedgerAccount"("organizationId", "officeId", "accountType");

-- CreateIndex
CREATE INDEX "LedgerAccount_organizationId_isActive_idx" ON "LedgerAccount"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_organizationId_code_key" ON "LedgerAccount"("organizationId", "code");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_officeId_type_idx" ON "AccountingTransaction"("organizationId", "officeId", "type");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_officeId_status_idx" ON "AccountingTransaction"("organizationId", "officeId", "status");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_relatedTransactionId_idx" ON "AccountingTransaction"("organizationId", "relatedTransactionId");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_relatedMembershipId_idx" ON "AccountingTransaction"("organizationId", "relatedMembershipId");

-- CreateIndex
CREATE INDEX "AccountingTransaction_organizationId_accountingDate_idx" ON "AccountingTransaction"("organizationId", "accountingDate");

-- CreateIndex
CREATE INDEX "AccountingTransactionLineItem_organizationId_accountingTran_idx" ON "AccountingTransactionLineItem"("organizationId", "accountingTransactionId");

-- CreateIndex
CREATE INDEX "AccountingTransactionLineItem_organizationId_ledgerAccountI_idx" ON "AccountingTransactionLineItem"("organizationId", "ledgerAccountId");

-- CreateIndex
CREATE INDEX "AccountingTransactionLineItem_organizationId_relatedTransac_idx" ON "AccountingTransactionLineItem"("organizationId", "relatedTransactionId");

-- CreateIndex
CREATE INDEX "GeneralLedgerEntry_organizationId_officeId_entryDate_idx" ON "GeneralLedgerEntry"("organizationId", "officeId", "entryDate");

-- CreateIndex
CREATE INDEX "GeneralLedgerEntry_organizationId_accountingTransactionId_idx" ON "GeneralLedgerEntry"("organizationId", "accountingTransactionId");

-- CreateIndex
CREATE INDEX "GeneralLedgerEntry_organizationId_relatedTransactionId_idx" ON "GeneralLedgerEntry"("organizationId", "relatedTransactionId");

-- CreateIndex
CREATE INDEX "GeneralLedgerEntry_organizationId_accountId_idx" ON "GeneralLedgerEntry"("organizationId", "accountId");

-- CreateIndex
CREATE INDEX "EarnestMoneyRecord_organizationId_officeId_status_idx" ON "EarnestMoneyRecord"("organizationId", "officeId", "status");

-- CreateIndex
CREATE INDEX "EarnestMoneyRecord_organizationId_dueAt_idx" ON "EarnestMoneyRecord"("organizationId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "EarnestMoneyRecord_transactionId_key" ON "EarnestMoneyRecord"("transactionId");

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_relatedMembershipId_fkey" FOREIGN KEY ("relatedMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransaction" ADD CONSTRAINT "AccountingTransaction_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionLineItem" ADD CONSTRAINT "AccountingTransactionLineItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionLineItem" ADD CONSTRAINT "AccountingTransactionLineItem_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionLineItem" ADD CONSTRAINT "AccountingTransactionLineItem_accountingTransactionId_fkey" FOREIGN KEY ("accountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionLineItem" ADD CONSTRAINT "AccountingTransactionLineItem_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTransactionLineItem" ADD CONSTRAINT "AccountingTransactionLineItem_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_accountingTransactionId_fkey" FOREIGN KEY ("accountingTransactionId") REFERENCES "AccountingTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnestMoneyRecord" ADD CONSTRAINT "EarnestMoneyRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnestMoneyRecord" ADD CONSTRAINT "EarnestMoneyRecord_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnestMoneyRecord" ADD CONSTRAINT "EarnestMoneyRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarnestMoneyRecord" ADD CONSTRAINT "EarnestMoneyRecord_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
