import {
  AccountingLineEntrySide,
  AccountingPaymentMethod,
  AccountingTransactionStatus,
  AccountingTransactionType,
  EarnestMoneyStatus,
  LedgerAccountType,
  Prisma
} from "@prisma/client";
import { activityLogActions, recordActivityLogEvent, type ActivityLogAction } from "./activity-log";
import { prisma } from "./client";

export type OfficeAccountingTransactionTypeLabel =
  | "Invoice"
  | "Bill"
  | "Credit memo"
  | "Deposit"
  | "Received payment"
  | "Made payment"
  | "Journal entry"
  | "Transfer"
  | "Refund";

export type OfficeAccountingTransactionStatusLabel = "Draft" | "Open" | "Posted" | "Completed" | "Void";
export type OfficeLedgerAccountTypeLabel = "Asset" | "Liability" | "Equity" | "Income" | "Expense" | "Contra income" | "Contra expense";
export type OfficeEarnestMoneyStatusLabel =
  | "Not received"
  | "Overdue"
  | "Pending bank deposit"
  | "Fully deposited"
  | "Distribute balance"
  | "Complete";

export type OfficeAccountingOverview = {
  totalInvoices: number;
  openBills: number;
  receivedPaymentsLabel: string;
  madePaymentsLabel: string;
  officeNetLedgerImpactLabel: string;
  outstandingEmdCount: number;
  overdueEmdCount: number;
};

export type OfficeAccountingTransactionRow = {
  id: string;
  accountingDate: string;
  type: OfficeAccountingTransactionTypeLabel;
  status: OfficeAccountingTransactionStatusLabel;
  counterparty: string;
  amountLabel: string;
  linkedTransactionId: string | null;
  linkedTransactionLabel: string;
  linkedTransactionHref: string | null;
  createdBy: string;
  ownerName: string;
  referenceNumber: string;
  href: string;
};

export type OfficeAccountingLineItemRecord = {
  id: string;
  ledgerAccountId: string;
  ledgerAccountLabel: string;
  description: string;
  entrySide: "Debit" | "Credit";
  amount: string;
};

export type OfficeAccountingTransactionDetail = {
  id: string;
  type: AccountingTransactionType;
  typeLabel: OfficeAccountingTransactionTypeLabel;
  status: AccountingTransactionStatus;
  statusLabel: OfficeAccountingTransactionStatusLabel;
  accountingDate: string;
  dueDate: string;
  paymentMethod: AccountingPaymentMethod | "";
  referenceNumber: string;
  counterpartyName: string;
  memo: string;
  notes: string;
  totalAmount: string;
  relatedTransactionId: string;
  relatedMembershipId: string;
  lineItems: OfficeAccountingLineItemRecord[];
};

export type OfficeEarnestMoneyRecord = {
  id: string;
  transactionId: string;
  transactionLabel: string;
  transactionHref: string;
  expectedAmount: string;
  receivedAmount: string;
  refundedAmount: string;
  dueAt: string;
  paymentDate: string;
  depositDate: string;
  status: OfficeEarnestMoneyStatusLabel;
  heldByOffice: boolean;
  heldExternally: boolean;
  trackInLedger: boolean;
  notes: string;
};

export type OfficeLedgerAccountRecord = {
  id: string;
  code: string;
  name: string;
  accountType: OfficeLedgerAccountTypeLabel;
  isSystem: boolean;
  isActive: boolean;
};

export type OfficeGeneralLedgerEntryRecord = {
  id: string;
  entryDate: string;
  accountLabel: string;
  debitAmount: string;
  creditAmount: string;
  memo: string;
  accountingTransactionLabel: string;
  accountingTransactionHref: string;
};

export type OfficeAccountingMemberOption = {
  id: string;
  label: string;
};

export type OfficeAccountingTransactionOption = {
  id: string;
  label: string;
};

export type OfficeLedgerAccountOption = {
  id: string;
  label: string;
  accountType: LedgerAccountType;
};

export type OfficeAccountingFilters = {
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  ownerMembershipId: string;
  q: string;
  entryId: string;
  ownerOptions: OfficeAccountingMemberOption[];
  transactionOptions: OfficeAccountingTransactionOption[];
};

export type OfficeAccountingSnapshot = {
  overview: OfficeAccountingOverview;
  filters: OfficeAccountingFilters;
  transactions: OfficeAccountingTransactionRow[];
  selectedTransaction: OfficeAccountingTransactionDetail | null;
  earnestMoneyRecords: OfficeEarnestMoneyRecord[];
  chartAccounts: OfficeLedgerAccountRecord[];
  generalLedgerEntries: OfficeGeneralLedgerEntryRecord[];
  accountOptions: OfficeLedgerAccountOption[];
  memberOptions: OfficeAccountingMemberOption[];
};

export type GetOfficeAccountingSnapshotInput = {
  organizationId: string;
  officeId?: string | null;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  ownerMembershipId?: string;
  q?: string;
  entryId?: string;
};

export type AccountingTransactionLineItemInput = {
  id?: string;
  ledgerAccountId: string;
  description?: string;
  amount: string;
  entrySide?: AccountingLineEntrySide | string;
};

export type SaveAccountingTransactionInput = {
  organizationId: string;
  officeId?: string | null;
  accountingTransactionId?: string;
  relatedTransactionId?: string;
  relatedMembershipId?: string;
  type: string;
  status?: string;
  accountingDate: string;
  dueDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  counterpartyName?: string;
  memo?: string;
  notes?: string;
  isAgentBilling?: boolean;
  billingCategory?: string;
  originRecurringChargeRuleId?: string;
  totalAmount?: string;
  lineItems?: AccountingTransactionLineItemInput[];
  createdByMembershipId: string;
  actorMembershipId?: string;
  activityActionOverride?: ActivityLogAction;
  activityContextHref?: string;
};

export type CreateEarnestMoneyRecordInput = {
  organizationId: string;
  officeId?: string | null;
  transactionId: string;
  expectedAmount: string;
  dueAt: string;
  heldByOffice?: boolean;
  heldExternally?: boolean;
  trackInLedger?: boolean;
  notes?: string;
  createdByMembershipId: string;
  actorMembershipId?: string;
};

export type UpdateEarnestMoneyRecordInput = {
  organizationId: string;
  officeId?: string | null;
  earnestMoneyRecordId: string;
  expectedAmount?: string;
  dueAt?: string;
  receivedAmount?: string;
  refundedAmount?: string;
  paymentDate?: string;
  depositDate?: string;
  heldByOffice?: boolean;
  heldExternally?: boolean;
  trackInLedger?: boolean;
  notes?: string;
  actorMembershipId?: string;
};

const accountingTypeLabelMap: Record<AccountingTransactionType, OfficeAccountingTransactionTypeLabel> = {
  invoice: "Invoice",
  bill: "Bill",
  credit_memo: "Credit memo",
  deposit: "Deposit",
  received_payment: "Received payment",
  made_payment: "Made payment",
  journal_entry: "Journal entry",
  transfer: "Transfer",
  refund: "Refund"
};

const accountingStatusLabelMap: Record<AccountingTransactionStatus, OfficeAccountingTransactionStatusLabel> = {
  draft: "Draft",
  open: "Open",
  posted: "Posted",
  completed: "Completed",
  void: "Void"
};

const ledgerAccountTypeLabelMap: Record<LedgerAccountType, OfficeLedgerAccountTypeLabel> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  income: "Income",
  expense: "Expense",
  contra_income: "Contra income",
  contra_expense: "Contra expense"
};

const earnestMoneyStatusLabelMap: Record<EarnestMoneyStatus, OfficeEarnestMoneyStatusLabel> = {
  not_received: "Not received",
  overdue: "Overdue",
  pending_bank_deposit: "Pending bank deposit",
  fully_deposited: "Fully deposited",
  distribute_balance: "Distribute balance",
  complete: "Complete"
};

const paymentMethodLabelMap: Record<AccountingPaymentMethod, string> = {
  ach: "ACH",
  check: "Check",
  wire: "Wire",
  cash: "Cash",
  internal_transfer: "Internal transfer",
  other: "Other"
};

export const accountingSystemAccountCodes = {
  accountsReceivable: "1100",
  accountsPayable: "2000",
  commissionIncome: "4000",
  agentBillingIncome: "4010",
  agentCommissionExpense: "5000",
  earnestMoneyLiability: "2100",
  operatingBank: "1000",
  earnestMoneyHoldingBank: "1010",
  referralExpense: "5100",
  refundContraRevenue: "4050"
} as const;

type AccountingSystemAccounts = Record<keyof typeof accountingSystemAccountCodes, { id: string; code: string; name: string }>;

type AccountingPostingLine = {
  accountId: string;
  debitAmount: Prisma.Decimal;
  creditAmount: Prisma.Decimal;
  memo: string | null;
};

type NormalizedAccountingLineItem = {
  ledgerAccountId: string;
  description: string | null;
  entrySide: AccountingLineEntrySide;
  amount: Prisma.Decimal;
  sortOrder: number;
};

function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatDateValue(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatDateLabel(value: Date | null | undefined) {
  return value
    ? value.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "—";
}

function parseOptionalDate(value: string | undefined | null) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: string | undefined | null) {
  const parsed = parseOptionalDate(value);

  if (!parsed) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function endOfDay(value: string | undefined | null) {
  const parsed = parseOptionalDate(value);

  if (!parsed) {
    return null;
  }

  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function parseOptionalText(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalDecimal(value: string | undefined | null) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.replaceAll(",", "").replace(/\$/g, "").trim();

  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? new Prisma.Decimal(numeric) : null;
}

function positiveDecimalOrZero(value: Prisma.Decimal | null | undefined) {
  return value ?? new Prisma.Decimal(0);
}

function buildScopedOfficeWhere(officeId?: string | null) {
  return officeId
    ? {
        OR: [{ officeId }, { officeId: null }]
      }
    : {};
}

function parseAccountingType(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  return Object.keys(accountingTypeLabelMap).includes(value) ? (value as AccountingTransactionType) : null;
}

function parseAccountingStatus(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  return Object.keys(accountingStatusLabelMap).includes(value) ? (value as AccountingTransactionStatus) : null;
}

function parsePaymentMethod(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  return Object.keys(paymentMethodLabelMap).includes(value) ? (value as AccountingPaymentMethod) : null;
}

function parseLineEntrySide(value: string | undefined | null) {
  return value === "debit" || value === "credit" ? value : null;
}

function getDefaultTransactionStatus(type: AccountingTransactionType): AccountingTransactionStatus {
  switch (type) {
    case "invoice":
    case "bill":
      return "open";
    case "received_payment":
    case "made_payment":
    case "deposit":
    case "refund":
      return "completed";
    case "credit_memo":
    case "journal_entry":
    case "transfer":
      return "posted";
  }
}

function getActivityActionForAccountingType(type: AccountingTransactionType) {
  switch (type) {
    case "invoice":
      return activityLogActions.accountingInvoiceCreated;
    case "bill":
      return activityLogActions.accountingBillCreated;
    case "received_payment":
      return activityLogActions.accountingPaymentReceived;
    case "made_payment":
      return activityLogActions.accountingPaymentMade;
    default:
      return activityLogActions.accountingTransactionUpdated;
  }
}

function buildAccountingTransactionLabel(record: {
  type: AccountingTransactionType;
  referenceNumber: string | null;
  counterpartyName: string | null;
  relatedTransaction?: { title: string; address: string; city: string; state: string } | null;
}) {
  const typeLabel = accountingTypeLabelMap[record.type];
  const reference = record.referenceNumber?.trim();

  if (reference) {
    return `${typeLabel} ${reference}`;
  }

  if (record.counterpartyName?.trim()) {
    return `${typeLabel} · ${record.counterpartyName.trim()}`;
  }

  if (record.relatedTransaction) {
    return `${typeLabel} · ${record.relatedTransaction.title} · ${record.relatedTransaction.address}, ${record.relatedTransaction.city}, ${record.relatedTransaction.state}`;
  }

  return typeLabel;
}

function buildAccountingChanges(previousLabel: string, nextLabel: string, label: string) {
  return previousLabel === nextLabel
    ? []
    : [
        {
          label,
          previousValue: previousLabel,
          nextValue: nextLabel
        }
      ];
}

async function getSystemAccounts(tx: Prisma.TransactionClient, organizationId: string) {
  const accounts = await tx.ledgerAccount.findMany({
    where: {
      organizationId,
      code: {
        in: Object.values(accountingSystemAccountCodes)
      }
    },
    select: {
      id: true,
      code: true,
      name: true
    }
  });

  const accountMap = new Map(accounts.map((account) => [account.code ?? "", account]));
  const resolved = {} as AccountingSystemAccounts;

  for (const [key, code] of Object.entries(accountingSystemAccountCodes) as Array<[keyof typeof accountingSystemAccountCodes, string]>) {
    const account = accountMap.get(code);

    if (!account) {
      throw new Error(`Missing system ledger account ${code}.`);
    }

    resolved[key] = {
      id: account.id,
      code: account.code ?? code,
      name: account.name
    };
  }

  return resolved;
}

function buildAccountingTransactionWhere(input: GetOfficeAccountingSnapshotInput): Prisma.AccountingTransactionWhereInput {
  const type = parseAccountingType(input.type);
  const status = parseAccountingStatus(input.status);
  const startDate = startOfDay(input.startDate);
  const endDate = endOfDay(input.endDate);
  const search = input.q?.trim();

  return {
    organizationId: input.organizationId,
    ...buildScopedOfficeWhere(input.officeId),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...((startDate || endDate)
      ? {
          accountingDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        }
      : {}),
    ...(input.ownerMembershipId
      ? {
          OR: [{ relatedMembershipId: input.ownerMembershipId }, { relatedTransaction: { ownerMembershipId: input.ownerMembershipId } }]
        }
      : {}),
    ...(search
      ? {
          AND: [
            {
              OR: [
                { counterpartyName: { contains: search, mode: "insensitive" } },
                { referenceNumber: { contains: search, mode: "insensitive" } },
                { memo: { contains: search, mode: "insensitive" } },
                { notes: { contains: search, mode: "insensitive" } },
                {
                  relatedTransaction: {
                    OR: [
                      { title: { contains: search, mode: "insensitive" } },
                      { address: { contains: search, mode: "insensitive" } },
                      { city: { contains: search, mode: "insensitive" } },
                      { zipCode: { contains: search, mode: "insensitive" } }
                    ]
                  }
                },
                {
                  relatedMembership: {
                    user: {
                      OR: [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } }
                      ]
                    }
                  }
                }
              ]
            }
          ]
        }
      : {})
  };
}

function buildEarnestMoneyWhere(input: GetOfficeAccountingSnapshotInput): Prisma.EarnestMoneyRecordWhereInput {
  const startDate = startOfDay(input.startDate);
  const endDate = endOfDay(input.endDate);
  const search = input.q?.trim();

  return {
    organizationId: input.organizationId,
    ...buildScopedOfficeWhere(input.officeId),
    ...((startDate || endDate)
      ? {
          dueAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        }
      : {}),
    ...(input.ownerMembershipId
      ? {
          transaction: {
            ownerMembershipId: input.ownerMembershipId
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              transaction: {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { address: { contains: search, mode: "insensitive" } },
                  { city: { contains: search, mode: "insensitive" } },
                  { zipCode: { contains: search, mode: "insensitive" } }
                ]
              }
            },
            { notes: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function buildLedgerImpact(entries: Array<{ account: { accountType: LedgerAccountType }; debitAmount: Prisma.Decimal; creditAmount: Prisma.Decimal }>) {
  let impact = 0;

  for (const entry of entries) {
    const debit = Number(entry.debitAmount);
    const credit = Number(entry.creditAmount);

    if (entry.account.accountType === "income" || entry.account.accountType === "contra_expense") {
      impact += credit - debit;
    } else if (entry.account.accountType === "expense" || entry.account.accountType === "contra_income") {
      impact -= debit - credit;
    }
  }

  return impact;
}

function mapAccountingRow(record: {
  id: string;
  accountingDate: Date;
  type: AccountingTransactionType;
  status: AccountingTransactionStatus;
  counterpartyName: string | null;
  totalAmount: Prisma.Decimal;
  referenceNumber: string | null;
  relatedTransaction: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    ownerMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  } | null;
  relatedMembership: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  createdByMembership: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}) : OfficeAccountingTransactionRow {
  const ownerName = record.relatedMembership
    ? `${record.relatedMembership.user.firstName} ${record.relatedMembership.user.lastName}`
    : record.relatedTransaction?.ownerMembership
      ? `${record.relatedTransaction.ownerMembership.user.firstName} ${record.relatedTransaction.ownerMembership.user.lastName}`
      : "Unassigned";

  return {
    id: record.id,
    accountingDate: formatDateValue(record.accountingDate),
    type: accountingTypeLabelMap[record.type],
    status: accountingStatusLabelMap[record.status],
    counterparty: record.counterpartyName || "—",
    amountLabel: formatCurrency(record.totalAmount),
    linkedTransactionId: record.relatedTransaction?.id ?? null,
    linkedTransactionLabel: record.relatedTransaction
      ? `${record.relatedTransaction.title} · ${record.relatedTransaction.address}, ${record.relatedTransaction.city}, ${record.relatedTransaction.state}`
      : "—",
    linkedTransactionHref: record.relatedTransaction ? `/office/transactions/${record.relatedTransaction.id}` : null,
    createdBy: `${record.createdByMembership.user.firstName} ${record.createdByMembership.user.lastName}`,
    ownerName,
    referenceNumber: record.referenceNumber ?? "",
    href: `/office/accounting?entryId=${record.id}`
  };
}

function mapAccountingDetail(record: {
  id: string;
  type: AccountingTransactionType;
  status: AccountingTransactionStatus;
  accountingDate: Date;
  dueDate: Date | null;
  paymentMethod: AccountingPaymentMethod | null;
  referenceNumber: string | null;
  counterpartyName: string | null;
  memo: string | null;
  notes: string | null;
  totalAmount: Prisma.Decimal;
  relatedTransactionId: string | null;
  relatedMembershipId: string | null;
  lineItems: Array<{
    id: string;
    ledgerAccountId: string;
    description: string | null;
    entrySide: AccountingLineEntrySide;
    amount: Prisma.Decimal;
    ledgerAccount: {
      code: string | null;
      name: string;
    };
  }>;
}) : OfficeAccountingTransactionDetail {
  return {
    id: record.id,
    type: record.type,
    typeLabel: accountingTypeLabelMap[record.type],
    status: record.status,
    statusLabel: accountingStatusLabelMap[record.status],
    accountingDate: formatDateValue(record.accountingDate),
    dueDate: formatDateValue(record.dueDate),
    paymentMethod: record.paymentMethod ?? "",
    referenceNumber: record.referenceNumber ?? "",
    counterpartyName: record.counterpartyName ?? "",
    memo: record.memo ?? "",
    notes: record.notes ?? "",
    totalAmount: String(record.totalAmount),
    relatedTransactionId: record.relatedTransactionId ?? "",
    relatedMembershipId: record.relatedMembershipId ?? "",
    lineItems: record.lineItems.map((item) => ({
      id: item.id,
      ledgerAccountId: item.ledgerAccountId,
      ledgerAccountLabel: item.ledgerAccount.code ? `${item.ledgerAccount.code} · ${item.ledgerAccount.name}` : item.ledgerAccount.name,
      description: item.description ?? "",
      entrySide: item.entrySide === "debit" ? "Debit" : "Credit",
      amount: String(item.amount)
    }))
  };
}

function mapEarnestMoneyRecord(record: {
  id: string;
  expectedAmount: Prisma.Decimal;
  receivedAmount: Prisma.Decimal;
  refundedAmount: Prisma.Decimal;
  dueAt: Date;
  paymentDate: Date | null;
  depositDate: Date | null;
  status: EarnestMoneyStatus;
  heldByOffice: boolean;
  heldExternally: boolean;
  trackInLedger: boolean;
  notes: string | null;
  transaction: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
}): OfficeEarnestMoneyRecord {
  return {
    id: record.id,
    transactionId: record.transaction.id,
    transactionLabel: `${record.transaction.title} · ${record.transaction.address}, ${record.transaction.city}, ${record.transaction.state}`,
    transactionHref: `/office/transactions/${record.transaction.id}`,
    expectedAmount: formatCurrency(record.expectedAmount),
    receivedAmount: formatCurrency(record.receivedAmount),
    refundedAmount: formatCurrency(record.refundedAmount),
    dueAt: formatDateValue(record.dueAt),
    paymentDate: formatDateValue(record.paymentDate),
    depositDate: formatDateValue(record.depositDate),
    status: earnestMoneyStatusLabelMap[record.status],
    heldByOffice: record.heldByOffice,
    heldExternally: record.heldExternally,
    trackInLedger: record.trackInLedger,
    notes: record.notes ?? ""
  };
}

function deriveEarnestMoneyStatus(record: {
  dueAt: Date;
  receivedAmount: Prisma.Decimal;
  refundedAmount: Prisma.Decimal;
  paymentDate: Date | null;
  depositDate: Date | null;
}) : EarnestMoneyStatus {
  const receivedAmount = Number(record.receivedAmount);
  const refundedAmount = Number(record.refundedAmount);
  const now = new Date();

  if (receivedAmount > 0 && refundedAmount >= receivedAmount) {
    return "complete";
  }

  if (receivedAmount > 0 && refundedAmount > 0 && refundedAmount < receivedAmount) {
    return "distribute_balance";
  }

  if (receivedAmount > 0 && record.depositDate) {
    return "fully_deposited";
  }

  if (receivedAmount > 0 || record.paymentDate) {
    return "pending_bank_deposit";
  }

  if (record.dueAt < now) {
    return "overdue";
  }

  return "not_received";
}

async function resolveLineItemAccounts(
  tx: Prisma.TransactionClient,
  organizationId: string,
  lineItems: Array<{ ledgerAccountId: string }>
) {
  const uniqueAccountIds = [...new Set(lineItems.map((lineItem) => lineItem.ledgerAccountId).filter(Boolean))];

  const accounts = await tx.ledgerAccount.findMany({
    where: {
      organizationId,
      id: {
        in: uniqueAccountIds
      },
      isActive: true
    },
    select: {
      id: true,
      code: true,
      name: true
    }
  });

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  for (const accountId of uniqueAccountIds) {
    if (!accountMap.has(accountId)) {
      throw new Error("One or more ledger accounts are not available in the current organization scope.");
    }
  }

  return accountMap;
}

function normalizeManualLineItems(lineItems: AccountingTransactionLineItemInput[]): NormalizedAccountingLineItem[] {
  return lineItems
    .map((lineItem, index) => ({
      ledgerAccountId: lineItem.ledgerAccountId,
      description: parseOptionalText(lineItem.description),
      entrySide: parseLineEntrySide(lineItem.entrySide) ?? "debit",
      amount: parseOptionalDecimal(lineItem.amount),
      sortOrder: index
    }))
    .filter((lineItem): lineItem is NormalizedAccountingLineItem => Boolean(lineItem.ledgerAccountId && lineItem.amount));
}

function sumLineItems(lineItems: Array<{ amount: Prisma.Decimal }>) {
  return lineItems.reduce((total, lineItem) => total.plus(lineItem.amount), new Prisma.Decimal(0));
}

function sumLineItemsBySide(lineItems: Array<{ amount: Prisma.Decimal; entrySide: AccountingLineEntrySide }>, entrySide: AccountingLineEntrySide) {
  return lineItems
    .filter((lineItem) => lineItem.entrySide === entrySide)
    .reduce((total, lineItem) => total.plus(lineItem.amount), new Prisma.Decimal(0));
}

function createBalancedPostingMemo(type: AccountingTransactionType, counterpartyName: string | null, referenceNumber: string | null) {
  const typeLabel = accountingTypeLabelMap[type];

  if (referenceNumber?.trim()) {
    return `${typeLabel} ${referenceNumber.trim()}`;
  }

  if (counterpartyName?.trim()) {
    return `${typeLabel} · ${counterpartyName.trim()}`;
  }

  return typeLabel;
}

function buildLedgerEntriesForTransaction(args: {
  type: AccountingTransactionType;
  totalAmount: Prisma.Decimal;
  lineItems: NormalizedAccountingLineItem[];
  systemAccounts: AccountingSystemAccounts;
  relatedTransactionId?: string | null;
  memo?: string | null;
}) {
  const { type, totalAmount, lineItems, systemAccounts, relatedTransactionId, memo } = args;
  const postingMemo = memo ?? createBalancedPostingMemo(type, null, null);
  const lines: AccountingPostingLine[] = [];

  const pushLine = (accountId: string, debitAmount: Prisma.Decimal, creditAmount: Prisma.Decimal, lineMemo?: string | null) => {
    lines.push({
      accountId,
      debitAmount,
      creditAmount,
      memo: lineMemo ?? postingMemo
    });
  };

  switch (type) {
    case "invoice":
      pushLine(systemAccounts.accountsReceivable.id, totalAmount, new Prisma.Decimal(0));
      for (const lineItem of lineItems) {
        pushLine(lineItem.ledgerAccountId, new Prisma.Decimal(0), lineItem.amount, lineItem.description);
      }
      break;
    case "bill":
      for (const lineItem of lineItems) {
        pushLine(lineItem.ledgerAccountId, lineItem.amount, new Prisma.Decimal(0), lineItem.description);
      }
      pushLine(systemAccounts.accountsPayable.id, new Prisma.Decimal(0), totalAmount);
      break;
    case "received_payment":
      pushLine(systemAccounts.operatingBank.id, totalAmount, new Prisma.Decimal(0));
      pushLine(systemAccounts.accountsReceivable.id, new Prisma.Decimal(0), totalAmount);
      break;
    case "made_payment":
      pushLine(systemAccounts.accountsPayable.id, totalAmount, new Prisma.Decimal(0));
      pushLine(systemAccounts.operatingBank.id, new Prisma.Decimal(0), totalAmount);
      break;
    case "deposit": {
      const bankAccountId = relatedTransactionId ? systemAccounts.earnestMoneyHoldingBank.id : systemAccounts.operatingBank.id;
      pushLine(bankAccountId, totalAmount, new Prisma.Decimal(0));
      for (const lineItem of lineItems) {
        pushLine(lineItem.ledgerAccountId, new Prisma.Decimal(0), lineItem.amount, lineItem.description);
      }
      break;
    }
    case "refund": {
      const bankAccountId = relatedTransactionId ? systemAccounts.earnestMoneyHoldingBank.id : systemAccounts.operatingBank.id;
      for (const lineItem of lineItems) {
        pushLine(lineItem.ledgerAccountId, lineItem.amount, new Prisma.Decimal(0), lineItem.description);
      }
      pushLine(bankAccountId, new Prisma.Decimal(0), totalAmount);
      break;
    }
    case "credit_memo":
    case "journal_entry":
    case "transfer":
      for (const lineItem of lineItems) {
        pushLine(
          lineItem.ledgerAccountId,
          lineItem.entrySide === "debit" ? lineItem.amount : new Prisma.Decimal(0),
          lineItem.entrySide === "credit" ? lineItem.amount : new Prisma.Decimal(0),
          lineItem.description
        );
      }
      break;
  }

  return lines;
}

function assertBalancedLines(type: AccountingTransactionType, lineItems: Array<{ amount: Prisma.Decimal; entrySide: AccountingLineEntrySide }>) {
  if (["journal_entry", "transfer", "credit_memo"].includes(type)) {
    const debits = sumLineItemsBySide(lineItems, "debit");
    const credits = sumLineItemsBySide(lineItems, "credit");

    if (!debits.equals(credits)) {
      throw new Error("Manual debit and credit line items must stay balanced.");
    }

    return debits;
  }

  return sumLineItems(lineItems);
}

function normalizeTypeAwareLineItems(type: AccountingTransactionType, lineItems: AccountingTransactionLineItemInput[]): NormalizedAccountingLineItem[] {
  const normalized = normalizeManualLineItems(lineItems);

  switch (type) {
    case "invoice":
      return normalized.map((lineItem) => ({
        ...lineItem,
        entrySide: "credit" as AccountingLineEntrySide
      }));
    case "bill":
    case "refund":
      return normalized.map((lineItem) => ({
        ...lineItem,
        entrySide: "debit" as AccountingLineEntrySide
      }));
    case "deposit":
      return normalized.map((lineItem) => ({
        ...lineItem,
        entrySide: "credit" as AccountingLineEntrySide
      }));
    case "credit_memo":
    case "journal_entry":
    case "transfer":
      return normalized;
    default:
      return [];
  }
}

export async function saveAccountingTransactionInternal(
  tx: Prisma.TransactionClient,
  input: SaveAccountingTransactionInput
) {
  const type = parseAccountingType(input.type);

  if (!type) {
    throw new Error("Unsupported accounting transaction type.");
  }

  const requestedStatus = parseAccountingStatus(input.status);
  const paymentMethod = parsePaymentMethod(input.paymentMethod);
  const accountingDate = parseOptionalDate(input.accountingDate);

  if (!accountingDate) {
    throw new Error("Accounting date is required.");
  }

  const relatedTransaction = input.relatedTransactionId
    ? await tx.transaction.findFirst({
        where: {
          id: input.relatedTransactionId,
          organizationId: input.organizationId
        },
        select: {
          id: true,
          officeId: true,
          title: true,
          address: true,
          city: true,
          state: true
        }
      })
    : null;

  if (input.relatedTransactionId && !relatedTransaction) {
    throw new Error("Linked transaction was not found in the current organization scope.");
  }

  const relatedMembership = input.relatedMembershipId
    ? await tx.membership.findFirst({
        where: {
          id: input.relatedMembershipId,
          organizationId: input.organizationId
        },
        select: {
          id: true
        }
      })
    : null;

  if (input.relatedMembershipId && !relatedMembership) {
    throw new Error("Selected agent was not found in the current organization scope.");
  }

  const systemAccounts = await getSystemAccounts(tx, input.organizationId);
  const normalizedLineItems = normalizeTypeAwareLineItems(type, input.lineItems ?? []);
  await resolveLineItemAccounts(tx, input.organizationId, normalizedLineItems);

  const explicitTotalAmount = parseOptionalDecimal(input.totalAmount);
  const computedLineItemTotal = assertBalancedLines(type, normalizedLineItems);
  const usesLineItems = ["invoice", "bill", "deposit", "refund", "journal_entry", "transfer", "credit_memo"].includes(type);
  const totalAmount = usesLineItems ? computedLineItemTotal : explicitTotalAmount;

  if (!totalAmount || totalAmount.lte(0)) {
    throw new Error("A positive accounting amount is required.");
  }

  const status = requestedStatus ?? getDefaultTransactionStatus(type);
  const postingLines = status === "draft" || status === "void"
    ? []
    : buildLedgerEntriesForTransaction({
        type,
        totalAmount,
        lineItems: normalizedLineItems,
        systemAccounts,
        relatedTransactionId: relatedTransaction?.id ?? null,
        memo: parseOptionalText(input.memo)
      });

  const existing = input.accountingTransactionId
    ? await tx.accountingTransaction.findFirst({
        where: {
          id: input.accountingTransactionId,
          organizationId: input.organizationId
        },
        include: {
          relatedTransaction: {
            select: {
              title: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      })
    : null;

  const saved = existing
    ? await tx.accountingTransaction.update({
        where: {
          id: existing.id
        },
        data: {
          officeId: input.officeId ?? relatedTransaction?.officeId ?? null,
          relatedTransactionId: relatedTransaction?.id ?? null,
          relatedMembershipId: relatedMembership?.id ?? null,
          type,
          status,
          accountingDate,
          dueDate: parseOptionalDate(input.dueDate),
        paymentMethod,
        referenceNumber: parseOptionalText(input.referenceNumber),
        counterpartyName: parseOptionalText(input.counterpartyName),
        memo: parseOptionalText(input.memo),
        notes: parseOptionalText(input.notes),
        isAgentBilling: input.isAgentBilling ?? existing.isAgentBilling,
        billingCategory: input.billingCategory !== undefined ? parseOptionalText(input.billingCategory) : existing.billingCategory,
        originRecurringChargeRuleId: input.originRecurringChargeRuleId ?? existing.originRecurringChargeRuleId,
        totalAmount,
        postedAt: status === "draft" || status === "void" ? null : new Date()
      },
        include: {
          relatedTransaction: {
            select: {
              title: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      })
    : await tx.accountingTransaction.create({
        data: {
          organizationId: input.organizationId,
          officeId: input.officeId ?? relatedTransaction?.officeId ?? null,
          relatedTransactionId: relatedTransaction?.id ?? null,
          relatedMembershipId: relatedMembership?.id ?? null,
          type,
          status,
          accountingDate,
          dueDate: parseOptionalDate(input.dueDate),
          paymentMethod,
          referenceNumber: parseOptionalText(input.referenceNumber),
          counterpartyName: parseOptionalText(input.counterpartyName),
          memo: parseOptionalText(input.memo),
          notes: parseOptionalText(input.notes),
          isAgentBilling: input.isAgentBilling ?? false,
          billingCategory: parseOptionalText(input.billingCategory),
          originRecurringChargeRuleId: input.originRecurringChargeRuleId ?? null,
          totalAmount,
          createdByMembershipId: input.createdByMembershipId,
          postedAt: status === "draft" || status === "void" ? null : new Date()
        },
        include: {
          relatedTransaction: {
            select: {
              title: true,
              address: true,
              city: true,
              state: true
            }
          }
        }
      });

  await tx.accountingTransactionLineItem.deleteMany({
    where: {
      organizationId: input.organizationId,
      accountingTransactionId: saved.id
    }
  });

  await tx.generalLedgerEntry.deleteMany({
    where: {
      organizationId: input.organizationId,
      accountingTransactionId: saved.id
    }
  });

  if (normalizedLineItems.length) {
    await tx.accountingTransactionLineItem.createMany({
      data: normalizedLineItems.map((lineItem) => ({
        organizationId: input.organizationId,
        officeId: input.officeId ?? relatedTransaction?.officeId ?? null,
        accountingTransactionId: saved.id,
        relatedTransactionId: relatedTransaction?.id ?? null,
        ledgerAccountId: lineItem.ledgerAccountId,
        description: lineItem.description,
        entrySide: lineItem.entrySide,
        amount: lineItem.amount,
        sortOrder: lineItem.sortOrder
      }))
    });
  }

  if (postingLines.length) {
    await tx.generalLedgerEntry.createMany({
      data: postingLines.map((postingLine) => ({
        organizationId: input.organizationId,
        officeId: input.officeId ?? relatedTransaction?.officeId ?? null,
        accountingTransactionId: saved.id,
        relatedTransactionId: relatedTransaction?.id ?? null,
        accountId: postingLine.accountId,
        entryDate: accountingDate,
        debitAmount: postingLine.debitAmount,
        creditAmount: postingLine.creditAmount,
        memo: postingLine.memo
      }))
    });
  }

  const changes = existing
    ? [
        ...buildAccountingChanges(accountingTypeLabelMap[existing.type], accountingTypeLabelMap[type], "Type"),
        ...buildAccountingChanges(accountingStatusLabelMap[existing.status], accountingStatusLabelMap[status], "Status"),
        ...buildAccountingChanges(formatCurrency(existing.totalAmount), formatCurrency(totalAmount), "Amount")
      ]
    : [];

  await recordActivityLogEvent(tx, {
    organizationId: input.organizationId,
    membershipId: input.actorMembershipId ?? input.createdByMembershipId,
    entityType: "accounting_transaction",
    entityId: saved.id,
    action: input.activityActionOverride ?? (existing ? activityLogActions.accountingTransactionUpdated : getActivityActionForAccountingType(type)),
    payload: {
      officeId: saved.officeId,
      objectLabel: buildAccountingTransactionLabel(saved),
      transactionId: relatedTransaction?.id ?? undefined,
      transactionLabel: relatedTransaction
        ? `${relatedTransaction.title} · ${relatedTransaction.address}, ${relatedTransaction.city}, ${relatedTransaction.state}`
        : undefined,
      contextHref: input.activityContextHref,
      details: [
        `Type: ${accountingTypeLabelMap[type]}`,
        `Status: ${accountingStatusLabelMap[status]}`,
        `Amount: ${formatCurrency(totalAmount)}`
      ],
      changes
    }
  });

  return saved.id;
}

async function createEarningMoneyLedgerTransaction(
  tx: Prisma.TransactionClient,
  input: SaveAccountingTransactionInput
) {
  return saveAccountingTransactionInternal(tx, input);
}

export async function getOfficeAccountingSnapshot(input: GetOfficeAccountingSnapshotInput): Promise<OfficeAccountingSnapshot> {
  const transactionWhere = buildAccountingTransactionWhere(input);
  const earnestMoneyWhere = buildEarnestMoneyWhere(input);

  const [transactions, ledgerEntries, chartAccounts, earnestMoneyRecords, ownerMemberships, transactionOptions] = await Promise.all([
    prisma.accountingTransaction.findMany({
      where: transactionWhere,
      include: {
        relatedTransaction: {
          include: {
            ownerMembership: {
              include: {
                user: true
              }
            }
          }
        },
        relatedMembership: {
          include: {
            user: true
          }
        },
        createdByMembership: {
          include: {
            user: true
          }
        },
        lineItems: {
          include: {
            ledgerAccount: true
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      },
      orderBy: [{ accountingDate: "desc" }, { createdAt: "desc" }],
      take: 200
    }),
    prisma.generalLedgerEntry.findMany({
      where: {
        organizationId: input.organizationId,
        ...buildScopedOfficeWhere(input.officeId),
        ...(input.startDate || input.endDate
          ? {
              entryDate: {
                ...(startOfDay(input.startDate) ? { gte: startOfDay(input.startDate)! } : {}),
                ...(endOfDay(input.endDate) ? { lte: endOfDay(input.endDate)! } : {})
              }
            }
          : {})
      },
      include: {
        account: true,
        accountingTransaction: true
      },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      take: 50
    }),
    prisma.ledgerAccount.findMany({
      where: {
        organizationId: input.organizationId,
        ...buildScopedOfficeWhere(input.officeId)
      },
      orderBy: [{ isSystem: "desc" }, { code: "asc" }, { name: "asc" }]
    }),
    prisma.earnestMoneyRecord.findMany({
      where: earnestMoneyWhere,
      include: {
        transaction: true
      },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: "active",
        ...(input.officeId ? { officeId: input.officeId } : {})
      },
      include: {
        user: true
      },
      orderBy: [{ user: { firstName: "asc" } }]
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.officeId ? { officeId: input.officeId } : {})
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        state: true
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    })
  ]);

  const selectedTransaction = input.entryId
    ? transactions.find((transaction) => transaction.id === input.entryId) ?? null
    : null;
  const derivedEarnestMoneyRecords = earnestMoneyRecords.map((record) => ({
    ...record,
    status: deriveEarnestMoneyStatus(record)
  }));
  const officeNetLedgerImpact = buildLedgerImpact(ledgerEntries);
  const totalInvoices = transactions.filter((transaction) => transaction.type === "invoice").length;
  const openBills = transactions.filter((transaction) => transaction.type === "bill" && transaction.status === "open").length;
  const receivedPaymentsTotal = transactions
    .filter((transaction) => transaction.type === "received_payment")
    .reduce((sum, transaction) => sum.plus(transaction.totalAmount), new Prisma.Decimal(0));
  const madePaymentsTotal = transactions
    .filter((transaction) => transaction.type === "made_payment")
    .reduce((sum, transaction) => sum.plus(transaction.totalAmount), new Prisma.Decimal(0));
  const outstandingEmdCount = derivedEarnestMoneyRecords.filter((record) => record.status !== "complete").length;
  const overdueEmdCount = derivedEarnestMoneyRecords.filter((record) => record.status === "overdue").length;

  return {
    overview: {
      totalInvoices,
      openBills,
      receivedPaymentsLabel: formatCurrency(receivedPaymentsTotal),
      madePaymentsLabel: formatCurrency(madePaymentsTotal),
      officeNetLedgerImpactLabel: formatCurrency(officeNetLedgerImpact),
      outstandingEmdCount,
      overdueEmdCount
    },
    filters: {
      type: input.type ?? "",
      status: input.status ?? "",
      startDate: input.startDate ?? "",
      endDate: input.endDate ?? "",
      ownerMembershipId: input.ownerMembershipId ?? "",
      q: input.q ?? "",
      entryId: input.entryId ?? "",
      ownerOptions: ownerMemberships.map((membership) => ({
        id: membership.id,
        label: `${membership.user.firstName} ${membership.user.lastName}`
      })),
      transactionOptions: transactionOptions.map((transaction) => ({
        id: transaction.id,
        label: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`
      }))
    },
    transactions: transactions.map(mapAccountingRow),
    selectedTransaction: selectedTransaction ? mapAccountingDetail(selectedTransaction) : null,
    earnestMoneyRecords: derivedEarnestMoneyRecords.map(mapEarnestMoneyRecord),
    chartAccounts: chartAccounts.map((account) => ({
      id: account.id,
      code: account.code ?? "",
      name: account.name,
      accountType: ledgerAccountTypeLabelMap[account.accountType],
      isSystem: account.isSystem,
      isActive: account.isActive
    })),
    generalLedgerEntries: ledgerEntries.map((entry) => ({
      id: entry.id,
      entryDate: formatDateValue(entry.entryDate),
      accountLabel: entry.account.code ? `${entry.account.code} · ${entry.account.name}` : entry.account.name,
      debitAmount: formatCurrency(entry.debitAmount),
      creditAmount: formatCurrency(entry.creditAmount),
      memo: entry.memo ?? "",
      accountingTransactionLabel: buildAccountingTransactionLabel(entry.accountingTransaction),
      accountingTransactionHref: `/office/accounting?entryId=${entry.accountingTransactionId}`
    })),
    accountOptions: chartAccounts
      .filter((account) => account.isActive)
      .map((account) => ({
        id: account.id,
        label: account.code ? `${account.code} · ${account.name}` : account.name,
        accountType: account.accountType
      })),
    memberOptions: ownerMemberships.map((membership) => ({
      id: membership.id,
      label: `${membership.user.firstName} ${membership.user.lastName}`
    }))
  };
}

export async function createAccountingTransaction(input: SaveAccountingTransactionInput) {
  const transactionId = await prisma.$transaction((tx) => saveAccountingTransactionInternal(tx, input));

  const saved = await prisma.accountingTransaction.findUnique({
    where: {
      id: transactionId
    },
    include: {
      lineItems: {
        include: {
          ledgerAccount: true
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!saved) {
    throw new Error("Accounting transaction could not be loaded after creation.");
  }

  return mapAccountingDetail(saved);
}

export async function updateAccountingTransaction(input: SaveAccountingTransactionInput) {
  if (!input.accountingTransactionId) {
    throw new Error("Accounting transaction id is required for updates.");
  }

  const transactionId = await prisma.$transaction((tx) => saveAccountingTransactionInternal(tx, input));
  const saved = await prisma.accountingTransaction.findUnique({
    where: {
      id: transactionId
    },
    include: {
      lineItems: {
        include: {
          ledgerAccount: true
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return saved ? mapAccountingDetail(saved) : null;
}

export async function createEarnestMoneyRecord(input: CreateEarnestMoneyRecordInput) {
  const dueAt = parseOptionalDate(input.dueAt);
  const expectedAmount = parseOptionalDecimal(input.expectedAmount);

  if (!dueAt || !expectedAmount || expectedAmount.lte(0)) {
    throw new Error("Expected amount and due date are required for earnest money.");
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      organizationId: input.organizationId
    },
    select: {
      id: true,
      officeId: true,
      title: true,
      address: true,
      city: true,
      state: true
    }
  });

  if (!transaction) {
    throw new Error("Transaction was not found in the current organization scope.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const derivedStatus = deriveEarnestMoneyStatus({
      dueAt,
      receivedAmount: new Prisma.Decimal(0),
      refundedAmount: new Prisma.Decimal(0),
      paymentDate: null,
      depositDate: null
    });

    const record = await tx.earnestMoneyRecord.upsert({
      where: {
        transactionId: transaction.id
      },
      update: {
        expectedAmount,
        dueAt,
        heldByOffice: input.heldByOffice ?? true,
        heldExternally: input.heldExternally ?? false,
        trackInLedger: input.trackInLedger ?? true,
        status: derivedStatus,
        notes: parseOptionalText(input.notes)
      },
      create: {
        organizationId: input.organizationId,
        officeId: input.officeId ?? transaction.officeId ?? null,
        transactionId: transaction.id,
        expectedAmount,
        dueAt,
        heldByOffice: input.heldByOffice ?? true,
        heldExternally: input.heldExternally ?? false,
        trackInLedger: input.trackInLedger ?? true,
        status: derivedStatus,
        notes: parseOptionalText(input.notes),
        createdByMembershipId: input.createdByMembershipId
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId ?? input.createdByMembershipId,
      entityType: "earnest_money",
      entityId: record.id,
      action: activityLogActions.emdExpectedCreated,
      payload: {
        officeId: transaction.officeId,
        transactionId: transaction.id,
        transactionLabel: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`,
        objectLabel: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`,
        contextHref: "/office/accounting#earnest-money",
        details: [`Expected amount: ${formatCurrency(expectedAmount)}`, `Due: ${formatDateLabel(dueAt)}`]
      }
    });

    return record;
  });

  return created;
}

export async function updateEarnestMoneyRecord(input: UpdateEarnestMoneyRecordInput) {
  const existing = await prisma.earnestMoneyRecord.findFirst({
    where: {
      id: input.earnestMoneyRecordId,
      organizationId: input.organizationId
    },
    include: {
      transaction: {
        select: {
          id: true,
          officeId: true,
          title: true,
          address: true,
          city: true,
          state: true
        }
      }
    }
  });

  if (!existing) {
    return null;
  }

  const nextExpectedAmount = parseOptionalDecimal(input.expectedAmount) ?? existing.expectedAmount;
  const nextDueAt = parseOptionalDate(input.dueAt) ?? existing.dueAt;
  const nextReceivedAmount = parseOptionalDecimal(input.receivedAmount) ?? existing.receivedAmount;
  const nextRefundedAmount = parseOptionalDecimal(input.refundedAmount) ?? existing.refundedAmount;
  const nextPaymentDate = parseOptionalDate(input.paymentDate) ?? existing.paymentDate;
  const nextDepositDate = parseOptionalDate(input.depositDate) ?? existing.depositDate;
  const nextTrackInLedger = input.trackInLedger ?? existing.trackInLedger;
  const nextStatus = deriveEarnestMoneyStatus({
    dueAt: nextDueAt,
    receivedAmount: nextReceivedAmount,
    refundedAmount: nextRefundedAmount,
    paymentDate: nextPaymentDate,
    depositDate: nextDepositDate
  });

  const receivedDelta = Number(nextReceivedAmount.minus(existing.receivedAmount));
  const refundedDelta = Number(nextRefundedAmount.minus(existing.refundedAmount));

  const updated = await prisma.$transaction(async (tx) => {
    const ledgerActorMembershipId = input.actorMembershipId ?? existing.createdByMembershipId;

    if ((receivedDelta > 0 || refundedDelta > 0) && nextTrackInLedger && !ledgerActorMembershipId) {
      throw new Error("A membership context is required to post earnest money ledger activity.");
    }

    const saved = await tx.earnestMoneyRecord.update({
      where: {
        id: existing.id
      },
      data: {
        expectedAmount: nextExpectedAmount,
        dueAt: nextDueAt,
        receivedAmount: nextReceivedAmount,
        refundedAmount: nextRefundedAmount,
        paymentDate: nextPaymentDate,
        depositDate: nextDepositDate,
        heldByOffice: input.heldByOffice ?? existing.heldByOffice,
        heldExternally: input.heldExternally ?? existing.heldExternally,
        trackInLedger: nextTrackInLedger,
        status: nextStatus,
        notes: input.notes !== undefined ? parseOptionalText(input.notes) : existing.notes
      }
    });

    if (receivedDelta > 0 && nextTrackInLedger) {
      await createEarningMoneyLedgerTransaction(tx, {
        organizationId: input.organizationId,
        officeId: input.officeId ?? existing.officeId ?? existing.transaction.officeId ?? null,
        relatedTransactionId: existing.transaction.id,
        type: "deposit",
        accountingDate: formatDateValue(nextDepositDate ?? nextPaymentDate ?? new Date()),
        paymentMethod: "check",
        counterpartyName: existing.transaction.title,
        memo: "Earnest money received",
        totalAmount: String(receivedDelta),
        lineItems: [
          {
            ledgerAccountId: (await getSystemAccounts(tx, input.organizationId)).earnestMoneyLiability.id,
            description: "Earnest money liability",
            amount: String(receivedDelta)
          }
        ],
        createdByMembershipId: ledgerActorMembershipId!,
        actorMembershipId: input.actorMembershipId
      });
    }

    if (refundedDelta > 0 && nextTrackInLedger) {
      await createEarningMoneyLedgerTransaction(tx, {
        organizationId: input.organizationId,
        officeId: input.officeId ?? existing.officeId ?? existing.transaction.officeId ?? null,
        relatedTransactionId: existing.transaction.id,
        type: "refund",
        accountingDate: formatDateValue(nextDepositDate ?? new Date()),
        paymentMethod: "check",
        counterpartyName: existing.transaction.title,
        memo: "Earnest money refund or distribution",
        totalAmount: String(refundedDelta),
        lineItems: [
          {
            ledgerAccountId: (await getSystemAccounts(tx, input.organizationId)).earnestMoneyLiability.id,
            description: "Earnest money liability release",
            amount: String(refundedDelta)
          }
        ],
        createdByMembershipId: ledgerActorMembershipId!,
        actorMembershipId: input.actorMembershipId
      });
    }

    if (receivedDelta > 0) {
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? existing.createdByMembershipId,
        entityType: "earnest_money",
        entityId: existing.id,
        action: activityLogActions.emdReceived,
        payload: {
          officeId: existing.transaction.officeId,
          transactionId: existing.transaction.id,
          transactionLabel: `${existing.transaction.title} · ${existing.transaction.address}, ${existing.transaction.city}, ${existing.transaction.state}`,
          objectLabel: `${existing.transaction.title} · ${existing.transaction.address}, ${existing.transaction.city}, ${existing.transaction.state}`,
          contextHref: "/office/accounting#earnest-money",
          details: [`Received amount: ${formatCurrency(receivedDelta)}`, `Status: ${earnestMoneyStatusLabelMap[nextStatus]}`]
        }
      });
    }

    if (refundedDelta > 0) {
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? existing.createdByMembershipId,
        entityType: "earnest_money",
        entityId: existing.id,
        action: activityLogActions.emdRefunded,
        payload: {
          officeId: existing.transaction.officeId,
          transactionId: existing.transaction.id,
          transactionLabel: `${existing.transaction.title} · ${existing.transaction.address}, ${existing.transaction.city}, ${existing.transaction.state}`,
          objectLabel: `${existing.transaction.title} · ${existing.transaction.address}, ${existing.transaction.city}, ${existing.transaction.state}`,
          contextHref: "/office/accounting#earnest-money",
          details: [`Refunded or distributed: ${formatCurrency(refundedDelta)}`, `Status: ${earnestMoneyStatusLabelMap[nextStatus]}`]
        }
      });
    }

    return saved;
  });

  return updated;
}
