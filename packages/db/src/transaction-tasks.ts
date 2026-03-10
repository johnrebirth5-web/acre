import { Prisma, TransactionTaskStatus, UserRole } from "@prisma/client";
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
  const transaction = await getTransactionScope(input.organizationId, input.transactionId);

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

  const task = await prisma.transactionTask.create({
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

  return mapTransactionTask(task);
}

export async function updateTransactionTask(input: UpdateTransactionTaskInput): Promise<OfficeTransactionTask | null> {
  const transaction = await getTransactionScope(input.organizationId, input.transactionId);

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
      id: true
    }
  });

  if (!existingTask) {
    return null;
  }

  const assigneeMembershipId =
    input.assigneeMembershipId !== undefined
      ? await validateAssigneeMembership(input.organizationId, transaction.officeId, input.assigneeMembershipId)
      : undefined;

  const updatedTask = await prisma.transactionTask.update({
    where: {
      id: input.taskId
    },
    data: {
      ...(input.checklistGroup !== undefined ? { checklistGroup: normalizeChecklistGroup(input.checklistGroup) } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() || "Untitled task" } : {}),
      ...(input.description !== undefined ? { description: parseOptionalText(input.description) } : {}),
      ...(input.assigneeMembershipId !== undefined ? { assigneeMembershipId } : {}),
      ...(input.dueAt !== undefined ? { dueAt: parseOptionalDate(input.dueAt) } : {}),
      ...(input.status !== undefined ? { status: taskStatusDbMap[normalizeTaskStatus(input.status)] } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {})
    },
    include: {
      assigneeMembership: {
        include: {
          user: true
        }
      }
    }
  });

  return mapTransactionTask(updatedTask);
}
