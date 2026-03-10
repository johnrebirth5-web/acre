import Link from "next/link";
import { officeTrainingLinks, officeUsefulLinks, officeWeeklyUpdates } from "@acre/backoffice";
import { getOfficeDashboardBusinessSnapshot } from "@acre/db";
import { getSessionAccess, requireOfficeSession } from "../../../lib/auth-session";

function buildChartPath(values: number[], width: number, height: number, maxValue: number) {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (maxValue === 0 ? 0 : (value / maxValue) * height);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default async function OfficeDashboardPage() {
  const context = await requireOfficeSession();
  const access = getSessionAccess(context);
  const snapshot = await getOfficeDashboardBusinessSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id
  });

  const chartWidth = 1000;
  const chartHeight = 220;
  const chartValues = snapshot.chart.points.map((point) => point.value);
  const chartPath = buildChartPath(chartValues, chartWidth, chartHeight, snapshot.chart.maxValue);

  return (
    <div className="bm-dashboard">
      <section className="bm-goal-card">
        <div className="bm-goal-main">
          <div className="bm-card-head">
            <h2>GOAL TRACKING</h2>
            <span>✎</span>
          </div>

          <div className="bm-dashboard-summary">
            <div className="bm-dashboard-access">
              <strong>
                {context.currentUser.firstName} {context.currentUser.lastName}
              </strong>
              <span>
                {access.label} · {access.permissionCount} permissions · {context.currentOffice?.name ?? context.currentOrganization.name}
              </span>
            </div>

            <div className="bm-dashboard-status-strip">
              {snapshot.transactionCountsByStatus.map((metric) => (
                <div className="bm-dashboard-status-chip" key={metric.status}>
                  <span>{metric.status}</span>
                  <strong>{metric.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="bm-goal-chart">
            <div className="bm-chart-grid">
              <div className="bm-chart-axis">
                {snapshot.chart.axisLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="bm-chart-line-shell">
                <svg aria-hidden="true" className="bm-chart-series" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <path d={chartPath} />
                  {snapshot.chart.points.map((point, index) => {
                    const x = snapshot.chart.points.length > 1 ? (index / (snapshot.chart.points.length - 1)) * chartWidth : chartWidth / 2;
                    const y = chartHeight - (snapshot.chart.maxValue === 0 ? 0 : (point.value / snapshot.chart.maxValue) * chartHeight);

                    return <circle cx={x} cy={y} key={point.label} r="5" />;
                  })}
                </svg>

                <div className="bm-chart-months">
                  {snapshot.chart.points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="bm-goal-side">
              <div className="bm-goal-ring">
                <div className="bm-goal-ring-inner">
                  <strong>{snapshot.goal.progressPercent}%</strong>
                  <span>{snapshot.goal.currentValueLabel}</span>
                </div>
              </div>
              <div className="bm-goal-foot">
                <span>{snapshot.goal.targetLabel}:</span>
                <strong>{snapshot.goal.target}</strong>
              </div>
              <div className="bm-time-left">
                <span>{snapshot.goal.secondaryLabel}:</span>
                <strong>{snapshot.goal.secondaryValue}</strong>
              </div>
              <div className="bm-time-bar">
                <div className="bm-time-bar-fill" style={{ width: `${snapshot.goal.progressPercent}%` }} />
              </div>
              <p className="bm-goal-caption">{snapshot.goal.currentValue}</p>
            </aside>
          </div>
        </div>
      </section>

      <section className="bm-card-grid">
        <section className="bm-info-card">
          <div className="bm-card-head">
            <h3>WEEKLY UPDATES</h3>
            <span>✎</span>
          </div>
          <div className="bm-update-list">
            {officeWeeklyUpdates.map((update) => (
              <article className="bm-update-item" key={update.id}>
                <strong>
                  {update.timeLabel} {update.title}
                </strong>
                {update.details.map((detail) =>
                  detail.startsWith("https://") ? (
                    <a className="bm-text-link" href={detail} key={detail}>
                      {detail}
                    </a>
                  ) : (
                    <p key={detail}>{detail}</p>
                  )
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="bm-info-card">
          <div className="bm-card-head">
            <h3>ACRE USEFUL LINKS</h3>
            <span>✎</span>
          </div>
          <div className="bm-link-list">
            {officeUsefulLinks.map((link) => (
              <article className="bm-link-row" key={link.id}>
                <span className="bm-link-icon">⛓</span>
                <a className="bm-link-label" href="#">
                  {link.label}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="bm-info-card">
          <div className="bm-card-head">
            <h3>BACK OFFICE AGENT TRAINING LINKS</h3>
            <span>✎</span>
          </div>
          <div className="bm-link-list">
            {officeTrainingLinks.map((link) => (
              <article className="bm-link-row" key={link.id}>
                <span className="bm-link-icon">⛓</span>
                <a className="bm-link-label" href="#">
                  {link.label}
                </a>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="bm-transactions-card">
        <div className="bm-card-head">
          <h3>RECENT TRANSACTIONS</h3>
          <span>✎</span>
        </div>

        <div className="bm-transactions-table">
          <div className="bm-transaction-header">
            <span />
            <span>Transaction</span>
            <span>Price</span>
            <span>Status</span>
            <span>Owner</span>
          </div>
          {snapshot.recentTransactions.map((transaction) => (
            <div className="bm-transaction-row" key={transaction.id}>
              <div className="bm-transaction-home">⌂</div>
              <strong>
                <Link href={`/office/transactions/${transaction.id}`}>{transaction.label}</Link>
              </strong>
              <span>{transaction.amount}</span>
              <span className={`bm-status-pill bm-status-${transaction.stage}`}>{transaction.stage}</span>
              <span>{transaction.owner}</span>
            </div>
          ))}
        </div>
      </section>

      <button className="bm-help-button" type="button">
        <span className="bm-help-icon">?</span>
        NEED HELP?
      </button>
    </div>
  );
}
