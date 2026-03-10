-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('sales', 'sales_listing', 'rental_leasing', 'rental_listing', 'commercial_sales', 'commercial_lease', 'other');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('opportunity', 'active', 'pending', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "TransactionRepresenting" AS ENUM ('buyer', 'seller', 'both', 'tenant', 'landlord');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "ownerMembershipId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'opportunity',
    "representing" "TransactionRepresenting" NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "importantDate" TIMESTAMP(3),
    "buyerAgreementDate" TIMESTAMP(3),
    "buyerExpirationDate" TIMESTAMP(3),
    "acceptanceDate" TIMESTAMP(3),
    "listingDate" TIMESTAMP(3),
    "listingExpirationDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "companyReferral" BOOLEAN NOT NULL DEFAULT false,
    "companyReferralEmployeeName" TEXT,
    "referralContext" JSONB,
    "commissionContext" JSONB,
    "additionalFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_organizationId_status_idx" ON "Transaction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_officeId_idx" ON "Transaction"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_ownerMembershipId_idx" ON "Transaction"("organizationId", "ownerMembershipId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ownerMembershipId_fkey" FOREIGN KEY ("ownerMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
