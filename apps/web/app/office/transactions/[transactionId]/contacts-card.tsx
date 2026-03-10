"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfficeTransactionContact, OfficeTransactionContactOption } from "@acre/db";

type TransactionContactsCardProps = {
  transactionId: string;
  contacts: OfficeTransactionContact[];
  availableContacts: OfficeTransactionContactOption[];
};

export function TransactionContactsCard({
  transactionId,
  contacts,
  availableContacts
}: TransactionContactsCardProps) {
  const router = useRouter();
  const [selectedContactId, setSelectedContactId] = useState(availableContacts[0]?.id ?? "");
  const [makePrimary, setMakePrimary] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function handleLinkContact() {
    if (!selectedContactId) {
      return;
    }

    setPendingAction("link");
    setActionError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contactId: selectedContactId,
          isPrimary: makePrimary
        })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to link contact.");
      }

      setSelectedContactId("");
      setMakePrimary(false);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to link contact.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSetPrimary(contactLinkId: string) {
    setPendingAction(`primary:${contactLinkId}`);
    setActionError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/contacts/${contactLinkId}`, {
        method: "PATCH"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update primary contact.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update primary contact.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUnlink(contactLinkId: string) {
    setPendingAction(`unlink:${contactLinkId}`);
    setActionError("");

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}/contacts/${contactLinkId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to unlink contact.");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to unlink contact.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="bm-detail-card">
      <div className="bm-card-head">
        <h3>Contacts</h3>
      </div>

      <div className="bm-transaction-contact-list">
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <div className="bm-transaction-contact-row" key={contact.id}>
              <div className="bm-transaction-contact-main">
                <div className="bm-transaction-contact-head">
                  <Link className="bm-transaction-contact-link" href={`/office/contacts/${contact.clientId}`}>
                    {contact.fullName}
                  </Link>
                  <span className="bm-status-pill">{contact.role}</span>
                  {contact.isPrimary ? <span className="bm-status-pill bm-status-pill-primary">Primary</span> : null}
                </div>
                <p>{contact.email || contact.phone || "No contact details saved."}</p>
                {contact.email && contact.phone ? <p>{contact.phone}</p> : null}
              </div>

              <div className="bm-transaction-contact-actions">
                {!contact.isPrimary ? (
                  <button
                    className="bm-view-toggle"
                    disabled={pendingAction === `primary:${contact.id}`}
                    onClick={() => handleSetPrimary(contact.id)}
                    type="button"
                  >
                    {pendingAction === `primary:${contact.id}` ? "Setting..." : "Set primary"}
                  </button>
                ) : null}
                <button
                  className="bm-view-toggle"
                  disabled={pendingAction === `unlink:${contact.id}`}
                  onClick={() => handleUnlink(contact.id)}
                  type="button"
                >
                  {pendingAction === `unlink:${contact.id}` ? "Removing..." : "Unlink"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bm-detail-field">
            <span>Contacts</span>
            <strong>No linked contacts yet.</strong>
          </div>
        )}
      </div>

      <div className="bm-transaction-contact-toolbar">
        <select onChange={(event) => setSelectedContactId(event.target.value)} value={selectedContactId}>
          <option value="">Select contact to link</option>
          {availableContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.label}
            </option>
          ))}
        </select>
        <label className="bm-transaction-contact-checkbox">
          <input checked={makePrimary} onChange={(event) => setMakePrimary(event.target.checked)} type="checkbox" />
          <span>Set as primary</span>
        </label>
        <button className="bm-create-button" disabled={!selectedContactId || pendingAction === "link"} onClick={handleLinkContact} type="button">
          {pendingAction === "link" ? "Linking..." : "Link contact"}
        </button>
      </div>

      {actionError ? <p className="bm-transaction-submit-error">{actionError}</p> : null}
    </section>
  );
}
