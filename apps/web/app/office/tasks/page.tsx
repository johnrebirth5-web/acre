import {
  canAccessOfficeTasks,
  canApproveOfficeDocuments,
  canReviewOfficeTasks,
  canSecondaryReviewOfficeTasks
} from "@acre/auth";
import { PageHeader, PageHeaderSummary, PageShell, SummaryChip } from "@acre/ui";
import { listOfficeTasks } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeTasksClient } from "./tasks-client";

type OfficeTasksPageProps = {
  searchParams?: Promise<{
    view?: string;
    transactionStatus?: string;
    assigneeMembershipId?: string;
    dueWindow?: string;
    noDueDate?: string;
    reviewStatus?: string;
    requiresSecondaryApproval?: string;
    complianceStatus?: string | string[];
    transactionId?: string;
    q?: string;
    includeCompleted?: string;
  }>;
};

export default async function OfficeTasksPage(props: OfficeTasksPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessOfficeTasks(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await listOfficeTasks({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    membershipId: context.currentMembership.id,
    role: context.currentMembership.role,
    view: searchParams.view,
    transactionStatus: searchParams.transactionStatus,
    assigneeMembershipId: searchParams.assigneeMembershipId,
    dueWindow: searchParams.dueWindow,
    noDueDate: searchParams.noDueDate,
    reviewStatus: searchParams.reviewStatus,
    requiresSecondaryApproval: searchParams.requiresSecondaryApproval,
    complianceStatus: searchParams.complianceStatus,
    transactionId: searchParams.transactionId,
    q: searchParams.q,
    includeCompleted: searchParams.includeCompleted
  });

  return (
    <PageShell className="office-list-page office-tasks-page">
      <PageHeader
        actions={
          <PageHeaderSummary>
            <SummaryChip label="Office scope" value={context.currentOffice?.name ?? context.currentOrganization.name} />
            <SummaryChip label="Current view" value={snapshot.selectedViewName} />
            <SummaryChip label="Window" tone="accent" value={snapshot.maxWindowLabel} />
          </PageHeaderSummary>
        }
        description="Back-office task management for transaction work, compliance review, and due-date prioritization."
        eyebrow="Task list"
        title="Task list"
      />

      <OfficeTasksClient
        canApproveDocuments={canApproveOfficeDocuments(context.currentMembership.role)}
        canReviewTasks={canReviewOfficeTasks(context.currentMembership.role)}
        canSecondaryReviewTasks={canSecondaryReviewOfficeTasks(context.currentMembership.role)}
        currentMembershipId={context.currentMembership.id}
        snapshot={snapshot}
      />
    </PageShell>
  );
}
