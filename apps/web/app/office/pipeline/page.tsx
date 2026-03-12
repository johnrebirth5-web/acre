import Link from "next/link";
import { getOfficePipelineWorkspaceSnapshot } from "@acre/db";
import { PageHeader, PageShell } from "@acre/ui";
import { requireOfficeSession } from "../../../lib/auth-session";

type PipelinePageSearchParams = {
  search?: string;
  representing?: string;
  ownerMembershipId?: string;
  metricMode?: string;
  stage?: string;
  historyStatus?: string;
  historyMonth?: string;
};

type PipelinePageProps = {
  searchParams?: Promise<PipelinePageSearchParams>;
};

function buildPipelineHref(
  currentFilters: {
    search: string;
    representing: string;
    ownerMembershipId: string;
    metricMode: string;
    stage: string;
    historyStatus: string;
    historyMonth: string;
  },
  overrides: Partial<Record<keyof PipelinePageSearchParams, string | null>>
) {
  const params = new URLSearchParams();
  const nextFilters = {
    ...currentFilters,
    ...overrides
  };

  Object.entries(nextFilters).forEach(([key, value]) => {
    if (!value || value === "all") {
      return;
    }

    params.set(key, value);
  });

  const queryString = params.toString();
  return `/office/pipeline${queryString ? `?${queryString}` : ""}`;
}

export default async function OfficePipelinePage(props: PipelinePageProps) {
  const context = await requireOfficeSession();
  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficePipelineWorkspaceSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    search: searchParams.search,
    representing: searchParams.representing,
    ownerMembershipId: searchParams.ownerMembershipId,
    metricMode: searchParams.metricMode,
    stage: searchParams.stage,
    historyStatus: searchParams.historyStatus,
    historyMonth: searchParams.historyMonth
  });

  const hrefBaseFilters = {
    search: snapshot.filters.search,
    representing: snapshot.filters.representing,
    ownerMembershipId: snapshot.filters.ownerMembershipId,
    metricMode: snapshot.filters.metricMode,
    stage: snapshot.filters.stage,
    historyStatus: snapshot.filters.historyStatus,
    historyMonth: snapshot.filters.historyMonth
  };

  const allTransactionsHref = buildPipelineHref(hrefBaseFilters, {
    stage: null,
    historyStatus: null,
    historyMonth: null
  });
  const hasScopedSelection = snapshot.selection.kind !== "all";

  return (
    <PageShell className="bm-page">
      <PageHeader
        actions={
          <div className="office-page-actions office-pipeline-page-actions">
            <span className="office-pipeline-header-chip">{snapshot.metricModeLabel}</span>
            {hasScopedSelection ? (
              <Link className="office-button office-button-secondary" href={allTransactionsHref}>
                Clear selection
              </Link>
            ) : null}
          </div>
        }
        description="Management-oriented pipeline workspace with live funnel totals on the left and one unified working list on the right."
        eyebrow="Pipeline"
        title="Pipeline"
      />

      <form className="office-report-filters office-pipeline-filters" method="get">
        <label className="office-report-filter">
          <span>Search</span>
          <input defaultValue={snapshot.filters.search} name="search" placeholder="Address, owner, city..." type="search" />
        </label>
        <label className="office-report-filter">
          <span>Side</span>
          <select defaultValue={snapshot.filters.representing} name="representing">
            <option value="all">Any side</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="both">Both</option>
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
        </label>
        <label className="office-report-filter">
          <span>Metric</span>
          <select defaultValue={snapshot.filters.metricMode} name="metricMode">
            <option value="transaction_volume">Transaction volume</option>
            <option value="office_net">Office net</option>
            <option value="office_gross">Office gross</option>
          </select>
        </label>
        <label className="office-report-filter">
          <span>Owner / agent</span>
          <select defaultValue={snapshot.filters.ownerMembershipId} name="ownerMembershipId">
            <option value="">Any owner / agent</option>
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
          <Link className="office-button office-button-secondary" href="/office/pipeline">
            Reset
          </Link>
        </div>
        {snapshot.filters.stage ? <input name="stage" type="hidden" value={snapshot.filters.stage} /> : null}
        {snapshot.filters.historyStatus ? <input name="historyStatus" type="hidden" value={snapshot.filters.historyStatus} /> : null}
        {snapshot.filters.historyMonth ? <input name="historyMonth" type="hidden" value={snapshot.filters.historyMonth} /> : null}
      </form>

      <section className="office-pipeline-layout">
        <aside className="office-pipeline-rail">
          <section className="office-pipeline-rail-card">
            <div className="office-pipeline-rail-copy">
              <span className="office-eyebrow">Current funnel</span>
              <h3>Live stages</h3>
              <p>{snapshot.metricModeDescription}</p>
            </div>

            <Link
              className={`office-pipeline-rail-link ${snapshot.selection.kind === "all" ? "is-active" : ""}`}
              href={allTransactionsHref}
            >
              <div>
                <strong>All transactions</strong>
                <span>{snapshot.allTransactionsSummary.count} records</span>
              </div>
              <em>{snapshot.allTransactionsSummary.metricLabel}</em>
            </Link>

            <div className="office-pipeline-rail-section-head">
              <span>Funnel stage</span>
              <span>{snapshot.metricModeLabel}</span>
            </div>
            <div className="office-pipeline-rail-list">
              {snapshot.funnelBuckets.map((bucket) => (
                <Link
                  className={`office-pipeline-rail-link ${snapshot.filters.stage === bucket.status ? "is-active" : ""}`}
                  href={buildPipelineHref(hrefBaseFilters, {
                    stage: bucket.status,
                    historyStatus: null,
                    historyMonth: null
                  })}
                  key={bucket.status}
                >
                  <div>
                    <strong>{bucket.status}</strong>
                    <span>{bucket.count} records</span>
                  </div>
                  <em>{bucket.metricLabel}</em>
                </Link>
              ))}
            </div>
          </section>

          <section className="office-pipeline-rail-card">
            <div className="office-pipeline-rail-copy">
              <span className="office-eyebrow">Closed / cancelled</span>
              <h3>Recent monthly rollups</h3>
              <p>Uses closing date when available. Otherwise the rollup falls back to the transaction updated date.</p>
            </div>

            {snapshot.historyMonths.length > 0 ? (
              <div className="office-pipeline-history-list">
                {snapshot.historyMonths.map((month) => (
                  <article className="office-pipeline-history-month" key={month.monthKey}>
                    <header>
                      <strong>{month.label}</strong>
                    </header>
                    <div className="office-pipeline-history-buckets">
                      {month.buckets.map((bucket) => (
                        <Link
                          className={`office-pipeline-history-link ${
                            snapshot.filters.historyStatus === bucket.status && snapshot.filters.historyMonth === month.monthKey ? "is-active" : ""
                          }`}
                          href={buildPipelineHref(hrefBaseFilters, {
                            stage: null,
                            historyStatus: bucket.status,
                            historyMonth: month.monthKey
                          })}
                          key={`${month.monthKey}-${bucket.status}`}
                        >
                          <span>{bucket.status}</span>
                          <strong>{bucket.count}</strong>
                          <em>{bucket.metricLabel}</em>
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="office-report-empty">No closed or cancelled records matched the current top-level filters in the recent history window.</p>
            )}
          </section>
        </aside>

        <section className="office-pipeline-panel">
          <div className="office-pipeline-panel-header">
            <div className="office-pipeline-panel-copy">
              <span className="office-eyebrow">Working list</span>
              <h3>{snapshot.selection.label}</h3>
              <p>{snapshot.selection.note}</p>
              <div className="office-pipeline-selection-meta">
                {snapshot.selection.contextChips.map((chip) => (
                  <span className="office-pipeline-selection-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="office-pipeline-headline">
              <article className="office-pipeline-headline-card">
                <span>Matching transactions</span>
                <strong>{snapshot.listSummary.totalCount}</strong>
              </article>
              <article className="office-pipeline-headline-card office-pipeline-headline-card-accent">
                <span>{snapshot.metricModeLabel}</span>
                <strong>{snapshot.listSummary.metricLabel}</strong>
              </article>
            </div>
          </div>

          <div className="office-pipeline-table">
            <div className="office-pipeline-table-head">
              <span>Transaction</span>
              <span>Market</span>
              <span>Status</span>
              <span>Side</span>
              <span>Owner</span>
              <span>Price</span>
              <span>{snapshot.metricModeLabel}</span>
              <span>Key date</span>
              <span>Updated</span>
            </div>

            <div className="office-pipeline-table-body">
              {snapshot.rows.length > 0 ? (
                snapshot.rows.map((transaction) => (
                  <Link className="office-pipeline-row" href={`/office/transactions/${transaction.id}`} key={transaction.id}>
                    <span className="office-pipeline-row-main">
                      <strong>{transaction.title}</strong>
                      <small>{transaction.addressLine}</small>
                    </span>
                    <span className="office-pipeline-row-market">{transaction.cityState}</span>
                    <span>
                      <span className={`bm-status-pill bm-status-${transaction.status.toLowerCase()}`}>{transaction.status}</span>
                    </span>
                    <span>{transaction.representing}</span>
                    <span>{transaction.owner}</span>
                    <span className="office-pipeline-cell-number">{transaction.priceLabel}</span>
                    <span className="office-pipeline-cell-number office-pipeline-cell-number-strong">{transaction.metricValueLabel}</span>
                    <span className="office-pipeline-cell-date">{transaction.closingOrImportantLabel}</span>
                    <span className="office-pipeline-cell-date">{transaction.updatedLabel}</span>
                  </Link>
                ))
              ) : (
                <div className="office-pipeline-empty">
                  <strong>No transactions matched the current pipeline selection.</strong>
                  <p>Adjust the top filters or clear the stage / history selection to widen the result set.</p>
                </div>
              )}
            </div>
          </div>

          <p className="office-pipeline-footnote">
            Current metric mode: <strong>{snapshot.metricModeLabel}</strong>. {snapshot.metricModeDescription}
          </p>
        </section>
      </section>
    </PageShell>
  );
}
