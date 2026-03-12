-- AlterTable
ALTER TABLE "AgentOnboardingItem" ADD COLUMN     "templateItemId" TEXT;

-- CreateTable
CREATE TABLE "AgentOnboardingTemplateItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "dueDaysOffset" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentOnboardingTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentOnboardingTemplateItem_organizationId_officeId_isActiv_idx" ON "AgentOnboardingTemplateItem"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE INDEX "AgentOnboardingTemplateItem_organizationId_sortOrder_idx" ON "AgentOnboardingTemplateItem"("organizationId", "sortOrder");

-- AddForeignKey
ALTER TABLE "AgentOnboardingItem" ADD CONSTRAINT "AgentOnboardingItem_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "AgentOnboardingTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingTemplateItem" ADD CONSTRAINT "AgentOnboardingTemplateItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingTemplateItem" ADD CONSTRAINT "AgentOnboardingTemplateItem_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
