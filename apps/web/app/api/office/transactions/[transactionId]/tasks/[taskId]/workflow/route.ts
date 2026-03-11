import { canManageOfficeTasks, canReviewOfficeTasks } from "@acre/auth";
import { approveTransactionTask, completeTransactionTask, rejectTransactionTask, reopenTransactionTask, requestTransactionTaskReview } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../../../../../lib/auth-session";

type RouteContext = {
  params: Promise<{
    transactionId: string;
    taskId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canManageOfficeTasks(context.currentMembership.role)) {
    return NextResponse.json({ error: "Task list access required." }, { status: 403 });
  }

  const { transactionId, taskId } = await params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action?.trim();

  if (!action) {
    return NextResponse.json({ error: "Workflow action is required." }, { status: 400 });
  }

  try {
    const task =
      action === "complete"
        ? await completeTransactionTask({
            organizationId: context.currentOrganization.id,
            transactionId,
            taskId,
            actorMembershipId: context.currentMembership.id
          })
        : action === "reopen"
          ? await reopenTransactionTask({
              organizationId: context.currentOrganization.id,
              transactionId,
              taskId,
              actorMembershipId: context.currentMembership.id
            })
          : action === "request_review"
            ? await requestTransactionTaskReview({
                organizationId: context.currentOrganization.id,
                transactionId,
                taskId,
                actorMembershipId: context.currentMembership.id
              })
            : action === "approve"
              ? canReviewOfficeTasks(context.currentMembership.role)
                ? await approveTransactionTask({
                    organizationId: context.currentOrganization.id,
                    transactionId,
                    taskId,
                    actorMembershipId: context.currentMembership.id
                  })
                : null
              : action === "reject"
                ? canReviewOfficeTasks(context.currentMembership.role)
                  ? await rejectTransactionTask({
                      organizationId: context.currentOrganization.id,
                      transactionId,
                      taskId,
                      actorMembershipId: context.currentMembership.id
                    })
                  : null
                : null;

    if ((action === "approve" || action === "reject") && !canReviewOfficeTasks(context.currentMembership.role)) {
      return NextResponse.json({ error: "Review permission required." }, { status: 403 });
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found or workflow action failed." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow action failed." },
      { status: 400 }
    );
  }
}
