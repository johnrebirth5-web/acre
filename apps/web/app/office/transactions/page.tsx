import { listTransactions } from "@acre/backoffice";

const statusFilters = ["All", "Opportunity", "Active", "Pending", "Closed", "Cancelled"];

export default function OfficeTransactionsPage() {
  const transactions = listTransactions();

  return (
    <div className="bm-page">
      <section className="bm-page-toolbar">
        <div className="bm-page-heading">
          <h2>Transactions</h2>
          <p>Track every transaction, important date, owner assignment, and status from one list.</p>
        </div>
        <div className="bm-toolbar-actions">
          <div className="bm-search-shell">
            <span>⌕</span>
            <input aria-label="Search transactions" defaultValue="" placeholder="Search by address, contact, or MLS #" />
          </div>
          <button className="bm-create-button" type="button">
            Create transaction
          </button>
        </div>
      </section>

      <section className="bm-filter-strip">
        {statusFilters.map((filter, index) => (
          <span className={`bm-filter-chip${index === 0 ? " is-active" : ""}`} key={filter}>
            {filter}
          </span>
        ))}
      </section>

      <section className="bm-table-card">
        <header className="bm-table-toolbar">
          <div className="bm-table-count">{transactions.length} transactions</div>
          <div className="bm-table-actions">
            <span>Columns</span>
            <span>Export</span>
          </div>
        </header>

        <div className="bm-office-table">
          <div className="bm-office-table-header bm-office-table-row bm-office-table-row-transactions">
            <span>Transaction</span>
            <span>Important date</span>
            <span>Price</span>
            <span>Owner</span>
            <span>Representing</span>
            <span>Status</span>
          </div>

          {transactions.map((transaction) => (
            <article className="bm-office-table-row bm-office-table-row-transactions" key={transaction.id}>
              <div className="bm-office-table-primary">
                <strong>{transaction.address}</strong>
              </div>
              <span>{transaction.importantDate}</span>
              <span>{transaction.price}</span>
              <span>{transaction.owner}</span>
              <span>{transaction.representing}</span>
              <span>
                <span className={`bm-status-pill bm-status-${transaction.status.toLowerCase()}`}>{transaction.status}</span>
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
