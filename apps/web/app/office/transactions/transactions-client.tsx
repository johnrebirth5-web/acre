"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  Button,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  FilterBar,
  FilterField,
  PageHeader,
  PageShell,
  SectionCard,
  SelectInput,
  TextInput
} from "@acre/ui";
import type { OfficeTransactionRecord, OfficeTransactionStatus, OfficeTransactionSummary } from "@acre/db";

type TransactionsClientProps = {
  transactions: OfficeTransactionRecord[];
  summary: OfficeTransactionSummary;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: {
    q: string;
    status: OfficeTransactionStatus | "All";
  };
};

type InlineSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

type ModalField = {
  label: string;
  name: string;
  type?: "text" | "date" | "email";
  className?: string;
};

type AdditionalField = {
  label: string;
  name: string;
  type: "input" | "select";
  inputType?: "text" | "email";
  options?: string[];
};

const topTypeOptions = ["Sales", "Sales (listing)", "Rental/Leasing", "Rental (listing)", "Commercial Sales", "Other", "Commercial Lease"];
const topStatusOptions = ["Opportunity", "Active", "Pending", "Closed", "Cancelled"];
const topRepresentingOptions = ["Buyer", "Seller", "Both"];
const listStatusOptions = ["All", "Opportunity", "Active", "Pending", "Closed", "Cancelled"] as const;
const pageSizeOptions = [10, 20, 50, 100] as const;

const primaryFields: ModalField[] = [
  { label: "Address", name: "address" },
  { label: "City", name: "city" },
  { label: "State", name: "state", className: "is-compact" },
  { label: "Zip", name: "zipCode", className: "is-compact" },
  { label: "Transaction name", name: "transactionName", className: "is-span-4" },
  { label: "Price", name: "price" },
  { label: "Buyer agreement date", name: "buyerAgreementDate", type: "date" },
  { label: "Buyer expiration date", name: "buyerExpirationDate", type: "date" },
  { label: "Acceptance date", name: "acceptanceDate", type: "date" },
  { label: "Listing date", name: "listingDate", type: "date" },
  { label: "Listing expiration date", name: "listingExpirationDate", type: "date" },
  { label: "Closing date", name: "closingDate", type: "date" }
];

const additionalFields: AdditionalField[] = [
  { label: "Agent Name", name: "agentName", type: "input" },
  { label: "Team Leader", name: "teamLeader", type: "select", options: ["Simon Park", "Naomi Chen", "Alice Tang"] },
  { label: "Licensed Agent Name", name: "licensedAgentName", type: "input" },
  { label: "Invoice Number", name: "invoiceNumber", type: "input" },
  { label: "Buyer/Tenant", name: "buyerTenant", type: "input" },
  { label: "Building Name", name: "buildingName", type: "input" },
  { label: "Address", name: "additionalAddress", type: "input" },
  { label: `Unit # (If it's a house, fill out "house")`, name: "unitNumber", type: "input" },
  { label: "Layout", name: "layout", type: "input" },
  { label: "City", name: "additionalCity", type: "input" },
  { label: "State", name: "additionalState", type: "input" },
  { label: "Zip Code", name: "additionalZipCode", type: "input" },
  { label: "Move-In Date/Closing Date", name: "moveInDateClosingDate", type: "input" },
  { label: "Commission Type", name: "commissionType", type: "select", options: ["Gross", "Net", "Custom"] },
  { label: "Leasing Contact", name: "leasingContact", type: "input" },
  { label: "Invoice Bill To", name: "invoiceBillTo", type: "input" },
  { label: "Currency Type", name: "currencyType", type: "select", options: ["USD", "CNY"] },
  { label: "Commission($)", name: "commissionAmount", type: "input" },
  { label: "Your Commission Rate", name: "yourCommissionRate", type: "input" },
  { label: "Rebate", name: "rebate", type: "input" },
  { label: "Reimbursement", name: "reimbursement", type: "input" },
  { label: "Co-Agent Legal Name", name: "coAgentLegalName", type: "input" },
  { label: "Commission Breakdown", name: "commissionBreakdown", type: "input" },
  { label: "Company Referral", name: "companyReferral", type: "select", options: ["Yes", "No"] },
  { label: "Outside Referral", name: "outsideReferral", type: "select", options: ["Yes", "No"] },
  { label: "Referral Fee", name: "referralFee", type: "input" },
  { label: "External Partners", name: "externalPartners", type: "input" },
  { label: "Company Referral Employee's Name", name: "companyReferralEmployeeName", type: "input" },
  { label: "Client's Email", name: "clientEmail", type: "input", inputType: "email" },
  { label: "Upload Invoice to VendorCafe", name: "uploadInvoiceToVendorCafe", type: "select", options: ["Yes", "No"] },
  { label: "Note(Rebate, Referral, Others)", name: "note", type: "input" },
  { label: "Status of Commission Received(For Admin)", name: "commissionReceivedStatus", type: "select", options: ["No", "Yes", "Partial"] },
  { label: "Commission Confirmation(For Agent, we'll process the payment once you select yes)", name: "commissionConfirmation", type: "select", options: ["Yes", "No"] }
];

function InlineSelect({ label, name, value, onChange, options }: InlineSelectProps) {
  return (
    <label className="bm-modal-inline-select">
      <span>{label}:</span>
      <select className={value ? "" : "is-empty"} name={name} onChange={(event) => onChange(event.target.value)} value={value}>
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

function normalizeStatusFilter(value: string): (typeof listStatusOptions)[number] {
  return listStatusOptions.includes(value as (typeof listStatusOptions)[number]) ? (value as (typeof listStatusOptions)[number]) : "All";
}

function buildTransactionsHref(
  pathname: string,
  params: {
    q: string;
    status: string;
    page: number;
    pageSize: number;
  }
) {
  const searchParams = new URLSearchParams();

  if (params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.status && params.status !== "All") {
    searchParams.set("status", params.status);
  }

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize !== 20) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function TransactionsClient({ transactions, summary, totalCount, totalPages, page, pageSize, filters }: TransactionsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [representing, setRepresenting] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof listStatusOptions)[number]>(normalizeStatusFilter(filters.status));
  const [searchQuery, setSearchQuery] = useState(filters.q);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formVersion, setFormVersion] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    setSearchQuery(filters.q);
  }, [filters.q]);

  useEffect(() => {
    setStatusFilter(normalizeStatusFilter(filters.status));
  }, [filters.status]);

  useEffect(() => {
    if (searchQuery === filters.q) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push(
        buildTransactionsHref(pathname, {
          q: searchQuery,
          status: statusFilter,
          page: 1,
          pageSize
        })
      );
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters.q, pageSize, pathname, router, searchQuery, statusFilter]);

  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  function handleStatusFilterChange(nextStatus: (typeof listStatusOptions)[number]) {
    setStatusFilter(nextStatus);
    router.push(
      buildTransactionsHref(pathname, {
        q: searchQuery,
        status: nextStatus,
        page: 1,
        pageSize
      })
    );
  }

  function handlePageSizeChange(nextPageSize: number) {
    router.push(
      buildTransactionsHref(pathname, {
        q: searchQuery,
        status: statusFilter,
        page: 1,
        pageSize: nextPageSize
      })
    );
  }

  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/office/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create transaction.");
      }

      setIsModalOpen(false);
      setFormVersion((current) => current + 1);
      setTransactionType("");
      setTransactionStatus("");
      setRepresenting("");
      router.push(
        buildTransactionsHref(pathname, {
          q: searchQuery,
          status: statusFilter,
          page: 1,
          pageSize
        })
      );
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageShell className="bm-transactions-page office-list-page">
        <PageHeader
          actions={
            <div className="office-page-actions office-transactions-page-actions">
              <div className="office-transactions-summary-chip">
                <strong>{summary.totalCount}</strong>
                <span>Transactions</span>
              </div>
              <div className="office-transactions-summary-chip office-transactions-summary-chip-accent">
                <strong>{summary.totalNetIncome}</strong>
                <span>My net income</span>
              </div>
              <Button className="bm-transactions-create" onClick={() => setIsModalOpen(true)} type="button">
                Create transaction
              </Button>
            </div>
          }
          description="Operational transaction list with server-backed search, status filtering, and pagination."
          eyebrow="Transactions"
          title="Transactions"
        />

        <SectionCard className="office-list-card" subtitle="Search, filter, and review the current office transaction set." title="Transaction list">
          <FilterBar as="form" className="bm-transactions-toolbar" onSubmit={(event) => event.preventDefault()}>
            <FilterField className="bm-transactions-search" label="Search">
              <TextInput
                aria-label="Search transactions"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search address, contact, mls # ..."
                value={searchQuery}
              />
            </FilterField>

            <FilterField label="Current view">
              <SelectInput
                aria-label="Filter transactions by status"
                onChange={(event) => handleStatusFilterChange(event.target.value as (typeof listStatusOptions)[number])}
                value={statusFilter}
              >
                {listStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectInput>
            </FilterField>
          </FilterBar>

          <DataTable className="bm-transactions-list-shell">
            <DataTableHeader className="bm-transactions-columns">
              <span />
              <span>Transaction</span>
              <span>Price</span>
              <span>Owner</span>
              <span>Representing</span>
              <span>Status</span>
              <span>Important date</span>
            </DataTableHeader>

            <DataTableBody className="bm-transactions-rows">
              {transactions.map((transaction) => (
                <DataTableRow className="bm-transactions-row" key={transaction.id}>
                  <span className={`bm-transaction-home-icon${transaction.isFlagged ? " is-flagged" : ""}`}>⌂</span>
                  <strong className={transaction.isFlagged ? "is-flagged" : ""}>
                    <Link href={`/office/transactions/${transaction.id}`}>{transaction.address}</Link>
                  </strong>
                  <span>{transaction.price}</span>
                  <span>{transaction.owner}</span>
                  <span>{transaction.representing}</span>
                  <span className={`bm-transaction-status bm-transaction-status-${transaction.status.toLowerCase()}`}>{transaction.status.toLowerCase()}</span>
                  <span>{transaction.importantDate || "—"}</span>
                </DataTableRow>
              ))}

              {transactions.length === 0 ? (
                <EmptyState
                  description="Try widening the search or switching the current view."
                  title="No transactions matched the current filters"
                />
              ) : null}
            </DataTableBody>
          </DataTable>

          <footer className="bm-transactions-footer">
            <span>
              {pageStart}-{pageEnd} of {totalCount}
            </span>
            <div className="bm-transactions-footer-controls">
              <label className="bm-transactions-page-size">
                <span>Rows</span>
                <SelectInput onChange={(event) => handlePageSizeChange(Number(event.target.value))} value={String(pageSize)}>
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </label>

              <div className="bm-transactions-pager">
                {page > 1 ? (
                  <Link
                    className="bm-transactions-page-button"
                    href={buildTransactionsHref(pathname, {
                      q: filters.q,
                      status: filters.status,
                      page: page - 1,
                      pageSize
                    })}
                  >
                    «
                  </Link>
                ) : (
                  <span className="bm-transactions-page-button is-disabled">«</span>
                )}

                <span className="bm-transactions-page-indicator">
                  Page {page} / {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    className="bm-transactions-page-button"
                    href={buildTransactionsHref(pathname, {
                      q: filters.q,
                      status: filters.status,
                      page: page + 1,
                      pageSize
                    })}
                  >
                    »
                  </Link>
                ) : (
                  <span className="bm-transactions-page-button is-disabled">»</span>
                )}
              </div>
            </div>
          </footer>
        </SectionCard>
      </PageShell>

      {isModalOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="bm-transaction-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>NEW TRANSACTION</h3>
              <button aria-label="Close create transaction modal" onClick={() => setIsModalOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body" key={formVersion} onSubmit={handleCreateTransaction}>
              <div className="bm-transaction-modal-top-selects">
                <InlineSelect label="Type" name="transactionType" onChange={setTransactionType} options={topTypeOptions} value={transactionType} />
                <InlineSelect label="Status" name="transactionStatus" onChange={setTransactionStatus} options={topStatusOptions} value={transactionStatus} />
                <InlineSelect label="Representing" name="representing" onChange={setRepresenting} options={topRepresentingOptions} value={representing} />
              </div>

              <div className="bm-transaction-modal-grid bm-transaction-modal-grid-primary">
                {primaryFields.map((field) => (
                  <label className={`bm-transaction-modal-field ${field.className ?? ""}`.trim()} key={field.name}>
                    <span>{field.label}</span>
                    <input name={field.name} type={field.type ?? "text"} />
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
                    <label className="bm-transaction-modal-field" key={field.name}>
                      <span>{field.label}</span>
                      {field.type === "select" ? (
                        <select defaultValue="" name={field.name}>
                          <option value="">Select...</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input name={field.name} type={field.inputType ?? "text"} />
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <footer className="bm-transaction-modal-footer">
                <span>step 1 of 4</span>
                <div className="bm-transaction-modal-actions">
                  {submitError ? <p className="bm-transaction-submit-error">{submitError}</p> : null}
                  <button className="bm-transaction-next" disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Saving..." : "Next →"}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
