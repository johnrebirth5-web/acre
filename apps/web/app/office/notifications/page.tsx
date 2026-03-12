import Link from "next/link";
import { canAccessOfficeNotifications } from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { listOfficeNotifications } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeNotificationsClient } from "./notifications-client";

type OfficeNotificationsPageProps = {
  searchParams?: Promise<{
    type?: string;
    category?: string;
    readState?: string;
  }>;
};

export default async function OfficeNotificationsPage(props: OfficeNotificationsPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessOfficeNotifications(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await listOfficeNotifications({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    membershipId: context.currentMembership.id,
    type: searchParams.type,
    category: searchParams.category,
    readState: searchParams.readState
  });

  return (
    <PageShell className="bm-page">
      <PageHeader
        actions={
          <>
            <Link className="office-button office-button-secondary" href="/office/activity">
              Open activity log
            </Link>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.summary.unreadCount} unread</Badge>
          </>
        }
        description="Personal inbox for review work, follow-ups, offer changes, signatures, and incoming updates. Activity log remains the audited system-wide record."
        eyebrow="Notifications"
        title="Notifications"
      />

      <OfficeNotificationsClient snapshot={snapshot} />
    </PageShell>
  );
}
