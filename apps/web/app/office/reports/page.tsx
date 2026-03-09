import { getOfficeDashboardSnapshot } from "@acre/backoffice";
import { Panel } from "@acre/ui";

export default function OfficeReportsPage() {
  const snapshot = getOfficeDashboardSnapshot();

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Reports</span>
          <h2>Reports</h2>
          <p>Current placeholder for transaction reports, team reports, and export flows.</p>
        </div>
        <div className="office-button-row">
          <span className="office-button office-button-secondary">Export CSV</span>
        </div>
      </section>

      <section className="office-kpi-grid">
        {snapshot.metrics.map((metric) => (
          <article className="office-kpi-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.trend}</p>
          </article>
        ))}
      </section>

      <Panel title="Report implementation status" subtitle="Real exported reports and filters are still unimplemented.">
        <div className="office-note-list">
          <article className="office-note-item">
            <span>01</span>
            <p>Export to Excel / CSV is planned but not connected to real data yet.</p>
          </article>
          <article className="office-note-item">
            <span>02</span>
            <p>Department-wide reporting for finance should be implemented after transaction persistence.</p>
          </article>
        </div>
      </Panel>
    </>
  );
}
