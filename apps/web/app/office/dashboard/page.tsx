import Link from "next/link";
import { getOfficeDashboardBusinessSnapshot } from "@acre/db";
import { Badge, PageHeader, PageShell, StatCard } from "@acre/ui";
import { getSessionAccess, requireOfficeSession } from "../../../lib/auth-session";

const chartTopInset = 8;
const chartBottomInset = 8;

function getChartY(value: number, height: number, maxValue: number) {
  const drawableHeight = height - chartTopInset - chartBottomInset;

  if (drawableHeight <= 0) {
    return height / 2;
  }

  if (maxValue === 0) {
    return height - chartBottomInset;
  }

  return chartTopInset + drawableHeight - (value / maxValue) * drawableHeight;
}

function buildChartPath(values: number[], width: number, height: number, maxValue: number) {
  if (values.length === 0) {
    return "";
  }

  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = getChartY(value, height, maxValue);

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
    <PageShell className="bm-dashboard office-dashboard-page">
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="accent">{access.label}</Badge>
          </>
        }
        description="Goal tracking, current back-office pressure, and recent transactions inside one operational dashboard."
        eyebrow="Dashboard"
        title="Office dashboard"
      />

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
                <StatCard
                  className="bm-dashboard-status-chip"
                  hint="transactions"
                  key={metric.status}
                  label={metric.status}
                  value={metric.count}
                />
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
                    const y = getChartY(point.value, chartHeight, snapshot.chart.maxValue);

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
    </PageShell>
  );
}
