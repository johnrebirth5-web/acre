import { Prisma, TransactionRepresenting, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "./client";
import { listAvailableContactsForTransaction, type OfficeTransactionContact, type OfficeTransactionContactOption } from "./transaction-contacts";

export type OfficeTransactionStatus = "Opportunity" | "Active" | "Pending" | "Closed" | "Cancelled";

export type OfficeTransactionRecord = {
  id: string;
  address: string;
  importantDate: string;
  price: string;
  owner: string;
  representing: string;
  status: OfficeTransactionStatus;
  volume: number;
  isFlagged?: boolean;
};

export type OfficeTransactionSummary = {
  totalCount: number;
  totalNetIncome: string;
};

export type OfficeTransactionListResult = {
  transactions: OfficeTransactionRecord[];
  summary: OfficeTransactionSummary;
};

export type OfficeTransactionDetail = {
  id: string;
  organizationId: string;
  officeId: string | null;
  ownerMembershipId: string | null;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  type: string;
  status: OfficeTransactionStatus;
  representing: string;
  importantDate: string;
  buyerAgreementDate: string;
  buyerExpirationDate: string;
  acceptanceDate: string;
  listingDate: string;
  listingExpirationDate: string;
  closingDate: string;
  companyReferral: "Yes" | "No";
  companyReferralEmployeeName: string;
  ownerName: string;
  ownerEmail: string;
  officeName: string;
  grossCommission: string;
  referralFee: string;
  officeNet: string;
  agentNet: string;
  financeNotes: string;
  additionalFields: Record<string, string>;
  contacts: OfficeTransactionContact[];
  availableContacts: OfficeTransactionContactOption[];
  createdAt: string;
  updatedAt: string;
};

export type ListTransactionsInput = {
  organizationId: string;
  officeId?: string | null;
  search?: string;
  status?: OfficeTransactionStatus | "All";
};

export type CreateTransactionInput = {
  organizationId: string;
  officeId?: string | null;
  ownerMembershipId: string;
  transactionType: string;
  transactionStatus: string;
  representing: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  transactionName: string;
  price: string;
  buyerAgreementDate?: string;
  buyerExpirationDate?: string;
  acceptanceDate?: string;
  listingDate?: string;
  listingExpirationDate?: string;
  closingDate?: string;
  grossCommission?: string;
  referralFee?: string;
  officeNet?: string;
  agentNet?: string;
  financeNotes?: string;
  additionalFields?: Record<string, string>;
};

export type UpdateTransactionStatusInput = {
  organizationId: string;
  transactionId: string;
  status: OfficeTransactionStatus;
};

export type UpdateTransactionFinanceInput = {
  organizationId: string;
  transactionId: string;
  grossCommission?: string;
  referralFee?: string;
  officeNet?: string;
  agentNet?: string;
  financeNotes?: string;
};

const transactionStatusLabelMap: Record<TransactionStatus, OfficeTransactionStatus> = {
  opportunity: "Opportunity",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  cancelled: "Cancelled"
};

const transactionStatusDbMap: Record<OfficeTransactionStatus, TransactionStatus> = {
  Opportunity: "opportunity",
  Active: "active",
  Pending: "pending",
  Closed: "closed",
  Cancelled: "cancelled"
};

const transactionTypeDbMap: Record<string, TransactionType> = {
  Sales: "sales",
  "Sales (listing)": "sales_listing",
  "Rental/Leasing": "rental_leasing",
  "Rental (listing)": "rental_listing",
  "Commercial Sales": "commercial_sales",
  "Commercial Lease": "commercial_lease",
  Other: "other"
};

const transactionTypeLabelMap: Record<TransactionType, string> = {
  sales: "Sales",
  sales_listing: "Sales (listing)",
  rental_leasing: "Rental/Leasing",
  rental_listing: "Rental (listing)",
  commercial_sales: "Commercial Sales",
  commercial_lease: "Commercial Lease",
  other: "Other"
};

const representingDbMap: Record<string, TransactionRepresenting> = {
  Buyer: "buyer",
  Seller: "seller",
  Both: "both",
  Tenant: "tenant",
  Landlord: "landlord"
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

function formatDateValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? new Date(trimmed) : null;
}

function parseOptionalDecimal(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replaceAll(",", "").replace(/\$/g, "").trim();

  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? new Prisma.Decimal(numeric) : null;
}

function parseOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseCreateFinanceDecimal(explicitValue: string | undefined, fallbackValue: string | undefined) {
  return parseOptionalDecimal(explicitValue) ?? parseOptionalDecimal(fallbackValue);
}

function mapTransactionRecord(
  transaction: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: Prisma.Decimal | null;
    importantDate: Date | null;
    status: TransactionStatus;
    representing: TransactionRepresenting;
    ownerMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  }
): OfficeTransactionRecord {
  return {
    id: transaction.id,
    address: `${transaction.address}, ${transaction.city}, ${transaction.state} ${transaction.zipCode}`.replace(/,\s+,/g, ", "),
    importantDate: formatImportantDate(transaction.importantDate),
    price: formatCurrency(transaction.price),
    owner: transaction.ownerMembership
      ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
      : "Unassigned",
    representing: representingLabelMap[transaction.representing],
    status: transactionStatusLabelMap[transaction.status],
    volume: Number(transaction.price ?? 0),
    isFlagged: Boolean(transaction.importantDate)
  };
}

function mapTransactionDetail(
  transaction: {
    id: string;
    organizationId: string;
    officeId: string | null;
    ownerMembershipId: string | null;
    title: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    price: Prisma.Decimal | null;
    type: TransactionType;
    status: TransactionStatus;
    representing: TransactionRepresenting;
    importantDate: Date | null;
    buyerAgreementDate: Date | null;
    buyerExpirationDate: Date | null;
    acceptanceDate: Date | null;
    listingDate: Date | null;
    listingExpirationDate: Date | null;
    closingDate: Date | null;
    companyReferral: boolean;
    companyReferralEmployeeName: string | null;
    grossCommission: Prisma.Decimal | null;
    referralFee: Prisma.Decimal | null;
    officeNet: Prisma.Decimal | null;
    agentNet: Prisma.Decimal | null;
    financeNotes: string | null;
    additionalFields: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    office: {
      name: string;
    } | null;
    ownerMembership: {
      user: {
        email: string;
        firstName: string;
        lastName: string;
      };
    } | null;
    transactionContacts?: OfficeTransactionContact[];
    availableContacts?: OfficeTransactionContactOption[];
  }
): OfficeTransactionDetail {
  const ownerName = transaction.ownerMembership
    ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}`
    : "Unassigned";

  return {
    id: transaction.id,
    organizationId: transaction.organizationId,
    officeId: transaction.officeId,
    ownerMembershipId: transaction.ownerMembershipId,
    title: transaction.title,
    address: transaction.address,
    city: transaction.city,
    state: transaction.state,
    zipCode: transaction.zipCode,
    price: transaction.price ? String(transaction.price) : "",
    type: transactionTypeLabelMap[transaction.type],
    status: transactionStatusLabelMap[transaction.status],
    representing: representingLabelMap[transaction.representing],
    importantDate: formatDateValue(transaction.importantDate),
    buyerAgreementDate: formatDateValue(transaction.buyerAgreementDate),
    buyerExpirationDate: formatDateValue(transaction.buyerExpirationDate),
    acceptanceDate: formatDateValue(transaction.acceptanceDate),
    listingDate: formatDateValue(transaction.listingDate),
    listingExpirationDate: formatDateValue(transaction.listingExpirationDate),
    closingDate: formatDateValue(transaction.closingDate),
    companyReferral: transaction.companyReferral ? "Yes" : "No",
    companyReferralEmployeeName: transaction.companyReferralEmployeeName ?? "",
    ownerName,
    ownerEmail: transaction.ownerMembership?.user.email ?? "",
    officeName: transaction.office?.name ?? "",
    grossCommission: transaction.grossCommission ? String(transaction.grossCommission) : "",
    referralFee: transaction.referralFee ? String(transaction.referralFee) : "",
    officeNet: transaction.officeNet ? String(transaction.officeNet) : "",
    agentNet: transaction.agentNet ? String(transaction.agentNet) : "",
    financeNotes: transaction.financeNotes ?? "",
    additionalFields:
      transaction.additionalFields && typeof transaction.additionalFields === "object" && !Array.isArray(transaction.additionalFields)
        ? Object.fromEntries(
            Object.entries(transaction.additionalFields as Record<string, Prisma.JsonValue>).map(([key, value]) => [key, String(value ?? "")])
          )
        : {},
    contacts: transaction.transactionContacts ?? [],
    availableContacts: transaction.availableContacts ?? [],
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString()
  };
}

export async function listTransactions(input: ListTransactionsInput): Promise<OfficeTransactionListResult> {
  const where: Prisma.TransactionWhereInput = {
    organizationId: input.organizationId
  };
  const summaryWhere: Prisma.TransactionWhereInput = {
    organizationId: input.organizationId
  };

  if (input.officeId) {
    where.officeId = input.officeId;
    summaryWhere.officeId = input.officeId;
  }

  if (input.status && input.status !== "All") {
    where.status = transactionStatusDbMap[input.status];
  }

  if (input.search?.trim()) {
    const query = input.search.trim();

    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
      { city: { contains: query, mode: "insensitive" } },
      { zipCode: { contains: query, mode: "insensitive" } },
      {
        ownerMembership: {
          user: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      }
    ];
  }

  const [transactions, totalCount, financeAggregate] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        ownerMembership: {
          include: {
            user: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.transaction.count({
      where: summaryWhere
    }),
    prisma.transaction.aggregate({
      where: summaryWhere,
      _sum: {
        officeNet: true
      }
    })
  ]);

  return {
    transactions: transactions.map(mapTransactionRecord),
    summary: {
      totalCount,
      totalNetIncome: formatCurrency(financeAggregate._sum.officeNet)
    }
  };
}

export async function getTransactionById(organizationId: string, transactionId: string): Promise<OfficeTransactionDetail | null> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      organizationId
    },
    include: {
      office: true,
      ownerMembership: {
        include: {
          user: true
        }
      },
      transactionContacts: {
        where: {
          organizationId
        },
        include: {
          client: {
            select: {
              fullName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!transaction) {
    return null;
  }

  const availableContacts = await listAvailableContactsForTransaction(organizationId, transactionId);

  return mapTransactionDetail({
    ...transaction,
    transactionContacts: transaction.transactionContacts.map((transactionContact) => ({
      id: transactionContact.id,
      transactionId: transactionContact.transactionId,
      clientId: transactionContact.clientId,
      fullName: transactionContact.client.fullName,
      email: transactionContact.client.email ?? "",
      phone: transactionContact.client.phone ?? "",
      role: transactionContact.role
        .split("_")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("-"),
      isPrimary: transactionContact.isPrimary,
      notes: transactionContact.notes ?? ""
    })),
    availableContacts
  });
}

export async function createTransaction(input: CreateTransactionInput): Promise<OfficeTransactionDetail> {
  const additionalFields = { ...(input.additionalFields ?? {}) };

  const companyReferralValue = (additionalFields.companyReferral ?? "").toString().toLowerCase();
  const companyReferral = companyReferralValue === "yes";
  const companyReferralEmployeeName = (additionalFields.companyReferralEmployeesName ?? additionalFields.companyReferralEmployeeName ?? "").trim();
  const grossCommission = parseCreateFinanceDecimal(input.grossCommission, additionalFields.commissionAmount);
  const referralFee = parseCreateFinanceDecimal(input.referralFee, additionalFields.referralFee);
  const officeNet = parseCreateFinanceDecimal(input.officeNet, additionalFields.officeNet);
  const agentNet = parseCreateFinanceDecimal(input.agentNet, additionalFields.agentNet);
  const financeNotes = parseOptionalText(input.financeNotes) ?? parseOptionalText(additionalFields.note);

  const transaction = await prisma.transaction.create({
    data: {
      organizationId: input.organizationId,
      officeId: input.officeId ?? null,
      ownerMembershipId: input.ownerMembershipId,
      type: transactionTypeDbMap[input.transactionType] ?? "other",
      status: transactionStatusDbMap[(input.transactionStatus as OfficeTransactionStatus) || "Opportunity"] ?? "opportunity",
      representing: representingDbMap[input.representing] ?? "buyer",
      title: input.transactionName.trim() || input.address.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      zipCode: input.zipCode.trim(),
      price: parseOptionalDecimal(input.price),
      importantDate: parseOptionalDate(input.buyerExpirationDate) ?? parseOptionalDate(input.closingDate),
      buyerAgreementDate: parseOptionalDate(input.buyerAgreementDate),
      buyerExpirationDate: parseOptionalDate(input.buyerExpirationDate),
      acceptanceDate: parseOptionalDate(input.acceptanceDate),
      listingDate: parseOptionalDate(input.listingDate),
      listingExpirationDate: parseOptionalDate(input.listingExpirationDate),
      closingDate: parseOptionalDate(input.closingDate),
      companyReferral,
      companyReferralEmployeeName: companyReferralEmployeeName || null,
      grossCommission,
      referralFee,
      officeNet,
      agentNet,
      financeNotes,
      referralContext: companyReferral
        ? {
            companyReferralEmployeeName
          }
        : Prisma.JsonNull,
      commissionContext: Prisma.JsonNull,
      additionalFields
    },
    include: {
      office: true,
      ownerMembership: {
        include: {
          user: true
        }
      }
    }
  });

  return mapTransactionDetail({
    ...transaction,
    transactionContacts: [],
    availableContacts: []
  });
}

export async function updateTransactionStatus(input: UpdateTransactionStatusInput): Promise<OfficeTransactionDetail | null> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: input.transactionId,
      organizationId: input.organizationId
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return null;
  }

  const updated = await prisma.transaction.update({
    where: {
      id: input.transactionId
    },
    data: {
      status: transactionStatusDbMap[input.status],
      importantDate:
        input.status === "Closed" || input.status === "Cancelled"
          ? null
          : undefined
    },
    include: {
      office: true,
      ownerMembership: {
        include: {
          user: true
        }
      }
    }
  });

  return mapTransactionDetail({
    ...updated,
    transactionContacts: [],
    availableContacts: []
  });
}

export async function updateTransactionFinance(input: UpdateTransactionFinanceInput): Promise<OfficeTransactionDetail | null> {
  const updated = await prisma.transaction.updateMany({
    where: {
      id: input.transactionId,
      organizationId: input.organizationId
    },
    data: {
      grossCommission: parseOptionalDecimal(input.grossCommission),
      referralFee: parseOptionalDecimal(input.referralFee),
      officeNet: parseOptionalDecimal(input.officeNet),
      agentNet: parseOptionalDecimal(input.agentNet),
      financeNotes: parseOptionalText(input.financeNotes)
    }
  });

  if (updated.count === 0) {
    return null;
  }

  return getTransactionById(input.organizationId, input.transactionId);
}
