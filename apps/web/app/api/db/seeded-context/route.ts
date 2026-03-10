import { getSeededWorkspaceSnapshot } from "@acre/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await getSeededWorkspaceSnapshot();

    if (!snapshot) {
      return NextResponse.json(
        {
          status: "not_found",
          message: "No seeded Acre workspace was found. Run the Prisma migration and seed workflow first."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "ok",
      snapshot
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unavailable",
        message: "Database query failed. Confirm DATABASE_URL, run the migration workflow, and seed the database.",
        error: error instanceof Error ? error.message : "Unknown database error"
      },
      { status: 503 }
    );
  }
}
