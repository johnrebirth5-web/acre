import { Prisma, TaskStatus, TransactionStatus, TransactionTaskStatus } from "@prisma/client";
import { prisma } from "./client";

export const activityLogActions = {
  transactionCreated: "transaction.created",
  transactionStatusChanged: "transaction.status_changed",
  transactionClosed: "transaction.closed",
  transactionContactLinked: "transaction.contact_linked",
  transactionContactUnlinked: "transaction.contact_unlinked",
  transactionPrimaryContactChanged: "transaction.primary_contact_changed",
  transactionFinanceUpdated: "transaction.finance_updated",
  transactionTaskCreated: "transaction.task_created",
  transactionTaskUpdated: "transaction.task_updated",
  transactionTaskCompleted: "transaction.task_completed",
  contactCreated: "contact.created",
  contactUpdated: "contact.updated"
} as const;

export type ActivityLogAction = (typeof activityLogActions)[keyof typeof activityLogActions];
export type ActivityLogViewMode = "all" | "activity" | "alerts";

export type ActivityLogPayload = {
  officeId?: string | null;
  objectLabel?: string;
  transactionId?: string;
  transactionLabel?: string;
  contactId?: string;
  contactName?: string;
  taskId?: string;
  taskTitle?: string;
  details?: string[];
};

export type ActivityLogSectionKey =
  | "all"
  | "transaction-created"
  | "transaction-updated"
  | "transaction-status-changed"
  | "transaction-closed"
  | "transaction-contact-linked"
  | "transaction-contact-unlinked"
  | "transaction-primary-contact-changed"
  | "transaction-finance-updated"
  | "task-created"
  | "task-updated"
  | "task-completed"
  | "contact-created"
  | "contact-updated";

export type ActivityAlertSectionKey =
  | "all"
  | "transaction-closing-soon"
  | "overdue-transaction-tasks"
  | "contacts-follow-up-soon"
  | "overdue-follow-up-tasks"
  | "transaction-finance-incomplete";

export type OfficeActivityLogSection = {
  key: ActivityLogSectionKey;
  label: string;
  count: number;
};

export type OfficeActivityAlertSection = {
  key: ActivityAlertSectionKey;
  label: string;
  count: number;
};

export type OfficeActivityLogEvent = {
  id: string;
  action: string;
  actionLabel: string;
  actorDisplayName: string;
  summary: string;
  objectLabel: string;
  href: string | null;
  timestampLabel: string;
  detailSummary: string[];
};

export type OfficeOperationalAlertSeverity = "high" | "medium" | "low";

export type OfficeOperationalAlert = {
  id: string;
  type: Exclude<ActivityAlertSectionKey, "all">;
  typeLabel: string;
  severity: OfficeOperationalAlertSeverity;
  severityLabel: string;
  title: string;
  summary: string;
  objectLabel: string;
  href: string | null;
  referenceLabel: string;
  detailSummary: string[];
};

export type OfficeActivityActorOption = {
  id: string;
  label: string;
};

export type GetOfficeActivityLogInput = {
  organizationId: string;
  officeId?: string | null;
  view?: string;
  activitySection?: string;
  alertSection?: string;
  actorMembershipId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type OfficeActivityLogSnapshot = {
  latestWindowLabel: string;
  latestWindowCount: number;
  selectedView: ActivityLogViewMode;
  activitySelectedSection: ActivityLogSectionKey;
  activitySelectedSectionLabel: string;
  alertSelectedSection: ActivityAlertSectionKey;
  alertSelectedSectionLabel: string;
  activitySections: OfficeActivityLogSection[];
  alertSections: OfficeActivityAlertSection[];
  activityEvents: OfficeActivityLogEvent[];
  alerts: OfficeOperationalAlert[];
  filters: {
    actorMembershipId: string;
    startDate: string;
    endDate: string;
    actorOptions: OfficeActivityActorOption[];
  };
};

type AuditLogWriter = Pick<Prisma.TransactionClient, "auditLog">;

type RecordActivityLogEventInput = {
  organizationId: string;
  membershipId?: string | null;
  entityType: "transaction" | "contact" | "transaction_task";
  entityId: string;
  action: ActivityLogAction;
  payload?: ActivityLogPayload;
};

type ActivityLogRecord = {
  id: string;
  membershipId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  membership: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
};

type ActivityLogSectionDefinition = {
  key: ActivityLogSectionKey;
  label: string;
  matches: (action: string) => boolean;
};

type ActivityAlertSectionDefinition = {
  key: Exclude<ActivityAlertSectionKey, "all">;
  label: string;
  matches: (alert: OfficeOperationalAlert) => boolean;
};

const activityActionLabelMap: Record<ActivityLogAction, string> = {
  "transaction.created": "Transaction created",
  "transaction.status_changed": "Transaction status changed",
  "transaction.closed": "Transaction closed",
  "transaction.contact_linked": "Transaction contact linked",
  "transaction.contact_unlinked": "Transaction contact unlinked",
  "transaction.primary_contact_changed": "Transaction primary contact changed",
  "transaction.finance_updated": "Transaction finance updated",
  "transaction.task_created": "Task created",
  "transaction.task_updated": "Task updated",
  "transaction.task_completed": "Task completed",
  "contact.created": "Contact created",
  "contact.updated": "Contact updated"
};

const activityLogSectionDefinitions: ActivityLogSectionDefinition[] = [
  { key: "all", label: "All events", matches: () => true },
  { key: "transaction-created", label: "Transaction created", matches: (action) => action === activityLogActions.transactionCreated },
  {
    key: "transaction-updated",
    label: "Transaction updated",
    matches: (action) =>
      action === activityLogActions.transactionStatusChanged ||
      action === activityLogActions.transactionClosed ||
      action === activityLogActions.transactionContactLinked ||
      action === activityLogActions.transactionContactUnlinked ||
      action === activityLogActions.transactionPrimaryContactChanged ||
      action === activityLogActions.transactionFinanceUpdated
  },
  { key: "transaction-status-changed", label: "Transaction status changed", matches: (action) => action === activityLogActions.transactionStatusChanged },
  { key: "transaction-closed", label: "Transaction closed", matches: (action) => action === activityLogActions.transactionClosed },
  { key: "transaction-contact-linked", label: "Transaction contact linked", matches: (action) => action === activityLogActions.transactionContactLinked },
  { key: "transaction-contact-unlinked", label: "Transaction contact unlinked", matches: (action) => action === activityLogActions.transactionContactUnlinked },
  {
    key: "transaction-primary-contact-changed",
    label: "Transaction primary contact changed",
    matches: (action) => action === activityLogActions.transactionPrimaryContactChanged
  },
  { key: "transaction-finance-updated", label: "Transaction finance updated", matches: (action) => action === activityLogActions.transactionFinanceUpdated },
  { key: "task-created", label: "Task created", matches: (action) => action === activityLogActions.transactionTaskCreated },
  { key: "task-updated", label: "Task updated", matches: (action) => action === activityLogActions.transactionTaskUpdated || action === activityLogActions.transactionTaskCompleted },
  { key: "task-completed", label: "Task completed", matches: (action) => action === activityLogActions.transactionTaskCompleted },
  { key: "contact-created", label: "Contact created", matches: (action) => action === activityLogActions.contactCreated },
  { key: "contact-updated", label: "Contact updated", matches: (action) => action === activityLogActions.contactUpdated }
];

const activityAlertSectionDefinitions: ActivityAlertSectionDefinition[] = [
  { key: "transaction-closing-soon", label: "Transaction closing soon", matches: (alert) => alert.type === "transaction-closing-soon" },
  { key: "overdue-transaction-tasks", label: "Overdue transaction tasks", matches: (alert) => alert.type === "overdue-transaction-tasks" },
  { key: "contacts-follow-up-soon", label: "Contacts needing follow-up soon", matches: (alert) => alert.type === "contacts-follow-up-soon" },
  { key: "overdue-follow-up-tasks", label: "Overdue follow-up tasks", matches: (alert) => alert.type === "overdue-follow-up-tasks" },
  { key: "transaction-finance-incomplete", label: "Transaction finance incomplete", matches: (alert) => alert.type === "transaction-finance-incomplete" }
];

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getActorDisplayName(record: ActivityLogRecord) {
  return record.membership ? `${record.membership.user.firstName} ${record.membership.user.lastName}` : "System";
}

function isPayloadObject(payload: Prisma.JsonValue | null): payload is Prisma.JsonObject {
  return Boolean(payload) && typeof payload === "object" && !Array.isArray(payload);
}

function getActivityPayload(payload: Prisma.JsonValue | null): ActivityLogPayload {
  if (!isPayloadObject(payload)) {
    return {};
  }

  const detailsValue = payload.details;

  return {
    officeId: typeof payload.officeId === "string" ? payload.officeId : payload.officeId === null ? null : undefined,
    objectLabel: typeof payload.objectLabel === "string" ? payload.objectLabel : undefined,
    transactionId: typeof payload.transactionId === "string" ? payload.transactionId : undefined,
    transactionLabel: typeof payload.transactionLabel === "string" ? payload.transactionLabel : undefined,
    contactId: typeof payload.contactId === "string" ? payload.contactId : undefined,
    contactName: typeof payload.contactName === "string" ? payload.contactName : undefined,
    taskId: typeof payload.taskId === "string" ? payload.taskId : undefined,
    taskTitle: typeof payload.taskTitle === "string" ? payload.taskTitle : undefined,
    details: Array.isArray(detailsValue) ? detailsValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []
  };
}

function getActivityHref(record: ActivityLogRecord, payload: ActivityLogPayload) {
  if (record.entityType === "transaction") {
    return `/office/transactions/${payload.transactionId ?? record.entityId}`;
  }

  if (record.entityType === "contact") {
    return `/office/contacts/${payload.contactId ?? record.entityId}`;
  }

  if (record.entityType === "transaction_task" && payload.transactionId) {
    return `/office/transactions/${payload.transactionId}`;
  }

  return null;
}

function getObjectLabel(record: ActivityLogRecord, payload: ActivityLogPayload) {
  return (
    payload.objectLabel ??
    payload.transactionLabel ??
    payload.contactName ??
    payload.taskTitle ??
    `${record.entityType.replaceAll("_", " ")} · ${record.entityId}`
  );
}

function getActionLabel(action: string) {
  return activityActionLabelMap[action as ActivityLogAction] ?? action;
}

function getSummary(action: string) {
  switch (action) {
    case activityLogActions.transactionCreated:
      return "created a transaction";
    case activityLogActions.transactionStatusChanged:
      return "changed transaction status";
    case activityLogActions.transactionClosed:
      return "closed a transaction";
    case activityLogActions.transactionContactLinked:
      return "linked a contact to a transaction";
    case activityLogActions.transactionContactUnlinked:
      return "unlinked a contact from a transaction";
    case activityLogActions.transactionPrimaryContactChanged:
      return "changed the primary transaction contact";
    case activityLogActions.transactionFinanceUpdated:
      return "updated transaction finance";
    case activityLogActions.transactionTaskCreated:
      return "created a transaction task";
    case activityLogActions.transactionTaskUpdated:
      return "updated a transaction task";
    case activityLogActions.transactionTaskCompleted:
      return "completed a transaction task";
    case activityLogActions.contactCreated:
      return "created a contact";
    case activityLogActions.contactUpdated:
      return "updated a contact";
    default:
      return "recorded an activity event";
  }
}

function getActivitySectionDefinition(key: string | undefined) {
  return activityLogSectionDefinitions.find((section) => section.key === key) ?? activityLogSectionDefinitions[0];
}

function getAlertSectionDefinition(key: string | undefined) {
  return activityAlertSectionDefinitions.find((section) => section.key === key) ?? null;
}

function getViewMode(view: string | undefined): ActivityLogViewMode {
  return view === "activity" || view === "alerts" ? view : "all";
}

function formatActivityLogRecord(record: ActivityLogRecord): OfficeActivityLogEvent {
  const payload = getActivityPayload(record.payload);

  return {
    id: record.id,
    action: record.action,
    actionLabel: getActionLabel(record.action),
    actorDisplayName: getActorDisplayName(record),
    summary: getSummary(record.action),
    objectLabel: getObjectLabel(record, payload),
    href: getActivityHref(record, payload),
    timestampLabel: formatTimestamp(record.createdAt),
    detailSummary: payload.details ?? []
  };
}

function parseStartDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInRange(date: Date | null | undefined, startDate: Date | null, endDate: Date | null) {
  if (!date) {
    return false;
  }

  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date > endDate) {
    return false;
  }

  return true;
}

function clampDateWindow(startDate: Date, endDate: Date, filterStartDate: Date | null, filterEndDate: Date | null) {
  const effectiveStartDate = filterStartDate && filterStartDate > startDate ? filterStartDate : startDate;
  const effectiveEndDate = filterEndDate && filterEndDate < endDate ? filterEndDate : endDate;

  if (effectiveStartDate > effectiveEndDate) {
    return null;
  }

  return {
    startDate: effectiveStartDate,
    endDate: effectiveEndDate
  };
}

function formatCurrency(value: Prisma.Decimal | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function getSeverityLabel(severity: OfficeOperationalAlertSeverity) {
  switch (severity) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

function getSeverityRank(severity: OfficeOperationalAlertSeverity) {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function sortAlerts(alerts: Array<OfficeOperationalAlert & { sortAt: Date }>) {
  return alerts
    .sort((left, right) => {
      const severityDiff = getSeverityRank(right.severity) - getSeverityRank(left.severity);

      if (severityDiff !== 0) {
        return severityDiff;
      }

      return left.sortAt.getTime() - right.sortAt.getTime();
    })
    .map(({ sortAt: _sortAt, ...alert }) => alert);
}

function buildAlertReferenceLabel(label: string, date: Date) {
  return `${label}: ${formatDateLabel(date)}`;
}

async function getActorOptions(records: ActivityLogRecord[]) {
  const seen = new Set<string>();
  const options: OfficeActivityActorOption[] = [];

  for (const record of records) {
    if (!record.membershipId || !record.membership) {
      continue;
    }

    if (seen.has(record.membershipId)) {
      continue;
    }

    seen.add(record.membershipId);
    options.push({
      id: record.membershipId,
      label: `${record.membership.user.firstName} ${record.membership.user.lastName}`
    });
  }

  return options.sort((left, right) => left.label.localeCompare(right.label));
}

async function listOperationalAlerts(input: {
  organizationId: string;
  officeId?: string | null;
  startDate: Date | null;
  endDate: Date | null;
}): Promise<OfficeOperationalAlert[]> {
  const now = new Date();
  const closingSoonWindow = clampDateWindow(
    now,
    new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    input.startDate,
    input.endDate
  );
  const followUpSoonWindow = clampDateWindow(
    now,
    new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    input.startDate,
    input.endDate
  );

  const [closingSoonTransactions, overdueTransactionTasks, contactsNeedingFollowUpSoon, overdueFollowUpTasks, financeIncompleteTransactions] =
    await Promise.all([
      closingSoonWindow
        ? prisma.transaction.findMany({
            where: {
              organizationId: input.organizationId,
              ...(input.officeId ? { officeId: input.officeId } : {}),
              status: {
                in: [TransactionStatus.active, TransactionStatus.pending]
              },
              closingDate: {
                gte: closingSoonWindow.startDate,
                lte: closingSoonWindow.endDate
              }
            },
            include: {
              ownerMembership: {
                include: {
                  user: true
                }
              }
            },
            orderBy: [{ closingDate: "asc" }]
          })
        : Promise.resolve([]),
      prisma.transactionTask.findMany({
        where: {
          organizationId: input.organizationId,
          status: {
            in: [TransactionTaskStatus.todo, TransactionTaskStatus.in_progress]
          },
          dueAt: {
            lt: now,
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {})
          },
          transaction: input.officeId
            ? {
                officeId: input.officeId
              }
            : undefined
        },
        include: {
          assigneeMembership: {
            include: {
              user: true
            }
          },
          transaction: true
        },
        orderBy: [{ dueAt: "asc" }]
      }),
      followUpSoonWindow
        ? prisma.client.findMany({
            where: {
              organizationId: input.organizationId,
              nextFollowUpAt: {
                gte: followUpSoonWindow.startDate,
                lte: followUpSoonWindow.endDate
              },
              ...(input.officeId
                ? {
                    ownerMembership: {
                      officeId: input.officeId
                    }
                  }
                : {})
            },
            include: {
              ownerMembership: {
                include: {
                  user: true
                }
              }
            },
            orderBy: [{ nextFollowUpAt: "asc" }]
          })
        : Promise.resolve([]),
      prisma.followUpTask.findMany({
        where: {
          organizationId: input.organizationId,
          status: {
            in: [TaskStatus.queued, TaskStatus.in_progress]
          },
          dueAt: {
            lt: now,
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {})
          },
          ...(input.officeId
            ? {
                OR: [
                  {
                    assigneeMembership: {
                      officeId: input.officeId
                    }
                  },
                  {
                    client: {
                      ownerMembership: {
                        officeId: input.officeId
                      }
                    }
                  }
                ]
              }
            : {})
        },
        include: {
          assigneeMembership: {
            include: {
              user: true
            }
          },
          client: {
            include: {
              ownerMembership: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: [{ dueAt: "asc" }]
      }),
      prisma.transaction.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.officeId ? { officeId: input.officeId } : {}),
          status: {
            not: TransactionStatus.cancelled
          },
          OR: [{ grossCommission: null }, { officeNet: null }, { agentNet: null }],
          ...(input.startDate || input.endDate
            ? {
                updatedAt: {
                  ...(input.startDate ? { gte: input.startDate } : {}),
                  ...(input.endDate ? { lte: input.endDate } : {})
                }
              }
            : {})
        },
        include: {
          ownerMembership: {
            include: {
              user: true
            }
          }
        },
        orderBy: [{ updatedAt: "desc" }]
      })
    ]);

  const alerts: Array<OfficeOperationalAlert & { sortAt: Date }> = [];

  for (const transaction of closingSoonTransactions) {
    if (!transaction.closingDate) {
      continue;
    }

    const daysUntilClosing = Math.ceil((transaction.closingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const severity: OfficeOperationalAlertSeverity = daysUntilClosing <= 3 ? "high" : "medium";

    alerts.push({
      id: `alert-closing-${transaction.id}`,
      type: "transaction-closing-soon",
      typeLabel: "Transaction closing soon",
      severity,
      severityLabel: getSeverityLabel(severity),
      title: "Closing date approaching",
      summary: `${transaction.title} is scheduled to close soon.`,
      objectLabel: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`,
      href: `/office/transactions/${transaction.id}`,
      referenceLabel: buildAlertReferenceLabel("Closing date", transaction.closingDate),
      detailSummary: [
        `Status: ${transaction.status}`,
        `Price: ${formatCurrency(transaction.price)}`,
        `Owner: ${transaction.ownerMembership ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}` : "Unassigned"}`
      ],
      sortAt: transaction.closingDate
    });
  }

  for (const task of overdueTransactionTasks) {
    if (!task.dueAt) {
      continue;
    }

    alerts.push({
      id: `alert-transaction-task-${task.id}`,
      type: "overdue-transaction-tasks",
      typeLabel: "Overdue transaction task",
      severity: "high",
      severityLabel: getSeverityLabel("high"),
      title: "Transaction task overdue",
      summary: `${task.title} is overdue and still open.`,
      objectLabel: `${task.transaction.title} · ${task.transaction.address}, ${task.transaction.city}, ${task.transaction.state}`,
      href: `/office/transactions/${task.transactionId}`,
      referenceLabel: buildAlertReferenceLabel("Due date", task.dueAt),
      detailSummary: [
        `Checklist group: ${task.checklistGroup}`,
        `Assignee: ${task.assigneeMembership ? `${task.assigneeMembership.user.firstName} ${task.assigneeMembership.user.lastName}` : "Unassigned"}`,
        `Status: ${task.status === "in_progress" ? "In progress" : "Todo"}`
      ],
      sortAt: task.dueAt
    });
  }

  for (const client of contactsNeedingFollowUpSoon) {
    if (!client.nextFollowUpAt) {
      continue;
    }

    alerts.push({
      id: `alert-client-follow-up-${client.id}`,
      type: "contacts-follow-up-soon",
      typeLabel: "Contact follow-up soon",
      severity: "medium",
      severityLabel: getSeverityLabel("medium"),
      title: "Contact follow-up due soon",
      summary: `${client.fullName} needs follow-up soon.`,
      objectLabel: client.email ? `${client.fullName} · ${client.email}` : client.fullName,
      href: `/office/contacts/${client.id}`,
      referenceLabel: buildAlertReferenceLabel("Next follow-up", client.nextFollowUpAt),
      detailSummary: [
        `Stage: ${client.stage}`,
        `Intent: ${client.intent}`,
        `Owner: ${client.ownerMembership ? `${client.ownerMembership.user.firstName} ${client.ownerMembership.user.lastName}` : "Unassigned"}`
      ],
      sortAt: client.nextFollowUpAt
    });
  }

  for (const task of overdueFollowUpTasks) {
    if (!task.dueAt) {
      continue;
    }

    alerts.push({
      id: `alert-follow-up-task-${task.id}`,
      type: "overdue-follow-up-tasks",
      typeLabel: "Overdue follow-up task",
      severity: "high",
      severityLabel: getSeverityLabel("high"),
      title: "Follow-up task overdue",
      summary: `${task.title} is overdue and still assigned.`,
      objectLabel: task.client?.fullName ?? task.title,
      href: task.clientId ? `/office/contacts/${task.clientId}` : null,
      referenceLabel: buildAlertReferenceLabel("Due date", task.dueAt),
      detailSummary: [
        `Client: ${task.client?.fullName ?? "Unknown"}`,
        `Assignee: ${task.assigneeMembership ? `${task.assigneeMembership.user.firstName} ${task.assigneeMembership.user.lastName}` : "Unassigned"}`,
        `Status: ${task.status === "in_progress" ? "In progress" : "Queued"}`
      ],
      sortAt: task.dueAt
    });
  }

  for (const transaction of financeIncompleteTransactions) {
    const missingFields = [
      transaction.grossCommission === null ? "gross commission" : null,
      transaction.officeNet === null ? "office net" : null,
      transaction.agentNet === null ? "agent net" : null
    ].filter((field): field is string => Boolean(field));

    const severity: OfficeOperationalAlertSeverity =
      transaction.status === TransactionStatus.pending || transaction.status === TransactionStatus.closed ? "high" : "medium";

    alerts.push({
      id: `alert-finance-${transaction.id}`,
      type: "transaction-finance-incomplete",
      typeLabel: "Transaction finance incomplete",
      severity,
      severityLabel: getSeverityLabel(severity),
      title: "Transaction finance is incomplete",
      summary: `${transaction.title} is missing key finance values.`,
      objectLabel: `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`,
      href: `/office/transactions/${transaction.id}`,
      referenceLabel: buildAlertReferenceLabel("Last updated", transaction.updatedAt),
      detailSummary: [
        `Missing: ${missingFields.join(", ")}`,
        `Status: ${transaction.status}`,
        `Owner: ${transaction.ownerMembership ? `${transaction.ownerMembership.user.firstName} ${transaction.ownerMembership.user.lastName}` : "Unassigned"}`
      ],
      sortAt: transaction.updatedAt
    });
  }

  return sortAlerts(alerts);
}

export async function recordActivityLogEvent(writer: AuditLogWriter, input: RecordActivityLogEventInput) {
  const payload = input.payload ? (JSON.parse(JSON.stringify(input.payload)) as Prisma.InputJsonValue) : Prisma.JsonNull;

  await writer.auditLog.create({
    data: {
      organizationId: input.organizationId,
      membershipId: input.membershipId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      payload
    }
  });
}

export async function getOfficeActivityLogSnapshot(input: GetOfficeActivityLogInput): Promise<OfficeActivityLogSnapshot> {
  const limit = input.limit ?? 200;
  const selectedView = getViewMode(input.view);
  const selectedActivitySection = getActivitySectionDefinition(input.activitySection);
  const selectedAlertSection = getAlertSectionDefinition(input.alertSection);
  const startDate = parseStartDate(input.startDate);
  const endDate = parseEndDate(input.endDate);
  const fetchWindow = Math.max(limit * 5, 1000);

  const rawEvents = await prisma.auditLog.findMany({
    where: {
      organizationId: input.organizationId,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {})
            }
          }
        : {})
    },
    include: {
      membership: {
        include: {
          user: true
        }
      }
    },
    orderBy: [{ createdAt: "desc" }],
    take: fetchWindow
  });

  const officeScopedEvents = rawEvents.filter((record) => {
    if (!input.officeId) {
      return true;
    }

    return getActivityPayload(record.payload).officeId === input.officeId;
  });

  const actorOptions = await getActorOptions(officeScopedEvents);
  const actorScopedEvents = input.actorMembershipId
    ? officeScopedEvents.filter((record) => record.membershipId === input.actorMembershipId)
    : officeScopedEvents;
  const latestActivityWindow = actorScopedEvents.slice(0, limit).map(formatActivityLogRecord);

  const activitySections = activityLogSectionDefinitions.map((section) => ({
    key: section.key,
    label: section.label,
    count: latestActivityWindow.filter((event) => section.matches(event.action)).length
  }));

  const activityEvents =
    selectedView === "alerts"
      ? []
      : selectedActivitySection.key === "all"
        ? latestActivityWindow
        : latestActivityWindow.filter((event) => selectedActivitySection.matches(event.action));

  const derivedAlerts = await listOperationalAlerts({
    organizationId: input.organizationId,
    officeId: input.officeId,
    startDate,
    endDate
  });

  const alertSections: OfficeActivityAlertSection[] = [
    {
      key: "all",
      label: "All alerts",
      count: derivedAlerts.length
    },
    ...activityAlertSectionDefinitions.map((section) => ({
      key: section.key,
      label: section.label,
      count: derivedAlerts.filter((alert) => section.matches(alert)).length
    }))
  ];

  const alerts =
    selectedView === "activity"
      ? []
      : selectedAlertSection
        ? derivedAlerts.filter((alert) => selectedAlertSection.matches(alert))
        : derivedAlerts;

  return {
    latestWindowLabel: `Latest ${limit} activity records`,
    latestWindowCount: latestActivityWindow.length,
    selectedView,
    activitySelectedSection: selectedActivitySection.key,
    activitySelectedSectionLabel: selectedActivitySection.label,
    alertSelectedSection: selectedAlertSection?.key ?? "all",
    alertSelectedSectionLabel: selectedAlertSection?.label ?? "All alerts",
    activitySections,
    alertSections,
    activityEvents,
    alerts,
    filters: {
      actorMembershipId: input.actorMembershipId ?? "",
      startDate: input.startDate ?? "",
      endDate: input.endDate ?? "",
      actorOptions
    }
  };
}
