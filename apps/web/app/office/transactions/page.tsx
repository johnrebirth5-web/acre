import { listTransactions } from "@acre/backoffice";
import { TransactionsClient } from "./transactions-client";

export default function OfficeTransactionsPage() {
  const transactions = listTransactions();

  return <TransactionsClient transactions={transactions} />;
}
