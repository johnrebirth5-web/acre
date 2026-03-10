import { Prisma, TransactionStatus, UserRole } from "@prisma/client";
import { prisma } from "./client";

export type OfficeReportStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";

export type OfficeReportOwnerMetric = {
  ownerMembershipId: string | null;
  ownerName: string;
  transactionCount: number;
  totalVolumeLabel: string;
};

export type OfficeReportTimePoint = {
  label: string;
  transactionCount: number;
};

export type OfficeReportOwnerOption = {
  id: string;
  label: string;
};

export type OfficeReportsFilters = {
  startDate: string;
  endDate: string;
  ownerMembershipId: string;
  ownerOptions: OfficeReportOwnerOption[];
};

export type OfficeReportsSnapshot = {
  filters: OfficeReportsFilters;
  totals: {
    totalTransactions: number;
    contactsNeedingFollowUp: number;
    totalVolumeLabel: string;
    activeOwnerCount: number;
  };
  transactionsByStatus: Array<{
    status: OfficeReportStatus;
    count: number;
  }>;
  transactionsByOwner: OfficeReportOwnerMetric[];
  transactionsOverTime: OfficeReportTimePoint[];
};

export type OfficeReportTransactionExportRow = {
  transactionId: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: OfficeReportStatus;
  representing: string;
  owner: string;
  primaryContact: string;
  price: string;
  grossCommission: string;
  referralFee: string;
  officeNet: string;
  agentNet: string;
  importantDate: string;
  closingDate: string;
  createdAt: string;
  updatedAt: string;
};

export type GetOfficeReportsSnapshotInput = {
  organizationId: string;
  officeId?: string | null;
  startDate?: string;
  endDate?: string;
  ownerMembershipId?: string;
};

const reportStatusOrder: OfficeReportStatus[] = ["Opportunity", "Active", "Pending", "Closed", "Cancelled"];

const statusFromDb: Record<TransactionStatus, OfficeReportStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const typeFromDb = {
  sales: "Sales",
  sales_listing: "Sales (listing)",
  rental_leasing: "Rental/Leasing",
  rental_listing: "Rental (listing)",
  commercial_sales: "Commercial Sales",
  commercial_lease: "Commercial Lease",
  other: "Other"
} as const;

const representingFromDb = {
  buyer: "buyer",
  seller: "seller",
  both: "both",
  tenant: "tenant",
  landlord: "landlord"
} as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

function formatCurrencyFromDb(value: Prisma.Decimal | null) {
  return value ? formatCurrency(Number(value)) : "";
}

function startOfDay(input: string | undefined) {
  if (!input?.trim()) {
    return null;
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(input: string | undefined) {
  if (!input?.trim()) {
    return null;
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

function buildTransactionWhere(input: GetOfficeReportsSnapshotInput): Prisma.TransactionWhereInput {
  const startDate = startOfDay(input.startDate);
  const endDate = endOfDay(input.endDate);

  return {
    organizationId: input.organizationId,
    ...(input.officeId ? { officeId: input.officeId } : {}),
    ...(input.ownerMembershipId ? { ownerMembershipId: input.ownerMembershipId } : {}),
    ...((startDate || endDate)
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        }
      : {})
  };
}

function buildClientWhere(input: GetOfficeReportsSnapshotInput): Prisma.ClientWhereInput {
  return {
    organizationId: input.organizationId,
    ...(input.ownerMembershipId ? { ownerMembershipId: input.ownerMembershipId } : {}),
    ...(input.officeId
      ? {
          ownerMembership: {
            is: {
              officeId: input.officeId
            }
          }
        }
      : {})
  };
}

function buildTimeSeries(transactions: Array<{ createdAt: Date }>, startDate: Date | null, endDate: Date | null): OfficeReportTimePoint[] {
  const rangeStart = startDate ?? new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const rangeEnd = endDate ?? new Date();
  const bucketStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const bucketEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
  const points: OfficeReportTimePoint[] = [];

  const cursor = new Date(bucketStart);

  while (cursor <= bucketEnd) {
    const label = cursor.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
    const count = transactions.filter(
      (transaction) =>
        transaction.createdAt.getFullYear() === cursor.getFullYear() && transaction.createdAt.getMonth() === cursor.getMonth()
    ).length;

    points.push({
      label,
      transactionCount: count
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
}

function formatDateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export async function getOfficeReportsSnapshot(input: GetOfficeReportsSnapshotInput): Promise<OfficeReportsSnapshot> {
  const transactionWhere = buildTransactionWhere(input);
  const clientWhere = buildClientWhere(input);
  const startDate = startOfDay(input.startDate);
  const endDate = endOfDay(input.endDate);
  const now = new Date();

  const [transactions, groupedStatuses, contactsNeedingFollowUp, ownerOptions] = await Promise.all([
    prisma.transaction.findMany({
      where: transactionWhere,
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
        ownerMembershipId: true,
        ownerMembership: {
          include: {
            user: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.transaction.groupBy({
      by: ["status"],
      where: transactionWhere,
      _count: {
        _all: true
      }
    }),
    prisma.client.count({
      where: {
        ...clientWhere,
        nextFollowUpAt: {
          lte: now
        }
      }
    }),
    prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: "active",
        ...(input.officeId ? { officeId: input.officeId } : {}),
        role: {
          in: ["agent", "office_manager", "office_admin"] satisfies UserRole[]
        }
      },
      include: {
        user: true
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }]
    })
  ]);

  const transactionsByStatus = reportStatusOrder.map((status) => ({
    status,
    count: groupedStatuses.find((entry) => statusFromDb[entry.status] === status)?._count._all ?? 0
  }));

  const ownerMap = new Map<string, { ownerMembershipId: string | null; ownerName: string; transactionCount: number; totalVolume: number }>();

  for (const transaction of transactions) {
    const key = transaction.ownerMembershipId ?? "unassigned";
    const ownerName = transaction.ownerMembership
      ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
      : "Unassigned";
    const current = ownerMap.get(key) ?? {
      ownerMembershipId: transaction.ownerMembershipId,
      ownerName,
      transactionCount: 0,
      totalVolume: 0
    };

    current.transactionCount += 1;
    current.totalVolume += Number(transaction.price ?? 0);
    ownerMap.set(key, current);
  }

  const transactionsByOwner = [...ownerMap.values()]
    .sort((left, right) => right.transactionCount - left.transactionCount || right.totalVolume - left.totalVolume)
    .map((entry) => ({
      ownerMembershipId: entry.ownerMembershipId,
      ownerName: entry.ownerName,
      transactionCount: entry.transactionCount,
      totalVolumeLabel: formatCurrency(entry.totalVolume)
    }));

  return {
    filters: {
      startDate: startDate ? startDate.toISOString().slice(0, 10) : "",
      endDate: endDate ? endDate.toISOString().slice(0, 10) : "",
      ownerMembershipId: input.ownerMembershipId ?? "",
      ownerOptions: ownerOptions.map((membership) => ({
        id: membership.id,
        label: `${membership.user.firstName} ${membership.user.lastName}`
      }))
    },
    totals: {
      totalTransactions: transactions.length,
      contactsNeedingFollowUp,
      totalVolumeLabel: formatCurrency(transactions.reduce((sum, transaction) => sum + Number(transaction.price ?? 0), 0)),
      activeOwnerCount: transactionsByOwner.filter((entry) => entry.ownerMembershipId).length
    },
    transactionsByStatus,
    transactionsByOwner,
    transactionsOverTime: buildTimeSeries(
      transactions.map((transaction) => ({ createdAt: transaction.createdAt })),
      startDate,
      endDate
    )
  };
}

export async function listOfficeReportTransactionsForExport(
  input: GetOfficeReportsSnapshotInput
): Promise<OfficeReportTransactionExportRow[]> {
  const transactionWhere = buildTransactionWhere(input);

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    include: {
      ownerMembership: {
        include: {
          user: true
        }
      },
      primaryClient: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return transactions.map((transaction) => ({
    transactionId: transaction.id,
    title: transaction.title,
    address: transaction.address,
    city: transaction.city,
    state: transaction.state,
    zipCode: transaction.zipCode,
    type: typeFromDb[transaction.type],
    status: statusFromDb[transaction.status],
    representing: representingFromDb[transaction.representing],
    owner: transaction.ownerMembership
      ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
      : "Unassigned",
    primaryContact: transaction.primaryClient?.fullName ?? "",
    price: formatCurrencyFromDb(transaction.price),
    grossCommission: formatCurrencyFromDb(transaction.grossCommission),
    referralFee: formatCurrencyFromDb(transaction.referralFee),
    officeNet: formatCurrencyFromDb(transaction.officeNet),
    agentNet: formatCurrencyFromDb(transaction.agentNet),
    importantDate: formatDateOnly(transaction.importantDate),
    closingDate: formatDateOnly(transaction.closingDate),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString()
  }));
}
