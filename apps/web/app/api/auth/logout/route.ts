import { activityLogActions, prisma, recordActivityLogEvent } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext, getSessionCookieName, getSessionCookieSettings } from "../../../../lib/auth-session";

export async function POST(request: NextRequest) {
  const context = await getRequestSessionContext(request);

  if (context) {
    await recordActivityLogEvent(prisma, {
      organizationId: context.currentOrganization.id,
      membershipId: context.currentMembership.id,
      entityType: "session",
      entityId: context.currentMembership.id,
      action: activityLogActions.authLogout,
      payload: {
        officeId: context.currentOffice?.id ?? null,
        objectLabel: `${context.currentUser.firstName} ${context.currentUser.lastName} · ${context.currentUser.email}`,
        details: [`Role: ${context.currentMembership.role}`, `Office: ${context.currentOffice?.name ?? context.currentOrganization.name}`]
      }
    });
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieSettings(),
    maxAge: 0
  });

  return response;
}
