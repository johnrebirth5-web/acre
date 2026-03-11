import Link from "next/link";
import { getTransactionById, listTransactionTaskAssigneeOptions, listTransactionTasks } from "@acre/db";
import {
  canManageOfficeDocuments,
  canManageOfficeSignatures,
  canReviewOfficeIncomingUpdates,
  canUseOfficeForms,
  canViewOfficeDocuments
} from "@acre/auth";
import { DetailSection, PageHeader, PageShell, SectionCard, SecondaryMetaList } from "@acre/ui";
import { notFound } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { TransactionContactsCard } from "./contacts-card";
import { TransactionDocumentsCard, TransactionUnsortedDocumentsCard } from "./documents-card";
import { TransactionFinanceForm } from "./finance-form";
import { TransactionFormsSignaturesCard } from "./forms-signatures-card";
import { TransactionIncomingUpdatesCard } from "./incoming-updates-card";
import { TransactionStatusForm } from "./status-form";
import { TransactionTasksCard } from "./tasks-card";

type TransactionDetailPageProps = {
  params: Promise<{
    transactionId: string;
  }>;
};

export default async function OfficeTransactionDetailPage({ params }: TransactionDetailPageProps) {
  const context = await requireOfficeSession();
  const { transactionId } = await params;
  const [transaction, tasks, taskAssigneeOptions] = await Promise.all([
    getTransactionById(context.currentOrganization.id, transactionId),
    listTransactionTasks(context.currentOrganization.id, transactionId),
    listTransactionTaskAssigneeOptions(context.currentOrganization.id, transactionId)
  ]);

  if (!transaction) {
    notFound();
  }

  const taskOptions = tasks.map((task) => ({
    id: task.id,
    title: task.title
  }));
  const canViewDocumentsForRole = canViewOfficeDocuments(context.currentMembership.role);
  const canManageDocumentsForRole = canManageOfficeDocuments(context.currentMembership.role);
  const canUseFormsForRole = canUseOfficeForms(context.currentMembership.role);
  const canManageSignaturesForRole = canManageOfficeSignatures(context.currentMembership.role);
  const canReviewIncomingUpdatesForRole = canReviewOfficeIncomingUpdates(context.currentMembership.role);

  return (
    <PageShell className="bm-transaction-detail-page office-detail-page">
      <PageHeader
        actions={
          <Link className="office-button office-button-secondary" href="/office/transactions">
            Back to transactions
          </Link>
        }
        description={`${transaction.address}, ${transaction.city}, ${transaction.state} ${transaction.zipCode}`}
        eyebrow="Transaction detail"
        title={transaction.title}
      />

      <DetailSection
        actions={
          <SecondaryMetaList
            items={[
              { label: "Owner", value: transaction.ownerName },
              { label: "Office", value: transaction.officeName || "Unassigned" },
              { label: "Status", value: transaction.status }
            ]}
          />
        }
        subtitle="Core transaction facts, dates, and referral context."
        title="Overview"
      >
        <div className="bm-detail-grid">
          <div className="bm-detail-field">
            <span>Type</span>
            <strong>{transaction.type}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Representing</span>
            <strong>{transaction.representing}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Price</span>
            <strong>{transaction.price ? `$${Number(transaction.price).toLocaleString("en-US")}` : "$0"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Owner</span>
            <strong>{transaction.ownerName}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Office</span>
            <strong>{transaction.officeName || "Unassigned"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Company referral</span>
            <strong>{transaction.companyReferral}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Referral employee</span>
            <strong>{transaction.companyReferralEmployeeName || "None"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Important date</span>
            <strong>{transaction.importantDate || "Not set"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Buyer agreement date</span>
            <strong>{transaction.buyerAgreementDate || "Not set"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Buyer expiration date</span>
            <strong>{transaction.buyerExpirationDate || "Not set"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Acceptance date</span>
            <strong>{transaction.acceptanceDate || "Not set"}</strong>
          </div>
          <div className="bm-detail-field">
            <span>Closing date</span>
            <strong>{transaction.closingDate || "Not set"}</strong>
          </div>
        </div>
      </DetailSection>

      <SectionCard subtitle="Update the primary workflow status for this transaction." title="Status">
        <TransactionStatusForm currentStatus={transaction.status} transactionId={transaction.id} />
      </SectionCard>

      <TransactionContactsCard
        availableContacts={transaction.availableContacts}
        contacts={transaction.contacts}
        transactionId={transaction.id}
      />

      <TransactionTasksCard assigneeOptions={taskAssigneeOptions} tasks={tasks} transactionId={transaction.id} />

      <TransactionDocumentsCard
        canManageDocuments={canManageDocumentsForRole}
        canViewDocuments={canViewDocumentsForRole}
        documents={transaction.documents}
        taskOptions={taskOptions}
        transactionId={transaction.id}
      />

      <TransactionUnsortedDocumentsCard
        canManageDocuments={canManageDocumentsForRole}
        canViewDocuments={canViewDocumentsForRole}
        documents={transaction.documents}
        taskOptions={taskOptions}
        transactionId={transaction.id}
      />

      <TransactionFormsSignaturesCard
        canManageSignatures={canManageSignaturesForRole}
        canUseForms={canUseFormsForRole}
        canViewDocuments={canViewDocumentsForRole}
        formTemplates={transaction.formTemplates}
        forms={transaction.forms}
        taskOptions={taskOptions}
        transactionId={transaction.id}
      />

      <TransactionIncomingUpdatesCard
        canReviewIncomingUpdates={canReviewIncomingUpdatesForRole}
        incomingUpdates={transaction.incomingUpdates}
        transactionId={transaction.id}
      />

      <SectionCard subtitle="Minimal finance layer for commissions, office net, and notes." title="Finance">
        <TransactionFinanceForm
          agentNet={transaction.agentNet}
          financeNotes={transaction.financeNotes}
          grossCommission={transaction.grossCommission}
          officeNet={transaction.officeNet}
          referralFee={transaction.referralFee}
          transactionId={transaction.id}
        />
      </SectionCard>

      <SectionCard subtitle="Additional custom fields stored with this transaction." title="Additional fields">
        <div className="bm-detail-grid">
          {Object.entries(transaction.additionalFields).length > 0 ? (
            Object.entries(transaction.additionalFields).map(([key, value]) => (
              <div className="bm-detail-field" key={key}>
                <span>{key}</span>
                <strong>{value || "—"}</strong>
              </div>
            ))
          ) : (
            <div className="bm-detail-field">
              <span>Fields</span>
              <strong>No additional fields saved.</strong>
            </div>
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
