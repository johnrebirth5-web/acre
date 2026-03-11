import { canAccessOfficeAccounting, canManageOfficeAccounting } from "@acre/auth";
import { Badge } from "@acre/ui";
import { getOfficeAccountingSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeAccountingClient } from "./accounting-client";

type OfficeAccountingPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    ownerMembershipId?: string;
    q?: string;
    entryId?: string;
  }>;
};

export default async function OfficeAccountingPage(props: OfficeAccountingPageProps) {
  const context = await requireOfficeSession();

  if (!canAccessOfficeAccounting(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficeAccountingSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    type: searchParams.type,
    status: searchParams.status,
    startDate: searchParams.startDate,
    endDate: searchParams.endDate,
    ownerMembershipId: searchParams.ownerMembershipId,
    q: searchParams.q,
    entryId: searchParams.entryId
  });

  return (
    <>
      <section className="office-page-header">
        <div>
          <span className="office-eyebrow">Accounting</span>
          <h2>Accounting</h2>
          <p>Transactional accounting for invoices, bills, payments, ledger posting, and earnest money workflows.</p>
        </div>
        <div className="office-button-row">
          <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
          <Badge tone="neutral">Chart of accounts ready</Badge>
          <Badge tone="neutral">Ledger-backed posting</Badge>
        </div>
      </section>

      <OfficeAccountingClient
        canManageAccounting={canManageOfficeAccounting(context.currentMembership.role)}
        officeLabel={context.currentOffice?.name ?? context.currentOrganization.name}
        snapshot={snapshot}
      />
    </>
  );
}
