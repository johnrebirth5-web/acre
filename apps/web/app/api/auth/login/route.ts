import { activityLogActions, prisma, recordActivityLogEvent } from "@acre/db";
import { getDefaultAppPath } from "@acre/auth";
import { NextRequest, NextResponse } from "next/server";
import { authenticateSeededUser, createSessionCookieValue, getSessionCookieName, getSessionCookieSettings } from "../../../../lib/auth-session";
import { getRequestOrigin } from "../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const context = await authenticateSeededUser(email);

  if (!context) {
    return NextResponse.redirect(new URL("/login?error=invalid_email", requestOrigin), 303);
  }

  await recordActivityLogEvent(prisma, {
    organizationId: context.currentOrganization.id,
    membershipId: context.currentMembership.id,
    entityType: "session",
    entityId: context.currentMembership.id,
    action: activityLogActions.authLogin,
    payload: {
      officeId: context.currentOffice?.id ?? null,
      objectLabel: `${context.currentUser.firstName} ${context.currentUser.lastName} · ${context.currentUser.email}`,
      details: [`Role: ${context.currentMembership.role}`, `Office: ${context.currentOffice?.name ?? context.currentOrganization.name}`]
    }
  });

  const response = NextResponse.redirect(new URL(getDefaultAppPath(context.currentMembership.role), requestOrigin), 303);

  response.cookies.set(getSessionCookieName(), createSessionCookieValue(context.currentMembership.id), getSessionCookieSettings());

  return response;
}
