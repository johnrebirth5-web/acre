-- CreateEnum
CREATE TYPE "AgentOnboardingStatus" AS ENUM ('not_started', 'in_progress', 'complete');

-- CreateEnum
CREATE TYPE "TeamMembershipRole" AS ENUM ('lead', 'member');

-- CreateEnum
CREATE TYPE "AgentOnboardingItemStatus" AS ENUM ('pending', 'in_progress', 'completed', 'reopened');

-- CreateEnum
CREATE TYPE "AgentGoalPeriodType" AS ENUM ('monthly', 'quarterly', 'annual');

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "notes" TEXT,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "startDate" TIMESTAMP(3),
    "onboardingStatus" "AgentOnboardingStatus" NOT NULL DEFAULT 'not_started',
    "commissionPlanName" TEXT,
    "avatarUrl" TEXT,
    "internalExtension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "teamId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "role" "TeamMembershipRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentOnboardingItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "dueAt" TIMESTAMP(3),
    "status" "AgentOnboardingItemStatus" NOT NULL DEFAULT 'pending',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "completedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentOnboardingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGoal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "membershipId" TEXT NOT NULL,
    "periodType" "AgentGoalPeriodType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "targetTransactionCount" INTEGER,
    "targetClosedVolume" DECIMAL(12,2),
    "targetOfficeNet" DECIMAL(12,2),
    "targetAgentNet" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_membershipId_key" ON "AgentProfile"("membershipId");

-- CreateIndex
CREATE INDEX "AgentProfile_organizationId_officeId_idx" ON "AgentProfile"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "AgentProfile_organizationId_onboardingStatus_idx" ON "AgentProfile"("organizationId", "onboardingStatus");

-- CreateIndex
CREATE INDEX "Team_organizationId_officeId_isActive_idx" ON "Team"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Team_organizationId_slug_key" ON "Team"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "TeamMembership_organizationId_officeId_idx" ON "TeamMembership"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "TeamMembership_organizationId_membershipId_idx" ON "TeamMembership"("organizationId", "membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_teamId_membershipId_key" ON "TeamMembership"("teamId", "membershipId");

-- CreateIndex
CREATE INDEX "AgentOnboardingItem_organizationId_officeId_membershipId_idx" ON "AgentOnboardingItem"("organizationId", "officeId", "membershipId");

-- CreateIndex
CREATE INDEX "AgentOnboardingItem_organizationId_membershipId_status_idx" ON "AgentOnboardingItem"("organizationId", "membershipId", "status");

-- CreateIndex
CREATE INDEX "AgentOnboardingItem_organizationId_dueAt_idx" ON "AgentOnboardingItem"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "AgentGoal_organizationId_officeId_membershipId_idx" ON "AgentGoal"("organizationId", "officeId", "membershipId");

-- CreateIndex
CREATE INDEX "AgentGoal_organizationId_startsAt_endsAt_idx" ON "AgentGoal"("organizationId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembership" ADD CONSTRAINT "TeamMembership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingItem" ADD CONSTRAINT "AgentOnboardingItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingItem" ADD CONSTRAINT "AgentOnboardingItem_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingItem" ADD CONSTRAINT "AgentOnboardingItem_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOnboardingItem" ADD CONSTRAINT "AgentOnboardingItem_completedByMembershipId_fkey" FOREIGN KEY ("completedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGoal" ADD CONSTRAINT "AgentGoal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGoal" ADD CONSTRAINT "AgentGoal_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGoal" ADD CONSTRAINT "AgentGoal_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
