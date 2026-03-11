-- CreateEnum
CREATE TYPE "TransactionDocumentStatus" AS ENUM ('uploaded', 'submitted', 'approved', 'rejected', 'signed', 'archived');

-- CreateEnum
CREATE TYPE "TransactionDocumentSource" AS ENUM ('manual_upload', 'generated_form', 'incoming_update', 'synced_external', 'email_pdf');

-- CreateEnum
CREATE TYPE "TransactionFormStatus" AS ENUM ('draft', 'prepared', 'sent_for_signature', 'partially_signed', 'fully_signed', 'rejected', 'voided');

-- CreateEnum
CREATE TYPE "SignatureRequestStatus" AS ENUM ('draft', 'sent', 'viewed', 'signed', 'declined', 'canceled');

-- CreateEnum
CREATE TYPE "IncomingUpdateStatus" AS ENUM ('pending_review', 'accepted', 'rejected', 'applied');

-- CreateTable
CREATE TABLE "TransactionDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "uploadedByMembershipId" TEXT,
    "linkedTaskId" TEXT,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "documentType" TEXT NOT NULL,
    "status" "TransactionDocumentStatus" NOT NULL DEFAULT 'uploaded',
    "source" "TransactionDocumentSource" NOT NULL DEFAULT 'manual_upload',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "isUnsorted" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "officeId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "mergeFields" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionForm" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "templateId" TEXT,
    "linkedTaskId" TEXT,
    "documentId" TEXT,
    "name" TEXT NOT NULL,
    "status" "TransactionFormStatus" NOT NULL DEFAULT 'draft',
    "generatedPayload" JSONB NOT NULL,
    "createdByMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT NOT NULL,
    "formId" TEXT,
    "documentId" TEXT,
    "requestedByMembershipId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "signingOrder" INTEGER,
    "status" "SignatureRequestStatus" NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingUpdate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "officeId" TEXT,
    "transactionId" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "status" "IncomingUpdateStatus" NOT NULL DEFAULT 'pending_review',
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByMembershipId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionDocument_organizationId_transactionId_status_idx" ON "TransactionDocument"("organizationId", "transactionId", "status");

-- CreateIndex
CREATE INDEX "TransactionDocument_organizationId_transactionId_isUnsorted_idx" ON "TransactionDocument"("organizationId", "transactionId", "isUnsorted");

-- CreateIndex
CREATE INDEX "TransactionDocument_organizationId_linkedTaskId_idx" ON "TransactionDocument"("organizationId", "linkedTaskId");

-- CreateIndex
CREATE INDEX "TransactionDocument_organizationId_officeId_idx" ON "TransactionDocument"("organizationId", "officeId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_key_key" ON "FormTemplate"("key");

-- CreateIndex
CREATE INDEX "FormTemplate_organizationId_officeId_isActive_idx" ON "FormTemplate"("organizationId", "officeId", "isActive");

-- CreateIndex
CREATE INDEX "TransactionForm_organizationId_transactionId_status_idx" ON "TransactionForm"("organizationId", "transactionId", "status");

-- CreateIndex
CREATE INDEX "TransactionForm_organizationId_linkedTaskId_idx" ON "TransactionForm"("organizationId", "linkedTaskId");

-- CreateIndex
CREATE INDEX "TransactionForm_organizationId_officeId_idx" ON "TransactionForm"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "SignatureRequest_organizationId_transactionId_status_idx" ON "SignatureRequest"("organizationId", "transactionId", "status");

-- CreateIndex
CREATE INDEX "SignatureRequest_organizationId_officeId_idx" ON "SignatureRequest"("organizationId", "officeId");

-- CreateIndex
CREATE INDEX "SignatureRequest_organizationId_formId_idx" ON "SignatureRequest"("organizationId", "formId");

-- CreateIndex
CREATE INDEX "SignatureRequest_organizationId_documentId_idx" ON "SignatureRequest"("organizationId", "documentId");

-- CreateIndex
CREATE INDEX "IncomingUpdate_organizationId_status_idx" ON "IncomingUpdate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "IncomingUpdate_organizationId_transactionId_idx" ON "IncomingUpdate"("organizationId", "transactionId");

-- CreateIndex
CREATE INDEX "IncomingUpdate_organizationId_officeId_receivedAt_idx" ON "IncomingUpdate"("organizationId", "officeId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingUpdate_organizationId_sourceSystem_sourceReference_key" ON "IncomingUpdate"("organizationId", "sourceSystem", "sourceReference");

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_uploadedByMembershipId_fkey" FOREIGN KEY ("uploadedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "TransactionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "TransactionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TransactionDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionForm" ADD CONSTRAINT "TransactionForm_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_formId_fkey" FOREIGN KEY ("formId") REFERENCES "TransactionForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TransactionDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_requestedByMembershipId_fkey" FOREIGN KEY ("requestedByMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingUpdate" ADD CONSTRAINT "IncomingUpdate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingUpdate" ADD CONSTRAINT "IncomingUpdate_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingUpdate" ADD CONSTRAINT "IncomingUpdate_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingUpdate" ADD CONSTRAINT "IncomingUpdate_reviewedByMembershipId_fkey" FOREIGN KEY ("reviewedByMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
