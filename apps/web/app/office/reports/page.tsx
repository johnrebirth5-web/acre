import { Badge, Panel } from "@acre/ui";
import { getOfficeReportsSnapshot } from "@acre/db";
import { requireOfficeSession } from "../../../lib/auth-session";

function getMaxOwnerCount(items: Array<{ transactionCount: number }>) {
  return Math.max(...items.map((item) => item.transactionCount), 1);
}

type ReportsPageProps = {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    ownerMembershipId?: string;
  }>;
};

export default async function OfficeReportsPage(props: ReportsPageProps) {
  const context = await requireOfficeSession();
  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficeReportsSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    ownerMembershipId: searchParams.ownerMembershipId
  });
  const maxOwnerCount = getMaxOwnerCount(snapshot.transactionsByOwner);

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Reports</span>
          <h2>Reports</h2>
          <p>Live office reporting for transactions, ownership distribution, and contacts that still need follow-up.</p>
        </div>
        <div className="office-button-row">
          <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
        </div>
      </section>

      <form className="office-report-filters" method="get">
        <label className="office-report-filter">
          <span>Start date</span>
          <input defaultValue={snapshot.filters.startDate} name="startDate" type="date" />
        </label>
        <label className="office-report-filter">
          <span>End date</span>
          <input defaultValue={snapshot.filters.endDate} name="endDate" type="date" />
        </label>
        <label className="office-report-filter">
          <span>Owner / agent</span>
          <select defaultValue={snapshot.filters.ownerMembershipId} name="ownerMembershipId">
            <option value="">All owners</option>
            {snapshot.filters.ownerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="office-report-filter-actions">
          <button className="office-button" type="submit">
            Apply filters
          </button>
          <a className="office-button office-button-secondary" href="/office/reports">
            Reset
          </a>
        </div>
      </form>

      <section className="office-kpi-grid">
        <article className="office-kpi-card office-kpi-card-accent">
          <span>Total transactions</span>
          <strong>{snapshot.totals.totalTransactions}</strong>
          <p>Counted from real transaction rows inside the current organization scope.</p>
        </article>
        <article className="office-kpi-card">
          <span>Total volume</span>
          <strong>{snapshot.totals.totalVolumeLabel}</strong>
          <p>Sum of current filtered transaction prices.</p>
        </article>
        <article className="office-kpi-card">
          <span>Contacts needing follow-up</span>
          <strong>{snapshot.totals.contactsNeedingFollowUp}</strong>
          <p>Contacts whose next follow-up date is due or overdue.</p>
        </article>
        <article className="office-kpi-card">
          <span>Owners with deals</span>
          <strong>{snapshot.totals.activeOwnerCount}</strong>
          <p>Distinct owners in the current filtered result set.</p>
        </article>
      </section>

      <section className="office-dashboard-grid office-dashboard-grid-wide">
        <Panel title="Transactions by status" subtitle="Current filtered transaction counts grouped by status.">
          <div className="office-note-list">
            {snapshot.transactionsByStatus.map((item, index) => (
              <article className="office-note-item" key={item.status}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.status}</strong>
                  <p>{item.count} transactions</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Transactions over time" subtitle="Grouped by transaction created month in the current filter window.">
          <div className="office-note-list">
            {snapshot.transactionsOverTime.map((point, index) => (
              <article className="office-note-item" key={point.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{point.label}</strong>
                  <p>{point.transactionCount} transactions</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Transactions by owner / agent" subtitle="Minimal ownership report built from real transaction ownership data.">
        <div className="office-report-owner-list">
          {snapshot.transactionsByOwner.length === 0 ? (
            <p className="office-report-empty">No transactions matched the current filters.</p>
          ) : (
            snapshot.transactionsByOwner.map((owner) => (
              <article className="office-report-owner-row" key={owner.ownerMembershipId ?? owner.ownerName}>
                <div className="office-report-owner-copy">
                  <strong>{owner.ownerName}</strong>
                  <span>
                    {owner.transactionCount} transactions · {owner.totalVolumeLabel}
                  </span>
                </div>
                <div className="office-report-owner-bar">
                  <div
                    className="office-report-owner-bar-fill"
                    style={{ width: `${Math.max((owner.transactionCount / maxOwnerCount) * 100, 8)}%` }}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>
    </>
  );
}
