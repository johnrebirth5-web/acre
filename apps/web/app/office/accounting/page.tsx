import { Panel } from "@acre/ui";

export default function OfficeAccountingPage() {
  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Accounting</span>
          <h2>Accounting</h2>
          <p>Accounting will later cover chart of accounts, payment gateways, payslips, and commission flows.</p>
        </div>
      </section>

      <section className="office-dashboard-grid">
        <Panel title="Current scope" subtitle="This page exists so the back-office IA matches the researched system.">
          <div className="office-note-list">
            <article className="office-note-item">
              <span>01</span>
              <p>Chart of Accounts is planned, not implemented.</p>
            </article>
            <article className="office-note-item">
              <span>02</span>
              <p>Payment gateway and agent commission account setup are planned, not implemented.</p>
            </article>
            <article className="office-note-item">
              <span>03</span>
              <p>Payslip generation and agent confirmation belong to the future finance workflow.</p>
            </article>
          </div>
        </Panel>

        <Panel title="Status" subtitle="Honest placeholder so the module exists without faking completion.">
          <div className="office-queue-list">
            <article className="office-queue-item">
              <div className="office-queue-item-top">
                <strong>Finance workflow</strong>
                <span className="office-filter-chip">Planned</span>
              </div>
              <p>This module should follow after real transactions, approvals, and commission logic are implemented.</p>
            </article>
          </div>
        </Panel>
      </section>
    </>
  );
}
