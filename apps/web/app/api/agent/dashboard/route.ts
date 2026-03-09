import { summarizeAccess } from "@acre/auth";
import { getAgentDashboardSnapshot } from "@acre/backoffice";
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;

  return NextResponse.json({
    access: summarizeAccess("agent"),
    snapshot: getAgentDashboardSnapshot(userId)
  });
}
