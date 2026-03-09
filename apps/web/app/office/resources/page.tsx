import { listResources, listVendors } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function OfficeResourcesPage() {
  const resourceFeed = listResources();
  const vendorFeed = listVendors();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Resources Admin</Badge>
          <h2>Curate the shared knowledge and asset layer behind the whole company.</h2>
          <p>
            Training media, vendor records, templates, and internal docs should all be maintainable here and reusable by
            both the agent workspace and AI tool outputs.
          </p>
        </div>
      </section>
      <section className="workspace-grid">
        <Panel title="Published resources" subtitle="These entries will later map to upload flows and searchable metadata.">
          <div className="list-column">
            {resourceFeed.map((resource) => (
              <article className="list-row" key={resource.id}>
                <div className="list-row-top">
                  <strong>{resource.title}</strong>
                  <Badge tone="neutral">{resource.type}</Badge>
                </div>
                <p>{resource.summary}</p>
                <div className="list-row-meta">
                  {resource.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Vendor records" subtitle="Structured vendor cards are needed for search, profile display, and AI grounding.">
          <div className="list-column">
            {vendorFeed.map((vendor) => (
              <article className="list-row" key={vendor.id}>
                <div className="list-row-top">
                  <strong>{vendor.name}</strong>
                  <Badge tone="success">{vendor.category}</Badge>
                </div>
                <p>{vendor.headline}</p>
                <div className="list-row-meta">
                  {vendor.neighborhoods.map((neighborhood) => (
                    <span key={neighborhood}>{neighborhood}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
