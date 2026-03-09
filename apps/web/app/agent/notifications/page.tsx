import { listEvents, listNotifications } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function AgentNotificationsPage() {
  const activityCards = listNotifications();
  const upcomingEvents = listEvents();

  return (
    <>
      <section className="workspace-panel workspace-panel-hero">
        <div className="panel-copy">
          <Badge tone="accent">Activity Center</Badge>
          <h2>Events, notices, RSVP, and reminders from one stream.</h2>
          <p>
            The final version will unify office broadcasts, event participation, and follow-up reminders so agents do
            not need to check multiple places.
          </p>
        </div>
      </section>

      <Panel title="Current activity model" subtitle="This stream merges system notices with event actions.">
        <div className="list-column">
          {activityCards.map((card) => (
            <article className="list-row" key={card.id}>
              <div className="list-row-top">
                <strong>{card.title}</strong>
                <Badge tone="neutral">Actionable</Badge>
              </div>
              <p>{card.body}</p>
              <div className="list-row-meta">
                <span>{card.kind}</span>
                <span>{card.actionLabel}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Upcoming events" subtitle="Office-created events feed the same activity surface for agents.">
        <div className="list-column">
          {upcomingEvents.map((event) => (
            <article className="list-row" key={event.id}>
              <div className="list-row-top">
                <strong>{event.title}</strong>
                <Badge tone="success">{event.kind}</Badge>
              </div>
              <p>{event.location}</p>
              <div className="list-row-meta">
                <span>{event.startsAtLabel}</span>
                <span>{event.rsvpCount} RSVP</span>
                <span>{event.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
