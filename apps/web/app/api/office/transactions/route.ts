import { isOfficeRole } from "@acre/auth";
import { createTransaction, listTransactions, type OfficeTransactionStatus } from "@acre/db";
import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionContext } from "../../../../lib/auth-session";

const transactionStatusOptions = ["All", "Opportunity", "Active", "Pending", "Closed", "Cancelled"] as const;
const defaultTransactionsPage = 1;
const defaultTransactionsPageSize = 20;
const maxTransactionsPageSize = 100;

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

function parsePositiveInteger(value: string | null, fallback: number, max?: number) {
  if (!value || !value.trim()) {
    return fallback;
  }

  const numeric = Number.parseInt(value, 10);

  if (!Number.isFinite(numeric) || numeric < 1) {
    return null;
  }

  return max ? Math.min(numeric, max) : numeric;
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
  const page = parsePositiveInteger(searchParams.get("page"), defaultTransactionsPage);
  const pageSize = parsePositiveInteger(
    searchParams.get("pageSize"),
    defaultTransactionsPageSize,
    maxTransactionsPageSize
  );

  if (page === null || pageSize === null) {
    return NextResponse.json({ error: "page and pageSize must be positive integers." }, { status: 400 });
  }

  if (!transactionStatusOptions.includes(status as (typeof transactionStatusOptions)[number])) {
    return NextResponse.json({ error: "Unsupported transaction status filter." }, { status: 400 });
  }

  const result = await listTransactions({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    search,
    status: status === "All" ? "All" : (status as OfficeTransactionStatus),
    page,
    pageSize
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
