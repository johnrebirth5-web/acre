import { getOfficeDashboardSnapshot } from "@acre/backoffice";

export default function OfficeDashboardPage() {
  const snapshot = getOfficeDashboardSnapshot();

  return (
    <div className="bm-dashboard">
      <section className="bm-goal-card">
        <div className="bm-goal-main">
          <div className="bm-card-head">
            <h2>GOAL TRACKING</h2>
            <span>✎</span>
          </div>
          <div className="bm-goal-chart">
            <div className="bm-chart-grid">
              <div className="bm-chart-axis">
                {["$10,000", "$9k", "$8k", "$7k", "$6k", "$5k", "$4k", "$3k", "$2k", "$1k", "$0"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="bm-chart-line-shell">
                <div className="bm-chart-line" />
                <div className="bm-chart-dots">
                  <span />
                  <span />
                </div>
                <div className="bm-chart-months">
                  {["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027"].map(
                    (month) => (
                      <span key={month}>{month}</span>
                    )
                  )}
                </div>
              </div>
            </div>

            <aside className="bm-goal-side">
              <div className="bm-goal-ring">
                <div className="bm-goal-ring-inner">
                  <strong>{snapshot.goal.progressPercent}%</strong>
                  <span>{snapshot.goal.currentValue}</span>
                </div>
              </div>
              <div className="bm-goal-foot">
                <span>GOAL:</span>
                <strong>{snapshot.goal.target}</strong>
              </div>
              <div className="bm-time-left">
                <span>Time left:</span>
                <strong>{snapshot.goal.timeLeft}</strong>
              </div>
              <div className="bm-time-bar">
                <div className="bm-time-bar-fill" />
              </div>
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
            {snapshot.weeklyUpdates.map((update) => (
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
            {snapshot.usefulLinks.map((link) => (
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
            {snapshot.trainingLinks.map((link) => (
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
              <strong>{transaction.label}</strong>
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
