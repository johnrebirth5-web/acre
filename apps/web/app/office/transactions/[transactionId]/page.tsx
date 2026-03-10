import Link from "next/link";
import { getTransactionById } from "@acre/db";
import { notFound } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { TransactionContactsCard } from "./contacts-card";
import { TransactionStatusForm } from "./status-form";

type TransactionDetailPageProps = {
  params: Promise<{
    transactionId: string;
  }>;
};

export default async function OfficeTransactionDetailPage({ params }: TransactionDetailPageProps) {
  const context = await requireOfficeSession();
  const { transactionId } = await params;
  const transaction = await getTransactionById(context.currentOrganization.id, transactionId);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="bm-transaction-detail-page">
      <section className="bm-detail-card">
        <div className="bm-detail-head">
          <div>
            <h2>{transaction.title}</h2>
            <p>
              {transaction.address}, {transaction.city}, {transaction.state} {transaction.zipCode}
            </p>
          </div>
          <Link className="bm-view-toggle" href="/office/transactions">
            Back to transactions
          </Link>
        </div>

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
      </section>

      <section className="bm-detail-card">
        <div className="bm-card-head">
          <h3>Status</h3>
        </div>
        <TransactionStatusForm currentStatus={transaction.status} transactionId={transaction.id} />
      </section>

      <TransactionContactsCard
        availableContacts={transaction.availableContacts}
        contacts={transaction.contacts}
        transactionId={transaction.id}
      />

      <section className="bm-detail-card">
        <div className="bm-card-head">
          <h3>Additional fields</h3>
        </div>
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
      </section>
    </div>
  );
}
