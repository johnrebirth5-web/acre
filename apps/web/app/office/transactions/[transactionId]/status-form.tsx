"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@acre/ui";
import type { OfficeTransactionStatus } from "@acre/db";

type TransactionStatusFormProps = {
  transactionId: string;
  currentStatus: OfficeTransactionStatus;
};

const statusOptions: OfficeTransactionStatus[] = ["Opportunity", "Active", "Pending", "Closed", "Cancelled"];

export function TransactionStatusForm({ transactionId, currentStatus }: TransactionStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OfficeTransactionStatus>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdateStatus() {
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/office/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update transaction status.");
      }

      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update transaction status.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="office-form-actions">
      <label className="office-detail-field">
        <span>Status</span>
        <select onChange={(event) => setStatus(event.target.value as OfficeTransactionStatus)} value={status}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <Button disabled={isSaving} onClick={handleUpdateStatus} type="button">
        {isSaving ? "Saving..." : "Update status"}
      </Button>
      {error ? <p className="bm-transaction-submit-error">{error}</p> : null}
    </div>
  );
}
