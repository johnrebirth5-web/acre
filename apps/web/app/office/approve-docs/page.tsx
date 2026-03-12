import {
  canAccessOfficeDocumentApprovals,
  canApproveOfficeDocuments,
  canReviewOfficeTasks,
  canSecondaryReviewOfficeTasks
} from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { listOfficeDocumentApprovalQueue } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeApproveDocsClient } from "./approve-docs-client";

type OfficeApproveDocsPageProps = {
  searchParams?: Promise<{
    queue?: string;
    assigneeMembershipId?: string;
    dueWindow?: string;
    q?: string;
  }>;
};

export default async function OfficeApproveDocsPage(props: OfficeApproveDocsPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessOfficeDocumentApprovals(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await listOfficeDocumentApprovalQueue({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    membershipId: context.currentMembership.id,
    canSecondaryReviewTasks: canSecondaryReviewOfficeTasks(context.currentMembership.role),
    queue: searchParams.queue,
    assigneeMembershipId: searchParams.assigneeMembershipId,
    dueWindow: searchParams.dueWindow,
    q: searchParams.q
  });

  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.selectedQueueLabel}</Badge>
            <Badge tone="neutral">{snapshot.maxWindowLabel}</Badge>
          </>
        }
        description="Focused document review workbench for first approval, second approval, rejection follow-up, signature blockers, and missing required files."
        eyebrow="Approve docs"
        title="Approve docs"
      />

      <OfficeApproveDocsClient
        canApproveDocuments={canApproveOfficeDocuments(context.currentMembership.role)}
        canReviewTasks={canReviewOfficeTasks(context.currentMembership.role)}
        canSecondaryReviewTasks={canSecondaryReviewOfficeTasks(context.currentMembership.role)}
        currentMembershipId={context.currentMembership.id}
        snapshot={snapshot}
      />
    </PageShell>
  );
}
