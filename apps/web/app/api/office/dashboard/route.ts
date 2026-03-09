import { summarizeAccess } from "@acre/auth";
import { getOfficeDashboardSnapshot } from "@acre/backoffice";
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? undefined;

  return NextResponse.json({
    access: summarizeAccess("office_manager"),
    snapshot: getOfficeDashboardSnapshot(userId)
  });
}
