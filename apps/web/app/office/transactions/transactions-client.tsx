"use client";

import { useEffect, useState } from "react";
import type { TransactionRecord } from "@acre/backoffice";

type TransactionsClientProps = {
  transactions: TransactionRecord[];
};

type InlineSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const topTypeOptions = ["Sales", "Sales (listing)", "Rental/Leasing", "Rental (listing)", "Commercial Sales", "Other", "Commercial Lease"];
const topStatusOptions = ["Opportunity", "Active", "Pending"];
const topRepresentingOptions = ["Buyer", "Seller", "Both"];

const topFields = [
  { label: "Address" },
  { label: "City" },
  { label: "State", className: "is-compact" },
  { label: "Zip", className: "is-compact" },
  { label: "Transaction name", className: "is-span-4" },
  { label: "Price" },
  { label: "Buyer agreement date" },
  { label: "Buyer expiration date" },
  { label: "Acceptance date" },
  { label: "Listing date" },
  { label: "Listing expiration date" },
  { label: "Closing date" }
];

const additionalFields = [
  { label: "Agent Name", type: "input" },
  { label: "Team Leader", type: "select", options: ["Simon Park", "Naomi Chen", "Alice Tang"] },
  { label: "Licensed Agent Name", type: "input" },
  { label: "Invoice Number", type: "input" },
  { label: "Buyer/Tenant", type: "input" },
  { label: "Building Name", type: "input" },
  { label: "Address", type: "input" },
  { label: `Unit # (If it's a house, fill out "house")`, type: "input" },
  { label: "Layout", type: "input" },
  { label: "City", type: "input" },
  { label: "State", type: "input" },
  { label: "Zip Code", type: "input" },
  { label: "Move-In Date/Closing Date", type: "input" },
  { label: "Commission Type", type: "select", options: ["Gross", "Net", "Custom"] },
  { label: "Leasing Contact", type: "input" },
  { label: "Invoice Bill To", type: "input" },
  { label: "Currency Type", type: "select", options: ["USD", "CNY"] },
  { label: "Commission($)", type: "input" },
  { label: "Your Commission Rate", type: "input" },
  { label: "Rebate", type: "input" },
  { label: "Reimbursement", type: "input" },
  { label: "Co-Agent Legal Name", type: "input" },
  { label: "Commission Breakdown", type: "input" },
  { label: "Company Referral", type: "select", options: ["Yes", "No"] },
  { label: "Outside Referral", type: "select", options: ["Yes", "No"] },
  { label: "Referral Fee", type: "input" },
  { label: "External Partners", type: "input" },
  { label: "Company Referral Employee's Name", type: "input" },
  { label: "Client's Email", type: "input" },
  { label: "Upload Invoice to VendorCafe", type: "select", options: ["Yes", "No"] },
  { label: "Note(Rebate, Referral, Others)", type: "input" },
  { label: "Status of Commission Received(For Admin)", type: "select", options: ["No", "Yes", "Partial"] },
  {
    label: "Commission Confirmation(For Agent, we'll process the payment once you select yes)",
    type: "select",
    options: ["Yes", "No"]
  }
] as const;

function InlineSelect({ label, value, onChange, options }: InlineSelectProps) {
  return (
    <label className="bm-modal-inline-select">
      <span>{label}:</span>
      <select className={value ? "" : "is-empty"} onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [representing, setRepresenting] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  return (
    <>
      <div className="bm-transactions-page">
        <section className="bm-transactions-toolbar">
          <div className="bm-transactions-summary">
            <h2>
              <strong>127</strong> TRANSACTIONS <span>?</span>
            </h2>
            <p>$ 0 MY NET INCOME</p>
          </div>

          <div className="bm-transactions-actions">
            <div className="bm-transactions-search">
              <input aria-label="Search transactions" placeholder="Search address, contact, mls # ..." />
            </div>

            <button className="bm-create-button bm-transactions-create" onClick={() => setIsModalOpen(true)} type="button">
              Create transaction
            </button>
          </div>
        </section>

        <section className="bm-transactions-list-shell">
          <div className="bm-transactions-list-head">
            <div className="bm-transactions-current-view">
              <span>current view:</span>
              <button type="button">
                Active <i>▾</i>
              </button>
            </div>

            <div className="bm-transactions-columns">
              <span />
              <span />
              <button type="button">Price</button>
              <button type="button">Owner</button>
              <button type="button">Representing</button>
              <button type="button">
                Status <i>↑</i>
              </button>
              <button type="button">Important date</button>
            </div>
          </div>

          <div className="bm-transactions-rows">
            {transactions.map((transaction) => (
              <article className="bm-transactions-row" key={transaction.id}>
                <span className={`bm-transaction-home-icon${transaction.isFlagged ? " is-flagged" : ""}`}>⌂</span>
                <strong className={transaction.isFlagged ? "is-flagged" : ""}>{transaction.address}</strong>
                <span>{transaction.price}</span>
                <span>{transaction.owner}</span>
                <span>{transaction.representing}</span>
                <span className={`bm-transaction-status bm-transaction-status-${transaction.status.toLowerCase()}`}>{transaction.status.toLowerCase()}</span>
                <span>{transaction.importantDate}</span>
              </article>
            ))}
          </div>

          <footer className="bm-transactions-footer">
            <span>1-25 of 127</span>
            <div className="bm-transactions-pager">
              <button type="button">«</button>
              <button type="button">»</button>
            </div>
          </footer>
        </section>
      </div>

      {isModalOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="bm-transaction-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>NEW TRANSACTION</h3>
              <button aria-label="Close create transaction modal" onClick={() => setIsModalOpen(false)} type="button">
                ×
              </button>
            </header>

            <div className="bm-transaction-modal-body">
              <div className="bm-transaction-modal-top-selects">
                <InlineSelect label="Type" onChange={setTransactionType} options={topTypeOptions} value={transactionType} />
                <InlineSelect label="Status" onChange={setTransactionStatus} options={topStatusOptions} value={transactionStatus} />
                <InlineSelect label="Representing" onChange={setRepresenting} options={topRepresentingOptions} value={representing} />
              </div>

              <div className="bm-transaction-modal-grid bm-transaction-modal-grid-primary">
                {topFields.map((field) => (
                  <label className={`bm-transaction-modal-field ${field.className ?? ""}`.trim()} key={field.label}>
                    <span>{field.label}</span>
                    <input type="text" />
                  </label>
                ))}
              </div>

              <section className="bm-transaction-modal-additional">
                <header className="bm-transaction-modal-section-header">
                  <button type="button">Additional fields</button>
                  <span>configure</span>
                </header>

                <div className="bm-transaction-modal-grid bm-transaction-modal-grid-additional">
                  {additionalFields.map((field) => (
                    <label className="bm-transaction-modal-field" key={field.label}>
                      <span>{field.label}</span>
                      {field.type === "select" ? (
                        <select defaultValue="">
                          <option value="">Select...</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <footer className="bm-transaction-modal-footer">
              <span>step 1 of 4</span>
              <button className="bm-transaction-next" type="button">
                Next →
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
