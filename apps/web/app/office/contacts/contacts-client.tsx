"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Panel } from "@acre/ui";
import type { OfficeContactRecord } from "@acre/db";

type ContactsClientProps = {
  contacts: OfficeContactRecord[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: {
    q: string;
    stage: string;
  };
};

const stageOptions = ["All", "Warm", "Tour booked", "Nurture", "New"] as const;
const pageSizeOptions = [10, 20, 50, 100] as const;

function normalizeStageFilter(value: string): (typeof stageOptions)[number] {
  return stageOptions.includes(value as (typeof stageOptions)[number]) ? (value as (typeof stageOptions)[number]) : "All";
}

function buildContactsHref(
  pathname: string,
  params: {
    q: string;
    stage: string;
    page: number;
    pageSize: number;
  }
) {
  const searchParams = new URLSearchParams();

  if (params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.stage && params.stage !== "All") {
    searchParams.set("stage", params.stage);
  }

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.pageSize !== 20) {
    searchParams.set("pageSize", String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function ContactsClient({ contacts, totalCount, totalPages, page, pageSize, filters }: ContactsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(filters.q);
  const [stageFilter, setStageFilter] = useState<(typeof stageOptions)[number]>(normalizeStageFilter(filters.stage));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formVersion, setFormVersion] = useState(0);

  useEffect(() => {
    setSearchQuery(filters.q);
    setStageFilter(normalizeStageFilter(filters.stage));
  }, [filters.q, filters.stage]);

  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);
  const summaryLabel =
    filters.q || filters.stage !== "All"
      ? `${totalCount} contacts match the current filters.`
      : `${totalCount} contacts in the current organization.`;

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      buildContactsHref(pathname, {
        q: searchQuery,
        stage: stageFilter,
        page: 1,
        pageSize
      })
    );
  }

  function handleResetFilters() {
    setSearchQuery("");
    setStageFilter("All");
    router.push(
      buildContactsHref(pathname, {
        q: "",
        stage: "All",
        page: 1,
        pageSize
      })
    );
  }

  function handlePageSizeChange(nextPageSize: number) {
    router.push(
      buildContactsHref(pathname, {
        q: searchQuery,
        stage: stageFilter,
        page: 1,
        pageSize: nextPageSize
      })
    );
  }

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
      setFormVersion((current) => current + 1);
      router.push(
        buildContactsHref(pathname, {
          q: searchQuery,
          stage: stageFilter,
          page: 1,
          pageSize
        })
      );
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create contact.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bm-page">
        <section className="office-page-header">
          <div>
            <span className="office-eyebrow">Contacts</span>
            <h2>Contacts</h2>
            <p>Back-office contacts now use the real Client and FollowUpTask tables with organization-scoped reads and writes.</p>
          </div>
        </section>

        <Panel title="Contacts table" subtitle={summaryLabel}>
          <form className="bm-contacts-toolbar" onSubmit={handleFilterSubmit}>
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
            <button className="office-button office-button-secondary" type="submit">
              Apply
            </button>
            <button className="office-button office-button-secondary" onClick={handleResetFilters} type="button">
              Reset
            </button>
            <button className="bm-create-button" onClick={() => setIsModalOpen(true)} type="button">
              New contact
            </button>
          </form>

          <div className="office-table">
            <div className="office-table-header office-table-row office-table-row-wide bm-contacts-table-header">
              <span>Name</span>
              <span>Stage</span>
              <span>Intent</span>
              <span>Areas</span>
              <span>Last contact</span>
              <span>Next follow-up</span>
            </div>
            {contacts.map((contact) => (
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
            {contacts.length === 0 ? (
              <div className="bm-contacts-empty">
                <p>No contacts matched the current search and stage filters.</p>
              </div>
            ) : null}
          </div>

          <footer className="bm-contacts-footer">
            <span>
              {pageStart}-{pageEnd} of {totalCount}
            </span>
            <div className="bm-contacts-footer-controls">
              <label className="bm-contacts-page-size">
                <span>Rows</span>
                <select onChange={(event) => handlePageSizeChange(Number(event.target.value))} value={pageSize}>
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="bm-contacts-pager">
                {page > 1 ? (
                  <Link
                    className="bm-contacts-page-button"
                    href={buildContactsHref(pathname, {
                      q: filters.q,
                      stage: filters.stage,
                      page: page - 1,
                      pageSize
                    })}
                  >
                    «
                  </Link>
                ) : (
                  <span className="bm-contacts-page-button is-disabled">«</span>
                )}

                <span className="bm-contacts-page-indicator">
                  Page {page} / {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    className="bm-contacts-page-button"
                    href={buildContactsHref(pathname, {
                      q: filters.q,
                      stage: filters.stage,
                      page: page + 1,
                      pageSize
                    })}
                  >
                    »
                  </Link>
                ) : (
                  <span className="bm-contacts-page-button is-disabled">»</span>
                )}
              </div>
            </div>
          </footer>
        </Panel>
      </div>

      {isModalOpen ? (
        <div className="bm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="bm-transaction-modal bm-contact-modal" onClick={(event) => event.stopPropagation()}>
            <header className="bm-transaction-modal-header">
              <h3>NEW CONTACT</h3>
              <button aria-label="Close create contact modal" onClick={() => setIsModalOpen(false)} type="button">
                ×
              </button>
            </header>

            <form className="bm-transaction-modal-body" key={formVersion} onSubmit={handleCreateContact}>
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
