import { getPipelineBuckets } from "@acre/backoffice";

export default function OfficePipelinePage() {
  const buckets = getPipelineBuckets();

  return (
    <div className="bm-page">
      <section className="bm-page-toolbar">
        <div className="bm-page-heading">
          <h2>Pipeline</h2>
          <p>High-level opportunity, active, pending, closed, and cancelled transaction volume.</p>
        </div>
        <div className="bm-toolbar-actions">
          <span className="bm-view-toggle is-active">Volume</span>
          <span className="bm-view-toggle">Closing date</span>
        </div>
      </section>

      <section className="bm-pipeline-board">
        {buckets.map((bucket) => (
          <article className="bm-pipeline-column" key={bucket.status}>
            <header className="bm-pipeline-header">
              <h3>{bucket.status}</h3>
              <strong>{bucket.count}</strong>
            </header>
            <p className="bm-pipeline-volume">{bucket.volumeLabel}</p>

            <div className="bm-pipeline-list">
              {bucket.transactions.length > 0 ? (
                bucket.transactions.map((transaction) => (
                  <div className="bm-pipeline-item" key={transaction.id}>
                    <strong>{transaction.address}</strong>
                    <span>{transaction.price}</span>
                    <p>
                      {transaction.owner} · {transaction.representing}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bm-pipeline-empty">No transactions in this stage.</div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
