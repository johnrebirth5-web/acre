import Link from "next/link";
import { getApiCatalog, getCurrentOrganization, getOffices } from "@acre/backoffice";
import { databaseModules } from "@acre/db";
import { Badge, Panel, StatCard } from "@acre/ui";

export default function HomePage() {
  const org = getCurrentOrganization();
  const officeList = getOffices();
  const apiCatalog = getApiCatalog();

  return (
    <main className="app-shell">
      <div className="main-area">
        <section className="page-banner">
          <div className="workspace-lead">
            <Badge tone="accent">Acre Agent OS</Badge>
            <h1>Internal operating system for listings, CRM, AI workflows, and office execution.</h1>
            <p>
              This first build establishes the shared shell for the agent workspace and the office console. It is
              designed for both desktop and mobile browsers so agents can work from the field while office staff still
              get a dense control surface on larger screens.
            </p>
            <div className="hero-kpis">
              <div className="mini-kpi">
                <span>Primary users</span>
                <strong>Agents + Office Team</strong>
              </div>
              <div className="mini-kpi">
                <span>Active companies</span>
                <strong>{officeList.length} legal entities</strong>
              </div>
              <div className="mini-kpi">
                <span>System anchor</span>
                <strong>{org.name} internal operations</strong>
              </div>
            </div>
          </div>
          <aside className="summary-callout">
            <Badge tone="success">Why this shape</Badge>
            <strong>Back-office first, customer-facing site later.</strong>
            <p>
              The architecture is now aligned to your PRD: this is the internal agent and office platform, while the
              public website becomes a separate output surface fed by the same listings and analytics core.
            </p>
          </aside>
        </section>

        <section className="workspace-grid">
          <div className="panel-stack">
            <Panel title="Choose a workspace" subtitle="Start from the side that matches the user role.">
              <div className="workspace-tile-grid">
                <Link className="workspace-tile" href="/agent/dashboard">
                  <strong>Agent Workspace</strong>
                  <p>Listings, CRM, reminders, resources, AI writing tools, and event activity.</p>
                </Link>
                <Link className="workspace-tile" href="/office/dashboard">
                  <strong>Office Console</strong>
                  <p>Listing ingestion, analytics, event publishing, and shared resource administration.</p>
                </Link>
              </div>
            </Panel>

            <Panel title="First implementation targets" subtitle="These are the modules the shell is built around.">
              <div className="action-grid">
                <article className="action-card">
                  <strong>Listing Management</strong>
                  <p>URL ingest, AI parsing, status monitoring, and structured marketing data.</p>
                </article>
                <article className="action-card">
                  <strong>Agent Marketing</strong>
                  <p>Poster generation, tracked links, and custom listing notes for private distribution.</p>
                </article>
                <article className="action-card">
                  <strong>CRM Funnel</strong>
                  <p>OCR intake, needs summaries, last-contact anchors, and reminder automation.</p>
                </article>
                <article className="action-card">
                  <strong>Event Hub</strong>
                  <p>Notifications, RSVP actions, meeting links, and push-style reminders.</p>
                </article>
                <article className="action-card">
                  <strong>Resources</strong>
                  <p>Training videos, vendor cards, company templates, and searchable docs.</p>
                </article>
                <article className="action-card">
                  <strong>AI Workspace</strong>
                  <p>Listing writing, reply assistant, knowledge Q&A, scripts, and calculators.</p>
                </article>
              </div>
            </Panel>
          </div>

          <Panel title="Architecture readout" subtitle="The technical baseline now matches the project shape.">
            <div className="stats-grid">
              <StatCard label="Frontend" value="Next.js" hint="Responsive web app for mobile and desktop." />
              <StatCard label="Backend" value="App routes + services" hint="Modular monolith with worker-ready seams." />
              <StatCard label="Database" value="PostgreSQL" hint="Supports CRM, listings, JSONB, analytics, and auth." />
              <StatCard label="AI Layer" value="Workflow + RAG" hint="Structured generators plus Acre knowledge retrieval." />
            </div>
          </Panel>
        </section>

        <section className="workspace-grid">
          <Panel title="Backend surface" subtitle="The first API and data-model layer is now scaffolded locally.">
            <div className="route-grid">
              {apiCatalog.map((route) => (
                <article className="route-card" key={route}>
                  <strong>{route}</strong>
                  <code>JSON route handler</code>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Database modules" subtitle="Prisma schema covers the first operational domains.">
            <div className="list-column">
              {databaseModules.map((moduleName) => (
                <article className="list-row" key={moduleName}>
                  <strong>{moduleName}</strong>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
