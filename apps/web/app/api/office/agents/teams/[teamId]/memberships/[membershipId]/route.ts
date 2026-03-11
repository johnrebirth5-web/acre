import { canManageOfficeTeams } from "@acre/auth";
import { removeAgentFromTeam } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../../../../../lib/auth-session";

type RouteContext = {
  params: Promise<{
    teamId: string;
    membershipId: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canManageOfficeTeams(context.currentMembership.role)) {
    return NextResponse.json({ error: "Team management permission required." }, { status: 403 });
  }

  const { teamId, membershipId } = await params;

  try {
    await removeAgentFromTeam({
      organizationId: context.currentOrganization.id,
      officeId: context.currentOffice?.id ?? null,
      actorMembershipId: context.currentMembership.id,
      teamId,
      membershipId
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to remove agent from team." }, { status: 400 });
  }
}
