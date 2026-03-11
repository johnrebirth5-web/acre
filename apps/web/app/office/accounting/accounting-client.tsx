"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { OfficeAccountingSnapshot } from "@acre/db";

type OfficeAccountingClientProps = {
  snapshot: OfficeAccountingSnapshot;
  officeLabel: string;
  canManageAccounting: boolean;
};

type AccountingTypeOption = {
  value: string;
  label: string;
  supportsLineItems: boolean;
  manualEntrySides: boolean;
};

type PaymentMethodOption = {
  value: string;
  label: string;
};

type AccountingLineItemFormState = {
  id?: string;
  ledgerAccountId: string;
  description: string;
  amount: string;
  entrySide: string;
};

type AccountingEntryFormState = {
  type: string;
  status: string;
  accountingDate: string;
  dueDate: string;
  paymentMethod: string;
  referenceNumber: string;
  counterpartyName: string;
  memo: string;
  notes: string;
  totalAmount: string;
  relatedTransactionId: string;
  relatedMembershipId: string;
  lineItems: AccountingLineItemFormState[];
};

type EarnestMoneyFormState = {
  transactionId: string;
  expectedAmount: string;
  dueAt: string;
  receivedAmount: string;
  refundedAmount: string;
  paymentDate: string;
  depositDate: string;
  heldByOffice: boolean;
  heldExternally: boolean;
  trackInLedger: boolean;
  notes: string;
};

const accountingTypeOptions: AccountingTypeOption[] = [
  { value: "invoice", label: "Invoice", supportsLineItems: true, manualEntrySides: false },
  { value: "bill", label: "Bill", supportsLineItems: true, manualEntrySides: false },
  { value: "credit_memo", label: "Credit memo", supportsLineItems: true, manualEntrySides: true },
  { value: "deposit", label: "Deposit", supportsLineItems: true, manualEntrySides: false },
  { value: "received_payment", label: "Received payment", supportsLineItems: false, manualEntrySides: false },
  { value: "made_payment", label: "Made payment", supportsLineItems: false, manualEntrySides: false },
  { value: "journal_entry", label: "Journal entry", supportsLineItems: true, manualEntrySides: true },
  { value: "transfer", label: "Transfer", supportsLineItems: true, manualEntrySides: true },
  { value: "refund", label: "Refund", supportsLineItems: true, manualEntrySides: false }
];

const accountingStatusOptions = [
  { value: "", label: "Default status" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "posted", label: "Posted" },
  { value: "completed", label: "Completed" },
  { value: "void", label: "Void" }
];

const paymentMethodOptions: PaymentMethodOption[] = [
  { value: "", label: "Select method" },
  { value: "ach", label: "ACH" },
  { value: "check", label: "Check" },
  { value: "wire", label: "Wire" },
  { value: "cash", label: "Cash" },
  { value: "internal_transfer", label: "Internal transfer" },
  { value: "other", label: "Other" }
];

const accountingFilterTypeOptions = [
  { value: "", label: "All types" },
  ...accountingTypeOptions.map((option) => ({ value: option.value, label: option.label }))
];

const accountingFilterStatusOptions = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "posted", label: "Posted" },
  { value: "completed", label: "Completed" },
  { value: "void", label: "Void" }
];

function createEmptyLineItem(): AccountingLineItemFormState {
  return {
    ledgerAccountId: "",
    description: "",
    amount: "",
    entrySide: "debit"
  };
}

function buildAccountingHref(
  pathname: string,
  params: {
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    ownerMembershipId: string;
    q: string;
    entryId: string;
  }
) {
  const searchParams = new URLSearchParams();

  if (params.type.trim()) {
    searchParams.set("type", params.type.trim());
  }

  if (params.status.trim()) {
    searchParams.set("status", params.status.trim());
  }

  if (params.startDate.trim()) {
    searchParams.set("startDate", params.startDate.trim());
  }

  if (params.endDate.trim()) {
    searchParams.set("endDate", params.endDate.trim());
  }

  if (params.ownerMembershipId.trim()) {
    searchParams.set("ownerMembershipId", params.ownerMembershipId.trim());
  }

  if (params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.entryId.trim()) {
    searchParams.set("entryId", params.entryId.trim());
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getAccountingTypeConfig(type: string) {
  return accountingTypeOptions.find((option) => option.value === type) ?? accountingTypeOptions[0];
}

function buildEmptyEntryState(): AccountingEntryFormState {
  return {
    type: "invoice",
    status: "",
    accountingDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    paymentMethod: "",
    referenceNumber: "",
    counterpartyName: "",
    memo: "",
    notes: "",
    totalAmount: "",
    relatedTransactionId: "",
    relatedMembershipId: "",
    lineItems: [createEmptyLineItem()]
  };
}

function buildEntryStateFromSelectedEntry(snapshot: OfficeAccountingSnapshot): AccountingEntryFormState {
  const selectedEntry = snapshot.selectedTransaction;

  if (!selectedEntry) {
    return buildEmptyEntryState();
  }

  return {
    type: selectedEntry.type,
    status: selectedEntry.status,
    accountingDate: selectedEntry.accountingDate,
    dueDate: selectedEntry.dueDate,
    paymentMethod: selectedEntry.paymentMethod,
    referenceNumber: selectedEntry.referenceNumber,
    counterpartyName: selectedEntry.counterpartyName,
    memo: selectedEntry.memo,
    notes: selectedEntry.notes,
    totalAmount: selectedEntry.totalAmount,
    relatedTransactionId: selectedEntry.relatedTransactionId,
    relatedMembershipId: selectedEntry.relatedMembershipId,
    lineItems: selectedEntry.lineItems.length
      ? selectedEntry.lineItems.map((lineItem) => ({
          id: lineItem.id,
          ledgerAccountId: lineItem.ledgerAccountId,
          description: lineItem.description,
          amount: lineItem.amount,
          entrySide: lineItem.entrySide.toLowerCase()
        }))
      : [createEmptyLineItem()]
  };
}

function buildEarnestMoneyState(record?: OfficeAccountingSnapshot["earnestMoneyRecords"][number] | null): EarnestMoneyFormState {
  if (!record) {
    return {
      transactionId: "",
      expectedAmount: "",
      dueAt: "",
      receivedAmount: "",
      refundedAmount: "",
      paymentDate: "",
      depositDate: "",
      heldByOffice: true,
      heldExternally: false,
      trackInLedger: true,
      notes: ""
    };
  }

  return {
    transactionId: record.transactionId,
    expectedAmount: record.expectedAmount.replace(/[^\d.-]/g, ""),
    dueAt: record.dueAt,
    receivedAmount: record.receivedAmount.replace(/[^\d.-]/g, ""),
    refundedAmount: record.refundedAmount.replace(/[^\d.-]/g, ""),
    paymentDate: record.paymentDate,
    depositDate: record.depositDate,
    heldByOffice: record.heldByOffice,
    heldExternally: record.heldExternally,
    trackInLedger: record.trackInLedger,
    notes: record.notes
  };
}

export function OfficeAccountingClient({ snapshot, officeLabel, canManageAccounting }: OfficeAccountingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateEntryOpen, setIsCreateEntryOpen] = useState(false);
  const [isEarnestMoneyOpen, setIsEarnestMoneyOpen] = useState(false);
  const [editingEarnestMoneyId, setEditingEarnestMoneyId] = useState("");
  const [entryFormState, setEntryFormState] = useState<AccountingEntryFormState>(() => buildEntryStateFromSelectedEntry(snapshot));
  const [earnestMoneyFormState, setEarnestMoneyFormState] = useState<EarnestMoneyFormState>(() => buildEarnestMoneyState(null));
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isSavingEarnestMoney, setIsSavingEarnestMoney] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [earnestMoneyError, setEarnestMoneyError] = useState("");
  const [filterState, setFilterState] = useState({
    type: snapshot.filters.type,
    status: snapshot.filters.status,
    startDate: snapshot.filters.startDate,
    endDate: snapshot.filters.endDate,
    ownerMembershipId: snapshot.filters.ownerMembershipId,
    q: snapshot.filters.q
  });

  useEffect(() => {
    setFilterState({
      type: snapshot.filters.type,
      status: snapshot.filters.status,
      startDate: snapshot.filters.startDate,
      endDate: snapshot.filters.endDate,
      ownerMembershipId: snapshot.filters.ownerMembershipId,
      q: snapshot.filters.q
    });
  }, [
    snapshot.filters.endDate,
    snapshot.filters.ownerMembershipId,
    snapshot.filters.q,
    snapshot.filters.startDate,
    snapshot.filters.status,
    snapshot.filters.type
  ]);

  useEffect(() => {
    setEntryFormState(buildEntryStateFromSelectedEntry(snapshot));
  }, [snapshot.selectedTransaction]);

  const selectedEntryConfig = getAccountingTypeConfig(entryFormState.type);
  const entryModalConfig = getAccountingTypeConfig(entryFormState.type);

  function navigateWithFilters(overrides: Partial<typeof filterState> & { entryId?: string }) {
    router.push(
      buildAccountingHref(pathname, {
        type: overrides.type ?? filterState.type,
        status: overrides.status ?? filterState.status,
        startDate: overrides.startDate ?? filterState.startDate,
        endDate: overrides.endDate ?? filterState.endDate,
        ownerMembershipId: overrides.ownerMembershipId ?? filterState.ownerMembershipId,
        q: overrides.q ?? filterState.q,
        entryId: overrides.entryId ?? snapshot.filters.entryId
      })
    );
  }

  function resetFilters() {
    setFilterState({
      type: "",
      status: "",
      startDate: "",
      endDate: "",
      ownerMembershipId: "",
      q: ""
    });
    router.push(pathname);
  }

  function updateEntryField<K extends keyof AccountingEntryFormState>(key: K, value: AccountingEntryFormState[K]) {
    setEntryFormState((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateLineItem(index: number, key: keyof AccountingLineItemFormState, value: string) {
    setEntryFormState((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem, lineItemIndex) =>
        lineItemIndex === index
          ? {
              ...lineItem,
              [key]: value
            }
          : lineItem
      )
    }));
  }

  function addLineItem() {
    setEntryFormState((current) => ({
      ...current,
      lineItems: [...current.lineItems, createEmptyLineItem()]
    }));
  }

  function removeLineItem(index: number) {
    setEntryFormState((current) => ({
      ...current,
      lineItems: current.lineItems.length === 1 ? [createEmptyLineItem()] : current.lineItems.filter((_, lineItemIndex) => lineItemIndex !== index)
    }));
  }

  function openCreateEntryModal() {
    setEntryError("");
    setEntryFormState(buildEmptyEntryState());
    setIsCreateEntryOpen(true);
  }

  function openEarnestMoneyModal(record?: OfficeAccountingSnapshot["earnestMoneyRecords"][number]) {
    setEarnestMoneyError("");
    setEditingEarnestMoneyId(record?.id ?? "");
    setEarnestMoneyFormState(buildEarnestMoneyState(record ?? null));
    setIsEarnestMoneyOpen(true);
  }

  async function handleCreateEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingEntry(true);
    setEntryError("");

    try {
      const response = await fetch("/api/office/accounting/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entryFormState)
      });

      const body = (await response.json().catch(() => null)) as { error?: string; transaction?: { id: string } } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to create accounting transaction.");
      }

      setIsCreateEntryOpen(false);
      router.push(
        buildAccountingHref(pathname, {
          ...filterState,
          entryId: body?.transaction?.id ?? ""
        })
      );
      router.refresh();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "Failed to create accounting transaction.");
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function handleSaveSelectedEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot.selectedTransaction) {
      return;
    }

    setIsSavingEntry(true);
    setEntryError("");

    try {
      const response = await fetch(`/api/office/accounting/transactions/${snapshot.selectedTransaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(entryFormState)
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to update accounting transaction.");
      }

      router.refresh();
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "Failed to update accounting transaction.");
    } finally {
      setIsSavingEntry(false);
    }
  }

  async function handleSaveEarnestMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingEarnestMoney(true);
    setEarnestMoneyError("");

    try {
      const endpoint = editingEarnestMoneyId
        ? `/api/office/accounting/earnest-money/${editingEarnestMoneyId}`
        : "/api/office/accounting/earnest-money";
      const method = editingEarnestMoneyId ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(earnestMoneyFormState)
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Failed to save earnest money.");
      }

      setIsEarnestMoneyOpen(false);
      setEditingEarnestMoneyId("");
      router.refresh();
    } catch (error) {
      setEarnestMoneyError(error instanceof Error ? error.message : "Failed to save earnest money.");
    } finally {
      setIsSavingEarnestMoney(false);
    }
  }

  return (
    <>
      <section className="office-kpi-grid">
        <article className="office-kpi-card office-kpi-card-accent">
          <span>Total invoices</span>
          <strong>{snapshot.overview.totalInvoices}</strong>
          <p>Invoices currently in the filtered accounting window.</p>
        </article>
        <article className="office-kpi-card">
          <span>Open bills</span>
          <strong>{snapshot.overview.openBills}</strong>
          <p>Outstanding bills still open for payment.</p>
        </article>
        <article className="office-kpi-card">
          <span>Received payments</span>
          <strong>{snapshot.overview.receivedPaymentsLabel}</strong>
          <p>Cash-in recorded inside the current result set.</p>
        </article>
        <article className="office-kpi-card">
          <span>Made payments</span>
          <strong>{snapshot.overview.madePaymentsLabel}</strong>
          <p>Cash-out recorded inside the current result set.</p>
        </article>
        <article className="office-kpi-card">
          <span>Office net ledger impact</span>
          <strong>{snapshot.overview.officeNetLedgerImpactLabel}</strong>
          <p>Income/expense effect derived from ledger entries.</p>
        </article>
        <article className="office-kpi-card">
          <span>Outstanding EMD</span>
          <strong>{snapshot.overview.outstandingEmdCount}</strong>
          <p>Earnest money records not yet complete.</p>
        </article>
        <article className="office-kpi-card">
          <span>Overdue EMD</span>
          <strong>{snapshot.overview.overdueEmdCount}</strong>
          <p>Earnest money items already past due.</p>
        </article>
        <article className="office-kpi-card">
          <span>Scope</span>
          <strong>{officeLabel}</strong>
          <p>Shared org-level accounts remain visible when office scope allows it.</p>
        </article>
      </section>

      <form
        className="office-report-filters"
        onSubmit={(event) => {
          event.preventDefault();
          navigateWithFilters({ ...filterState, entryId: "" });
        }}
      >
        <label className="office-report-filter">
          <span>Type</span>
          <select onChange={(event) => setFilterState((current) => ({ ...current, type: event.target.value }))} value={filterState.type}>
            {accountingFilterTypeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="office-report-filter">
          <span>Status</span>
          <select onChange={(event) => setFilterState((current) => ({ ...current, status: event.target.value }))} value={filterState.status}>
            {accountingFilterStatusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="office-report-filter">
          <span>Owner / agent</span>
          <select
            onChange={(event) => setFilterState((current) => ({ ...current, ownerMembershipId: event.target.value }))}
            value={filterState.ownerMembershipId}
          >
            <option value="">All owners</option>
            {snapshot.filters.ownerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="office-report-filter">
          <span>Search</span>
          <input
            onChange={(event) => setFilterState((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search reference, counterparty, transaction..."
            type="text"
            value={filterState.q}
          />
        </label>

        <label className="office-report-filter">
          <span>Start date</span>
          <input onChange={(event) => setFilterState((current) => ({ ...current, startDate: event.target.value }))} type="date" value={filterState.startDate} />
        </label>

        <label className="office-report-filter">
          <span>End date</span>
          <input onChange={(event) => setFilterState((current) => ({ ...current, endDate: event.target.value }))} type="date" value={filterState.endDate} />
        </label>

        <div className="office-report-filter-actions">
          <button className="office-button" type="submit">
            Apply filters
          </button>
          <button className="office-button office-button-secondary" onClick={resetFilters} type="button">
            Reset
          </button>
        </div>

        {canManageAccounting ? (
          <div className="office-report-filter-actions">
            <button className="bm-create-button" onClick={openCreateEntryModal} type="button">
              New accounting entry
            </button>
            <button className="office-button office-button-secondary" onClick={() => openEarnestMoneyModal()} type="button">
              New EMD
            </button>
          </div>
        ) : null}
      </form>

      <section className="office-dashboard-grid-wide bm-accounting-grid">
        <div className="office-side-stack">
          <section className="bm-table-card">
            <div className="bm-card-head">
              <h3>Accounting transactions</h3>
              <span>{snapshot.transactions.length} records in the current filtered window</span>
            </div>

            <div className="office-table">
              <div className="office-table-header office-table-row office-table-row-accounting">
                <span>Date</span>
                <span>Type</span>
                <span>Counterparty</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Linked transaction</span>
                <span>Created by</span>
              </div>

              {snapshot.transactions.map((transaction) => (
                <Link className="office-table-row office-table-row-accounting" href={transaction.href} key={transaction.id}>
                  <span>{transaction.accountingDate}</span>
                  <span>{transaction.type}</span>
                  <div className="office-table-primary">
                    <strong>{transaction.counterparty}</strong>
                    <p>{transaction.referenceNumber || transaction.ownerName}</p>
                  </div>
                  <span>{transaction.amountLabel}</span>
                  <span>{transaction.status}</span>
                  <div className="office-table-primary">
                    <strong>{transaction.linkedTransactionHref ? "Open transaction" : "—"}</strong>
                    <p>{transaction.linkedTransactionLabel}</p>
                  </div>
                  <span>{transaction.createdBy}</span>
                </Link>
              ))}

              {snapshot.transactions.length === 0 ? (
                <div className="bm-accounting-empty">
                  <p>No accounting transactions match the current filters.</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="bm-table-card">
            <div className="bm-card-head">
              <h3>General ledger</h3>
              <span>Latest {snapshot.generalLedgerEntries.length} posted entries</span>
            </div>

            <div className="office-table">
              <div className="office-table-header office-table-row office-table-row-ledger">
                <span>Date</span>
                <span>Account</span>
                <span>Debit</span>
                <span>Credit</span>
                <span>Memo</span>
              </div>

              {snapshot.generalLedgerEntries.map((entry) => (
                <Link className="office-table-row office-table-row-ledger" href={entry.accountingTransactionHref} key={entry.id}>
                  <span>{entry.entryDate}</span>
                  <div className="office-table-primary">
                    <strong>{entry.accountLabel}</strong>
                    <p>{entry.accountingTransactionLabel}</p>
                  </div>
                  <span>{entry.debitAmount}</span>
                  <span>{entry.creditAmount}</span>
                  <span>{entry.memo || "—"}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="office-side-stack">
          <section className="bm-table-card">
            <div className="bm-card-head">
              <h3>{snapshot.selectedTransaction ? "Accounting entry detail" : "Select an accounting entry"}</h3>
              <span>
                {snapshot.selectedTransaction
                  ? `${snapshot.selectedTransaction.typeLabel} · ${snapshot.selectedTransaction.statusLabel}`
                  : "Choose a row from the accounting table to inspect or edit it."}
              </span>
            </div>

            {snapshot.selectedTransaction ? (
              <form className="bm-accounting-form" onSubmit={handleSaveSelectedEntry}>
                <AccountingEntryFormFields
                  accountOptions={snapshot.accountOptions}
                  config={selectedEntryConfig}
                  formState={entryFormState}
                  memberOptions={snapshot.memberOptions}
                  onAddLineItem={addLineItem}
                  onLineItemChange={updateLineItem}
                  onRemoveLineItem={removeLineItem}
                  onUpdateField={updateEntryField}
                  paymentMethodOptions={paymentMethodOptions}
                  transactionOptions={snapshot.filters.transactionOptions}
                />

                <div className="bm-accounting-form-actions">
                  <button className="bm-create-button" disabled={!canManageAccounting || isSavingEntry} type="submit">
                    {isSavingEntry ? "Saving..." : "Save accounting entry"}
                  </button>
                  {snapshot.selectedTransaction.relatedTransactionId ? (
                    <Link className="office-button office-button-secondary" href={`/office/transactions/${snapshot.selectedTransaction.relatedTransactionId}`}>
                      Open linked transaction
                    </Link>
                  ) : null}
                  {entryError ? <p className="bm-transaction-submit-error">{entryError}</p> : null}
                </div>
              </form>
            ) : (
              <div className="bm-accounting-empty">
                <p>Use the transaction table to open an accounting record, or create a new invoice, bill, payment, deposit, refund, or journal entry.</p>
              </div>
            )}
          </section>

          <section className="bm-table-card" id="earnest-money">
            <div className="bm-card-head">
              <h3>Earnest money</h3>
              <span>{snapshot.earnestMoneyRecords.length} active EMD records</span>
            </div>

            <div className="office-table">
              <div className="office-table-header office-table-row office-table-row-emd">
                <span>Transaction</span>
                <span>Expected</span>
                <span>Received</span>
                <span>Refunded</span>
                <span>Status</span>
                <span>Due date</span>
              </div>

              {snapshot.earnestMoneyRecords.map((record) => (
                <div className="office-table-row office-table-row-emd" key={record.id}>
                  <div className="office-table-primary">
                    <strong>
                      <Link href={record.transactionHref}>{record.transactionLabel}</Link>
                    </strong>
                    <p>{record.heldExternally ? "Held externally" : record.heldByOffice ? "Held by office" : "Holding mode unset"}</p>
                  </div>
                  <span>{record.expectedAmount}</span>
                  <span>{record.receivedAmount}</span>
                  <span>{record.refundedAmount}</span>
                  <span>{record.status}</span>
                  <div className="bm-accounting-inline-actions">
                    <span>{record.dueAt}</span>
                    {canManageAccounting ? (
                      <button className="office-inline-action" onClick={() => openEarnestMoneyModal(record)} type="button">
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bm-table-card">
            <div className="bm-card-head">
              <h3>Chart of accounts</h3>
              <span>System accounts are seeded and ready; custom account editing is intentionally not exposed yet.</span>
            </div>

            <div className="office-table">
              <div className="office-table-header office-table-row office-table-row-chart">
                <span>Code</span>
                <span>Name</span>
                <span>Type</span>
                <span>Status</span>
              </div>

              {snapshot.chartAccounts.map((account) => (
                <div className="office-table-row office-table-row-chart" key={account.id}>
                  <span>{account.code || "—"}</span>
                  <div className="office-table-primary">
                    <strong>{account.name}</strong>
                    <p>{account.isSystem ? "System account" : "Custom account"}</p>
                  </div>
                  <span>{account.accountType}</span>
                  <span>{account.isActive ? "Active" : "Inactive"}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      {isCreateEntryOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsCreateEntryOpen(false)}>
          <section className="bm-transaction-modal bm-accounting-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>NEW ACCOUNTING ENTRY</h3>
              <button aria-label="Close create accounting entry modal" onClick={() => setIsCreateEntryOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body bm-accounting-modal-body" onSubmit={handleCreateEntry}>
              <AccountingEntryFormFields
                accountOptions={snapshot.accountOptions}
                config={entryModalConfig}
                formState={entryFormState}
                memberOptions={snapshot.memberOptions}
                onAddLineItem={addLineItem}
                onLineItemChange={updateLineItem}
                onRemoveLineItem={removeLineItem}
                onUpdateField={updateEntryField}
                paymentMethodOptions={paymentMethodOptions}
                transactionOptions={snapshot.filters.transactionOptions}
              />

              <footer className="bm-transaction-modal-footer">
                <span>{entryModalConfig.supportsLineItems ? "Line items drive the posted total for this type." : "Payments and received payments use the total amount field directly."}</span>
                <button className="bm-create-button" disabled={isSavingEntry} type="submit">
                  {isSavingEntry ? "Saving..." : "Create entry"}
                </button>
              </footer>
              {entryError ? <p className="bm-transaction-submit-error">{entryError}</p> : null}
            </form>
          </section>
        </div>
      ) : null}

      {isEarnestMoneyOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsEarnestMoneyOpen(false)}>
          <section className="bm-transaction-modal bm-accounting-modal bm-emd-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>{editingEarnestMoneyId ? "EDIT EARNEST MONEY" : "NEW EARNEST MONEY"}</h3>
              <button aria-label="Close earnest money modal" onClick={() => setIsEarnestMoneyOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body bm-accounting-modal-body" onSubmit={handleSaveEarnestMoney}>
              <div className="bm-accounting-form-grid">
                <label className="bm-detail-field bm-detail-field-wide">
                  <span>Linked transaction</span>
                  <select
                    disabled={Boolean(editingEarnestMoneyId)}
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, transactionId: event.target.value }))}
                    value={earnestMoneyFormState.transactionId}
                  >
                    <option value="">Select transaction</option>
                    {snapshot.filters.transactionOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="bm-detail-field">
                  <span>Expected amount</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, expectedAmount: event.target.value }))}
                    type="text"
                    value={earnestMoneyFormState.expectedAmount}
                  />
                </label>

                <label className="bm-detail-field">
                  <span>Due date</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, dueAt: event.target.value }))}
                    type="date"
                    value={earnestMoneyFormState.dueAt}
                  />
                </label>

                <label className="bm-detail-field">
                  <span>Received amount</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, receivedAmount: event.target.value }))}
                    type="text"
                    value={earnestMoneyFormState.receivedAmount}
                  />
                </label>

                <label className="bm-detail-field">
                  <span>Refunded / distributed</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, refundedAmount: event.target.value }))}
                    type="text"
                    value={earnestMoneyFormState.refundedAmount}
                  />
                </label>

                <label className="bm-detail-field">
                  <span>Payment date</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, paymentDate: event.target.value }))}
                    type="date"
                    value={earnestMoneyFormState.paymentDate}
                  />
                </label>

                <label className="bm-detail-field">
                  <span>Deposit date</span>
                  <input
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, depositDate: event.target.value }))}
                    type="date"
                    value={earnestMoneyFormState.depositDate}
                  />
                </label>

                <label className="bm-detail-field bm-detail-field-checkbox">
                  <input
                    checked={earnestMoneyFormState.heldByOffice}
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, heldByOffice: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>Held by office</span>
                </label>

                <label className="bm-detail-field bm-detail-field-checkbox">
                  <input
                    checked={earnestMoneyFormState.heldExternally}
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, heldExternally: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>Held externally</span>
                </label>

                <label className="bm-detail-field bm-detail-field-checkbox">
                  <input
                    checked={earnestMoneyFormState.trackInLedger}
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, trackInLedger: event.target.checked }))}
                    type="checkbox"
                  />
                  <span>Track in ledger</span>
                </label>

                <label className="bm-detail-field bm-detail-field-wide">
                  <span>Notes</span>
                  <textarea
                    onChange={(event) => setEarnestMoneyFormState((current) => ({ ...current, notes: event.target.value }))}
                    rows={3}
                    value={earnestMoneyFormState.notes}
                  />
                </label>
              </div>

              <footer className="bm-transaction-modal-footer">
                <span>EMD status is derived from due date, received amount, refunded amount, and deposit progress.</span>
                <button className="bm-create-button" disabled={isSavingEarnestMoney} type="submit">
                  {isSavingEarnestMoney ? "Saving..." : editingEarnestMoneyId ? "Save EMD" : "Create EMD"}
                </button>
              </footer>
              {earnestMoneyError ? <p className="bm-transaction-submit-error">{earnestMoneyError}</p> : null}
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

type AccountingEntryFormFieldsProps = {
  formState: AccountingEntryFormState;
  config: AccountingTypeOption;
  transactionOptions: OfficeAccountingSnapshot["filters"]["transactionOptions"];
  memberOptions: OfficeAccountingSnapshot["memberOptions"];
  accountOptions: OfficeAccountingSnapshot["accountOptions"];
  paymentMethodOptions: PaymentMethodOption[];
  onUpdateField: <K extends keyof AccountingEntryFormState>(key: K, value: AccountingEntryFormState[K]) => void;
  onLineItemChange: (index: number, key: keyof AccountingLineItemFormState, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (index: number) => void;
};

function AccountingEntryFormFields({
  formState,
  config,
  transactionOptions,
  memberOptions,
  accountOptions,
  paymentMethodOptions,
  onUpdateField,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem
}: AccountingEntryFormFieldsProps) {
  return (
    <div className="bm-accounting-form-stack">
      <div className="bm-accounting-form-grid">
        <label className="bm-detail-field">
          <span>Type</span>
          <select onChange={(event) => onUpdateField("type", event.target.value)} value={formState.type}>
            {accountingTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bm-detail-field">
          <span>Status</span>
          <select onChange={(event) => onUpdateField("status", event.target.value)} value={formState.status}>
            {accountingStatusOptions.map((option) => (
              <option key={option.value || "default"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bm-detail-field">
          <span>Accounting date</span>
          <input onChange={(event) => onUpdateField("accountingDate", event.target.value)} type="date" value={formState.accountingDate} />
        </label>

        <label className="bm-detail-field">
          <span>Due date</span>
          <input onChange={(event) => onUpdateField("dueDate", event.target.value)} type="date" value={formState.dueDate} />
        </label>

        <label className="bm-detail-field">
          <span>Payment method</span>
          <select onChange={(event) => onUpdateField("paymentMethod", event.target.value)} value={formState.paymentMethod}>
            {paymentMethodOptions.map((option) => (
              <option key={option.value || "default"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bm-detail-field">
          <span>Reference number</span>
          <input onChange={(event) => onUpdateField("referenceNumber", event.target.value)} type="text" value={formState.referenceNumber} />
        </label>

        <label className="bm-detail-field bm-detail-field-wide">
          <span>Counterparty</span>
          <input onChange={(event) => onUpdateField("counterpartyName", event.target.value)} type="text" value={formState.counterpartyName} />
        </label>

        <label className="bm-detail-field bm-detail-field-wide">
          <span>Linked transaction</span>
          <select onChange={(event) => onUpdateField("relatedTransactionId", event.target.value)} value={formState.relatedTransactionId}>
            <option value="">No linked transaction</option>
            {transactionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bm-detail-field bm-detail-field-wide">
          <span>Owner / agent</span>
          <select onChange={(event) => onUpdateField("relatedMembershipId", event.target.value)} value={formState.relatedMembershipId}>
            <option value="">No linked owner</option>
            {memberOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="bm-detail-field bm-detail-field-wide">
          <span>Memo</span>
          <input onChange={(event) => onUpdateField("memo", event.target.value)} type="text" value={formState.memo} />
        </label>

        <label className="bm-detail-field bm-detail-field-wide">
          <span>Notes</span>
          <textarea onChange={(event) => onUpdateField("notes", event.target.value)} rows={3} value={formState.notes} />
        </label>

        {!config.supportsLineItems ? (
          <label className="bm-detail-field">
            <span>Total amount</span>
            <input onChange={(event) => onUpdateField("totalAmount", event.target.value)} type="text" value={formState.totalAmount} />
          </label>
        ) : null}
      </div>

      {config.supportsLineItems ? (
        <section className="bm-accounting-line-items">
          <div className="bm-card-head bm-card-head-inline">
            <h3>Line items</h3>
            <span>{config.manualEntrySides ? "Manual debit/credit rows must stay balanced." : "Total is derived from the line items below."}</span>
          </div>

          <div className="office-table">
            <div className={`office-table-header office-table-row ${config.manualEntrySides ? "office-table-row-accounting-lines-manual" : "office-table-row-accounting-lines"}`}>
              <span>Account</span>
              <span>Description</span>
              {config.manualEntrySides ? <span>Entry side</span> : null}
              <span>Amount</span>
              <span />
            </div>

            {formState.lineItems.map((lineItem, index) => (
              <div className={`office-table-row ${config.manualEntrySides ? "office-table-row-accounting-lines-manual" : "office-table-row-accounting-lines"}`} key={`${index}-${lineItem.id ?? "new"}`}>
                <select onChange={(event) => onLineItemChange(index, "ledgerAccountId", event.target.value)} value={lineItem.ledgerAccountId}>
                  <option value="">Select account</option>
                  {accountOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input onChange={(event) => onLineItemChange(index, "description", event.target.value)} placeholder="Optional description" type="text" value={lineItem.description} />
                {config.manualEntrySides ? (
                  <select onChange={(event) => onLineItemChange(index, "entrySide", event.target.value)} value={lineItem.entrySide}>
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                ) : null}
                <input onChange={(event) => onLineItemChange(index, "amount", event.target.value)} placeholder="0.00" type="text" value={lineItem.amount} />
                <button className="office-inline-action" onClick={() => onRemoveLineItem(index)} type="button">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button className="office-button office-button-secondary" onClick={onAddLineItem} type="button">
            Add line item
          </button>
        </section>
      ) : null}
    </div>
  );
}
