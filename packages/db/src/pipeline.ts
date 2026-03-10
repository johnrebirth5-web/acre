import { Prisma, TransactionRepresenting, TransactionStatus } from "@prisma/client";
import { prisma } from "./client";

export type OfficePipelineStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";

export type OfficePipelineItem = {
  id: string;
  address: string;
  price: string;
  owner: string;
  representing: string;
  status: OfficePipelineStatus;
  importantDate: string;
  volume: number;
};

export type OfficePipelineBucket = {
  status: OfficePipelineStatus;
  count: number;
  volumeLabel: string;
  transactions: OfficePipelineItem[];
};

export type GetOfficePipelineBucketsInput = {
  organizationId: string;
  officeId?: string | null;
};

const pipelineStatusOrder: OfficePipelineStatus[] = ["Opportunity", "Active", "Pending", "Closed", "Cancelled"];

// Pipeline columns intentionally stay aligned to the existing Office UI labels.
// Current Prisma enum values map 1:1 to those columns, but the helper keeps that
// boundary explicit in case transaction status semantics diverge later.
const pipelineStatusFromDb: Record<TransactionStatus, OfficePipelineStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const representingLabelMap: Record<TransactionRepresenting, string> = {
  buyer: "buyer",
  seller: "seller",
  both: "both",
  tenant: "tenant",
  landlord: "landlord"
};

function formatCurrency(value: Prisma.Decimal | number | string | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatImportantDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return `expires: ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function mapPipelineItem(
  transaction: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: Prisma.Decimal | null;
    importantDate: Date | null;
    representing: TransactionRepresenting;
    status: TransactionStatus;
    ownerMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  }
): OfficePipelineItem {
  return {
    id: transaction.id,
    address: `${transaction.address}, ${transaction.city}, ${transaction.state} ${transaction.zipCode}`.replace(/,\s+,/g, ", "),
    price: formatCurrency(transaction.price),
    owner: transaction.ownerMembership
      ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
      : "Unassigned",
    representing: representingLabelMap[transaction.representing],
    status: pipelineStatusFromDb[transaction.status],
    importantDate: formatImportantDate(transaction.importantDate),
    volume: Number(transaction.price ?? 0)
  };
}

export async function getOfficePipelineBuckets(input: GetOfficePipelineBucketsInput): Promise<OfficePipelineBucket[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: input.organizationId,
      ...(input.officeId ? { officeId: input.officeId } : {})
    },
    include: {
      ownerMembership: {
        include: {
          user: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  const items = transactions.map(mapPipelineItem);

  return pipelineStatusOrder.map((status) => {
    const bucketTransactions = items.filter((transaction) => transaction.status === status);
    const volume = bucketTransactions.reduce((total, transaction) => total + transaction.volume, 0);

    return {
      status,
      count: bucketTransactions.length,
      volumeLabel: formatCurrency(volume),
      transactions: bucketTransactions
    };
  });
}
