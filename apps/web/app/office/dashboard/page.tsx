import Link from "next/link";
import { getOfficeDashboardBusinessSnapshot } from "@acre/db";
import { Badge, Button, DataTable, DataTableBody, DataTableHeader, DataTableRow, PageHeader, PageShell, SectionCard, StatCard, StatusBadge } from "@acre/ui";
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

function getTransactionStatusTone(stage: string) {
  if (stage === "Closed") {
    return "success" as const;
  }

  if (stage === "Pending") {
    return "warning" as const;
  }

  if (stage === "Cancelled") {
    return "danger" as const;
  }

  if (stage === "Opportunity" || stage === "Active") {
    return "accent" as const;
  }

  return "neutral" as const;
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
    <PageShell className="office-dashboard-page">
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

      <div className="office-dashboard-grid-wide">
        <SectionCard
          className="office-dashboard-goal-card"
          subtitle="Goal tracking, access visibility, and live pipeline pressure for the current office scope."
          title="Goal tracking"
        >
          <div className="bm-goal-main">
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
                  <div className="bm-chart-canvas">
                    <svg aria-hidden="true" className="bm-chart-series" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      <path d={chartPath} />
                    </svg>

                    <div aria-hidden="true" className="bm-chart-points">
                      {snapshot.chart.points.map((point, index) => {
                        const xPercent = snapshot.chart.points.length > 1 ? (index / (snapshot.chart.points.length - 1)) * 100 : 50;
                        const yPercent = (getChartY(point.value, chartHeight, snapshot.chart.maxValue) / chartHeight) * 100;

                        return <span className="bm-chart-point" key={point.label} style={{ left: `${xPercent}%`, top: `${yPercent}%` }} />;
                      })}
                    </div>

                    <div className="bm-chart-months">
                      {snapshot.chart.points.map((point) => (
                        <span key={point.label}>{point.label}</span>
                      ))}
                    </div>
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
        </SectionCard>

        <SectionCard
          className="office-dashboard-transactions-card"
          subtitle="Recently updated deals visible inside the current office scope."
          title="Recent transactions"
        >
          <DataTable className="office-dashboard-transactions-table">
            <DataTableHeader className="office-dashboard-transactions-head">
              <span>Transaction</span>
              <span>Price</span>
              <span>Status</span>
              <span>Owner</span>
            </DataTableHeader>
            <DataTableBody>
              {snapshot.recentTransactions.map((transaction) => (
                <DataTableRow className="office-dashboard-transactions-row" key={transaction.id}>
                  <div className="office-dashboard-transactions-main">
                    <strong>
                      <Link href={`/office/transactions/${transaction.id}`}>{transaction.label}</Link>
                    </strong>
                  </div>
                  <strong className="office-dashboard-transactions-amount">{transaction.amount}</strong>
                  <StatusBadge tone={getTransactionStatusTone(transaction.stage)}>{transaction.stage}</StatusBadge>
                  <span className="office-dashboard-transactions-owner">{transaction.owner}</span>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </SectionCard>
      </div>

      <Button className="office-help-fab" type="button" variant="secondary">
        <span className="bm-help-icon">?</span>
        NEED HELP?
      </Button>
    </PageShell>
  );
}
