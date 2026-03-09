import { summarizeAccess } from "@acre/auth";
import { getOfficeDashboardSnapshot } from "@acre/backoffice";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function OfficeDashboardPage() {
  const snapshot = getOfficeDashboardSnapshot();
  const access = summarizeAccess("office_manager");

  return (
    <>
      <section className="page-banner">
        <div className="workspace-lead">
          <Badge tone="accent">Office Analytics</Badge>
          <h1>Command layer for distribution, engagement, and publishing decisions.</h1>
          <p>
            This is where office staff should see the feedback loop between listing quality, agent distribution, tracked
            clicks, event participation, and resource usage.
          </p>
          <div className="hero-kpis">
            {snapshot.metrics.slice(0, 3).map((metric) => (
              <div className="mini-kpi" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <aside className="summary-callout">
          <Badge tone="success">Operational loop</Badge>
          <strong>Parse listings, watch clicks, update hero inventory, and guide the next week.</strong>
          <p>That is the business loop your PRD describes, and this dashboard is shaped around it.</p>
        </aside>
      </section>

      <section className="workspace-grid">
        <Panel title="Weekly metrics" subtitle="Initial analytics framing for the office team.">
          <div className="stats-grid">
            <StatCard label="Role" value={access.label} hint={`${access.permissionCount} permissions in the current scaffold.`} />
            {snapshot.metrics.slice(0, 3).map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={metric.value} hint={metric.trend} />
            ))}
          </div>
        </Panel>
        <Panel title="Implementation notes" subtitle="These requirements came directly from the PRD and optimization docs.">
          <div className="list-column">
            {snapshot.workflowNotes.map((note) => (
              <article className="list-row" key={note}>
                <p>{note}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
