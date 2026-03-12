"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, DataTable, DataTableBody, DataTableHeader, DataTableRow, EmptyState, FilterBar, FilterField, SectionCard, SelectInput, StatCard, TextInput } from "@acre/ui";
import type { OfficeAdminUsersSnapshot } from "@acre/db";

type OfficeSettingsUsersClientProps = {
  snapshot: OfficeAdminUsersSnapshot;
  canManageUsers: boolean;
};

type UserRowDraft = {
  role: string;
  status: string;
  officeId: string;
};

function buildUsersHref(
  pathname: string,
  filters: {
    q: string;
    role: string;
    status: string;
    officeId: string;
  }
) {
  const searchParams = new URLSearchParams();

  if (filters.q.trim()) {
    searchParams.set("q", filters.q.trim());
  }

  if (filters.role.trim()) {
    searchParams.set("role", filters.role.trim());
  }

  if (filters.status.trim()) {
    searchParams.set("status", filters.status.trim());
  }

  if (filters.officeId.trim()) {
    searchParams.set("officeId", filters.officeId.trim());
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function OfficeSettingsUsersClient({ snapshot, canManageUsers }: OfficeSettingsUsersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState(snapshot.filters.q);
  const [roleFilter, setRoleFilter] = useState(snapshot.filters.role);
  const [statusFilter, setStatusFilter] = useState(snapshot.filters.status);
  const [officeFilter, setOfficeFilter] = useState(snapshot.filters.officeId);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [rowDrafts, setRowDrafts] = useState<Record<string, UserRowDraft>>(
    Object.fromEntries(
      snapshot.rows.map((row) => [
        row.membershipId,
        {
          role: row.roleValue,
          status: row.statusValue,
          officeId: row.officeAccessValue
        }
      ])
    )
  );

  useEffect(() => {
    setSearchQuery(snapshot.filters.q);
    setRoleFilter(snapshot.filters.role);
    setStatusFilter(snapshot.filters.status);
    setOfficeFilter(snapshot.filters.officeId);
    setRowDrafts(
      Object.fromEntries(
        snapshot.rows.map((row) => [
          row.membershipId,
          {
            role: row.roleValue,
            status: row.statusValue,
            officeId: row.officeAccessValue
          }
        ])
      )
    );
  }, [snapshot]);

  const officeOptions = useMemo(() => snapshot.filters.officeOptions, [snapshot.filters.officeOptions]);

  function setRowDraft(membershipId: string, field: keyof UserRowDraft, value: string) {
    setRowDrafts((current) => ({
      ...current,
      [membershipId]: {
        ...(current[membershipId] ?? { role: "agent", status: "active", officeId: "__all__" }),
        [field]: value
      }
    }));
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      buildUsersHref(pathname, {
        q: searchQuery,
        role: roleFilter,
        status: statusFilter,
        officeId: officeFilter
      })
    );
  }

  function handleResetFilters() {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setOfficeFilter("");
    router.push(
      buildUsersHref(pathname, {
        q: "",
        role: "",
        status: "",
        officeId: ""
      })
    );
  }

  async function handleSaveUser(membershipId: string) {
    const draft = rowDrafts[membershipId];
    if (!draft) {
      return;
    }

    setPendingAction(`save-user:${membershipId}`);
    setSubmitError("");

    try {
      const response = await fetch(`/api/office/settings/users/${membershipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update user access.");
      }

      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to update user access.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <section className="office-settings-summary-grid">
        <StatCard hint="Current organization" label="Total users" value={snapshot.summary.totalUsers} />
        <StatCard hint="Membership status = active" label="Active users" value={snapshot.summary.activeUsers} />
        <StatCard hint="Invited or disabled" label="Inactive users" value={snapshot.summary.inactiveUsers} />
        <StatCard hint="Office assignment is org-wide" label="All-office access" value={snapshot.summary.allOfficeAccessCount} />
      </section>

      <SectionCard subtitle="Role, active status, and office assignment are managed at the membership layer." title="Users access">
        <FilterBar as="form" onSubmit={handleFilterSubmit}>
          <FilterField label="Search">
            <TextInput onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search name, email, title, office..." value={searchQuery} />
          </FilterField>

          <FilterField label="Role">
            <SelectInput onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
              <option value="">All roles</option>
              {snapshot.filters.roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FilterField>

          <FilterField label="Status">
            <SelectInput onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="">All statuses</option>
              {snapshot.filters.statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FilterField>

          <FilterField label="Office access">
            <SelectInput onChange={(event) => setOfficeFilter(event.target.value)} value={officeFilter}>
              <option value="">All assignments</option>
              {officeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FilterField>

          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <Button onClick={handleResetFilters} type="button" variant="secondary">
            Reset
          </Button>
        </FilterBar>

        {submitError ? <p className="office-inline-error">{submitError}</p> : null}

        <DataTable className="office-table">
          <DataTableHeader className="office-table-header office-table-row office-table-row-settings-users">
            <span>User</span>
            <span>Role</span>
            <span>Office access</span>
            <span>Status</span>
            <span>Actions</span>
          </DataTableHeader>
          <DataTableBody>
            {snapshot.rows.length ? (
              snapshot.rows.map((row) => {
                const draft = rowDrafts[row.membershipId] ?? {
                  role: row.roleValue,
                  status: row.statusValue,
                  officeId: row.officeAccessValue
                };

                return (
                  <DataTableRow className="office-table-row office-table-row-settings-users" key={row.membershipId}>
                    <div className="office-table-primary">
                      <strong>
                        <Link href={row.href}>{row.name}</Link>
                      </strong>
                      <p>
                        {row.email}
                        {row.title ? ` · ${row.title}` : ""}
                      </p>
                    </div>

                    {canManageUsers ? (
                      <SelectInput onChange={(event) => setRowDraft(row.membershipId, "role", event.target.value)} value={draft.role}>
                        {snapshot.filters.roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    ) : (
                      <span>{row.role}</span>
                    )}

                    {canManageUsers ? (
                      <SelectInput onChange={(event) => setRowDraft(row.membershipId, "officeId", event.target.value)} value={draft.officeId}>
                        {officeOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    ) : (
                      <span>{row.officeAccessLabel}</span>
                    )}

                    {canManageUsers ? (
                      <SelectInput onChange={(event) => setRowDraft(row.membershipId, "status", event.target.value)} value={draft.status}>
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="disabled">Inactive</option>
                      </SelectInput>
                    ) : (
                      <span>{row.status}</span>
                    )}

                    <div className="office-table-actions">
                      {canManageUsers ? (
                        <Button
                          disabled={pendingAction === `save-user:${row.membershipId}`}
                          onClick={() => handleSaveUser(row.membershipId)}
                          size="sm"
                          variant="secondary"
                        >
                          {pendingAction === `save-user:${row.membershipId}` ? "Saving..." : "Save"}
                        </Button>
                      ) : (
                        <span className="office-table-action-muted">View only</span>
                      )}
                    </div>
                  </DataTableRow>
                );
              })
            ) : (
              <EmptyState description="Try widening the filters or resetting the current search." title="No users matched the current filters" />
            )}
          </DataTableBody>
        </DataTable>
      </SectionCard>
    </>
  );
}
