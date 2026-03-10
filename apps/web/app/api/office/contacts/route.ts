import { isOfficeRole } from "@acre/auth";
import { createContact, listContacts } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../lib/auth-session";

function parsePreferredAreas(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isOfficeRole(context.currentMembership.role)) {
    return NextResponse.json({ error: "Office access required." }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const stage = request.nextUrl.searchParams.get("stage") ?? undefined;
  const result = await listContacts({
    organizationId: context.currentOrganization.id,
    search,
    stage
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isOfficeRole(context.currentMembership.role)) {
    return NextResponse.json({ error: "Office access required." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const fullName = String(body.fullName ?? "").trim();

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }

  const contact = await createContact({
    organizationId: context.currentOrganization.id,
    ownerMembershipId: context.currentMembership.id,
    actorMembershipId: context.currentMembership.id,
    actorOfficeId: context.currentOffice?.id,
    fullName,
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    contactType: String(body.contactType ?? ""),
    source: String(body.source ?? ""),
    stage: String(body.stage ?? ""),
    intent: String(body.intent ?? ""),
    budgetMin: String(body.budgetMin ?? ""),
    budgetMax: String(body.budgetMax ?? ""),
    preferredAreas: parsePreferredAreas(body.preferredAreas),
    notes: String(body.notes ?? ""),
    lastContactAt: String(body.lastContactAt ?? ""),
    nextFollowUpAt: String(body.nextFollowUpAt ?? "")
  });

  return NextResponse.json({ contact }, { status: 201 });
}
