import { canManageOfficeFields } from "@acre/auth";
import { saveOfficeFieldSettings } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../../lib/auth-session";

export async function PATCH(request: NextRequest) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canManageOfficeFields(context.currentMembership.role)) {
    return NextResponse.json({ error: "Field settings permission required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        contactRoleSettings?: Array<{
          role?: string;
          isRequired?: boolean;
        }>;
        transactionFieldSettings?: Array<{
          fieldKey?: string;
          isRequired?: boolean;
          isVisible?: boolean;
        }>;
      }
    | null;

  try {
    const snapshot = await saveOfficeFieldSettings({
      organizationId: context.currentOrganization.id,
      officeId: context.currentOffice?.id ?? null,
      actorMembershipId: context.currentMembership.id,
      contactRoleSettings:
        body?.contactRoleSettings?.map((entry) => ({
          role: entry.role ?? "",
          isRequired: Boolean(entry.isRequired)
        })) ?? [],
      transactionFieldSettings:
        body?.transactionFieldSettings?.map((entry) => ({
          fieldKey: entry.fieldKey ?? "",
          isRequired: Boolean(entry.isRequired),
          isVisible: typeof entry.isVisible === "boolean" ? entry.isVisible : true
        })) ?? []
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save field settings." }, { status: 400 });
  }
}
