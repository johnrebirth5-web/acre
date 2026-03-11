import { randomUUID } from "node:crypto";
import { Prisma, TaskStatus, TransactionStatus, TransactionTaskStatus } from "@prisma/client";
import { prisma } from "./client";

export const activityLogActions = {
  transactionCreated: "transaction.created",
  transactionStatusChanged: "transaction.status_changed",
  transactionClosed: "transaction.closed",
  transactionCancelled: "transaction.cancelled",
  transactionContactLinked: "transaction.contact_linked",
  transactionContactUnlinked: "transaction.contact_unlinked",
  transactionPrimaryContactChanged: "transaction.primary_contact_changed",
  transactionFinanceUpdated: "transaction.finance_updated",
  transactionTaskCreated: "transaction.task_created",
  transactionTaskUpdated: "transaction.task_updated",
  transactionTaskReviewRequested: "transaction.task_review_requested",
  transactionTaskApproved: "transaction.task_approved",
  transactionTaskRejected: "transaction.task_rejected",
  transactionTaskCompleted: "transaction.task_completed",
  transactionTaskReopened: "transaction.task_reopened",
  followUpTaskCreated: "follow_up_task.created",
  contactCreated: "contact.created",
  contactUpdated: "contact.updated",
  activityCommentAdded: "activity.comment_added",
  authLogin: "auth.login",
  authLogout: "auth.logout"
} as const;

export type ActivityLogAction = (typeof activityLogActions)[keyof typeof activityLogActions];
export type ActivityLogViewMode = "all" | "activity" | "alerts";
export type ActivityLogEntityType = "transaction" | "contact" | "transaction_task" | "follow_up_task" | "activity_comment" | "session";
export type ActivityLogObjectType = "all" | "transaction" | "contact" | "task" | "comment" | "auth";

export type ActivityLogChange = {
  label: string;
  previousValue?: string | null;
  nextValue?: string | null;
};

export type ActivityLogPayload = {
  officeId?: string | null;
  objectLabel?: string;
  transactionId?: string;
  transactionLabel?: string;
  contactId?: string;
  contactName?: string;
  taskId?: string;
  taskTitle?: string;
  commentBody?: string;
  contextHref?: string;
  details?: string[];
  changes?: ActivityLogChange[];
};

export type ActivityLogSectionKey =
  | "all"
  | "transactions"
  | "contacts"
  | "tasks-checklists"
  | "finance-commissions"
  | "authentication"
  | "comments";

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
  objectType: Exclude<ActivityLogObjectType, "all">;
  isComment: boolean;
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
  objectType: Exclude<ActivityLogObjectType, "all" | "auth">;
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
  objectType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type AddOfficeActivityCommentInput = {
  organizationId: string;
  officeId?: string | null;
  membershipId: string;
  scopeLabel: string;
  body: string;
  contextHref?: string | null;
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
    objectType: ActivityLogObjectType;
    startDate: string;
    endDate: string;
    actorOptions: OfficeActivityActorOption[];
  };
};

type AuditLogWriter = Pick<Prisma.TransactionClient, "auditLog">;

type RecordActivityLogEventInput = {
  organizationId: string;
  membershipId?: string | null;
  entityType: ActivityLogEntityType;
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

type ParsedActivityPayload = ActivityLogPayload & {
  changes: ActivityLogChange[];
  details: string[];
};

const activityActionLabelMap: Record<ActivityLogAction, string> = {
  "transaction.created": "Transaction created",
  "transaction.status_changed": "Transaction status changed",
  "transaction.closed": "Transaction closed",
  "transaction.cancelled": "Transaction cancelled",
  "transaction.contact_linked": "Transaction contact linked",
  "transaction.contact_unlinked": "Transaction contact unlinked",
  "transaction.primary_contact_changed": "Transaction primary contact changed",
  "transaction.finance_updated": "Transaction finance updated",
  "transaction.task_created": "Task created",
  "transaction.task_updated": "Task updated",
  "transaction.task_review_requested": "Task review requested",
  "transaction.task_approved": "Task approved",
  "transaction.task_rejected": "Task rejected",
  "transaction.task_completed": "Task completed",
  "transaction.task_reopened": "Task reopened",
  "follow_up_task.created": "Follow-up task created",
  "contact.created": "Contact created",
  "contact.updated": "Contact updated",
  "activity.comment_added": "Comment added",
  "auth.login": "Sign in",
  "auth.logout": "Sign out"
};

const activityLogSectionDefinitions: ActivityLogSectionDefinition[] = [
  { key: "all", label: "All events", matches: () => true },
  {
    key: "transactions",
    label: "Transactions",
    matches: (action) =>
      action === activityLogActions.transactionCreated ||
      action === activityLogActions.transactionStatusChanged ||
      action === activityLogActions.transactionClosed ||
      action === activityLogActions.transactionCancelled ||
      action === activityLogActions.transactionContactLinked ||
      action === activityLogActions.transactionContactUnlinked ||
      action === activityLogActions.transactionPrimaryContactChanged
  },
  {
    key: "contacts",
    label: "Contacts",
    matches: (action) =>
      action === activityLogActions.contactCreated ||
      action === activityLogActions.contactUpdated
  },
  {
    key: "tasks-checklists",
    label: "Tasks / Checklists",
    matches: (action) =>
      action === activityLogActions.transactionTaskCreated ||
      action === activityLogActions.transactionTaskUpdated ||
      action === activityLogActions.transactionTaskReviewRequested ||
      action === activityLogActions.transactionTaskApproved ||
      action === activityLogActions.transactionTaskRejected ||
      action === activityLogActions.transactionTaskCompleted ||
      action === activityLogActions.transactionTaskReopened ||
      action === activityLogActions.followUpTaskCreated
  },
  {
    key: "finance-commissions",
    label: "Finance / Commissions",
    matches: (action) => action === activityLogActions.transactionFinanceUpdated
  },
  {
    key: "authentication",
    label: "Authentication",
    matches: (action) =>
      action === activityLogActions.authLogin || action === activityLogActions.authLogout
  },
  {
    key: "comments",
    label: "Comments",
    matches: (action) => action === activityLogActions.activityCommentAdded
  }
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

function parsePayloadString(payload: Prisma.JsonObject, key: string) {
  return typeof payload[key] === "string" ? payload[key] : undefined;
}

function parsePayloadNullableString(payload: Prisma.JsonObject, key: string) {
  return typeof payload[key] === "string" ? payload[key] : payload[key] === null ? null : undefined;
}

function parsePayloadDetails(payload: Prisma.JsonObject) {
  const value = payload.details;

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function parsePayloadChanges(payload: Prisma.JsonObject) {
  const value = payload.changes;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const maybeLabel = "label" in entry ? entry.label : undefined;
    const maybePrevious = "previousValue" in entry ? entry.previousValue : undefined;
    const maybeNext = "nextValue" in entry ? entry.nextValue : undefined;

    if (typeof maybeLabel !== "string" || maybeLabel.trim().length === 0) {
      return [];
    }

    return [
      {
        label: maybeLabel,
        previousValue: typeof maybePrevious === "string" ? maybePrevious : maybePrevious === null ? null : undefined,
        nextValue: typeof maybeNext === "string" ? maybeNext : maybeNext === null ? null : undefined
      }
    ];
  });
}

function getActivityPayload(payload: Prisma.JsonValue | null): ParsedActivityPayload {
  if (!isPayloadObject(payload)) {
    return {
      details: [],
      changes: []
    };
  }

  return {
    officeId: parsePayloadNullableString(payload, "officeId"),
    objectLabel: parsePayloadString(payload, "objectLabel"),
    transactionId: parsePayloadString(payload, "transactionId"),
    transactionLabel: parsePayloadString(payload, "transactionLabel"),
    contactId: parsePayloadString(payload, "contactId"),
    contactName: parsePayloadString(payload, "contactName"),
    taskId: parsePayloadString(payload, "taskId"),
    taskTitle: parsePayloadString(payload, "taskTitle"),
    commentBody: parsePayloadString(payload, "commentBody"),
    contextHref: parsePayloadString(payload, "contextHref"),
    details: parsePayloadDetails(payload),
    changes: parsePayloadChanges(payload)
  };
}

function mapEntityTypeToObjectType(entityType: string): Exclude<ActivityLogObjectType, "all"> {
  switch (entityType) {
    case "transaction":
      return "transaction";
    case "contact":
      return "contact";
    case "transaction_task":
    case "follow_up_task":
      return "task";
    case "activity_comment":
      return "comment";
    case "session":
      return "auth";
    default:
      return "transaction";
  }
}

function normalizeObjectType(value: string | undefined): ActivityLogObjectType {
  if (value === "transaction" || value === "contact" || value === "task" || value === "comment" || value === "auth") {
    return value;
  }

  return "all";
}

function getActivityHref(record: ActivityLogRecord, payload: ParsedActivityPayload) {
  if (record.entityType === "transaction") {
    const transactionId = payload.transactionId ?? record.entityId;

    if (record.action === activityLogActions.transactionFinanceUpdated) {
      return `/office/transactions/${transactionId}#finance`;
    }

    if (
      record.action === activityLogActions.transactionContactLinked ||
      record.action === activityLogActions.transactionContactUnlinked ||
      record.action === activityLogActions.transactionPrimaryContactChanged
    ) {
      return `/office/transactions/${transactionId}#contacts`;
    }

    return `/office/transactions/${transactionId}`;
  }

  if (record.entityType === "contact") {
    return `/office/contacts/${payload.contactId ?? record.entityId}`;
  }

  if (record.entityType === "transaction_task" && payload.transactionId) {
    return payload.taskId
      ? `/office/transactions/${payload.transactionId}#transaction-task-${payload.taskId}`
      : `/office/transactions/${payload.transactionId}#transaction-tasks`;
  }

  if (record.entityType === "follow_up_task" && payload.contactId) {
    return `/office/contacts/${payload.contactId}#follow-up-tasks`;
  }

  if (record.entityType === "activity_comment") {
    return payload.contextHref ?? null;
  }

  return null;
}

function getObjectLabel(record: ActivityLogRecord, payload: ParsedActivityPayload) {
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

function normalizeChangeValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function formatActivityChange(change: ActivityLogChange) {
  const previousValue = normalizeChangeValue(change.previousValue);
  const nextValue = normalizeChangeValue(change.nextValue);

  if (previousValue === nextValue) {
    return null;
  }

  return `${change.label}: ${previousValue} -> ${nextValue}`;
}

function getPayloadChange(payload: ParsedActivityPayload, label: string) {
  return payload.changes.find((change) => change.label === label) ?? null;
}

function formatSummaryChange(change: ActivityLogChange | null) {
  if (!change) {
    return null;
  }

  return `${normalizeChangeValue(change.previousValue)} to ${normalizeChangeValue(change.nextValue)}`;
}

function getSummary(action: string, payload: ParsedActivityPayload) {
  switch (action) {
    case activityLogActions.transactionCreated:
      return "created a transaction";
    case activityLogActions.transactionStatusChanged: {
      const statusChange = getPayloadChange(payload, "Status");
      return statusChange ? `changed transaction status from ${formatSummaryChange(statusChange)}` : "changed transaction status";
    }
    case activityLogActions.transactionClosed:
      return "closed a transaction";
    case activityLogActions.transactionCancelled:
      return "cancelled a transaction";
    case activityLogActions.transactionContactLinked:
      return payload.contactName ? `linked ${payload.contactName} to a transaction` : "linked a contact to a transaction";
    case activityLogActions.transactionContactUnlinked:
      return payload.contactName ? `unlinked ${payload.contactName} from a transaction` : "unlinked a contact from a transaction";
    case activityLogActions.transactionPrimaryContactChanged:
      return "changed the primary transaction contact";
    case activityLogActions.transactionFinanceUpdated:
      return payload.changes.length === 1 ? `updated ${payload.changes[0].label.toLowerCase()}` : "updated transaction finance";
    case activityLogActions.transactionTaskCreated:
      return "created a transaction task";
    case activityLogActions.transactionTaskUpdated: {
      const statusChange = getPayloadChange(payload, "Workflow status") ?? getPayloadChange(payload, "Status");
      return statusChange ? `updated task status from ${formatSummaryChange(statusChange)}` : "updated a transaction task";
    }
    case activityLogActions.transactionTaskReviewRequested:
      return "requested review for a transaction task";
    case activityLogActions.transactionTaskApproved:
      return "approved a transaction task";
    case activityLogActions.transactionTaskRejected:
      return "rejected a transaction task";
    case activityLogActions.transactionTaskCompleted:
      return "completed a transaction task";
    case activityLogActions.transactionTaskReopened:
      return "reopened a transaction task";
    case activityLogActions.followUpTaskCreated:
      return "created a follow-up task";
    case activityLogActions.contactCreated:
      return "created a contact";
    case activityLogActions.contactUpdated:
      return payload.changes.length === 1 ? `updated contact ${payload.changes[0].label.toLowerCase()}` : "updated a contact";
    case activityLogActions.activityCommentAdded:
      return "added an internal comment";
    case activityLogActions.authLogin:
      return "signed in";
    case activityLogActions.authLogout:
      return "signed out";
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

function getDetailSummary(payload: ParsedActivityPayload) {
  const detailItems = payload.details;
  const changeItems = payload.changes
    .map(formatActivityChange)
    .filter((detail): detail is string => Boolean(detail));
  const commentItems = payload.commentBody?.trim() ? [payload.commentBody.trim()] : [];

  const seen = new Set<string>();
  const merged: string[] = [];

  for (const detail of [...commentItems, ...changeItems, ...detailItems]) {
    if (seen.has(detail)) {
      continue;
    }

    seen.add(detail);
    merged.push(detail);
  }

  return merged;
}

function formatActivityLogRecord(record: ActivityLogRecord): OfficeActivityLogEvent {
  const payload = getActivityPayload(record.payload);

  return {
    id: record.id,
    action: record.action,
    actionLabel: getActionLabel(record.action),
    actorDisplayName: getActorDisplayName(record),
    summary: getSummary(record.action, payload),
    objectType: mapEntityTypeToObjectType(record.entityType),
    isComment: record.action === activityLogActions.activityCommentAdded,
    objectLabel: getObjectLabel(record, payload),
    href: getActivityHref(record, payload),
    timestampLabel: formatTimestamp(record.createdAt),
    detailSummary: getDetailSummary(payload)
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
  objectType: ActivityLogObjectType;
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
      closingSoonWindow && (input.objectType === "all" || input.objectType === "transaction")
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
      input.objectType === "all" || input.objectType === "task"
        ? prisma.transactionTask.findMany({
            where: {
              organizationId: input.organizationId,
              status: {
                in: [
                  TransactionTaskStatus.todo,
                  TransactionTaskStatus.in_progress,
                  TransactionTaskStatus.review_requested,
                  TransactionTaskStatus.reopened
                ]
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
          })
        : Promise.resolve([]),
      followUpSoonWindow && (input.objectType === "all" || input.objectType === "contact")
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
      input.objectType === "all" || input.objectType === "task"
        ? prisma.followUpTask.findMany({
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
          })
        : Promise.resolve([]),
      input.objectType === "all" || input.objectType === "transaction"
        ? prisma.transaction.findMany({
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
        : Promise.resolve([])
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
      objectType: "transaction",
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
      objectType: "task",
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
      objectType: "contact",
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
      objectType: "task",
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
      objectType: "transaction",
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

export async function addOfficeActivityComment(input: AddOfficeActivityCommentInput) {
  const body = input.body.trim();

  if (!body) {
    throw new Error("Comment body is required.");
  }

  await recordActivityLogEvent(prisma, {
    organizationId: input.organizationId,
    membershipId: input.membershipId,
    entityType: "activity_comment",
    entityId: randomUUID(),
    action: activityLogActions.activityCommentAdded,
    payload: {
      officeId: input.officeId ?? null,
      objectLabel: `${input.scopeLabel} · Internal comment`,
      commentBody: body,
      contextHref: input.contextHref ?? undefined,
      details: []
    }
  });
}

export async function getOfficeActivityLogSnapshot(input: GetOfficeActivityLogInput): Promise<OfficeActivityLogSnapshot> {
  const limit = input.limit ?? 200;
  const selectedView = getViewMode(input.view);
  const selectedActivitySection = getActivitySectionDefinition(input.activitySection);
  const selectedAlertSection = getAlertSectionDefinition(input.alertSection);
  const selectedObjectType = normalizeObjectType(input.objectType);
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

  const objectScopedEvents =
    selectedObjectType === "all"
      ? officeScopedEvents
      : officeScopedEvents.filter((record) => mapEntityTypeToObjectType(record.entityType) === selectedObjectType);

  const actorOptions = await getActorOptions(objectScopedEvents);
  const actorScopedEvents = input.actorMembershipId
    ? objectScopedEvents.filter((record) => record.membershipId === input.actorMembershipId)
    : objectScopedEvents;
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
    objectType: selectedObjectType,
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
      objectType: selectedObjectType,
      startDate: input.startDate ?? "",
      endDate: input.endDate ?? "",
      actorOptions
    }
  };
}
