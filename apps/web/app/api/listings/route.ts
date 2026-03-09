import { listListings } from "@acre/backoffice";
import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const audience = request.nextUrl.searchParams.get("audience") === "office" ? "office" : "agent";

  return NextResponse.json({
    audience,
    listings: listListings(audience)
  });
}
