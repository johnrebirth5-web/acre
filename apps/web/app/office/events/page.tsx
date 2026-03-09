import { listEvents } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function OfficeEventsPage() {
  const eventFeed = listEvents();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Events</Badge>
          <h2>Publish workshops and field events with RSVP and reminder automation.</h2>
          <p>
            Office-created events should automatically appear in the agent activity center, with RSVP state and reminder
            timing handled centrally.
          </p>
        </div>
      </section>
      <Panel title="Event workflow" subtitle="The admin side controls creation, visibility, and reminder timing.">
        <div className="list-column">
          {eventFeed.map((event) => (
            <article className="list-row" key={event.id}>
              <div className="list-row-top">
                <strong>{event.title}</strong>
                <Badge tone="accent">{event.kind}</Badge>
              </div>
              <p>{event.location}</p>
              <div className="list-row-meta">
                <span>{event.startsAtLabel}</span>
                <span>{event.visibility}</span>
                <span>{event.rsvpCount} RSVP</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
