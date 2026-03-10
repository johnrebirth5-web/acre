import { listTransactions } from "@acre/db";
import { requireOfficeSession } from "../../../lib/auth-session";
import { TransactionsClient } from "./transactions-client";

export default async function OfficeTransactionsPage() {
  const context = await requireOfficeSession();
  const result = await listTransactions({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id
  });

  return <TransactionsClient summary={result.summary} transactions={result.transactions} />;
}
