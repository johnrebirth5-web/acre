import { listResources, listVendors } from "@acre/backoffice";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    resources: listResources(),
    vendors: listVendors()
  });
}
