import { listClients } from "@acre/backoffice";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    clients: listClients()
  });
}
