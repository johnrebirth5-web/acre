import Link from "next/link";
import { getRoleSummary } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { getOfficeAccountSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeAccountClient } from "./account-client";

export default async function OfficeAccountPage() {
  const context = await requireOfficeSession();
  const snapshot = await getOfficeAccountSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    membershipId: context.currentMembership.id
  });

  if (!snapshot) {
    redirect("/office/dashboard");
  }

  return (
    <PageShell className="office-account-page">
      <PageHeader
        actions={
          <>
            <Link className="office-button office-button-secondary" href="/office/notifications">
              Open notifications
            </Link>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="accent">{getRoleSummary(context.currentMembership.role).label}</Badge>
          </>
        }
        description="Self-service profile, current office/team assignment, in-app notification preferences, and truthful account security context."
        eyebrow="Account"
        title="My profile"
      />

      <OfficeAccountClient snapshot={snapshot} />
    </PageShell>
  );
}
