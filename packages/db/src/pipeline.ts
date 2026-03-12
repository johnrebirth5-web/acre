import { Prisma, TransactionRepresenting, TransactionStatus } from "@prisma/client";
import { prisma } from "./client";

export type OfficePipelineStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";
export type OfficePipelineHistoryStatus = Extract<OfficePipelineStatus, "Closed" | "Cancelled">;
export type OfficePipelineMetricMode = "transaction_volume" | "office_net" | "office_gross";
export type OfficePipelineRepresentingFilter = TransactionRepresenting | "all";

export type OfficePipelineOwnerOption = {
  id: string;
  label: string;
};

export type OfficePipelineFunnelBucket = {
  status: Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">;
  count: number;
  metricLabel: string;
};

export type OfficePipelineHistoryBucket = {
  status: OfficePipelineHistoryStatus;
  count: number;
  metricLabel: string;
};

export type OfficePipelineHistoryMonth = {
  monthKey: string;
  label: string;
  buckets: OfficePipelineHistoryBucket[];
};

export type OfficePipelineWorkspaceRow = {
  id: string;
  title: string;
  addressLine: string;
  cityState: string;
  status: OfficePipelineStatus;
  representing: string;
  owner: string;
  priceLabel: string;
  metricValueLabel: string;
  closingOrImportantLabel: string;
  updatedLabel: string;
};

export type OfficePipelineWorkspaceSnapshot = {
  filters: {
    search: string;
    representing: OfficePipelineRepresentingFilter;
    ownerMembershipId: string;
    metricMode: OfficePipelineMetricMode;
    ownerOptions: OfficePipelineOwnerOption[];
    stage: Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending"> | "";
    historyStatus: OfficePipelineHistoryStatus | "";
    historyMonth: string;
  };
  metricModeLabel: string;
  metricModeDescription: string;
  selection: {
    kind: "all" | "stage" | "history";
    label: string;
    note: string;
    contextChips: string[];
  };
  allTransactionsSummary: {
    count: number;
    metricLabel: string;
  };
  funnelBuckets: OfficePipelineFunnelBucket[];
  historyMonths: OfficePipelineHistoryMonth[];
  listSummary: {
    totalCount: number;
    metricLabel: string;
  };
  rows: OfficePipelineWorkspaceRow[];
};

export type GetOfficePipelineWorkspaceInput = {
  organizationId: string;
  officeId?: string | null;
  search?: string;
  representing?: string;
  ownerMembershipId?: string;
  metricMode?: string;
  stage?: string;
  historyStatus?: string;
  historyMonth?: string;
};

type PipelineWorkspaceTransaction = {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: Prisma.Decimal | null;
  grossCommission: Prisma.Decimal | null;
  officeNet: Prisma.Decimal | null;
  importantDate: Date | null;
  closingDate: Date | null;
  updatedAt: Date;
  status: TransactionStatus;
  representing: TransactionRepresenting;
  ownerMembershipId: string | null;
  ownerMembership: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
};

const activePipelineStatuses: Array<Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">> = [
  "Opportunity",
  "Active",
  "Pending"
];
const historyPipelineStatuses: OfficePipelineHistoryStatus[] = ["Closed", "Cancelled"];
const pipelineHistoryWindowMonths = 6;

const pipelineStatusFromDb: Record<TransactionStatus, OfficePipelineStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const representingLabelMap: Record<TransactionRepresenting, string> = {
  buyer: "Buyer",
  seller: "Seller",
  both: "Both",
  tenant: "Tenant",
  landlord: "Landlord"
};

const metricModeLabels: Record<OfficePipelineMetricMode, string> = {
  transaction_volume: "Transaction volume",
  office_net: "Office net",
  office_gross: "Office gross"
};

function normalizeRepresentingFilter(value: string | undefined): OfficePipelineRepresentingFilter {
  if (!value || value === "all") {
    return "all";
  }

  return ["buyer", "seller", "both", "tenant", "landlord"].includes(value) ? (value as TransactionRepresenting) : "all";
}

function normalizeMetricMode(value: string | undefined): OfficePipelineMetricMode {
  if (value === "office_net") {
    return "office_net";
  }

  if (value === "office_gross") {
    return "office_gross";
  }

  return "transaction_volume";
}

function normalizeStage(value: string | undefined): Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending"> | "" {
  return activePipelineStatuses.includes(value as Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">)
    ? (value as Extract<OfficePipelineStatus, "Opportunity" | "Active" | "Pending">)
    : "";
}

function normalizeHistoryStatus(value: string | undefined): OfficePipelineHistoryStatus | "" {
  return historyPipelineStatuses.includes(value as OfficePipelineHistoryStatus) ? (value as OfficePipelineHistoryStatus) : "";
}

function normalizeHistoryMonth(value: string | undefined) {
  if (!value) {
    return "";
  }

  return /^\d{4}-\d{2}$/.test(value) ? value : "";
}

function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatDateLabel(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
}

function getTransactionMetricValue(
  transaction: Pick<PipelineWorkspaceTransaction, "price" | "grossCommission" | "officeNet">,
  metricMode: OfficePipelineMetricMode
) {
  if (metricMode === "office_net") {
    return Number(transaction.officeNet ?? 0);
  }

  if (metricMode === "office_gross") {
    return Number(transaction.grossCommission ?? 0);
  }

  return Number(transaction.price ?? 0);
}

function getMonthlyRollupDate(transaction: Pick<PipelineWorkspaceTransaction, "closingDate" | "updatedAt">) {
  return transaction.closingDate ?? transaction.updatedAt;
}

function getMonthlyRollupKey(transaction: Pick<PipelineWorkspaceTransaction, "closingDate" | "updatedAt">) {
  return getMonthlyRollupDate(transaction).toISOString().slice(0, 7);
}

function buildTopLevelWhere(input: GetOfficePipelineWorkspaceInput, representing: OfficePipelineRepresentingFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    organizationId: input.organizationId
  };

  if (input.officeId) {
    where.officeId = input.officeId;
  }

  if (representing !== "all") {
    where.representing = representing;
  }

  if (input.ownerMembershipId?.trim()) {
    where.ownerMembershipId = input.ownerMembershipId.trim();
  }

  if (input.search?.trim()) {
    const query = input.search.trim();

    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { state: { contains: query, mode: "insensitive" } },
      { zipCode: { contains: query, mode: "insensitive" } },
      {
        ownerMembership: {
          user: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      }
    ];
  }

  return where;
}

function buildHistoryMonthKeys() {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let index = 0; index < pipelineHistoryWindowMonths; index += 1) {
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    keys.push(monthKey);
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return keys;
}

function buildOwnerLabel(transaction: PipelineWorkspaceTransaction) {
  return transaction.ownerMembership
    ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
    : "Unassigned";
}

function buildSelectionState(
  stage: OfficePipelineWorkspaceSnapshot["filters"]["stage"],
  historyStatus: OfficePipelineWorkspaceSnapshot["filters"]["historyStatus"],
  historyMonth: string,
  contextChips: string[]
) {
  if (stage) {
    return {
      kind: "stage" as const,
      label: `${stage} pipeline`,
      note: "Showing the current filtered transaction list for the selected funnel stage.",
      contextChips
    };
  }

  if (historyStatus && historyMonth) {
    return {
      kind: "history" as const,
      label: `${historyStatus} · ${formatMonthLabel(historyMonth)}`,
      note: "Closed / cancelled history uses closing date when available, otherwise updated date as the documented fallback.",
      contextChips
    };
  }

  return {
    kind: "all" as const,
    label: "All transactions",
    note: "Showing all transactions in the current pipeline workspace filters.",
    contextChips
  };
}

function buildMetricModeDescription(metricMode: OfficePipelineMetricMode) {
  if (metricMode === "office_net") {
    return "Uses stored office net values from transaction finance and commission workflow outputs; missing values are treated as zero.";
  }

  if (metricMode === "office_gross") {
    return "Uses stored gross commission values from transaction finance; transactions without gross commission data are treated as zero.";
  }

  return "Uses transaction price as the current pipeline volume metric.";
}

function mapPipelineRow(transaction: PipelineWorkspaceTransaction, metricMode: OfficePipelineMetricMode): OfficePipelineWorkspaceRow {
  const detailDate = transaction.closingDate
    ? `Closing ${formatDateLabel(transaction.closingDate)}`
    : transaction.importantDate
      ? `Important ${formatDateLabel(transaction.importantDate)}`
      : "—";

  return {
    id: transaction.id,
    title: transaction.title,
    addressLine: transaction.address,
    cityState: `${transaction.city}, ${transaction.state} ${transaction.zipCode}`,
    status: pipelineStatusFromDb[transaction.status],
    representing: representingLabelMap[transaction.representing],
    owner: buildOwnerLabel(transaction),
    priceLabel: formatCurrency(transaction.price),
    metricValueLabel: formatCurrency(getTransactionMetricValue(transaction, metricMode)),
    closingOrImportantLabel: detailDate,
    updatedLabel: formatDateLabel(transaction.updatedAt)
  };
}

export async function getOfficePipelineWorkspaceSnapshot(
  input: GetOfficePipelineWorkspaceInput
): Promise<OfficePipelineWorkspaceSnapshot> {
  const representing = normalizeRepresentingFilter(input.representing);
  const metricMode = normalizeMetricMode(input.metricMode);
  const stage = normalizeStage(input.stage);
  const historyStatus = normalizeHistoryStatus(input.historyStatus);
  const historyMonth = normalizeHistoryMonth(input.historyMonth);
  const where = buildTopLevelWhere(input, representing);

  const [transactions, ownerMemberships] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        ownerMembership: {
          include: {
            user: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: "active",
        ...(input.officeId ? { officeId: input.officeId } : {}),
        transactionsOwned: {
          some: {
            organizationId: input.organizationId,
            ...(input.officeId ? { officeId: input.officeId } : {})
          }
        }
      },
      include: {
        user: true
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }]
    })
  ]);

  const ownerOptions = ownerMemberships.map((membership) => ({
    id: membership.id,
    label: `${membership.user.firstName} ${membership.user.lastName}`
  }));
  const ownerFilterLabel = input.ownerMembershipId?.trim()
    ? ownerOptions.find((option) => option.id === input.ownerMembershipId?.trim())?.label ?? "Selected owner"
    : "Any owner / agent";
  const representingFilterLabel = representing === "all" ? "Any side" : `${representingLabelMap[representing]} side`;
  const selectionContextChips = [
    representingFilterLabel,
    ownerFilterLabel,
    `Metric: ${metricModeLabels[metricMode]}`,
    ...(input.search?.trim() ? [`Search: ${input.search.trim()}`] : [])
  ];

  const funnelBuckets = activePipelineStatuses.map((currentStatus) => {
    const scopedTransactions = transactions.filter((transaction) => pipelineStatusFromDb[transaction.status] === currentStatus);
    const totalMetric = scopedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

    return {
      status: currentStatus,
      count: scopedTransactions.length,
      metricLabel: formatCurrency(totalMetric)
    };
  });

  const historyMonthKeys = buildHistoryMonthKeys();
  const historyMonths = historyMonthKeys
    .map((monthKey) => {
      const buckets = historyPipelineStatuses.map((currentStatus) => {
        const scopedTransactions = transactions.filter(
          (transaction) =>
            pipelineStatusFromDb[transaction.status] === currentStatus && getMonthlyRollupKey(transaction) === monthKey
        );
        const totalMetric = scopedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

        return {
          status: currentStatus,
          count: scopedTransactions.length,
          metricLabel: formatCurrency(totalMetric)
        };
      });

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        buckets
      };
    })
    .filter((month) => month.buckets.some((bucket) => bucket.count > 0) || month.monthKey === historyMonth);

  const selection = buildSelectionState(stage, historyStatus, historyMonth, selectionContextChips);

  const selectedTransactions = transactions
    .filter((transaction) => {
      if (stage) {
        return pipelineStatusFromDb[transaction.status] === stage;
      }

      if (historyStatus && historyMonth) {
        return pipelineStatusFromDb[transaction.status] === historyStatus && getMonthlyRollupKey(transaction) === historyMonth;
      }

      return true;
    })
    .sort((left, right) => {
      if (historyStatus && historyMonth) {
        return getMonthlyRollupDate(right).getTime() - getMonthlyRollupDate(left).getTime();
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    });

  const totalMetric = selectedTransactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);
  const allTransactionsMetric = transactions.reduce((sum, transaction) => sum + getTransactionMetricValue(transaction, metricMode), 0);

  return {
    filters: {
      search: input.search?.trim() ?? "",
      representing,
      ownerMembershipId: input.ownerMembershipId?.trim() ?? "",
      metricMode,
      ownerOptions,
      stage,
      historyStatus,
      historyMonth
    },
    metricModeLabel: metricModeLabels[metricMode],
    metricModeDescription: buildMetricModeDescription(metricMode),
    selection,
    allTransactionsSummary: {
      count: transactions.length,
      metricLabel: formatCurrency(allTransactionsMetric)
    },
    funnelBuckets,
    historyMonths,
    listSummary: {
      totalCount: selectedTransactions.length,
      metricLabel: formatCurrency(totalMetric)
    },
    rows: selectedTransactions.map((transaction) => mapPipelineRow(transaction, metricMode))
  };
}
