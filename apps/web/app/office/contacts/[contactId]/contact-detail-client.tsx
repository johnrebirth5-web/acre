"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { OfficeContactDetail } from "@acre/db";

type ContactDetailClientProps = {
  contact: OfficeContactDetail;
};

export function ContactDetailClient({ contact }: ContactDetailClientProps) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    fullName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    contactType: contact.contactType,
    source: contact.source,
    stage: contact.stage,
    intent: contact.intent,
    budgetMin: contact.budgetMin,
    budgetMax: contact.budgetMax,
    preferredAreas: contact.areas.join(", "),
    notes: contact.notes,
    lastContactAt: contact.lastContactAt,
    nextFollowUpAt: contact.nextFollowUpAt
  });
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState(contact.availableTransactions[0]?.id ?? "");
  const [saveError, setSaveError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  function updateField(name: keyof typeof formState, value: string) {
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch(`/api/office/contacts/${contact.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formState)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to save contact.");
      }

      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save contact.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingTask(true);
    setTaskError("");

    try {
      const response = await fetch(`/api/office/contacts/${contact.id}/follow-up-tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: taskTitle,
          dueAt: taskDueAt
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create follow-up task.");
      }

      setTaskTitle("");
      setTaskDueAt("");
      router.refresh();
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "Failed to create follow-up task.");
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function handleLinkTransaction() {
    if (!selectedTransactionId) {
      return;
    }

    setIsLinking(true);
    setLinkError("");

    try {
      const response = await fetch(`/api/office/contacts/${contact.id}/transactions/${selectedTransactionId}`, {
        method: "PATCH"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to link transaction.");
      }

      router.refresh();
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Failed to link transaction.");
    } finally {
      setIsLinking(false);
    }
  }

  return (
    <div className="bm-transaction-detail-page">
      <section className="bm-detail-card">
        <div className="bm-detail-head">
          <div>
            <h2>{contact.fullName}</h2>
            <p>{contact.email || contact.phone || contact.source}</p>
          </div>
          <Link className="bm-view-toggle" href="/office/contacts">
            Back to contacts
          </Link>
        </div>

        <form className="bm-detail-grid" onSubmit={handleSave}>
          <label className="bm-detail-field">
            <span>Full name</span>
            <input onChange={(event) => updateField("fullName", event.target.value)} type="text" value={formState.fullName} />
          </label>
          <label className="bm-detail-field">
            <span>Email</span>
            <input onChange={(event) => updateField("email", event.target.value)} type="email" value={formState.email} />
          </label>
          <label className="bm-detail-field">
            <span>Phone</span>
            <input onChange={(event) => updateField("phone", event.target.value)} type="text" value={formState.phone} />
          </label>
          <label className="bm-detail-field">
            <span>Contact type</span>
            <input onChange={(event) => updateField("contactType", event.target.value)} type="text" value={formState.contactType} />
          </label>
          <label className="bm-detail-field">
            <span>Source</span>
            <input onChange={(event) => updateField("source", event.target.value)} type="text" value={formState.source} />
          </label>
          <label className="bm-detail-field">
            <span>Stage</span>
            <input onChange={(event) => updateField("stage", event.target.value)} type="text" value={formState.stage} />
          </label>
          <label className="bm-detail-field">
            <span>Intent</span>
            <input onChange={(event) => updateField("intent", event.target.value)} type="text" value={formState.intent} />
          </label>
          <label className="bm-detail-field">
            <span>Budget min</span>
            <input onChange={(event) => updateField("budgetMin", event.target.value)} type="text" value={formState.budgetMin} />
          </label>
          <label className="bm-detail-field">
            <span>Budget max</span>
            <input onChange={(event) => updateField("budgetMax", event.target.value)} type="text" value={formState.budgetMax} />
          </label>
          <label className="bm-detail-field">
            <span>Preferred areas</span>
            <input onChange={(event) => updateField("preferredAreas", event.target.value)} type="text" value={formState.preferredAreas} />
          </label>
          <label className="bm-detail-field">
            <span>Last contact</span>
            <input onChange={(event) => updateField("lastContactAt", event.target.value)} type="date" value={formState.lastContactAt} />
          </label>
          <label className="bm-detail-field">
            <span>Next follow-up</span>
            <input onChange={(event) => updateField("nextFollowUpAt", event.target.value)} type="date" value={formState.nextFollowUpAt} />
          </label>
          <label className="bm-detail-field bm-detail-field-wide">
            <span>Notes</span>
            <input onChange={(event) => updateField("notes", event.target.value)} type="text" value={formState.notes} />
          </label>
          <div className="bm-transaction-status-form">
            <button className="bm-create-button" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save contact"}
            </button>
            {saveError ? <p className="bm-transaction-submit-error">{saveError}</p> : null}
          </div>
        </form>
      </section>

      <section className="bm-detail-card">
        <div className="bm-card-head">
          <h3>Linked transactions</h3>
        </div>
        <div className="bm-detail-grid">
          {contact.linkedTransactions.map((transaction) => (
            <div className="bm-detail-field" key={transaction.id}>
              <span>
                <Link href={`/office/transactions/${transaction.id}`}>{transaction.label}</Link>
              </span>
              <strong>
                {transaction.status} · {transaction.price}
              </strong>
            </div>
          ))}
          {contact.linkedTransactions.length === 0 ? (
            <div className="bm-detail-field">
              <span>Transactions</span>
              <strong>No linked transactions yet.</strong>
            </div>
          ) : null}
        </div>

        <div className="bm-transaction-status-form">
          <select onChange={(event) => setSelectedTransactionId(event.target.value)} value={selectedTransactionId}>
            <option value="">Select transaction to link</option>
            {contact.availableTransactions.map((transaction) => (
              <option key={transaction.id} value={transaction.id}>
                {transaction.label}
              </option>
            ))}
          </select>
          <button className="bm-create-button" disabled={!selectedTransactionId || isLinking} onClick={handleLinkTransaction} type="button">
            {isLinking ? "Linking..." : "Link transaction"}
          </button>
          {linkError ? <p className="bm-transaction-submit-error">{linkError}</p> : null}
        </div>
      </section>

      <section className="bm-detail-card">
        <div className="bm-card-head">
          <h3>Follow-up tasks</h3>
        </div>
        <div className="bm-detail-grid">
          {contact.followUpTasks.map((task) => (
            <div className="bm-detail-field" key={task.id}>
              <span>{task.title}</span>
              <strong>
                {task.status} · {task.dueAt} · {task.assigneeName}
              </strong>
            </div>
          ))}
          {contact.followUpTasks.length === 0 ? (
            <div className="bm-detail-field">
              <span>Tasks</span>
              <strong>No follow-up tasks yet.</strong>
            </div>
          ) : null}
        </div>

        <form className="bm-transaction-status-form" onSubmit={handleCreateTask}>
          <input onChange={(event) => setTaskTitle(event.target.value)} placeholder="New follow-up task" type="text" value={taskTitle} />
          <input onChange={(event) => setTaskDueAt(event.target.value)} type="date" value={taskDueAt} />
          <button className="bm-create-button" disabled={isCreatingTask} type="submit">
            {isCreatingTask ? "Saving..." : "Add task"}
          </button>
          {taskError ? <p className="bm-transaction-submit-error">{taskError}</p> : null}
        </form>
      </section>
    </div>
  );
}
