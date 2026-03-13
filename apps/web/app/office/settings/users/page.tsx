import { canManageOfficeUsers, canViewOfficeUsers } from "@acre/auth";
import { PageHeader, PageHeaderSummary, PageShell, SummaryChip } from "@acre/ui";
import { getOfficeAdminUsersSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { OfficeSettingsNav } from "../settings-nav";
import { OfficeSettingsUsersClient } from "./users-client";

type OfficeSettingsUsersPageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    status?: string;
    officeId?: string;
  }>;
};

export default async function OfficeSettingsUsersPage(props: OfficeSettingsUsersPageProps) {
  const context = await requireOfficeSession();

  if (!canViewOfficeUsers(context.currentMembership.role)) {
    redirect("/office/settings");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficeAdminUsersSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    q: searchParams.q,
    role: searchParams.role,
    status: searchParams.status,
    officeFilterId: searchParams.officeId
  });

  return (
    <PageShell className="office-list-page office-settings-list-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={context.currentOffice?.name ?? context.currentOrganization.name} />
            <SummaryChip label="Total users" tone="accent" value={snapshot.summary.totalUsers} />
            <SummaryChip label="Active users" value={snapshot.summary.activeUsers} />
          </PageHeaderSummary>
        }
        description="Administrative user access for the current organization, including role, active status, and office assignment."
        eyebrow="Office admin"
        title="Users"
      />

      <OfficeSettingsNav />

      <OfficeSettingsUsersClient canManageUsers={canManageOfficeUsers(context.currentMembership.role)} snapshot={snapshot} />
    </PageShell>
  );
}
