import { Prisma, TransactionTaskStatus, UserRole } from "@prisma/client";
import { activityLogActions, recordActivityLogEvent } from "./activity-log";
import { prisma } from "./client";

export type OfficeTransactionTaskStatus = "Todo" | "In progress" | "Completed";

export type OfficeTransactionTask = {
  id: string;
  checklistGroup: string;
  title: string;
  description: string;
  assigneeMembershipId: string | null;
  assigneeName: string;
  dueAt: string;
  status: OfficeTransactionTaskStatus;
  sortOrder: number;
};

export type OfficeTransactionTaskAssigneeOption = {
  id: string;
  label: string;
};

export type CreateTransactionTaskInput = {
  organizationId: string;
  transactionId: string;
  actorMembershipId?: string;
  checklistGroup?: string;
  title: string;
  description?: string;
  assigneeMembershipId?: string;
  dueAt?: string;
  status?: OfficeTransactionTaskStatus;
};

export type UpdateTransactionTaskInput = {
  organizationId: string;
  transactionId: string;
  taskId: string;
  actorMembershipId?: string;
  checklistGroup?: string;
  title?: string;
  description?: string;
  assigneeMembershipId?: string;
  dueAt?: string;
  status?: OfficeTransactionTaskStatus;
  sortOrder?: number;
};

const taskStatusLabelMap: Record<TransactionTaskStatus, OfficeTransactionTaskStatus> = {
  todo: "Todo",
  in_progress: "In progress",
  completed: "Completed"
};

const taskStatusDbMap: Record<OfficeTransactionTaskStatus, TransactionTaskStatus> = {
  Todo: "todo",
  "In progress": "in_progress",
  Completed: "completed"
};

function formatDateValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function parseOptionalDate(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeChecklistGroup(value: string | undefined) {
  return value?.trim() || "General";
}

function normalizeTaskStatus(value: string | undefined) {
  const fallback: OfficeTransactionTaskStatus = "Todo";

  if (!value) {
    return fallback;
  }

  return value in taskStatusDbMap ? (value as OfficeTransactionTaskStatus) : fallback;
}

function mapTransactionTask(
  task: {
    id: string;
    checklistGroup: string;
    title: string;
    description: string | null;
    assigneeMembershipId: string | null;
    dueAt: Date | null;
    status: TransactionTaskStatus;
    sortOrder: number;
    assigneeMembership: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
  }
): OfficeTransactionTask {
  return {
    id: task.id,
    checklistGroup: task.checklistGroup,
    title: task.title,
    description: task.description ?? "",
    assigneeMembershipId: task.assigneeMembershipId,
    assigneeName: task.assigneeMembership
      ? `${task.assigneeMembership.user.firstName} ${task.assigneeMembership.user.lastName}`
      : "Unassigned",
    dueAt: formatDateValue(task.dueAt),
    status: taskStatusLabelMap[task.status],
    sortOrder: task.sortOrder
  };
}

function buildTransactionObjectLabel(transaction: {
  title: string;
  address: string;
  city: string;
  state: string;
}) {
  return `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`;
}

function buildTaskObjectLabel(taskTitle: string, transactionLabel: string) {
  return `${taskTitle} · ${transactionLabel}`;
}

function buildTaskDetail(label: string, previousValue: string, nextValue: string) {
  if (previousValue === nextValue) {
    return null;
  }

  return `${label}: ${previousValue || "—"} -> ${nextValue || "—"}`;
}

async function getTransactionScope(organizationId: string, transactionId: string) {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      organizationId
    },
    select: {
      id: true,
      officeId: true
    }
  });
}

async function validateAssigneeMembership(
  organizationId: string,
  officeId: string | null,
  assigneeMembershipId: string | undefined
) {
  const trimmedMembershipId = assigneeMembershipId?.trim();

  if (!trimmedMembershipId) {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: trimmedMembershipId,
      organizationId,
      status: "active",
      ...(officeId ? { officeId } : {})
    },
    select: {
      id: true
    }
  });

  return membership?.id ?? null;
}

export async function listTransactionTasks(organizationId: string, transactionId: string): Promise<OfficeTransactionTask[]> {
  const tasks = await prisma.transactionTask.findMany({
    where: {
      organizationId,
      transactionId
    },
    include: {
      assigneeMembership: {
        include: {
          user: true
        }
      }
    },
    orderBy: [{ checklistGroup: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return tasks.map(mapTransactionTask);
}

export async function listTransactionTaskAssigneeOptions(
  organizationId: string,
  transactionId: string
): Promise<OfficeTransactionTaskAssigneeOption[]> {
  const transaction = await getTransactionScope(organizationId, transactionId);

  if (!transaction) {
    return [];
  }

  const memberships = await prisma.membership.findMany({
    where: {
      organizationId,
      status: "active",
      ...(transaction.officeId ? { officeId: transaction.officeId } : {}),
      role: {
        in: ["agent", "office_manager", "office_admin"] satisfies UserRole[]
      }
    },
    include: {
      user: true
    },
    orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }]
  });

  return memberships.map((membership) => ({
    id: membership.id,
    label: `${membership.user.firstName} ${membership.user.lastName}`
  }));
}

export async function createTransactionTask(input: CreateTransactionTaskInput): Promise<OfficeTransactionTask | null> {
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
    return null;
  }

  const title = input.title.trim();

  if (!title) {
    return null;
  }

  const assigneeMembershipId = await validateAssigneeMembership(input.organizationId, transaction.officeId, input.assigneeMembershipId);

  const sortAggregate = await prisma.transactionTask.aggregate({
    where: {
      organizationId: input.organizationId,
      transactionId: input.transactionId
    },
    _max: {
      sortOrder: true
    }
  });

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.transactionTask.create({
      data: {
        organizationId: input.organizationId,
        transactionId: input.transactionId,
        checklistGroup: normalizeChecklistGroup(input.checklistGroup),
        title,
        description: parseOptionalText(input.description),
        assigneeMembershipId,
        dueAt: parseOptionalDate(input.dueAt),
        status: taskStatusDbMap[normalizeTaskStatus(input.status)],
        sortOrder: (sortAggregate._max.sortOrder ?? -1) + 1
      },
      include: {
        assigneeMembership: {
          include: {
            user: true
          }
        }
      }
    });

    const transactionLabel = buildTransactionObjectLabel(transaction);
    await recordActivityLogEvent(tx, {
      organizationId: input.organizationId,
      membershipId: input.actorMembershipId ?? null,
      entityType: "transaction_task",
      entityId: created.id,
      action: activityLogActions.transactionTaskCreated,
      payload: {
        officeId: transaction.officeId,
        transactionId: input.transactionId,
        taskId: created.id,
        taskTitle: created.title,
        objectLabel: buildTaskObjectLabel(created.title, transactionLabel),
        details: [
          `Group: ${created.checklistGroup}`,
          `Status: ${taskStatusLabelMap[created.status]}`,
          ...(created.dueAt ? [`Due: ${formatDateValue(created.dueAt)}`] : [])
        ]
      }
    });

    return created;
  });

  return mapTransactionTask(task);
}

export async function updateTransactionTask(input: UpdateTransactionTaskInput): Promise<OfficeTransactionTask | null> {
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
    return null;
  }

  const existingTask = await prisma.transactionTask.findFirst({
    where: {
      id: input.taskId,
      organizationId: input.organizationId,
      transactionId: input.transactionId
    },
    select: {
      id: true,
      checklistGroup: true,
      title: true,
      description: true,
      assigneeMembershipId: true,
      dueAt: true,
      status: true,
      sortOrder: true
    }
  });

  if (!existingTask) {
    return null;
  }

  const assigneeMembershipId =
    input.assigneeMembershipId !== undefined
      ? await validateAssigneeMembership(input.organizationId, transaction.officeId, input.assigneeMembershipId)
      : undefined;

  const nextChecklistGroup = input.checklistGroup !== undefined ? normalizeChecklistGroup(input.checklistGroup) : existingTask.checklistGroup;
  const nextTitle = input.title !== undefined ? input.title.trim() || "Untitled task" : existingTask.title;
  const nextDescription = input.description !== undefined ? parseOptionalText(input.description) : existingTask.description;
  const nextDueAt = input.dueAt !== undefined ? parseOptionalDate(input.dueAt) : existingTask.dueAt;
  const nextStatus = input.status !== undefined ? taskStatusDbMap[normalizeTaskStatus(input.status)] : existingTask.status;
  const nextSortOrder = input.sortOrder !== undefined ? input.sortOrder : existingTask.sortOrder;
  const nextAssigneeMembershipId = input.assigneeMembershipId !== undefined ? assigneeMembershipId : existingTask.assigneeMembershipId;

  const updatedTask = await prisma.$transaction(async (tx) => {
    const saved = await tx.transactionTask.update({
      where: {
        id: input.taskId
      },
      data: {
        checklistGroup: nextChecklistGroup,
        title: nextTitle,
        description: nextDescription,
        assigneeMembershipId: nextAssigneeMembershipId,
        dueAt: nextDueAt,
        status: nextStatus,
        sortOrder: nextSortOrder
      },
      include: {
        assigneeMembership: {
          include: {
            user: true
          }
        }
      }
    });

    const details = [
      buildTaskDetail("Group", existingTask.checklistGroup, nextChecklistGroup),
      buildTaskDetail("Title", existingTask.title, nextTitle),
      buildTaskDetail("Description", existingTask.description ?? "", nextDescription ?? ""),
      buildTaskDetail("Due date", formatDateValue(existingTask.dueAt), formatDateValue(nextDueAt)),
      buildTaskDetail("Status", taskStatusLabelMap[existingTask.status], taskStatusLabelMap[nextStatus]),
      buildTaskDetail("Sort order", String(existingTask.sortOrder), String(nextSortOrder))
    ].filter((detail): detail is string => Boolean(detail));

    if (existingTask.status !== "completed" && nextStatus === "completed") {
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? null,
        entityType: "transaction_task",
        entityId: saved.id,
        action: activityLogActions.transactionTaskCompleted,
        payload: {
          officeId: transaction.officeId,
          transactionId: input.transactionId,
          taskId: saved.id,
          taskTitle: saved.title,
          objectLabel: buildTaskObjectLabel(saved.title, buildTransactionObjectLabel(transaction)),
          details: details.length > 0 ? details : [`Status: ${taskStatusLabelMap[existingTask.status]} -> ${taskStatusLabelMap[nextStatus]}`]
        }
      });
    } else if (details.length > 0) {
      await recordActivityLogEvent(tx, {
        organizationId: input.organizationId,
        membershipId: input.actorMembershipId ?? null,
        entityType: "transaction_task",
        entityId: saved.id,
        action: activityLogActions.transactionTaskUpdated,
        payload: {
          officeId: transaction.officeId,
          transactionId: input.transactionId,
          taskId: saved.id,
          taskTitle: saved.title,
          objectLabel: buildTaskObjectLabel(saved.title, buildTransactionObjectLabel(transaction)),
          details
        }
      });
    }

    return saved;
  });

  return mapTransactionTask(updatedTask);
}
