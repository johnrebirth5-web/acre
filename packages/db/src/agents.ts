import { Prisma, type AgentGoalPeriodType, type AgentOnboardingItemStatus, type AgentOnboardingStatus, type TeamMembershipRole, type UserRole } from "@prisma/client";
import { activityLogActions, recordActivityLogEvent, type ActivityLogAction, type ActivityLogChange } from "./activity-log";
import { prisma } from "./client";

const roleLabelMap: Record<UserRole, string> = {
  agent: "Agent",
  office_manager: "Office Manager",
  office_admin: "Office Admin"
};

const onboardingStatusLabelMap: Record<AgentOnboardingStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete"
};

const onboardingItemStatusLabelMap: Record<AgentOnboardingItemStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  reopened: "Reopened"
};

const teamRoleLabelMap: Record<TeamMembershipRole, string> = {
  lead: "Lead",
  member: "Member"
};

const goalPeriodLabelMap: Record<AgentGoalPeriodType, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual"
};

const defaultOnboardingItems = [
  {
    category: "Compliance",
    title: "Upload license and state ID",
    description: "Provide your active license details and identity documents for office compliance review."
  },
  {
    category: "Operations",
    title: "Complete brokerage onboarding packet",
    description: "Review commission setup, office policies, and brokerage-required agreements."
  },
  {
    category: "Training",
    title: "Review transaction workflow basics",
    description: "Walk through the Back Office transaction, document, and task flow before going live."
  }
] as const;

export type OfficeAgentRosterRow = {
  membershipId: string;
  name: string;
  email: string;
  officeName: string;
  role: string;
  title: string;
  teamLabel: string;
  onboardingStatus: string;
  activeTasksCount: number;
  openTransactionCount: number;
  billingBalanceLabel: string;
  href: string;
};

export type OfficeAgentRosterFilters = {
  officeId: string;
  role: string;
  teamId: string;
  onboardingStatus: string;
  q: string;
  officeOptions: Array<{ id: string; label: string }>;
  roleOptions: Array<{ value: string; label: string }>;
  teamOptions: Array<{ id: string; label: string }>;
};

export type OfficeAgentTeamSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount: number;
  members: Array<{
    membershipId: string;
    label: string;
    role: string;
  }>;
};

export type OfficeAgentsRosterSnapshot = {
  summary: {
    totalMembers: number;
    agentCount: number;
    onboardingInProgressCount: number;
    activeTeamCount: number;
  };
  filters: OfficeAgentRosterFilters;
  rows: OfficeAgentRosterRow[];
  teams: OfficeAgentTeamSummary[];
};

export type OfficeAgentProfileTeam = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  role: string;
};

export type OfficeAgentOnboardingItemRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  dueAt: string;
  status: string;
  statusValue: AgentOnboardingItemStatus;
  completedAt: string;
  completedByName: string;
};

export type OfficeAgentGoalRecord = {
  id: string;
  periodType: string;
  startsAt: string;
  endsAt: string;
  targetTransactionCount: string;
  targetClosedVolume: string;
  targetOfficeNet: string;
  targetAgentNet: string;
  actualTransactionCount: string;
  actualClosedVolume: string;
  actualOfficeNet: string;
  actualAgentNet: string;
  notes: string;
};

export type OfficeAgentProfileActivityItem = {
  id: string;
  actionLabel: string;
  objectLabel: string;
  timestampLabel: string;
};

export type OfficeAgentProfileSnapshot = {
  profile: {
    membershipId: string;
    userId: string;
    fullName: string;
    displayName: string;
    email: string;
    officeName: string;
    role: string;
    title: string;
    bio: string;
    notes: string;
    licenseNumber: string;
    licenseState: string;
    startDate: string;
    onboardingStatus: string;
    onboardingStatusValue: AgentOnboardingStatus;
    commissionPlanName: string;
    avatarUrl: string;
    internalExtension: string;
  };
  summary: {
    activeTaskCount: number;
    openTransactionCount: number;
    currentBalanceLabel: string;
    paymentMethodsCount: number;
    pipelineCounts: Array<{ label: string; count: number }>;
  };
  teams: OfficeAgentProfileTeam[];
  availableTeams: Array<{ id: string; label: string }>;
  onboarding: {
    totalCount: number;
    completedCount: number;
    statusLabel: string;
    items: OfficeAgentOnboardingItemRecord[];
  };
  goals: OfficeAgentGoalRecord[];
  recentTransactions: Array<{
    id: string;
    label: string;
    status: string;
    priceLabel: string;
    href: string;
  }>;
  recentActivity: OfficeAgentProfileActivityItem[];
};

export type GetOfficeAgentsRosterInput = {
  organizationId: string;
  officeId?: string | null;
  officeFilterId?: string;
  role?: string;
  teamId?: string;
  onboardingStatus?: string;
  q?: string;
};

export type GetOfficeAgentProfileInput = {
  organizationId: string;
  officeId?: string | null;
  membershipId: string;
};

export type SaveAgentProfileInput = {
  organizationId: string;
  officeId?: string | null;
  membershipId: string;
  actorMembershipId: string;
  displayName?: string;
  bio?: string;
  notes?: string;
  licenseNumber?: string;
  licenseState?: string;
  startDate?: string;
  commissionPlanName?: string;
  avatarUrl?: string;
  internalExtension?: string;
};

export type CreateAgentTeamInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  name: string;
};

export type UpdateAgentTeamInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  teamId: string;
  name?: string;
  isActive?: boolean;
};

export type AddAgentToTeamInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  teamId: string;
  membershipId: string;
  role?: string;
};

export type RemoveAgentFromTeamInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  teamId: string;
  membershipId: string;
};

export type CreateAgentOnboardingItemInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  membershipId: string;
  title: string;
  description?: string;
  category?: string;
  dueAt?: string;
};

export type UpdateAgentOnboardingItemInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  membershipId: string;
  itemId: string;
  title?: string;
  description?: string;
  category?: string;
  dueAt?: string;
  status?: string;
};

export type CreateAgentGoalInput = {
  organizationId: string;
  officeId?: string | null;
  actorMembershipId: string;
  membershipId: string;
  periodType: string;
  startsAt: string;
  endsAt: string;
  targetTransactionCount?: string;
  targetClosedVolume?: string;
  targetOfficeNet?: string;
  targetAgentNet?: string;
  notes?: string;
};

export type UpdateAgentGoalInput = CreateAgentGoalInput & {
  goalId: string;
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

function formatDateTimeLabel(value: Date | null | undefined) {
  return value
    ? value.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : "—";
}

function parseOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalDecimal(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.replaceAll(",", "").replace(/\$/g, "").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? new Prisma.Decimal(numeric) : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeOnboardingStatus(
  explicitStatus: AgentOnboardingStatus | null | undefined,
  items: Array<{ status: AgentOnboardingItemStatus }>
) {
  if (items.length === 0) {
    return explicitStatus ?? "not_started";
  }

  const completedCount = items.filter((item) => item.status === "completed").length;

  if (completedCount === items.length) {
    return "complete";
  }

  if (completedCount > 0 || items.some((item) => item.status === "in_progress" || item.status === "reopened")) {
    return "in_progress";
  }

  return explicitStatus === "complete" ? "in_progress" : explicitStatus ?? "not_started";
}

function normalizeTeamRole(value: string | undefined): TeamMembershipRole {
  return value === "lead" || value === "member" ? value : "member";
}

function normalizeGoalPeriod(value: string): AgentGoalPeriodType {
  if (value === "monthly" || value === "quarterly" || value === "annual") {
    return value;
  }

  throw new Error("A valid goal period is required.");
}

function normalizeOnboardingItemStatus(value: string | undefined): AgentOnboardingItemStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "pending" || value === "in_progress" || value === "completed" || value === "reopened") {
    return value;
  }

  throw new Error("A valid onboarding status is required.");
}

function getMembershipLabel(membership: {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}) {
  return `${membership.user.firstName} ${membership.user.lastName}`;
}

function getActivityActionLabel(action: string) {
  switch (action) {
    case activityLogActions.transactionCreated:
      return "Transaction created";
    case activityLogActions.transactionUpdated:
      return "Transaction updated";
    case activityLogActions.transactionStatusChanged:
      return "Transaction status changed";
    case activityLogActions.transactionTaskCreated:
      return "Task created";
    case activityLogActions.transactionTaskUpdated:
      return "Task updated";
    case activityLogActions.transactionTaskCompleted:
      return "Task completed";
    case activityLogActions.transactionTaskReopened:
      return "Task reopened";
    case activityLogActions.contactCreated:
      return "Contact created";
    case activityLogActions.contactUpdated:
      return "Contact updated";
    case activityLogActions.accountingPaymentReceived:
      return "Payment received";
    case activityLogActions.accountingAgentChargeCreated:
      return "Agent charge created";
    case "agent.profile_created":
      return "Agent profile created";
    case "agent.profile_updated":
      return "Agent profile updated";
    case "team.created":
      return "Team created";
    case "team.updated":
      return "Team updated";
    case "team.deactivated":
      return "Team deactivated";
    case "team.member_added":
      return "Agent added to team";
    case "team.member_removed":
      return "Agent removed from team";
    case "agent.onboarding_item_created":
      return "Onboarding item created";
    case "agent.onboarding_item_updated":
      return "Onboarding item updated";
    case "agent.onboarding_item_completed":
      return "Onboarding item completed";
    case "agent.onboarding_item_reopened":
      return "Onboarding item reopened";
    case "agent.goal_created":
      return "Goal created";
    case "agent.goal_updated":
      return "Goal updated";
    default:
      return action;
  }
}

function getPayloadObjectLabel(payload: Prisma.JsonValue | null) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "—";
  }

  if (typeof payload.objectLabel === "string" && payload.objectLabel.trim()) {
    return payload.objectLabel;
  }

  if (typeof payload.teamName === "string" && payload.teamName.trim()) {
    return payload.teamName;
  }

  return "—";
}

function buildChange(label: string, previousValue: string, nextValue: string): ActivityLogChange | null {
  return previousValue === nextValue ? null : { label, previousValue, nextValue };
}

async function ensureMembershipExists(
  tx: Prisma.TransactionClient,
  organizationId: string,
  membershipId: string,
  officeId?: string | null
) {
  const membership = await tx.membership.findFirst({
    where: {
      id: membershipId,
      organizationId,
      status: "active",
      ...(officeId ? { officeId } : {})
    },
    include: {
      user: true,
      office: true,
      agentProfile: true
    }
  });

  if (!membership) {
    throw new Error("Agent membership was not found.");
  }

  return membership;
}

async function syncAgentProfileOnboardingStatus(
  tx: Prisma.TransactionClient,
  organizationId: string,
  membershipId: string,
  officeId?: string | null
) {
  const [profile, onboardingItems] = await Promise.all([
    tx.agentProfile.findUnique({
      where: {
        membershipId
      }
    }),
    tx.agentOnboardingItem.findMany({
      where: {
        organizationId,
        membershipId,
        ...(officeId ? { officeId } : {})
      },
      select: {
        status: true
      }
    })
  ]);

  const nextStatus = normalizeOnboardingStatus(profile?.onboardingStatus, onboardingItems);

  await tx.agentProfile.upsert({
    where: {
      membershipId
    },
    update: {
      onboardingStatus: nextStatus
    },
    create: {
      organizationId,
      officeId: officeId ?? null,
      membershipId,
      onboardingStatus: nextStatus
    }
  });

  return nextStatus;
}

async function ensureAgentProfileFoundation(
  organizationId: string,
  membershipId: string,
  officeId?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const membership = await ensureMembershipExists(tx, organizationId, membershipId, officeId);

    await tx.agentProfile.upsert({
      where: {
        membershipId
      },
      update: {
        officeId: membership.officeId
      },
      create: {
        organizationId,
        officeId: membership.officeId,
        membershipId,
        displayName: `${membership.user.firstName} ${membership.user.lastName}`
      }
    });

    if (membership.role === "agent") {
      const existingCount = await tx.agentOnboardingItem.count({
        where: {
          organizationId,
          membershipId
        }
      });

      if (existingCount === 0) {
        await tx.agentOnboardingItem.createMany({
          data: defaultOnboardingItems.map((item, index) => ({
            organizationId,
            officeId: membership.officeId,
            membershipId,
            title: item.title,
            description: item.description,
            category: item.category,
            sortOrder: index
          }))
        });
      }
    }

    await syncAgentProfileOnboardingStatus(tx, organizationId, membershipId, officeId);
  });
}

function getGoalProgressSourceDate(transaction: {
  closingDate: Date | null;
  updatedAt: Date;
}) {
  return transaction.closingDate ?? transaction.updatedAt;
}

async function getBillingSummaryByMembership(
  organizationId: string,
  membershipIds: string[],
  officeId?: string | null
) {
  if (membershipIds.length === 0) {
    return new Map<string, { currentBalance: Prisma.Decimal; paymentMethodsCount: number }>();
  }

  const [transactions, paymentMethods] = await Promise.all([
    prisma.accountingTransaction.findMany({
      where: {
        organizationId,
        relatedMembershipId: {
          in: membershipIds
        },
        isAgentBilling: true,
        status: {
          not: "void"
        },
        ...(officeId ? { officeId } : {})
      },
      include: {
        applicationsTo: {
          select: {
            amount: true
          }
        }
      }
    }),
    prisma.agentPaymentMethod.findMany({
      where: {
        organizationId,
        membershipId: {
          in: membershipIds
        },
        ...(officeId ? { officeId } : {})
      },
      select: {
        membershipId: true
      }
    })
  ]);

  const balances = new Map<string, { currentBalance: Prisma.Decimal; paymentMethodsCount: number }>();

  for (const membershipId of membershipIds) {
    balances.set(membershipId, {
      currentBalance: new Prisma.Decimal(0),
      paymentMethodsCount: 0
    });
  }

  for (const transaction of transactions) {
    if (!transaction.relatedMembershipId || transaction.type !== "invoice") {
      continue;
    }

    const appliedAmount = transaction.applicationsTo.reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));
    const outstandingAmount = transaction.totalAmount.minus(appliedAmount);
    const current = balances.get(transaction.relatedMembershipId);

    if (!current) {
      continue;
    }

    current.currentBalance = current.currentBalance.plus(outstandingAmount.greaterThan(0) ? outstandingAmount : new Prisma.Decimal(0));
  }

  for (const method of paymentMethods) {
    const current = balances.get(method.membershipId);

    if (!current) {
      continue;
    }

    current.paymentMethodsCount += 1;
  }

  return balances;
}

export async function getOfficeAgentsRosterSnapshot(input: GetOfficeAgentsRosterInput): Promise<OfficeAgentsRosterSnapshot> {
  const memberships = await prisma.membership.findMany({
    where: {
      organizationId: input.organizationId,
      status: "active",
      ...(input.officeId ? { officeId: input.officeId } : {}),
      ...(input.officeFilterId ? { officeId: input.officeFilterId } : {}),
      ...(input.role ? { role: input.role as UserRole } : {}),
      ...(input.teamId
        ? {
            teamMemberships: {
              some: {
                teamId: input.teamId
              }
            }
          }
        : {}),
      ...(input.q?.trim()
        ? {
            OR: [
              { user: { firstName: { contains: input.q.trim(), mode: "insensitive" } } },
              { user: { lastName: { contains: input.q.trim(), mode: "insensitive" } } },
              { user: { email: { contains: input.q.trim(), mode: "insensitive" } } },
              { title: { contains: input.q.trim(), mode: "insensitive" } },
              { agentProfile: { displayName: { contains: input.q.trim(), mode: "insensitive" } } },
              { teamMemberships: { some: { team: { name: { contains: input.q.trim(), mode: "insensitive" } } } } }
            ]
          }
        : {})
    },
    include: {
      user: true,
      office: true,
      agentProfile: true,
      teamMemberships: {
        include: {
          team: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }]
  });

  const membershipIds = memberships.map((membership) => membership.id);
  const [offices, teams, openTaskCounts, openTransactionCounts, billingSummary] = await Promise.all([
    prisma.office.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.officeId ? { id: input.officeId } : {})
      },
      orderBy: [{ name: "asc" }]
    }),
    prisma.team.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.officeId ? { officeId: input.officeId } : {})
      },
      include: {
        memberships: {
          include: {
            membership: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: [{ name: "asc" }]
    }),
    prisma.transactionTask.groupBy({
      by: ["assigneeMembershipId"],
      where: {
        organizationId: input.organizationId,
        assigneeMembershipId: {
          in: membershipIds
        },
        status: {
          in: ["todo", "in_progress", "review_requested", "reopened"]
        },
        transaction: input.officeId
          ? {
              officeId: input.officeId
            }
          : undefined
      },
      _count: {
        _all: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["ownerMembershipId"],
      where: {
        organizationId: input.organizationId,
        ownerMembershipId: {
          in: membershipIds
        },
        ...(input.officeId ? { officeId: input.officeId } : {}),
        status: {
          in: ["opportunity", "active", "pending"]
        }
      },
      _count: {
        _all: true
      }
    }),
    getBillingSummaryByMembership(input.organizationId, membershipIds, input.officeId)
  ]);

  const openTaskCountMap = new Map(openTaskCounts.map((item) => [item.assigneeMembershipId ?? "", item._count._all]));
  const openTransactionCountMap = new Map(
    openTransactionCounts.map((item) => [item.ownerMembershipId ?? "", item._count._all])
  );

  let filteredMemberships = memberships;

  if (input.onboardingStatus) {
    filteredMemberships = filteredMemberships.filter((membership) => {
      const status = membership.agentProfile?.onboardingStatus ?? "not_started";
      return status === input.onboardingStatus;
    });
  }

  const rows = filteredMemberships.map((membership) => {
    const balance = billingSummary.get(membership.id);
    const teamLabels = membership.teamMemberships
      .filter((teamMembership) => teamMembership.team.isActive)
      .map((teamMembership) => teamMembership.team.name);

    return {
      membershipId: membership.id,
      name: membership.agentProfile?.displayName?.trim() || `${membership.user.firstName} ${membership.user.lastName}`,
      email: membership.user.email,
      officeName: membership.office?.name ?? "Unassigned",
      role: roleLabelMap[membership.role],
      title: membership.title ?? "—",
      teamLabel: teamLabels.length ? teamLabels.join(", ") : "No team",
      onboardingStatus: onboardingStatusLabelMap[membership.agentProfile?.onboardingStatus ?? "not_started"],
      activeTasksCount: openTaskCountMap.get(membership.id) ?? 0,
      openTransactionCount: openTransactionCountMap.get(membership.id) ?? 0,
      billingBalanceLabel: formatCurrency(balance?.currentBalance ?? 0),
      href: `/office/agents/${membership.id}`
    };
  });

  const activeTeamCount = teams.filter((team) => team.isActive).length;
  const onboardingInProgressCount = rows.filter((row) => row.onboardingStatus === "In progress").length;

  return {
    summary: {
      totalMembers: rows.length,
      agentCount: rows.filter((row) => row.role === "Agent").length,
      onboardingInProgressCount,
      activeTeamCount
    },
    filters: {
      officeId: input.officeFilterId ?? input.officeId ?? "",
      role: input.role ?? "",
      teamId: input.teamId ?? "",
      onboardingStatus: input.onboardingStatus ?? "",
      q: input.q?.trim() ?? "",
      officeOptions: offices.map((office) => ({
        id: office.id,
        label: office.name
      })),
      roleOptions: [
        { value: "agent", label: "Agent" },
        { value: "office_manager", label: "Office Manager" },
        { value: "office_admin", label: "Office Admin" }
      ],
      teamOptions: teams.map((team) => ({
        id: team.id,
        label: team.name
      }))
    },
    rows,
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      isActive: team.isActive,
      memberCount: team.memberships.length,
      members: team.memberships.map((teamMembership) => ({
        membershipId: teamMembership.membershipId,
        label: getMembershipLabel(teamMembership.membership),
        role: teamRoleLabelMap[teamMembership.role]
      }))
    }))
  };
}

export async function getOfficeAgentProfileSnapshot(input: GetOfficeAgentProfileInput): Promise<OfficeAgentProfileSnapshot | null> {
  await ensureAgentProfileFoundation(input.organizationId, input.membershipId, input.officeId);

  const membership = await prisma.membership.findFirst({
    where: {
      id: input.membershipId,
      organizationId: input.organizationId,
      status: "active",
      ...(input.officeId ? { officeId: input.officeId } : {})
    },
    include: {
      user: true,
      office: true,
      agentProfile: true,
      teamMemberships: {
        include: {
          team: true
        }
      }
    }
  });

  if (!membership) {
    return null;
  }

  const [onboardingItems, goals, recentTransactions, activeTaskCount, billingSummaryMap, recentActivity, availableTeams] =
    await Promise.all([
      prisma.agentOnboardingItem.findMany({
        where: {
          organizationId: input.organizationId,
          membershipId: input.membershipId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        },
        include: {
          completedByMembership: {
            include: {
              user: true
            }
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }),
      prisma.agentGoal.findMany({
        where: {
          organizationId: input.organizationId,
          membershipId: input.membershipId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        },
        orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }]
      }),
      prisma.transaction.findMany({
        where: {
          organizationId: input.organizationId,
          ownerMembershipId: input.membershipId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 6
      }),
      prisma.transactionTask.count({
        where: {
          organizationId: input.organizationId,
          assigneeMembershipId: input.membershipId,
          status: {
            in: ["todo", "in_progress", "review_requested", "reopened"]
          },
          transaction: input.officeId
            ? {
                officeId: input.officeId
              }
            : undefined
        }
      }),
      getBillingSummaryByMembership(input.organizationId, [input.membershipId], input.officeId),
      prisma.auditLog.findMany({
        where: {
          organizationId: input.organizationId,
          membershipId: input.membershipId
        },
        orderBy: [{ createdAt: "desc" }],
        take: 8
      }),
      prisma.team.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        },
        orderBy: [{ name: "asc" }]
      })
    ]);

  const pipelineTransactions = await prisma.transaction.groupBy({
    by: ["status"],
    where: {
      organizationId: input.organizationId,
      ownerMembershipId: input.membershipId,
      ...(input.officeId ? { officeId: input.officeId } : {})
    },
    _count: {
      _all: true
    }
  });

  const goalSnapshots = await Promise.all(
    goals.map(async (goal) => {
      const goalTransactions = await prisma.transaction.findMany({
        where: {
          organizationId: input.organizationId,
          ownerMembershipId: input.membershipId,
          ...(input.officeId ? { officeId: input.officeId } : {}),
          createdAt: {
            gte: goal.startsAt,
            lte: goal.endsAt
          }
        },
        select: {
          status: true,
          price: true,
          officeNet: true,
          agentNet: true,
          closingDate: true,
          updatedAt: true
        }
      });

      const closedTransactions = goalTransactions.filter(
        (transaction) =>
          transaction.status === "closed" &&
          getGoalProgressSourceDate(transaction) >= goal.startsAt &&
          getGoalProgressSourceDate(transaction) <= goal.endsAt
      );

      const closedVolume = closedTransactions.reduce((sum, transaction) => sum.plus(transaction.price ?? 0), new Prisma.Decimal(0));
      const officeNet = closedTransactions.reduce((sum, transaction) => sum.plus(transaction.officeNet ?? 0), new Prisma.Decimal(0));
      const agentNet = closedTransactions.reduce((sum, transaction) => sum.plus(transaction.agentNet ?? 0), new Prisma.Decimal(0));

      return {
        id: goal.id,
        periodType: goalPeriodLabelMap[goal.periodType],
        startsAt: formatDateValue(goal.startsAt),
        endsAt: formatDateValue(goal.endsAt),
        targetTransactionCount: goal.targetTransactionCount ? String(goal.targetTransactionCount) : "—",
        targetClosedVolume: goal.targetClosedVolume ? formatCurrency(goal.targetClosedVolume) : "—",
        targetOfficeNet: goal.targetOfficeNet ? formatCurrency(goal.targetOfficeNet) : "—",
        targetAgentNet: goal.targetAgentNet ? formatCurrency(goal.targetAgentNet) : "—",
        actualTransactionCount: String(goalTransactions.length),
        actualClosedVolume: formatCurrency(closedVolume),
        actualOfficeNet: formatCurrency(officeNet),
        actualAgentNet: formatCurrency(agentNet),
        notes: goal.notes ?? ""
      };
    })
  );

  const completedOnboardingCount = onboardingItems.filter((item) => item.status === "completed").length;
  const profileStatus = normalizeOnboardingStatus(membership.agentProfile?.onboardingStatus, onboardingItems);
  const billingSummary = billingSummaryMap.get(input.membershipId);

  return {
    profile: {
      membershipId: membership.id,
      userId: membership.user.id,
      fullName: `${membership.user.firstName} ${membership.user.lastName}`,
      displayName:
        membership.agentProfile?.displayName?.trim() || `${membership.user.firstName} ${membership.user.lastName}`,
      email: membership.user.email,
      officeName: membership.office?.name ?? "Unassigned",
      role: roleLabelMap[membership.role],
      title: membership.title ?? "",
      bio: membership.agentProfile?.bio ?? "",
      notes: membership.agentProfile?.notes ?? "",
      licenseNumber: membership.agentProfile?.licenseNumber ?? "",
      licenseState: membership.agentProfile?.licenseState ?? "",
      startDate: formatDateValue(membership.agentProfile?.startDate),
      onboardingStatus: onboardingStatusLabelMap[profileStatus],
      onboardingStatusValue: profileStatus,
      commissionPlanName: membership.agentProfile?.commissionPlanName ?? "",
      avatarUrl: membership.agentProfile?.avatarUrl ?? "",
      internalExtension: membership.agentProfile?.internalExtension ?? ""
    },
    summary: {
      activeTaskCount,
      openTransactionCount: pipelineTransactions
        .filter((item) => item.status !== "closed" && item.status !== "cancelled")
        .reduce((sum, item) => sum + item._count._all, 0),
      currentBalanceLabel: formatCurrency(billingSummary?.currentBalance ?? 0),
      paymentMethodsCount: billingSummary?.paymentMethodsCount ?? 0,
      pipelineCounts: [
        { label: "Opportunity", count: pipelineTransactions.find((item) => item.status === "opportunity")?._count._all ?? 0 },
        { label: "Active", count: pipelineTransactions.find((item) => item.status === "active")?._count._all ?? 0 },
        { label: "Pending", count: pipelineTransactions.find((item) => item.status === "pending")?._count._all ?? 0 },
        { label: "Closed", count: pipelineTransactions.find((item) => item.status === "closed")?._count._all ?? 0 }
      ]
    },
    teams: membership.teamMemberships.map((teamMembership) => ({
      id: teamMembership.team.id,
      name: teamMembership.team.name,
      slug: teamMembership.team.slug,
      isActive: teamMembership.team.isActive,
      role: teamRoleLabelMap[teamMembership.role]
    })),
    availableTeams: availableTeams.map((team) => ({
      id: team.id,
      label: team.name
    })),
    onboarding: {
      totalCount: onboardingItems.length,
      completedCount: completedOnboardingCount,
      statusLabel: onboardingStatusLabelMap[profileStatus],
      items: onboardingItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        category: item.category,
        dueAt: formatDateValue(item.dueAt),
        status: onboardingItemStatusLabelMap[item.status],
        statusValue: item.status,
        completedAt: formatDateValue(item.completedAt),
        completedByName: item.completedByMembership ? getMembershipLabel(item.completedByMembership) : ""
      }))
    },
    goals: goalSnapshots,
    recentTransactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      label: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`,
      status: transaction.status,
      priceLabel: formatCurrency(transaction.price),
      href: `/office/transactions/${transaction.id}`
    })),
    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      actionLabel: getActivityActionLabel(item.action),
      objectLabel: getPayloadObjectLabel(item.payload),
      timestampLabel: formatDateTimeLabel(item.createdAt)
    }))
  };
}

export async function saveAgentProfile(input: SaveAgentProfileInput) {
  return prisma.$transaction(async (tx) => {
    const membership = await ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId);
    const previousProfile = await tx.agentProfile.findUnique({
      where: {
        membershipId: input.membershipId
      }
    });

    const previousDisplayName = previousProfile?.displayName?.trim() || `${membership.user.firstName} ${membership.user.lastName}`;
    const previousLicense = previousProfile?.licenseNumber?.trim() || "—";
    const previousPlan = previousProfile?.commissionPlanName?.trim() || "—";

    const savedProfile = await tx.agentProfile.upsert({
      where: {
        membershipId: input.membershipId
      },
      update: {
        organizationId: input.organizationId,
        officeId: membership.officeId,
        displayName: parseOptionalText(input.displayName),
        bio: parseOptionalText(input.bio),
        notes: parseOptionalText(input.notes),
        licenseNumber: parseOptionalText(input.licenseNumber),
        licenseState: parseOptionalText(input.licenseState),
        startDate: parseOptionalDate(input.startDate),
        commissionPlanName: parseOptionalText(input.commissionPlanName),
        avatarUrl: parseOptionalText(input.avatarUrl),
        internalExtension: parseOptionalText(input.internalExtension)
      },
      create: {
        organizationId: input.organizationId,
        officeId: membership.officeId,
        membershipId: input.membershipId,
        displayName: parseOptionalText(input.displayName),
        bio: parseOptionalText(input.bio),
        notes: parseOptionalText(input.notes),
        licenseNumber: parseOptionalText(input.licenseNumber),
        licenseState: parseOptionalText(input.licenseState),
        startDate: parseOptionalDate(input.startDate),
        commissionPlanName: parseOptionalText(input.commissionPlanName),
        avatarUrl: parseOptionalText(input.avatarUrl),
        internalExtension: parseOptionalText(input.internalExtension)
      }
    });

    await syncAgentProfileOnboardingStatus(tx, input.organizationId, input.membershipId, input.officeId);

    const nextDisplayName = savedProfile.displayName?.trim() || `${membership.user.firstName} ${membership.user.lastName}`;
    const nextLicense = savedProfile.licenseNumber?.trim() || "—";
    const nextPlan = savedProfile.commissionPlanName?.trim() || "—";
    const changes = [
      buildChange("Display name", previousDisplayName, nextDisplayName),
      buildChange("License number", previousLicense, nextLicense),
      buildChange("Commission plan", previousPlan, nextPlan)
    ].filter((change): change is ActivityLogChange => Boolean(change));

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "agent_profile",
      entityId: savedProfile.id,
      action: previousProfile ? activityLogActions.agentProfileUpdated : activityLogActions.agentProfileCreated,
      payload: {
        officeId: membership.officeId,
        objectLabel: nextDisplayName,
        contextHref: `/office/agents/${input.membershipId}`,
        details: [`Role: ${roleLabelMap[membership.role]}`],
        changes
      }
    });

    return savedProfile;
  });
}

export async function createAgentTeam(input: CreateAgentTeamInput) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  return prisma.$transaction(async (tx) => {
    const baseSlug = slugify(name);
    const existingTeams = await tx.team.findMany({
      where: {
        organizationId: input.organizationId,
        slug: {
          startsWith: baseSlug
        }
      },
      select: {
        slug: true
      }
    });
    const slug = existingTeams.some((team) => team.slug === baseSlug) ? `${baseSlug}-${existingTeams.length + 1}` : baseSlug;
    const team = await tx.team.create({
      data: {
        organizationId: input.organizationId,
        officeId: input.officeId ?? null,
        name,
        slug
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "team",
      entityId: team.id,
      action: activityLogActions.teamCreated,
      payload: {
        officeId: input.officeId ?? null,
        objectLabel: team.name,
        contextHref: `/office/agents?teamId=${team.id}`,
        details: [`Status: Active`]
      }
    });

    return team;
  });
}

export async function updateAgentTeam(input: UpdateAgentTeamInput) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findFirst({
      where: {
        id: input.teamId,
        organizationId: input.organizationId,
        ...(input.officeId ? { officeId: input.officeId } : {})
      }
    });

    if (!team) {
      throw new Error("Team was not found.");
    }

    const nextName = parseOptionalText(input.name) ?? team.name;
    const nextIsActive = typeof input.isActive === "boolean" ? input.isActive : team.isActive;
    const changes = [
      buildChange("Name", team.name, nextName),
      buildChange("Status", team.isActive ? "Active" : "Inactive", nextIsActive ? "Active" : "Inactive")
    ].filter((change): change is ActivityLogChange => Boolean(change));

    const updatedTeam = await tx.team.update({
      where: {
        id: input.teamId
      },
      data: {
        name: nextName,
        slug: nextName === team.name ? team.slug : slugify(nextName),
        isActive: nextIsActive
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "team",
      entityId: updatedTeam.id,
      action: nextIsActive ? activityLogActions.teamUpdated : activityLogActions.teamDeactivated,
      payload: {
        officeId: updatedTeam.officeId,
        objectLabel: updatedTeam.name,
        contextHref: `/office/agents?teamId=${updatedTeam.id}`,
        details: [],
        changes
      }
    });

    return updatedTeam;
  });
}

export async function addAgentToTeam(input: AddAgentToTeamInput) {
  return prisma.$transaction(async (tx) => {
    const [team, membership] = await Promise.all([
      tx.team.findFirst({
        where: {
          id: input.teamId,
          organizationId: input.organizationId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        }
      }),
      ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId)
    ]);

    if (!team) {
      throw new Error("Team was not found.");
    }

    const nextRole = normalizeTeamRole(input.role);

    const teamMembership = await tx.teamMembership.upsert({
      where: {
        teamId_membershipId: {
          teamId: input.teamId,
          membershipId: input.membershipId
        }
      },
      update: {
        role: nextRole,
        officeId: team.officeId
      },
      create: {
        organizationId: input.organizationId,
        officeId: team.officeId,
        teamId: input.teamId,
        membershipId: input.membershipId,
        role: nextRole
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "team",
      entityId: team.id,
      action: activityLogActions.teamMemberAdded,
      payload: {
        officeId: team.officeId,
        objectLabel: `${team.name} · ${getMembershipLabel(membership)}`,
        contextHref: `/office/agents/${input.membershipId}`,
        details: [`Team role: ${teamRoleLabelMap[teamMembership.role]}`]
      }
    });

    return teamMembership;
  });
}

export async function removeAgentFromTeam(input: RemoveAgentFromTeamInput) {
  return prisma.$transaction(async (tx) => {
    const [team, membership, teamMembership] = await Promise.all([
      tx.team.findFirst({
        where: {
          id: input.teamId,
          organizationId: input.organizationId,
          ...(input.officeId ? { officeId: input.officeId } : {})
        }
      }),
      ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId),
      tx.teamMembership.findFirst({
        where: {
          organizationId: input.organizationId,
          teamId: input.teamId,
          membershipId: input.membershipId
        }
      })
    ]);

    if (!team || !teamMembership) {
      throw new Error("Team membership was not found.");
    }

    await tx.teamMembership.delete({
      where: {
        id: teamMembership.id
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "team",
      entityId: team.id,
      action: activityLogActions.teamMemberRemoved,
      payload: {
        officeId: team.officeId,
        objectLabel: `${team.name} · ${getMembershipLabel(membership)}`,
        contextHref: `/office/agents/${input.membershipId}`,
        details: [`Previous role: ${teamRoleLabelMap[teamMembership.role]}`]
      }
    });

    return true;
  });
}

export async function createAgentOnboardingItem(input: CreateAgentOnboardingItemInput) {
  if (!input.title.trim()) {
    throw new Error("Onboarding item title is required.");
  }

  return prisma.$transaction(async (tx) => {
    const membership = await ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId);
    const nextSortOrder = await tx.agentOnboardingItem.count({
      where: {
        organizationId: input.organizationId,
        membershipId: input.membershipId
      }
    });

    const item = await tx.agentOnboardingItem.create({
      data: {
        organizationId: input.organizationId,
        officeId: membership.officeId,
        membershipId: input.membershipId,
        title: input.title.trim(),
        description: parseOptionalText(input.description),
        category: parseOptionalText(input.category) ?? "General",
        dueAt: parseOptionalDate(input.dueAt),
        sortOrder: nextSortOrder
      }
    });

    await syncAgentProfileOnboardingStatus(tx, input.organizationId, input.membershipId, input.officeId);

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "agent_onboarding_item",
      entityId: item.id,
      action: activityLogActions.agentOnboardingItemCreated,
      payload: {
        officeId: membership.officeId,
        objectLabel: `${getMembershipLabel(membership)} · ${item.title}`,
        contextHref: `/office/agents/${input.membershipId}#onboarding`,
        details: [`Category: ${item.category}`]
      }
    });

    return item;
  });
}

export async function updateAgentOnboardingItem(input: UpdateAgentOnboardingItemInput) {
  return prisma.$transaction(async (tx) => {
    const [membership, item] = await Promise.all([
      ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId),
      tx.agentOnboardingItem.findFirst({
        where: {
          id: input.itemId,
          organizationId: input.organizationId,
          membershipId: input.membershipId
        }
      })
    ]);

    if (!item) {
      throw new Error("Onboarding item was not found.");
    }

    const nextStatus = normalizeOnboardingItemStatus(input.status) ?? item.status;
    const willComplete = nextStatus === "completed";
    const willReopen = nextStatus === "reopened" || nextStatus === "pending" || nextStatus === "in_progress";
    const updatedItem = await tx.agentOnboardingItem.update({
      where: {
        id: item.id
      },
      data: {
        title: input.title?.trim() || item.title,
        description: input.description !== undefined ? parseOptionalText(input.description) : item.description,
        category: input.category?.trim() || item.category,
        dueAt: input.dueAt !== undefined ? parseOptionalDate(input.dueAt) : item.dueAt,
        status: nextStatus,
        completedAt: willComplete ? new Date() : willReopen ? null : item.completedAt,
        completedByMembershipId: willComplete ? input.actorMembershipId : willReopen ? null : item.completedByMembershipId
      }
    });

    await syncAgentProfileOnboardingStatus(tx, input.organizationId, input.membershipId, input.officeId);

    const changes = [
      buildChange("Status", onboardingItemStatusLabelMap[item.status], onboardingItemStatusLabelMap[updatedItem.status]),
      buildChange("Title", item.title, updatedItem.title),
      buildChange("Category", item.category, updatedItem.category)
    ].filter((change): change is ActivityLogChange => Boolean(change));

    let action: ActivityLogAction = activityLogActions.agentOnboardingItemUpdated;
    if (item.status !== "completed" && updatedItem.status === "completed") {
      action = activityLogActions.agentOnboardingItemCompleted;
    } else if (item.status === "completed" && updatedItem.status !== "completed") {
      action = activityLogActions.agentOnboardingItemReopened;
    }

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "agent_onboarding_item",
      entityId: updatedItem.id,
      action,
      payload: {
        officeId: membership.officeId,
        objectLabel: `${getMembershipLabel(membership)} · ${updatedItem.title}`,
        contextHref: `/office/agents/${input.membershipId}#onboarding`,
        details: updatedItem.completedAt ? [`Completed: ${formatDateLabel(updatedItem.completedAt)}`] : [],
        changes
      }
    });

    return updatedItem;
  });
}

export async function createAgentGoal(input: CreateAgentGoalInput) {
  return prisma.$transaction(async (tx) => {
    const membership = await ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId);
    const goal = await tx.agentGoal.create({
      data: {
        organizationId: input.organizationId,
        officeId: membership.officeId,
        membershipId: input.membershipId,
        periodType: normalizeGoalPeriod(input.periodType),
        startsAt: parseOptionalDate(input.startsAt) ?? new Date(),
        endsAt: parseOptionalDate(input.endsAt) ?? new Date(),
        targetTransactionCount: input.targetTransactionCount?.trim() ? Number.parseInt(input.targetTransactionCount, 10) : null,
        targetClosedVolume: parseOptionalDecimal(input.targetClosedVolume),
        targetOfficeNet: parseOptionalDecimal(input.targetOfficeNet),
        targetAgentNet: parseOptionalDecimal(input.targetAgentNet),
        notes: parseOptionalText(input.notes)
      }
    });

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "agent_goal",
      entityId: goal.id,
      action: activityLogActions.agentGoalCreated,
      payload: {
        officeId: membership.officeId,
        objectLabel: `${getMembershipLabel(membership)} · ${goalPeriodLabelMap[goal.periodType]} goal`,
        contextHref: `/office/agents/${input.membershipId}#goals`,
        details: [`Window: ${formatDateLabel(goal.startsAt)} - ${formatDateLabel(goal.endsAt)}`]
      }
    });

    return goal;
  });
}

export async function updateAgentGoal(input: UpdateAgentGoalInput) {
  return prisma.$transaction(async (tx) => {
    const [membership, goal] = await Promise.all([
      ensureMembershipExists(tx, input.organizationId, input.membershipId, input.officeId),
      tx.agentGoal.findFirst({
        where: {
          id: input.goalId,
          organizationId: input.organizationId,
          membershipId: input.membershipId
        }
      })
    ]);

    if (!goal) {
      throw new Error("Goal was not found.");
    }

    const nextPeriod = normalizeGoalPeriod(input.periodType);
    const nextStartsAt = parseOptionalDate(input.startsAt) ?? goal.startsAt;
    const nextEndsAt = parseOptionalDate(input.endsAt) ?? goal.endsAt;
    const nextTransactionTarget = input.targetTransactionCount?.trim()
      ? Number.parseInt(input.targetTransactionCount, 10)
      : null;

    const updatedGoal = await tx.agentGoal.update({
      where: {
        id: goal.id
      },
      data: {
        periodType: nextPeriod,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        targetTransactionCount: nextTransactionTarget,
        targetClosedVolume: parseOptionalDecimal(input.targetClosedVolume),
        targetOfficeNet: parseOptionalDecimal(input.targetOfficeNet),
        targetAgentNet: parseOptionalDecimal(input.targetAgentNet),
        notes: parseOptionalText(input.notes)
      }
    });

    const changes = [
      buildChange("Period", goalPeriodLabelMap[goal.periodType], goalPeriodLabelMap[updatedGoal.periodType]),
      buildChange(
        "Transaction target",
        goal.targetTransactionCount ? String(goal.targetTransactionCount) : "—",
        updatedGoal.targetTransactionCount ? String(updatedGoal.targetTransactionCount) : "—"
      ),
      buildChange(
        "Closed volume target",
        goal.targetClosedVolume ? formatCurrency(goal.targetClosedVolume) : "—",
        updatedGoal.targetClosedVolume ? formatCurrency(updatedGoal.targetClosedVolume) : "—"
      )
    ].filter((change): change is ActivityLogChange => Boolean(change));

    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId,
      entityType: "agent_goal",
      entityId: updatedGoal.id,
      action: activityLogActions.agentGoalUpdated,
      payload: {
        officeId: membership.officeId,
        objectLabel: `${getMembershipLabel(membership)} · ${goalPeriodLabelMap[updatedGoal.periodType]} goal`,
        contextHref: `/office/agents/${input.membershipId}#goals`,
        details: [`Window: ${formatDateLabel(updatedGoal.startsAt)} - ${formatDateLabel(updatedGoal.endsAt)}`],
        changes
      }
    });

    return updatedGoal;
  });
}
