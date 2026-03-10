import { Prisma, TaskStatus, TransactionContactRole } from "@prisma/client";
import { prisma } from "./client";
import { linkContactToTransaction as linkTransactionContact } from "./transaction-contacts";

export type OfficeContactRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  contactType: string;
  source: string;
  stage: string;
  intent: string;
  budget: string;
  areas: string[];
  lastContactLabel: string;
  nextFollowUpLabel: string;
  owner: string;
};

export type OfficeContactListResult = {
  contacts: OfficeContactRecord[];
  totalCount: number;
};

export type OfficeContactTask = {
  id: string;
  title: string;
  status: string;
  dueAt: string;
  assigneeName: string;
};

export type OfficeContactLinkedTransaction = {
  id: string;
  label: string;
  status: string;
  price: string;
  role: string;
  isPrimary: boolean;
};

export type OfficeTransactionLinkOption = {
  id: string;
  label: string;
};

export type OfficeContactDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  contactType: string;
  source: string;
  stage: string;
  intent: string;
  budgetMin: string;
  budgetMax: string;
  areas: string[];
  notes: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  ownerMembershipId: string | null;
  ownerName: string;
  linkedTransactions: OfficeContactLinkedTransaction[];
  availableTransactions: OfficeTransactionLinkOption[];
  followUpTasks: OfficeContactTask[];
};

export type ListContactsInput = {
  organizationId: string;
  search?: string;
  stage?: string;
};

export type SaveContactInput = {
  organizationId: string;
  ownerMembershipId: string;
  fullName: string;
  email?: string;
  phone?: string;
  contactType?: string;
  source?: string;
  stage?: string;
  intent?: string;
  budgetMin?: string;
  budgetMax?: string;
  preferredAreas?: string[];
  notes?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
};

export type CreateFollowUpTaskInput = {
  organizationId: string;
  clientId: string;
  assigneeMembershipId: string;
  title: string;
  dueAt?: string;
};

function formatDateLabel(date: Date | null) {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function parseOptionalDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return new Date(value);
}

function parseOptionalDecimal(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.replaceAll(",", "").replace(/\$/g, "").trim();
  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? new Prisma.Decimal(numeric) : null;
}

function formatBudget(min: Prisma.Decimal | null, max: Prisma.Decimal | null) {
  if (!min && !max) {
    return "—";
  }

  const format = (value: Prisma.Decimal | null) =>
    value
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2
        }).format(Number(value))
      : "";

  if (min && max && Number(min) === Number(max)) {
    return format(min);
  }

  if (min && max) {
    return `${format(min)} - ${format(max)}`;
  }

  return format(min ?? max);
}

function formatTransactionContactRole(role: TransactionContactRole) {
  return role
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("-");
}

function mapContactRecord(
  client: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    contactType: string | null;
    source: string;
    stage: string;
    intent: string;
    budgetMin: Prisma.Decimal | null;
    budgetMax: Prisma.Decimal | null;
    preferredAreas: string[];
    lastContactAt: Date | null;
    nextFollowUpAt: Date | null;
    ownerMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  }
): OfficeContactRecord {
  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email ?? "",
    phone: client.phone ?? "",
    contactType: client.contactType ?? "",
    source: client.source,
    stage: client.stage,
    intent: client.intent,
    budget: formatBudget(client.budgetMin, client.budgetMax),
    areas: client.preferredAreas,
    lastContactLabel: formatDateLabel(client.lastContactAt),
    nextFollowUpLabel: formatDateLabel(client.nextFollowUpAt),
    owner: client.ownerMembership ? `${client.ownerMembership.user.firstName} ${client.ownerMembership.user.lastName}` : "Unassigned"
  };
}

export async function listContacts(input: ListContactsInput): Promise<OfficeContactListResult> {
  const where: Prisma.ClientWhereInput = {
    organizationId: input.organizationId
  };

  if (input.stage && input.stage !== "All") {
    where.stage = input.stage;
  }

  if (input.search?.trim()) {
    const query = input.search.trim();
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { source: { contains: query, mode: "insensitive" } },
      { intent: { contains: query, mode: "insensitive" } },
      { preferredAreas: { has: query } }
    ];
  }

  const [clients, totalCount] = await Promise.all([
    prisma.client.findMany({
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
    prisma.client.count({
      where: {
        organizationId: input.organizationId
      }
    })
  ]);

  return {
    contacts: clients.map(mapContactRecord),
    totalCount
  };
}

export async function createContact(input: SaveContactInput): Promise<OfficeContactDetail> {
  const client = await prisma.client.create({
    data: {
      organizationId: input.organizationId,
      ownerMembershipId: input.ownerMembershipId,
      fullName: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      contactType: input.contactType?.trim() || null,
      source: input.source?.trim() || "Manual entry",
      stage: input.stage?.trim() || "New",
      intent: input.intent?.trim() || "Unknown",
      budgetMin: parseOptionalDecimal(input.budgetMin),
      budgetMax: parseOptionalDecimal(input.budgetMax),
      preferredAreas: input.preferredAreas?.filter(Boolean) ?? [],
      notes: input.notes?.trim() || null,
      lastContactAt: parseOptionalDate(input.lastContactAt),
      nextFollowUpAt: parseOptionalDate(input.nextFollowUpAt)
    }
  });

  return (await getContactById(input.organizationId, client.id)) as OfficeContactDetail;
}

export async function updateContact(contactId: string, input: SaveContactInput): Promise<OfficeContactDetail | null> {
  const existing = await prisma.client.findFirst({
    where: {
      id: contactId,
      organizationId: input.organizationId
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    return null;
  }

  await prisma.client.update({
    where: { id: contactId },
    data: {
      fullName: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      contactType: input.contactType?.trim() || null,
      source: input.source?.trim() || "Manual entry",
      stage: input.stage?.trim() || "New",
      intent: input.intent?.trim() || "Unknown",
      budgetMin: parseOptionalDecimal(input.budgetMin),
      budgetMax: parseOptionalDecimal(input.budgetMax),
      preferredAreas: input.preferredAreas?.filter(Boolean) ?? [],
      notes: input.notes?.trim() || null,
      lastContactAt: parseOptionalDate(input.lastContactAt),
      nextFollowUpAt: parseOptionalDate(input.nextFollowUpAt)
    }
  });

  return getContactById(input.organizationId, contactId);
}

export async function getContactById(organizationId: string, contactId: string): Promise<OfficeContactDetail | null> {
  const client = await prisma.client.findFirst({
    where: {
      id: contactId,
      organizationId
    },
    include: {
      ownerMembership: {
        include: {
          user: true
        }
      },
      followUpTasks: {
        include: {
          assigneeMembership: {
            include: {
              user: true
            }
          }
        },
        orderBy: [{ createdAt: "desc" }]
      },
      transactionContacts: {
        where: {
          organizationId
        },
        include: {
          transaction: true
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!client) {
    return null;
  }

  const availableTransactions = await prisma.transaction.findMany({
    where: {
      organizationId,
      transactionContacts: {
        none: {
          clientId: client.id
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      state: true
    }
  });

  const linkedTransactions = client.transactionContacts.map((transactionContact) => ({
    id: transactionContact.transaction.id,
    label: `${transactionContact.transaction.address}, ${transactionContact.transaction.city}, ${transactionContact.transaction.state} ${transactionContact.transaction.zipCode}`,
    status: transactionContact.transaction.status,
    price: transactionContact.transaction.price
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: Number(transactionContact.transaction.price) % 1 === 0 ? 0 : 2
        }).format(Number(transactionContact.transaction.price))
      : "$0",
    role: formatTransactionContactRole(transactionContact.role),
    isPrimary: transactionContact.isPrimary
  }));

  return {
    id: client.id,
    fullName: client.fullName,
    email: client.email ?? "",
    phone: client.phone ?? "",
    contactType: client.contactType ?? "",
    source: client.source,
    stage: client.stage,
    intent: client.intent,
    budgetMin: client.budgetMin ? String(client.budgetMin) : "",
    budgetMax: client.budgetMax ? String(client.budgetMax) : "",
    areas: client.preferredAreas,
    notes: client.notes ?? "",
    lastContactAt: formatDateValue(client.lastContactAt),
    nextFollowUpAt: formatDateValue(client.nextFollowUpAt),
    ownerMembershipId: client.ownerMembershipId,
    ownerName: client.ownerMembership ? `${client.ownerMembership.user.firstName} ${client.ownerMembership.user.lastName}` : "Unassigned",
    linkedTransactions,
    availableTransactions: availableTransactions.map((transaction) => ({
      id: transaction.id,
      label: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`
    })),
    followUpTasks: client.followUpTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueAt: formatDateLabel(task.dueAt),
      assigneeName: task.assigneeMembership ? `${task.assigneeMembership.user.firstName} ${task.assigneeMembership.user.lastName}` : "Unassigned"
    }))
  };
}

export async function createFollowUpTask(input: CreateFollowUpTaskInput): Promise<OfficeContactTask | null> {
  const client = await prisma.client.findFirst({
    where: {
      id: input.clientId,
      organizationId: input.organizationId
    },
    select: {
      id: true
    }
  });

  if (!client) {
    return null;
  }

  const task = await prisma.followUpTask.create({
    data: {
      organizationId: input.organizationId,
      clientId: input.clientId,
      assigneeMemberId: input.assigneeMembershipId,
      title: input.title.trim(),
      status: TaskStatus.queued,
      dueAt: parseOptionalDate(input.dueAt),
      metadata: Prisma.JsonNull
    }
  });

  const hydratedTask = await prisma.followUpTask.findUnique({
    where: {
      id: task.id
    },
    include: {
      assigneeMembership: {
        include: {
          user: true
        }
      }
    }
  });

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    dueAt: formatDateLabel(task.dueAt),
    assigneeName: hydratedTask?.assigneeMembership ? `${hydratedTask.assigneeMembership.user.firstName} ${hydratedTask.assigneeMembership.user.lastName}` : "Unassigned"
  };
}

export async function linkContactToTransaction(organizationId: string, contactId: string, transactionId: string): Promise<boolean> {
  return linkTransactionContact(organizationId, contactId, transactionId);
}
