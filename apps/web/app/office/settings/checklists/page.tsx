import { canManageOfficeChecklists, canViewOfficeChecklists } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { getOfficeChecklistTemplatesSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../../lib/auth-session";
import { OfficeSettingsNav } from "../settings-nav";
import { OfficeSettingsChecklistsClient } from "./checklists-client";

export default async function OfficeSettingsChecklistsPage() {
  const context = await requireOfficeSession();

  if (!canViewOfficeChecklists(context.currentMembership.role)) {
    redirect("/office/settings");
  }

  const snapshot = await getOfficeChecklistTemplatesSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null
  });

  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.summary.totalTemplates} templates</Badge>
          </>
        }
        description="Reusable checklist templates for transaction workflows, due offsets, and document/compliance requirements."
        eyebrow="Office admin"
        title="Checklists"
      />

      <OfficeSettingsNav />

      <OfficeSettingsChecklistsClient canManageChecklists={canManageOfficeChecklists(context.currentMembership.role)} snapshot={snapshot} />
    </PageShell>
  );
}
