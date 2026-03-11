import { listTransactions, type OfficeTransactionStatus } from "@acre/db";
import { requireOfficeSession } from "../../../lib/auth-session";
import { TransactionsClient } from "./transactions-client";

type OfficeTransactionsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
};

const transactionStatusOptions = ["All", "Opportunity", "Active", "Pending", "Closed", "Cancelled"] as const;
const defaultTransactionsPage = 1;
const defaultTransactionsPageSize = 20;
const maxTransactionsPageSize = 100;

function parsePositiveInteger(value: string | undefined, fallback: number, max?: number) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }

  return max ? Math.min(numeric, max) : numeric;
}

function normalizeStatusFilter(value: string | undefined): OfficeTransactionStatus | "All" {
  return transactionStatusOptions.includes((value ?? "All") as (typeof transactionStatusOptions)[number])
    ? ((value ?? "All") as OfficeTransactionStatus | "All")
    : "All";
}

export default async function OfficeTransactionsPage(props: OfficeTransactionsPageProps) {
  const context = await requireOfficeSession();
  const searchParams = (await props.searchParams) ?? {};
  const q = searchParams.q?.trim() ?? "";
  const status = normalizeStatusFilter(searchParams.status);
  const page = parsePositiveInteger(searchParams.page, defaultTransactionsPage);
  const pageSize = parsePositiveInteger(
    searchParams.pageSize,
    defaultTransactionsPageSize,
    maxTransactionsPageSize
  );
  const result = await listTransactions({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id,
    search: q,
    status,
    page,
    pageSize
  });

  return (
    <TransactionsClient
      filters={{ q, status }}
      page={result.page}
      pageSize={result.pageSize}
      summary={result.summary}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      transactions={result.transactions}
    />
  );
}
