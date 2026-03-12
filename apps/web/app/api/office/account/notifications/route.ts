import { saveOfficeAccountNotificationPreferences } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { requireRequestOfficeSession } from "../../../../../lib/auth-session";

export async function PATCH(request: NextRequest) {
  const context = await requireRequestOfficeSession(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        inAppEnabled?: boolean;
        approvalAlertsEnabled?: boolean;
        taskRemindersEnabled?: boolean;
        offerAlertsEnabled?: boolean;
      }
    | null;

  if (
    !body ||
    typeof body.inAppEnabled !== "boolean" ||
    typeof body.approvalAlertsEnabled !== "boolean" ||
    typeof body.taskRemindersEnabled !== "boolean" ||
    typeof body.offerAlertsEnabled !== "boolean"
  ) {
    return NextResponse.json({ error: "Valid notification preferences are required." }, { status: 400 });
  }

  const saved = await saveOfficeAccountNotificationPreferences({
    organizationId: context.currentOrganization.id,
    membershipId: context.currentMembership.id,
    inAppEnabled: body.inAppEnabled,
    approvalAlertsEnabled: body.approvalAlertsEnabled,
    taskRemindersEnabled: body.taskRemindersEnabled,
    offerAlertsEnabled: body.offerAlertsEnabled
  });

  if (!saved) {
    return NextResponse.json({ error: "Notification preferences not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, saved });
}
