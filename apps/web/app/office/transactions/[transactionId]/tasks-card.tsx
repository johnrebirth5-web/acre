"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfficeTransactionTask, OfficeTransactionTaskAssigneeOption, OfficeTransactionTaskStatus } from "@acre/db";

type TransactionTasksCardProps = {
  transactionId: string;
  tasks: OfficeTransactionTask[];
  assigneeOptions: OfficeTransactionTaskAssigneeOption[];
};

type TaskFormState = {
  checklistGroup: string;
  title: string;
  description: string;
  assigneeMembershipId: string;
  dueAt: string;
  status: OfficeTransactionTaskStatus;
};

const taskStatusOptions: OfficeTransactionTaskStatus[] = ["Todo", "In progress", "Completed"];

function buildTaskState(task: OfficeTransactionTask): TaskFormState {
  return {
    checklistGroup: task.checklistGroup,
    title: task.title,
    description: task.description,
    assigneeMembershipId: task.assigneeMembershipId ?? "",
    dueAt: task.dueAt,
    status: task.status
  };
}

export function TransactionTasksCard({ transactionId, tasks, assigneeOptions }: TransactionTasksCardProps) {
  const router = useRouter();
  const [taskStates, setTaskStates] = useState<Record<string, TaskFormState>>(
    Object.fromEntries(tasks.map((task) => [task.id, buildTaskState(task)]))
  );
  const [newTaskState, setNewTaskState] = useState<TaskFormState>({
    checklistGroup: "General",
    title: "",
    description: "",
    assigneeMembershipId: assigneeOptions[0]?.id ?? "",
    dueAt: "",
    status: "Todo"
  });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");

  const groupedTasks = tasks.reduce<Record<string, OfficeTransactionTask[]>>((groups, task) => {
    const groupName = task.checklistGroup || "General";

    if (!groups[groupName]) {
      groups[groupName] = [];
    }

    groups[groupName].push(task);
    return groups;
  }, {});

  function updateTaskField(taskId: string, field: keyof TaskFormState, value: string) {
    setTaskStates((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? buildTaskState(tasks.find((task) => task.id === taskId)!)),
        [field]: value
      }
    }));
  }

  function updateNewTaskField(field: keyof TaskFormState, value: string) {
    setNewTaskState((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleCreateTask() {
    if (!newTaskState.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setPendingAction("create");
    setError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTaskState)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create task.");
      }

      setNewTaskState({
        checklistGroup: "General",
        title: "",
        description: "",
        assigneeMembershipId: assigneeOptions[0]?.id ?? "",
        dueAt: "",
        status: "Todo"
      });
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create task.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveTask(taskId: string) {
    const taskState = taskStates[taskId];

    if (!taskState?.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setPendingAction(`save:${taskId}`);
    setError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(taskState)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update task.");
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update task.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggleComplete(taskId: string) {
    const taskState = taskStates[taskId];

    if (!taskState) {
      return;
    }

    const nextStatus: OfficeTransactionTaskStatus = taskState.status === "Completed" ? "Todo" : "Completed";

    setPendingAction(`toggle:${taskId}`);
    setError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update task status.");
      }

      setTaskStates((current) => ({
        ...current,
        [taskId]: {
          ...current[taskId],
          status: nextStatus
        }
      }));
      router.refresh();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update task status.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="bm-detail-card">
      <div className="bm-card-head">
        <h3>Checklist / Tasks</h3>
      </div>

      <div className="bm-transaction-task-groups">
        {Object.entries(groupedTasks).length > 0 ? (
          Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <section className="bm-transaction-task-group" key={groupName}>
              <div className="bm-transaction-task-group-head">
                <strong>{groupName}</strong>
                <span>{groupTasks.length} task{groupTasks.length === 1 ? "" : "s"}</span>
              </div>

              <div className="bm-transaction-task-list">
                {groupTasks.map((task) => {
                  const formState = taskStates[task.id] ?? buildTaskState(task);
                  const isCompleted = formState.status === "Completed";

                  return (
                    <article className="bm-transaction-task-row" key={task.id}>
                      <div className="bm-transaction-task-top">
                        <div className="bm-transaction-task-status">
                          <span className={`bm-status-pill bm-task-status-${formState.status.toLowerCase().replace(/\s+/g, "-")}`}>{formState.status}</span>
                          <strong>{task.assigneeName}</strong>
                        </div>
                        <div className="bm-transaction-task-actions">
                          <button
                            className="bm-view-toggle"
                            disabled={pendingAction === `toggle:${task.id}`}
                            onClick={() => handleToggleComplete(task.id)}
                            type="button"
                          >
                            {pendingAction === `toggle:${task.id}` ? "Saving..." : isCompleted ? "Mark incomplete" : "Mark complete"}
                          </button>
                          <button
                            className="bm-create-button"
                            disabled={pendingAction === `save:${task.id}`}
                            onClick={() => handleSaveTask(task.id)}
                            type="button"
                          >
                            {pendingAction === `save:${task.id}` ? "Saving..." : "Save task"}
                          </button>
                        </div>
                      </div>

                      <div className="bm-transaction-task-grid">
                        <label className="bm-detail-field">
                          <span>Checklist group</span>
                          <input
                            onChange={(event) => updateTaskField(task.id, "checklistGroup", event.target.value)}
                            type="text"
                            value={formState.checklistGroup}
                          />
                        </label>
                        <label className="bm-detail-field">
                          <span>Task title</span>
                          <input onChange={(event) => updateTaskField(task.id, "title", event.target.value)} type="text" value={formState.title} />
                        </label>
                        <label className="bm-detail-field">
                          <span>Assignee</span>
                          <select
                            onChange={(event) => updateTaskField(task.id, "assigneeMembershipId", event.target.value)}
                            value={formState.assigneeMembershipId}
                          >
                            <option value="">Unassigned</option>
                            {assigneeOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="bm-detail-field">
                          <span>Due date</span>
                          <input onChange={(event) => updateTaskField(task.id, "dueAt", event.target.value)} type="date" value={formState.dueAt} />
                        </label>
                        <label className="bm-detail-field">
                          <span>Status</span>
                          <select onChange={(event) => updateTaskField(task.id, "status", event.target.value)} value={formState.status}>
                            {taskStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="bm-detail-field bm-detail-field-wide">
                          <span>Description</span>
                          <textarea
                            onChange={(event) => updateTaskField(task.id, "description", event.target.value)}
                            rows={3}
                            value={formState.description}
                          />
                        </label>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="bm-detail-field">
            <span>Tasks</span>
            <strong>No checklist tasks yet.</strong>
          </div>
        )}
      </div>

      <div className="bm-transaction-task-create">
        <div className="bm-card-head bm-card-head-inline">
          <h3>New task</h3>
        </div>

        <div className="bm-transaction-task-grid">
          <label className="bm-detail-field">
            <span>Checklist group</span>
            <input onChange={(event) => updateNewTaskField("checklistGroup", event.target.value)} type="text" value={newTaskState.checklistGroup} />
          </label>
          <label className="bm-detail-field">
            <span>Task title</span>
            <input onChange={(event) => updateNewTaskField("title", event.target.value)} type="text" value={newTaskState.title} />
          </label>
          <label className="bm-detail-field">
            <span>Assignee</span>
            <select onChange={(event) => updateNewTaskField("assigneeMembershipId", event.target.value)} value={newTaskState.assigneeMembershipId}>
              <option value="">Unassigned</option>
              {assigneeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="bm-detail-field">
            <span>Due date</span>
            <input onChange={(event) => updateNewTaskField("dueAt", event.target.value)} type="date" value={newTaskState.dueAt} />
          </label>
          <label className="bm-detail-field">
            <span>Status</span>
            <select onChange={(event) => updateNewTaskField("status", event.target.value)} value={newTaskState.status}>
              {taskStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="bm-detail-field bm-detail-field-wide">
            <span>Description</span>
            <textarea onChange={(event) => updateNewTaskField("description", event.target.value)} rows={3} value={newTaskState.description} />
          </label>
        </div>

        <div className="bm-transaction-status-form">
          <button className="bm-create-button" disabled={pendingAction === "create"} onClick={handleCreateTask} type="button">
            {pendingAction === "create" ? "Saving..." : "Create task"}
          </button>
          {error ? <p className="bm-transaction-submit-error">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
