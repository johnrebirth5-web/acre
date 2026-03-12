-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('draft', 'submitted', 'received', 'under_review', 'countered', 'accepted', 'rejected', 'withdrawn', 'expired');

-- AlterTable
ALTER TABLE "SignatureRequest" ADD COLUMN     "offerId" TEXT;

-- AlterTable
ALTER TABLE "TransactionDocument" ADD COLUMN     "offerId" TEXT;

-- AlterTable
ALTER TABLE "TransactionForm" ADD COLUMN     "offerId" TEXT;

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "offeringPartyName" TEXT NOT NULL,
    "buyerName" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'draft',
    "price" DECIMAL(12,2),
    "earnestMoneyAmount" DECIMAL(12,2),
    "financingType" TEXT,
    "closingDateOffered" TIMESTAMP(3),
    "expirationAt" TIMESTAMP(3),
    "isPrimaryOffer" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferComment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "offerId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_organizationId_transactionId_status_idx" ON "Offer"("organizationId", "transactionId", "status");

-- CreateIndex
CREATE INDEX "Offer_organizationId_officeId_createdAt_idx" ON "Offer"("organizationId", "officeId", "createdAt");

-- CreateIndex
CREATE INDEX "Offer_organizationId_expirationAt_idx" ON "Offer"("organizationId", "expirationAt");

-- CreateIndex
CREATE INDEX "Offer_organizationId_createdByMembershipId_idx" ON "Offer"("organizationId", "createdByMembershipId");

-- CreateIndex
CREATE INDEX "OfferComment_organizationId_offerId_createdAt_idx" ON "OfferComment"("organizationId", "offerId", "createdAt");

-- CreateIndex
CREATE INDEX "OfferComment_organizationId_membershipId_idx" ON "OfferComment"("organizationId", "membershipId");

-- CreateIndex
CREATE INDEX "SignatureRequest_organizationId_offerId_idx" ON "SignatureRequest"("organizationId", "offerId");

-- CreateIndex
CREATE INDEX "TransactionDocument_organizationId_offerId_idx" ON "TransactionDocument"("organizationId", "offerId");

-- CreateIndex
CREATE INDEX "TransactionForm_organizationId_offerId_idx" ON "TransactionForm"("organizationId", "offerId");

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferComment" ADD CONSTRAINT "OfferComment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferComment" ADD CONSTRAINT "OfferComment_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferComment" ADD CONSTRAINT "OfferComment_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferComment" ADD CONSTRAINT "OfferComment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
