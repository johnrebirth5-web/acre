import { listResources, listVendors } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function OfficeLibraryPage() {
  const resourceFeed = listResources();
  const vendorFeed = listVendors();

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Library</span>
          <h2>Library and documents</h2>
          <p>Back-office document library, training links, and vendor references.</p>
        </div>
        <div className="office-button-row">
          <span className="office-button office-button-secondary">Upload file</span>
          <span className="office-button">Add template</span>
        </div>
      </section>

      <section className="office-dashboard-grid office-dashboard-grid-wide">
        <Panel title="Library records" subtitle="Current placeholder for the library module.">
          <div className="office-table">
            <div className="office-table-header office-table-row office-table-row-wide">
              <span>Document</span>
              <span>Type</span>
              <span>Tags</span>
              <span>Summary</span>
              <span>Status</span>
              <span>Use</span>
            </div>
            {resourceFeed.map((resource) => (
              <div className="office-table-row office-table-row-wide" key={resource.id}>
                <div className="office-table-primary">
                  <strong>{resource.title}</strong>
                  <p>{resource.summary}</p>
                </div>
                <span>{resource.type}</span>
                <span>{resource.tags.join(", ")}</span>
                <span>{resource.summary}</span>
                <span>Published</span>
                <span>Internal</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Vendor references" subtitle="Temporary companion list sourced from the current back-office package.">
          <div className="office-table">
            <div className="office-table-header office-table-row office-table-row-vendors">
              <span>Vendor</span>
              <span>Category</span>
              <span>Coverage</span>
            </div>
            {vendorFeed.map((vendor) => (
              <div className="office-table-row office-table-row-vendors" key={vendor.id}>
                <div className="office-table-primary">
                  <strong>{vendor.name}</strong>
                  <p>{vendor.headline}</p>
                </div>
                <span>{vendor.category}</span>
                <span>{vendor.neighborhoods.join(", ")}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
