import { summarizeAccess } from "@acre/auth";
import { getAgentDashboardSnapshot } from "@acre/backoffice";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function AgentDashboardPage() {
  const snapshot = getAgentDashboardSnapshot();
  const access = summarizeAccess("agent");

  return (
    <>
      <section className="page-banner">
        <div className="workspace-lead">
          <Badge tone="accent">Agent Dashboard</Badge>
          <h1>One surface for today&apos;s follow-up, listing activity, and next actions.</h1>
          <p>
            This layout is optimized for fast scanning on desktop and compact action access on mobile. The same route
            structure will later connect to live CRM, link tracking, and AI workflows.
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
          <Badge tone="success">Today&apos;s focus</Badge>
          <strong>Push active leads, publish one hero listing, and clear the event queue.</strong>
          <p>Designed to work cleanly on phone screens so agents can operate without laptop-only dependency.</p>
        </aside>
      </section>

      <section className="workspace-grid">
        <div className="panel-stack">
          <Panel title="Priority queue" subtitle="Reminder logic will later come from OCR intake and last-contact anchors.">
            <div className="list-column">
              {snapshot.tasks.map((task) => (
                <article className="list-row" key={task.id}>
                  <div className="list-row-top">
                    <strong>{task.title}</strong>
                    <Badge tone={task.priority === "High" ? "accent" : task.priority === "Medium" ? "neutral" : "success"}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p>{task.subtitle}</p>
                  <div className="list-row-meta">
                    <span>{task.dueLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Featured inventory" subtitle="These cards preview how structured listings data will surface in the agent experience.">
            <div className="list-column">
              {snapshot.listings.map((listing) => (
                <article className="list-row" key={listing.id}>
                  <div className="list-row-top">
                    <strong>{listing.name}</strong>
                    <Badge tone="neutral">{listing.status}</Badge>
                  </div>
                  <p>{listing.area}</p>
                  <p>{listing.hook}</p>
                  <div className="list-row-meta">
                    <span>{listing.price}</span>
                    <span>{listing.trackedClicks} tracked clicks</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Agent quick stack" subtitle="The core utility set pulled from your PRD and AI tool plan.">
          <div className="stats-grid">
            <StatCard label="Role" value={access.label} hint={`${access.permissionCount} enabled permissions in MVP.`} />
            <StatCard label="Listing writer" value="Ready" hint="Multi-output copy and marketing scripts." />
            <StatCard label="Reply assistant" value="Ready" hint="Buyer, seller, renter, and objection templates." />
            <StatCard label="Knowledge base" value="RAG-ready" hint="Internal Acre answers, not generic chat." />
          </div>
        </Panel>
      </section>
    </>
  );
}
