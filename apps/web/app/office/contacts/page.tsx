import { listClients } from "@acre/backoffice";
import { Panel } from "@acre/ui";

export default function OfficeContactsPage() {
  const clients = listClients();

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Contacts</span>
          <h2>Contacts</h2>
          <p>Back-office contacts should eventually merge Front Office client records and manual additions.</p>
        </div>
      </section>

      <Panel title="Contacts table" subtitle="Current placeholder data comes from the lightweight CRM feed.">
        <div className="office-table">
          <div className="office-table-header office-table-row office-table-row-wide">
            <span>Name</span>
            <span>Stage</span>
            <span>Intent</span>
            <span>Areas</span>
            <span>Last contact</span>
            <span>Next follow-up</span>
          </div>
          {clients.map((client) => (
            <div className="office-table-row office-table-row-wide" key={client.id}>
              <div className="office-table-primary">
                <strong>{client.fullName}</strong>
                <p>{client.source}</p>
              </div>
              <span>{client.stage}</span>
              <span>{client.intent}</span>
              <span>{client.areas.join(", ")}</span>
              <span>{client.lastContactLabel}</span>
              <span>{client.nextFollowUpLabel}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
