-- CreateEnum
CREATE TYPE "TransactionContactRole" AS ENUM ('buyer', 'seller', 'co_buyer', 'co_seller', 'tenant', 'landlord', 'other');

-- CreateTable
CREATE TABLE "TransactionContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "role" "TransactionContactRole" NOT NULL DEFAULT 'other',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionContact_transactionId_clientId_key" ON "TransactionContact"("transactionId", "clientId");

-- CreateIndex
CREATE INDEX "TransactionContact_organizationId_transactionId_idx" ON "TransactionContact"("organizationId", "transactionId");

-- CreateIndex
CREATE INDEX "TransactionContact_organizationId_clientId_idx" ON "TransactionContact"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "TransactionContact_organizationId_transactionId_isPrimary_idx" ON "TransactionContact"("organizationId", "transactionId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionContact_transactionId_primary_unique" ON "TransactionContact"("transactionId") WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "TransactionContact" ADD CONSTRAINT "TransactionContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionContact" ADD CONSTRAINT "TransactionContact_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionContact" ADD CONSTRAINT "TransactionContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing primaryClientId links into TransactionContact.
INSERT INTO "TransactionContact" (
    "id",
    "organizationId",
    "transactionId",
    "clientId",
    "role",
    "isPrimary",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    'backfill-' || t."id" || '-' || t."primaryClientId",
    t."organizationId",
    t."id",
    t."primaryClientId",
    CASE
        WHEN t."representing" = 'seller' THEN 'seller'::"TransactionContactRole"
        WHEN t."representing" = 'tenant' THEN 'tenant'::"TransactionContactRole"
        WHEN t."representing" = 'landlord' THEN 'landlord'::"TransactionContactRole"
        ELSE 'buyer'::"TransactionContactRole"
    END,
    true,
    'Backfilled from Transaction.primaryClientId',
    COALESCE(t."updatedAt", CURRENT_TIMESTAMP),
    COALESCE(t."updatedAt", CURRENT_TIMESTAMP)
FROM "Transaction" t
WHERE t."primaryClientId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM "TransactionContact" tc
      WHERE tc."transactionId" = t."id"
        AND tc."clientId" = t."primaryClientId"
  );
