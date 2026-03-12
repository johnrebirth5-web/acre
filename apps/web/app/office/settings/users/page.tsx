import { canManageOfficeUsers, canViewOfficeUsers } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
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
    <PageShell>
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.summary.totalUsers} users</Badge>
          </>
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
