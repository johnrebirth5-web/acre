import { listEvents, listNotifications } from "@acre/backoffice";
import { Badge, Panel } from "@acre/ui";

export default function OfficeActivityPage() {
  const notifications = listNotifications();
  const events = listEvents();

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Activity</span>
          <h2>Activity feed</h2>
          <p>Real-time operational feed for reminders, missing files, event pressure, and system notices.</p>
        </div>
      </section>

      <section className="office-dashboard-grid">
        <Panel title="System activity" subtitle="This should eventually mirror the live back-office feed.">
          <div className="office-queue-list">
            {notifications.map((notification) => (
              <article className="office-queue-item" key={notification.id}>
                <div className="office-queue-item-top">
                  <strong>{notification.title}</strong>
                  <Badge tone="neutral">{notification.kind}</Badge>
                </div>
                <p>{notification.body}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Event activity" subtitle="Current temporary source until unified activity records are implemented.">
          <div className="office-queue-list">
            {events.map((event) => (
              <article className="office-queue-item" key={event.id}>
                <div className="office-queue-item-top">
                  <strong>{event.title}</strong>
                  <Badge tone="accent">{event.kind}</Badge>
                </div>
                <p>{event.location}</p>
                <div className="office-queue-meta">
                  <span>{event.startsAtLabel}</span>
                  <span>{event.rsvpCount} RSVP</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
