import Link from "next/link";
import { getCreateTransactionDraft } from "@acre/backoffice";

export default function OfficeTransactionCreatePage() {
  const draft = getCreateTransactionDraft();

  return (
    <div className="bm-new-transaction-page">
      <section className="bm-page-toolbar">
        <div className="bm-page-heading">
          <h2>New transaction</h2>
          <p>Static transaction intake form based on the Agent CRM referral tutorial. Save is not implemented yet.</p>
        </div>
        <div className="bm-toolbar-actions">
          <Link className="bm-view-toggle" href="/office/transactions">
            Back to transactions
          </Link>
          <button className="bm-create-button" type="button">
            Save draft
          </button>
        </div>
      </section>

      <section className="bm-new-transaction-grid">
        <section className="bm-new-transaction-card">
          <div className="bm-card-head">
            <h3>Transaction details</h3>
          </div>

          <div className="bm-transaction-form-grid">
            <label className="bm-form-field">
              <span>Transaction type</span>
              <input defaultValue={draft.transactionType} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Address</span>
              <input defaultValue={draft.address} readOnly />
            </label>
            <label className="bm-form-field">
              <span>City</span>
              <input defaultValue={draft.city} readOnly />
            </label>
            <label className="bm-form-field">
              <span>State</span>
              <input defaultValue={draft.state} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Zip</span>
              <input defaultValue={draft.zipCode} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Contract date</span>
              <input defaultValue={draft.contractDate} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Sale price</span>
              <input defaultValue={draft.salePrice} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Buyer expiration date</span>
              <input defaultValue={draft.buyerExpirationDate} placeholder="Buyer expiration date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Listing date</span>
              <input defaultValue={draft.listingDate} placeholder="Listing date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Listing expiration date</span>
              <input defaultValue={draft.listingExpirationDate} placeholder="Listing expiration date" readOnly />
            </label>
            <label className="bm-form-field">
              <span>Closing date</span>
              <input defaultValue={draft.closingDate} readOnly />
            </label>
          </div>
        </section>

        <section className="bm-new-transaction-card">
          <div className="bm-card-head">
            <h3>Additional fields</h3>
          </div>

          <div className="bm-transaction-form-grid">
            <label className="bm-form-field">
              <span>Agent name</span>
              <input defaultValue={draft.agentName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Team leader</span>
              <input defaultValue={draft.teamLeader} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Licensed agent name</span>
              <input defaultValue={draft.licensedAgentName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Company referral</span>
              <input defaultValue={draft.companyReferral} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Company Referral Employee&apos;s Name</span>
              <input defaultValue={draft.companyReferralEmployeeName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Brokerage name</span>
              <input defaultValue={draft.brokerageName} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Commission %</span>
              <input defaultValue={draft.commissionPercent} readOnly />
            </label>
            <label className="bm-form-field">
              <span>Referral %</span>
              <input defaultValue={draft.referralPercent} readOnly />
            </label>
            <label className="bm-form-field bm-form-field-wide">
              <span>Source notes</span>
              <textarea defaultValue={draft.sourceNotes} readOnly rows={4} />
            </label>
          </div>
        </section>
      </section>

      <section className="bm-new-transaction-grid">
        <section className="bm-new-transaction-card">
          <div className="bm-card-head">
            <h3>Agent / commission participants</h3>
          </div>
          <div className="bm-commission-list">
            {draft.participants.map((participant) => (
              <article className="bm-commission-item" key={participant.id}>
                <div>
                  <strong>{participant.name}</strong>
                  <p>{participant.role}</p>
                </div>
                <div className="bm-commission-meta">
                  <span>{participant.splitLabel}</span>
                  {participant.notes ? <p>{participant.notes}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-new-transaction-card">
          <div className="bm-card-head">
            <h3>Referral rules from Agent CRM tutorial</h3>
          </div>
          <div className="bm-rule-list">
            {draft.referralRules.map((rule) => (
              <article className="bm-rule-item" key={rule}>
                <span>{rule}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
