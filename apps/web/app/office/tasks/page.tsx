import { canAccessOfficeTasks, canReviewOfficeTasks } from "@acre/auth";
import { Badge } from "@acre/ui";
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
    complianceStatus: searchParams.complianceStatus,
    transactionId: searchParams.transactionId,
    q: searchParams.q,
    includeCompleted: searchParams.includeCompleted
  });

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Task list</span>
          <h2>Task List</h2>
          <p>Back-office task management for transaction work, compliance review, and due-date prioritization.</p>
        </div>
        <div className="office-button-row">
          <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
          <Badge tone="neutral">{snapshot.maxWindowLabel}</Badge>
        </div>
      </section>

      <OfficeTasksClient
        canReviewTasks={canReviewOfficeTasks(context.currentMembership.role)}
        snapshot={snapshot}
      />
    </>
  );
}
