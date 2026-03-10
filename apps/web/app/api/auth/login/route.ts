import { getDefaultAppPath } from "@acre/auth";
import { NextRequest, NextResponse } from "next/server";
import { authenticateSeededUser, createSessionCookieValue, getSessionCookieName, getSessionCookieSettings } from "../../../../lib/auth-session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const context = await authenticateSeededUser(email);

  if (!context) {
    return NextResponse.redirect(new URL("/login?error=invalid_email", request.url), 303);
  }

  const response = NextResponse.redirect(new URL(getDefaultAppPath(context.currentMembership.role), request.url), 303);

  response.cookies.set(getSessionCookieName(), createSessionCookieValue(context.currentMembership.id), getSessionCookieSettings());

  return response;
}
