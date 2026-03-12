-- CreateEnum
CREATE TYPE "TransactionFieldKey" AS ENUM ('price', 'important_date', 'closing_date', 'buyer_expiration_date', 'acceptance_date', 'company_referral', 'company_referral_employee_name');

-- CreateTable
CREATE TABLE "RequiredContactRoleSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "role" "TransactionContactRole" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredContactRoleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionFieldSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "fieldKey" "TransactionFieldKey" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionFieldSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "transactionType" "TransactionType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByMembershipId" TEXT,
    "updatedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "checklistTemplateId" TEXT NOT NULL,
    "checklistGroup" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDaysOffset" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocumentApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresSecondaryApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequiredContactRoleSetting_organizationId_officeId_isRequir_idx" ON "RequiredContactRoleSetting"("organizationId", "officeId", "isRequired");

-- CreateIndex
CREATE UNIQUE INDEX "RequiredContactRoleSetting_organizationId_officeId_role_key" ON "RequiredContactRoleSetting"("organizationId", "officeId", "role");

-- CreateIndex
CREATE INDEX "TransactionFieldSetting_organizationId_officeId_isVisible_idx" ON "TransactionFieldSetting"("organizationId", "officeId", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionFieldSetting_organizationId_officeId_fieldKey_key" ON "TransactionFieldSetting"("organizationId", "officeId", "fieldKey");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_organizationId_officeId_isActive_idx" ON "ChecklistTemplate"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_organizationId_transactionType_idx" ON "ChecklistTemplate"("organizationId", "transactionType");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_organizationId_officeId_checklistTemp_idx" ON "ChecklistTemplateItem"("organizationId", "officeId", "checklistTemplateId");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_organizationId_sortOrder_idx" ON "ChecklistTemplateItem"("organizationId", "sortOrder");

-- AddForeignKey
ALTER TABLE "RequiredContactRoleSetting" ADD CONSTRAINT "RequiredContactRoleSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredContactRoleSetting" ADD CONSTRAINT "RequiredContactRoleSetting_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFieldSetting" ADD CONSTRAINT "TransactionFieldSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFieldSetting" ADD CONSTRAINT "TransactionFieldSetting_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_updatedByMembershipId_fkey" FOREIGN KEY ("updatedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
