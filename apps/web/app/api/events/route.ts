import { listEvents } from "@acre/backoffice";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    events: listEvents()
  });
}
