"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, FormField, PageHeader, PageShell, SectionCard, SelectInput, TextInput, TextareaInput } from "@acre/ui";
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
    <PageShell className="bm-transaction-detail-page office-detail-page">
      <PageHeader
        actions={
          <Link className="office-button office-button-secondary" href="/office/contacts">
            Back to contacts
          </Link>
        }
        description={contact.email || contact.phone || contact.source}
        eyebrow="Contact detail"
        title={contact.fullName}
      />

      <SectionCard subtitle="Core profile, lifecycle, and follow-up details for this contact." title="Overview">
        <form className="bm-detail-grid" onSubmit={handleSave}>
          <FormField className="bm-detail-field" label="Full name">
            <TextInput onChange={(event) => updateField("fullName", event.target.value)} type="text" value={formState.fullName} />
          </FormField>
          <FormField className="bm-detail-field" label="Email">
            <TextInput onChange={(event) => updateField("email", event.target.value)} type="email" value={formState.email} />
          </FormField>
          <FormField className="bm-detail-field" label="Phone">
            <TextInput onChange={(event) => updateField("phone", event.target.value)} type="text" value={formState.phone} />
          </FormField>
          <FormField className="bm-detail-field" label="Contact type">
            <TextInput onChange={(event) => updateField("contactType", event.target.value)} type="text" value={formState.contactType} />
          </FormField>
          <FormField className="bm-detail-field" label="Source">
            <TextInput onChange={(event) => updateField("source", event.target.value)} type="text" value={formState.source} />
          </FormField>
          <FormField className="bm-detail-field" label="Stage">
            <TextInput onChange={(event) => updateField("stage", event.target.value)} type="text" value={formState.stage} />
          </FormField>
          <FormField className="bm-detail-field" label="Intent">
            <TextInput onChange={(event) => updateField("intent", event.target.value)} type="text" value={formState.intent} />
          </FormField>
          <FormField className="bm-detail-field" label="Budget min">
            <TextInput onChange={(event) => updateField("budgetMin", event.target.value)} type="text" value={formState.budgetMin} />
          </FormField>
          <FormField className="bm-detail-field" label="Budget max">
            <TextInput onChange={(event) => updateField("budgetMax", event.target.value)} type="text" value={formState.budgetMax} />
          </FormField>
          <FormField className="bm-detail-field" label="Preferred areas">
            <TextInput onChange={(event) => updateField("preferredAreas", event.target.value)} type="text" value={formState.preferredAreas} />
          </FormField>
          <FormField className="bm-detail-field" label="Last contact">
            <TextInput onChange={(event) => updateField("lastContactAt", event.target.value)} type="date" value={formState.lastContactAt} />
          </FormField>
          <FormField className="bm-detail-field" label="Next follow-up">
            <TextInput onChange={(event) => updateField("nextFollowUpAt", event.target.value)} type="date" value={formState.nextFollowUpAt} />
          </FormField>
          <FormField className="bm-detail-field bm-detail-field-wide" label="Notes">
            <TextareaInput onChange={(event) => updateField("notes", event.target.value)} value={formState.notes} />
          </FormField>
          <div className="bm-transaction-status-form">
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save contact"}
            </Button>
            {saveError ? <p className="bm-transaction-submit-error">{saveError}</p> : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard subtitle="Transactions currently linked to this contact." title="Linked transactions">
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
          <SelectInput onChange={(event) => setSelectedTransactionId(event.target.value)} value={selectedTransactionId}>
            <option value="">Select transaction to link</option>
            {contact.availableTransactions.map((transaction) => (
              <option key={transaction.id} value={transaction.id}>
                {transaction.label}
              </option>
            ))}
          </SelectInput>
          <Button disabled={!selectedTransactionId || isLinking} onClick={handleLinkTransaction} type="button">
            {isLinking ? "Linking..." : "Link transaction"}
          </Button>
          {linkError ? <p className="bm-transaction-submit-error">{linkError}</p> : null}
        </div>
      </SectionCard>

      <SectionCard subtitle="Follow-up work attached to this contact." title="Follow-up tasks">
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
          <TextInput onChange={(event) => setTaskTitle(event.target.value)} placeholder="New follow-up task" type="text" value={taskTitle} />
          <TextInput onChange={(event) => setTaskDueAt(event.target.value)} type="date" value={taskDueAt} />
          <Button disabled={isCreatingTask} type="submit">
            {isCreatingTask ? "Saving..." : "Add task"}
          </Button>
          {taskError ? <p className="bm-transaction-submit-error">{taskError}</p> : null}
        </form>
      </SectionCard>
    </PageShell>
  );
}
