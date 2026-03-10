import { createHmac, timingSafeEqual } from "node:crypto";
import { getDefaultAppPath, isOfficeRole, summarizeAccess } from "@acre/auth";
import { findActiveMembershipContextByEmail, getSessionMembershipContext, type SessionMembershipContext } from "@acre/db";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "acre_local_session";
const DEV_SESSION_SECRET = "acre-local-session-dev-only";

type SessionPayload = {
  membershipId: string;
  issuedAt: number;
};

function getSessionSecret() {
  return process.env.ACRE_SESSION_SECRET || DEV_SESSION_SECRET;
}

function signPayload(serializedPayload: string) {
  return createHmac("sha256", getSessionSecret()).update(serializedPayload).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const serializedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(serializedPayload);

  return `${serializedPayload}.${signature}`;
}

function decodeSession(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) {
    return null;
  }

  const [serializedPayload, signature] = cookieValue.split(".");

  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(serializedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(serializedPayload, "base64url").toString("utf8")) as SessionPayload;

    if (!parsed.membershipId || typeof parsed.membershipId !== "string") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  };
}

export function createSessionCookieValue(membershipId: string) {
  return encodeSession({
    membershipId,
    issuedAt: Date.now()
  });
}

export async function authenticateSeededUser(email: string): Promise<SessionMembershipContext | null> {
  return findActiveMembershipContextByEmail(email);
}

export async function getCurrentSessionContext(): Promise<SessionMembershipContext | null> {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return null;
  }

  return getSessionMembershipContext(session.membershipId);
}

export async function getRequestSessionContext(request: NextRequest): Promise<SessionMembershipContext | null> {
  const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return null;
  }

  return getSessionMembershipContext(session.membershipId);
}

export async function requireSessionContext(): Promise<SessionMembershipContext> {
  const context = await getCurrentSessionContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireOfficeSession(): Promise<SessionMembershipContext> {
  const context = await requireSessionContext();

  if (!isOfficeRole(context.currentMembership.role)) {
    redirect(getDefaultAppPath(context.currentMembership.role));
  }

  return context;
}

export async function requireRequestOfficeSession(request: NextRequest): Promise<SessionMembershipContext | null> {
  const context = await getRequestSessionContext(request);

  if (!context || !isOfficeRole(context.currentMembership.role)) {
    return null;
  }

  return context;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieSettings() {
  return getSessionCookieOptions();
}

export function getSessionAccess(context: SessionMembershipContext) {
  return summarizeAccess(context.currentMembership.role);
}
