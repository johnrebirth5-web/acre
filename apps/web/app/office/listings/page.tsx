import { listListings } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function OfficeListingsPage() {
  const listingFeed = listListings("office");

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Listings Admin</Badge>
          <h2>Inventory is the shared core that powers agents, analytics, and public website outputs.</h2>
          <p>
            This module should become the source of truth for listing structure, public eligibility, and downstream
            marketing metadata.
          </p>
        </div>
      </section>

      <section className="workspace-grid">
        <Panel title="Listing pipeline" subtitle="The office path is fundamentally an ingestion and enrichment workflow.">
          <div className="list-column">
            {listingFeed.map((listing) => (
              <article className="list-row" key={listing.id}>
                <div className="list-row-top">
                  <strong>{listing.name}</strong>
                  <Badge tone={listing.isPublic ? "success" : "neutral"}>{listing.isPublic ? "Public" : "Private"}</Badge>
                </div>
                <p>{listing.hook}</p>
                <div className="list-row-meta">
                  <span>{listing.area}</span>
                  <span>{listing.price}</span>
                  <span>{listing.trackedClicks} clicks</span>
                  <span>{listing.status}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Public-web bridge" subtitle="The optimization notes add requirements beyond a private back office.">
          <div className="route-grid">
            <article className="route-card">
              <strong>Public visibility flag</strong>
              <code>listings.is_public</code>
            </article>
            <article className="route-card">
              <strong>SEO metadata</strong>
              <code>listings.seo_keywords</code>
            </article>
            <article className="route-card">
              <strong>Tracked-link promotion</strong>
              <code>click_count can promote hot deals</code>
            </article>
            <article className="route-card">
              <strong>Status monitor</strong>
              <code>inactive + success stories automation</code>
            </article>
          </div>
        </Panel>
      </section>
    </>
  );
}
