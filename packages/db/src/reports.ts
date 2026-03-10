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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
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
