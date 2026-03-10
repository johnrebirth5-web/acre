"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Panel } from "@acre/ui";
import type { OfficeContactRecord } from "@acre/db";

type ContactsClientProps = {
  contacts: OfficeContactRecord[];
  totalCount: number;
};

const stageOptions = ["All", "Warm", "Tour booked", "Nurture", "New"] as const;

export function ContactsClient({ contacts, totalCount }: ContactsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<(typeof stageOptions)[number]>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredContacts = contacts.filter((contact) => {
    if (stageFilter !== "All" && contact.stage !== stageFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [contact.fullName, contact.email, contact.phone, contact.intent, contact.source, contact.owner, contact.areas.join(" ")].join(" ").toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/office/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create contact.");
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create contact.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Contacts</span>
          <h2>Contacts</h2>
          <p>Back-office contacts now use the real Client and FollowUpTask tables with organization-scoped reads and writes.</p>
        </div>
      </section>

      <Panel title="Contacts table" subtitle={`${totalCount} contacts in the current organization.`}>
        <div className="bm-contacts-toolbar">
          <input
            aria-label="Search contacts"
            className="bm-contacts-search"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, phone, area..."
            value={searchQuery}
          />
          <select className="bm-contacts-filter" onChange={(event) => setStageFilter(event.target.value as (typeof stageOptions)[number])} value={stageFilter}>
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button className="bm-create-button" onClick={() => setIsModalOpen(true)} type="button">
            New contact
          </button>
        </div>

        <div className="office-table">
          <div className="office-table-header office-table-row office-table-row-wide bm-contacts-table-header">
            <span>Name</span>
            <span>Stage</span>
            <span>Intent</span>
            <span>Areas</span>
            <span>Last contact</span>
            <span>Next follow-up</span>
          </div>
          {filteredContacts.map((contact) => (
            <div className="office-table-row office-table-row-wide bm-contacts-table-row" key={contact.id}>
              <div className="office-table-primary">
                <strong>
                  <Link href={`/office/contacts/${contact.id}`}>{contact.fullName}</Link>
                </strong>
                <p>{contact.email || contact.phone || contact.source}</p>
              </div>
              <span>{contact.stage}</span>
              <span>{contact.intent}</span>
              <span>{contact.areas.join(", ") || "—"}</span>
              <span>{contact.lastContactLabel}</span>
              <span>{contact.nextFollowUpLabel}</span>
            </div>
          ))}
        </div>
      </Panel>

      {isModalOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="bm-transaction-modal bm-contact-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>NEW CONTACT</h3>
              <button aria-label="Close create contact modal" onClick={() => setIsModalOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body" onSubmit={handleCreateContact}>
              <div className="bm-contact-form-grid">
                <label className="bm-transaction-modal-field">
                  <span>Full name</span>
                  <input name="fullName" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Email</span>
                  <input name="email" type="email" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Phone</span>
                  <input name="phone" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Contact type</span>
                  <input name="contactType" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Source</span>
                  <input name="source" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Stage</span>
                  <input defaultValue="New" name="stage" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Intent</span>
                  <input name="intent" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Budget min</span>
                  <input name="budgetMin" type="text" />
                </label>
                <label className="bm-transaction-modal-field">
                  <span>Budget max</span>
                  <input name="budgetMax" type="text" />
                </label>
                <label className="bm-transaction-modal-field is-span-4">
                  <span>Preferred areas (comma separated)</span>
                  <input name="preferredAreas" type="text" />
                </label>
                <label className="bm-transaction-modal-field is-span-4">
                  <span>Notes</span>
                  <input name="notes" type="text" />
                </label>
              </div>

              <footer className="bm-transaction-modal-footer">
                <span>Minimal contact create flow</span>
                <div className="bm-transaction-modal-actions">
                  {submitError ? <p className="bm-transaction-submit-error">{submitError}</p> : null}
                  <button className="bm-transaction-next" disabled={isSubmitting} type="submit">
                    {isSubmitting ? "Saving..." : "Save contact"}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
