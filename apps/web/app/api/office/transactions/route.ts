import { isOfficeRole } from "@acre/auth";
import { createTransaction, listTransactions, type OfficeTransactionStatus } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../lib/auth-session";

function parseAdditionalFields(body: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(body).filter(([key, value]) => {
      if (
        [
          "transactionType",
          "transactionStatus",
          "representing",
          "address",
          "city",
          "state",
          "zipCode",
          "transactionName",
          "price",
          "buyerAgreementDate",
          "buyerExpirationDate",
          "acceptanceDate",
          "listingDate",
          "listingExpirationDate",
          "closingDate",
          "grossCommission",
          "referralFee",
          "officeNet",
          "agentNet",
          "financeNotes"
        ].includes(key)
      ) {
        return false;
      }

      return typeof value === "string" && value.trim().length > 0;
    })
  ) as Record<string, string>;
}

export async function GET(request: NextRequest) {
  const context = await getRequestSessionContext(request);

  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!isOfficeRole(context.currentMembership.role)) {
    return NextResponse.json({ error: "Office access required." }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? "All";

  const result = await listTransactions({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    search,
    status: status === "All" ? "All" : (status as OfficeTransactionStatus)
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
  const address = String(body.address ?? "").trim();
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const zipCode = String(body.zipCode ?? "").trim();

  if (!address || !city || !state || !zipCode) {
    return NextResponse.json({ error: "Address, city, state, and zip code are required." }, { status: 400 });
  }

  const transaction = await createTransaction({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    ownerMembershipId: context.currentMembership.id,
    actorMembershipId: context.currentMembership.id,
    transactionType: String(body.transactionType ?? ""),
    transactionStatus: String(body.transactionStatus ?? ""),
    representing: String(body.representing ?? ""),
    address,
    city,
    state,
    zipCode,
    transactionName: String(body.transactionName ?? ""),
    price: String(body.price ?? ""),
    buyerAgreementDate: String(body.buyerAgreementDate ?? ""),
    buyerExpirationDate: String(body.buyerExpirationDate ?? ""),
    acceptanceDate: String(body.acceptanceDate ?? ""),
    listingDate: String(body.listingDate ?? ""),
    listingExpirationDate: String(body.listingExpirationDate ?? ""),
    closingDate: String(body.closingDate ?? ""),
    grossCommission: String(body.grossCommission ?? ""),
    referralFee: String(body.referralFee ?? ""),
    officeNet: String(body.officeNet ?? ""),
    agentNet: String(body.agentNet ?? ""),
    financeNotes: String(body.financeNotes ?? ""),
    additionalFields: parseAdditionalFields(body)
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
