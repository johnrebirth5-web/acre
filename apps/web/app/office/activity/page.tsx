import Link from "next/link";
import { canAccessAccountActivity, canReviewOfficeTasks, canSecondaryReviewOfficeTasks } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { getOfficeActivityLogSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { ActivityCommentComposer } from "./activity-comment-composer";

type OfficeActivityPageProps = {
  searchParams?: Promise<{
    view?: string;
    activitySection?: string;
    alertSection?: string;
    actorMembershipId?: string;
    objectType?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

type ActivitySearchParams = {
  view?: string;
  activitySection?: string;
  alertSection?: string;
  actorMembershipId?: string;
  objectType?: string;
  startDate?: string;
  endDate?: string;
};

function buildActivityHref(currentSearchParams: ActivitySearchParams, nextSearchParams: ActivitySearchParams) {
  const merged = new URLSearchParams();
  const finalSearchParams = {
    view: currentSearchParams.view,
    activitySection: currentSearchParams.activitySection,
    alertSection: currentSearchParams.alertSection,
    actorMembershipId: currentSearchParams.actorMembershipId,
    objectType: currentSearchParams.objectType,
    startDate: currentSearchParams.startDate,
    endDate: currentSearchParams.endDate,
    ...nextSearchParams
  };

  for (const [key, value] of Object.entries(finalSearchParams)) {
    if (typeof value === "string" && value.trim().length > 0) {
      merged.set(key, value);
    }
  }

  const query = merged.toString();
  return query ? `/office/activity?${query}` : "/office/activity";
}

export default async function OfficeActivityPage(props: OfficeActivityPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessAccountActivity(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficeActivityLogSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    currentMembershipId: context.currentMembership.id,
    canReviewTasks: canReviewOfficeTasks(context.currentMembership.role),
    canSecondaryReviewTasks: canSecondaryReviewOfficeTasks(context.currentMembership.role),
    view: searchParams.view,
    activitySection: searchParams.activitySection,
    alertSection: searchParams.alertSection,
    actorMembershipId: searchParams.actorMembershipId,
    objectType: searchParams.objectType,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate
  });

  const selectedView = snapshot.selectedView;

  return (
    <PageShell className="bm-page">
      <PageHeader
        actions={
          <>
            <ActivityCommentComposer
              officeId={context.currentOffice?.id ?? null}
              scopeLabel={context.currentOffice?.name ?? context.currentOrganization.name}
            />
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <span className="bm-view-toggle is-active">{snapshot.latestWindowLabel}</span>
          </>
        }
        description="Audit-backed activity records remain the source of truth. Operational alerts are derived live from current transaction, task, and contact state."
        eyebrow="Account activity"
        title="Account activity"
      />

      <form className="bm-activity-filter-bar bm-table-card" method="get">
        <div className="bm-filter-strip">
          <Link
            className={`bm-view-toggle${selectedView === "all" ? " is-active" : ""}`}
            href={buildActivityHref(searchParams, {
              view: "all",
              activitySection: "",
              alertSection: ""
            })}
          >
            All
          </Link>
          <Link
            className={`bm-view-toggle${selectedView === "activity" ? " is-active" : ""}`}
            href={buildActivityHref(searchParams, {
              view: "activity",
              alertSection: ""
            })}
          >
            Activity only
          </Link>
          <Link
            className={`bm-view-toggle${selectedView === "alerts" ? " is-active" : ""}`}
            href={buildActivityHref(searchParams, {
              view: "alerts",
              activitySection: ""
            })}
          >
            Alerts only
          </Link>
        </div>

        <div className="bm-activity-filter-grid">
          <label className="bm-activity-filter-field">
            <span>Actor (activity only)</span>
            <select defaultValue={snapshot.filters.actorMembershipId} disabled={selectedView === "alerts"} name="actorMembershipId">
              <option value="">All actors</option>
              {snapshot.filters.actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.label}
                </option>
              ))}
            </select>
          </label>

          <label className="bm-activity-filter-field">
            <span>Object type</span>
            <select defaultValue={snapshot.filters.objectType} name="objectType">
              <option value="all">All objects</option>
              <option value="transaction">Transactions</option>
              <option value="contact">Contacts</option>
              <option value="task">Tasks</option>
              <option value="agent">Agents / teams</option>
              <option value="document">Documents / forms</option>
              <option value="accounting">Accounting</option>
              <option value="comment">Comments</option>
              <option value="auth">Authentication</option>
            </select>
          </label>

          <label className="bm-activity-filter-field">
            <span>Start date</span>
            <input defaultValue={snapshot.filters.startDate} name="startDate" type="date" />
          </label>

          <label className="bm-activity-filter-field">
            <span>End date</span>
            <input defaultValue={snapshot.filters.endDate} name="endDate" type="date" />
          </label>

          <div className="bm-activity-filter-actions">
            <input name="view" type="hidden" value={selectedView} />
            {selectedView === "activity" ? (
              <input name="activitySection" type="hidden" value={snapshot.activitySelectedSection} />
            ) : null}
            {selectedView === "alerts" ? (
              <input name="alertSection" type="hidden" value={snapshot.alertSelectedSection === "all" ? "" : snapshot.alertSelectedSection} />
            ) : null}
            <button className="bm-create-button" type="submit">
              Apply filters
            </button>
            <Link className="bm-view-toggle" href="/office/activity">
              Reset
            </Link>
          </div>
        </div>
      </form>

      <section className="bm-activity-layout">
        <aside className="bm-activity-nav-column">
          <section className="bm-table-card bm-activity-sections-card">
            <div className="bm-card-head">
              <h3>Activity log</h3>
              <span>Counts in the latest 200-record audit window</span>
            </div>

            <nav className="bm-activity-section-list">
              {snapshot.activitySections.map((section) => (
                <Link
                  className={`bm-activity-section-link${selectedView === "activity" && section.key === snapshot.activitySelectedSection ? " is-active" : ""}`}
                  href={buildActivityHref(searchParams, {
                    view: "activity",
                    activitySection: section.key,
                    alertSection: ""
                  })}
                  key={section.key}
                >
                  <strong>{section.label}</strong>
                  <span>{section.count}</span>
                </Link>
              ))}
            </nav>
          </section>

          <section className="bm-table-card bm-activity-sections-card">
            <div className="bm-card-head">
              <h3>Operational alerts</h3>
              <span>Live alerts derived from current system state</span>
            </div>

            <nav className="bm-activity-section-list">
              {snapshot.alertSections.map((section) => (
                <Link
                  className={`bm-activity-section-link${selectedView === "alerts" && section.key === snapshot.alertSelectedSection ? " is-active" : ""}`}
                  href={buildActivityHref(searchParams, {
                    view: "alerts",
                    activitySection: "",
                    alertSection: section.key === "all" ? "" : section.key
                  })}
                  key={section.key}
                >
                  <strong>{section.label}</strong>
                  <span>{section.count}</span>
                </Link>
              ))}
            </nav>
          </section>
        </aside>

        <div className="bm-activity-streams">
          {selectedView !== "alerts" ? (
            <section className="bm-table-card bm-activity-log-card">
              <div className="bm-card-head">
                <h3>{selectedView === "activity" ? snapshot.activitySelectedSectionLabel : "Activity log"}</h3>
                <span>Showing {snapshot.activityEvents.length} audit records</span>
              </div>

              <div className="bm-activity-records">
                {snapshot.activityEvents.length ? (
                  snapshot.activityEvents.map((event) => (
                    <article className="bm-activity-record" key={event.id}>
                      <div className="bm-activity-record-top">
                        <div className="bm-activity-record-copy">
                          <div className="bm-activity-record-summary">
                            <strong>{event.actorDisplayName}</strong>
                            <span>{event.summary}</span>
                          </div>
                          {event.href ? (
                            <Link className="bm-activity-object-link" href={event.href}>
                              {event.objectLabel}
                            </Link>
                          ) : (
                            <p className="bm-activity-object-link is-static">{event.objectLabel}</p>
                          )}
                        </div>

                        <div className="bm-activity-record-meta">
                          <span className={`bm-status-pill ${event.isComment ? "bm-status-pill-neutral" : "bm-status-pill-primary"}`}>{event.actionLabel}</span>
                          <time>{event.timestampLabel}</time>
                        </div>
                      </div>

                      {event.detailSummary.length ? (
                        <ul className="bm-activity-detail-list">
                          {event.detailSummary.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="bm-pipeline-empty">No audit events are currently available for this scope.</div>
                )}
              </div>
            </section>
          ) : null}

          {selectedView !== "activity" ? (
            <section className="bm-table-card bm-activity-log-card bm-alerts-card">
              <div className="bm-card-head">
                <h3>{selectedView === "alerts" ? snapshot.alertSelectedSectionLabel : "Operational alerts"}</h3>
                <span>Showing {snapshot.alerts.length} current alerts</span>
              </div>

              <div className="bm-activity-records">
                {snapshot.alerts.length ? (
                  snapshot.alerts.map((alert) => (
                    <article className="bm-activity-record bm-alert-record" key={alert.id}>
                      <div className="bm-activity-record-top">
                        <div className="bm-activity-record-copy">
                          <div className="bm-activity-record-summary">
                            <strong>{alert.title}</strong>
                            <span>{alert.summary}</span>
                          </div>
                          {alert.href ? (
                            <Link className="bm-activity-object-link" href={alert.href}>
                              {alert.objectLabel}
                            </Link>
                          ) : (
                            <p className="bm-activity-object-link is-static">{alert.objectLabel}</p>
                          )}
                        </div>

                        <div className="bm-activity-record-meta">
                          <span className={`bm-status-pill bm-alert-pill bm-alert-pill-${alert.severity}`}>{alert.severityLabel}</span>
                          <span>{alert.referenceLabel}</span>
                        </div>
                      </div>

                      <div className="bm-alert-type-row">
                        <span className="bm-alert-type-label">{alert.typeLabel}</span>
                      </div>

                      {alert.detailSummary.length ? (
                        <ul className="bm-activity-detail-list">
                          {alert.detailSummary.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="bm-pipeline-empty">No live operational alerts are active for this scope.</div>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
