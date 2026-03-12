import { canManageOfficeTeams, canViewOfficeTeams } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { getOfficeAgentsRosterSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { OfficeSettingsNav } from "../settings-nav";
import { OfficeSettingsTeamsClient } from "./teams-client";

export default async function OfficeSettingsTeamsPage() {
  const context = await requireOfficeSession();

  if (!canViewOfficeTeams(context.currentMembership.role)) {
    redirect("/office/settings");
  }

  const snapshot = await getOfficeAgentsRosterSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null
  });

  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.teams.length} teams</Badge>
          </>
        }
        description="Administrative team roster management for operational grouping, assignment, and active/inactive team structure."
        eyebrow="Office admin"
        title="Teams"
      />

      <OfficeSettingsNav />

      <OfficeSettingsTeamsClient canManageTeams={canManageOfficeTeams(context.currentMembership.role)} snapshot={snapshot} />
    </PageShell>
  );
}
