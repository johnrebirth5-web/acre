import { getOfficeActivitySnapshot } from "@acre/db";
import { Badge, Panel } from "@acre/ui";
import { requireOfficeSession } from "../../../lib/auth-session";

function EmptyState(props: { message: string }) {
  return <p className="office-empty-copy">{props.message}</p>;
}

export default async function OfficeActivityPage() {
  const context = await requireOfficeSession();
  const snapshot = await getOfficeActivitySnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    membershipId: context.currentMembership.id
  });

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Activity</span>
          <h2>Activity feed</h2>
          <p>Session-aware operational feed for office events, notifications, follow-up pressure, and recent transaction work.</p>
        </div>
      </section>

      <section className="office-dashboard-grid">
        <Panel title="Upcoming events" subtitle="Real Event records for the current office scope.">
          <div className="office-queue-list">
            {snapshot.upcomingEvents.length ? (
              snapshot.upcomingEvents.map((event) => (
                <article className="office-queue-item" key={event.id}>
                  <div className="office-queue-item-top">
                    <strong>{event.title}</strong>
                    <Badge tone="accent">{event.visibility}</Badge>
                  </div>
                  <p>{event.description}</p>
                  <div className="office-queue-meta">
                    <span>{event.location}</span>
                    <span>{event.startsAtLabel}</span>
                    <span>{event.rsvpCount} RSVP</span>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No upcoming office events are currently scheduled." />
            )}
          </div>
        </Panel>

        <Panel title="Recent notifications" subtitle="Unread items first, then recent organization notifications.">
          <div className="office-queue-list">
            {snapshot.notifications.length ? (
              snapshot.notifications.map((notification) => (
                <article className="office-queue-item" key={notification.id}>
                  <div className="office-queue-item-top">
                    <strong>{notification.title}</strong>
                    <Badge tone={notification.isUnread ? "accent" : "neutral"}>
                      {notification.isUnread ? "Unread" : notification.kind}
                    </Badge>
                  </div>
                  <p>{notification.body}</p>
                  <div className="office-queue-meta">
                    <span>{notification.kind}</span>
                    <span>{notification.createdAtLabel}</span>
                    {notification.actionUrl ? <a href={notification.actionUrl}>Open</a> : null}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No notifications are currently available for this office context." />
            )}
          </div>
        </Panel>
      </section>

      <section className="office-dashboard-grid">
        <Panel title="Follow-up needs" subtitle="Real contacts and follow-up tasks that need attention soon.">
          <div className="office-queue-list">
            {snapshot.followUpItems.length ? (
              snapshot.followUpItems.map((item) => (
                <article className="office-queue-item" key={`${item.kind}-${item.id}`}>
                  <div className="office-queue-item-top">
                    <strong>{item.title}</strong>
                    <Badge tone={item.kind === "Overdue task" ? "accent" : "neutral"}>{item.kind}</Badge>
                  </div>
                  <p>{item.description}</p>
                  <div className="office-queue-meta">
                    <span>{item.dueLabel}</span>
                    <a href={item.href}>Open</a>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No overdue or due-soon follow-up items are currently open." />
            )}
          </div>
        </Panel>

        <Panel
          title="Recent operational items"
          subtitle="Derived from recent transaction update timestamps, not a full audit log."
        >
          <div className="office-queue-list">
            {snapshot.recentOperationalItems.length ? (
              snapshot.recentOperationalItems.map((item) => (
                <article className="office-queue-item" key={item.id}>
                  <div className="office-queue-item-top">
                    <strong>{item.title}</strong>
                    <Badge tone="success">{item.status}</Badge>
                  </div>
                  <p>{item.description}</p>
                  <div className="office-queue-meta">
                    <span>{item.updatedAtLabel}</span>
                    <a href={item.href}>Open</a>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="No recent transaction updates are available yet." />
            )}
          </div>
        </Panel>
      </section>
    </>
  );
}
