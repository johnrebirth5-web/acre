import { summarizeAccess } from "@acre/auth";
import { listClients } from "@acre/backoffice";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function AgentClientsPage() {
  const access = summarizeAccess("agent");
  const clientFeed = listClients();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Clients CRM</Badge>
          <h2>Lightweight funnel, not a bloated sales system.</h2>
          <p>
            The CRM side is intentionally lean: fast capture, useful reminders, and clear next actions. That matches
            your PRD much more closely than a traditional enterprise CRM.
          </p>
        </div>
        <div className="metric-strip">
          <span>MVP stance</span>
          <strong>{access.label} workflow.</strong>
          <p>Input friction has to be low enough that agents actually use it from chat screenshots and short notes.</p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="CRM design constraints" subtitle="Every feature here should reduce agent typing, not increase it.">
          <div className="list-column">
            {clientFeed.map((client) => (
              <article className="list-row" key={client.id}>
                <div className="list-row-top">
                  <strong>{client.fullName}</strong>
                  <Badge tone="neutral">{client.stage}</Badge>
                </div>
                <p>{client.intent} · {client.budget}</p>
                <p>{client.areas.join(", ")}</p>
                <div className="list-row-meta">
                  <span>{client.source}</span>
                  <span>Last contact {client.lastContactLabel}</span>
                  <span>Next {client.nextFollowUpLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Planned outputs" subtitle="These blocks correspond to the core CRM workflow.">
          <div className="stats-grid">
            <StatCard label="Role access" value={`${access.permissionCount} perms`} hint="CRM stays lean for field speed." />
            <StatCard label="OCR extraction" value="Phase 1" hint="Capture name, budget, area, and intent." />
            <StatCard label="Reminder engine" value="Phase 1" hint="Date-based prompts for client touchpoints." />
            <StatCard label="Reply generation" value="Phase 2" hint="Context-aware follow-up text generation." />
          </div>
        </Panel>
      </section>
    </>
  );
}
