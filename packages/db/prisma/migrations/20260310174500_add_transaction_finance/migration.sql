ALTER TABLE "Transaction"
ADD COLUMN "grossCommission" DECIMAL(12, 2),
ADD COLUMN "referralFee" DECIMAL(12, 2),
ADD COLUMN "officeNet" DECIMAL(12, 2),
ADD COLUMN "agentNet" DECIMAL(12, 2),
ADD COLUMN "financeNotes" TEXT;
