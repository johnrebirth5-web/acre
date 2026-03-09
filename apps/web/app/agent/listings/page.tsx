import { listListings } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function AgentListingsPage() {
  const listingFeed = listListings("agent");

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Listings</Badge>
          <h2>Agent marketing layer</h2>
          <p>
            This page is where listing search, poster generation, tracked share links, and custom notes converge. The
            final version will support both natural-language discovery and structured listing filters.
          </p>
        </div>
        <div className="metric-strip">
          <span>Responsive target</span>
          <strong>Single-column mobile, split workflow desktop.</strong>
          <p>Poster, QR, and share actions need one-thumb reach on phone.</p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="Suggested inventory" subtitle="Seeded from the structured listing model defined in the PRD.">
          <div className="list-column">
            {listingFeed.map((listing) => (
              <article className="list-row" key={listing.id}>
                <div className="list-row-top">
                  <strong>{listing.name}</strong>
                  <Badge tone="success">{listing.status}</Badge>
                </div>
                <p>{listing.area}</p>
                <p>{listing.hook}</p>
                <div className="list-row-meta">
                  <span>{listing.price}</span>
                  <span>Tracked link ready</span>
                  <span>{listing.trackedClicks} clicks</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Output modes" subtitle="The listings module is more than inventory; it is a marketing terminal.">
          <div className="action-grid">
            <article className="action-card">
              <strong>Tracked WeChat link</strong>
              <p>Agent-specific share link with click tracking and later gated lead capture.</p>
            </article>
            <article className="action-card">
              <strong>Poster export</strong>
              <p>Auto-inserts agent identity, compliance fields, and listing highlights.</p>
            </article>
            <article className="action-card">
              <strong>Custom notes</strong>
              <p>Agent can append local insight or investment framing per target client.</p>
            </article>
          </div>
        </Panel>
      </section>
    </>
  );
}
