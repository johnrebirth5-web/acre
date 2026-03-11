import {
  canManageOfficeAgents,
  canManageOfficeGoals,
  canManageOfficeOnboarding,
  canManageOfficeTeams,
  canViewOfficeAgents
} from "@acre/auth";
import { Badge, PageHeader, PageShell } from "@acre/ui";
import { getOfficeAgentsRosterSnapshot } from "@acre/db";
import { redirect } from "next/navigation";
import { requireOfficeSession } from "../../../lib/auth-session";
import { OfficeAgentsClient } from "./agents-client";

type OfficeAgentsPageProps = {
  searchParams?: Promise<{
    officeId?: string;
    role?: string;
    teamId?: string;
    onboardingStatus?: string;
    q?: string;
  }>;
};

export default async function OfficeAgentsPage(props: OfficeAgentsPageProps) {
  const context = await requireOfficeSession();

  if (!canViewOfficeAgents(context.currentMembership.role)) {
    redirect("/office/dashboard");
  }

  const searchParams = (await props.searchParams) ?? {};
  const snapshot = await getOfficeAgentsRosterSnapshot({
    organizationId: context.currentOrganization.id,
    officeId: context.currentOffice?.id ?? null,
    officeFilterId: searchParams.officeId,
    role: searchParams.role,
    teamId: searchParams.teamId,
    onboardingStatus: searchParams.onboardingStatus,
    q: searchParams.q
  });

  return (
    <PageShell>
      <PageHeader
        actions={
          <>
            <Badge tone="neutral">{context.currentOffice?.name ?? context.currentOrganization.name}</Badge>
            <Badge tone="neutral">{snapshot.summary.totalMembers} rostered members</Badge>
          </>
        }
        description="Agent profiles, onboarding visibility, teams, goals, and operating performance for the current back-office workspace."
        eyebrow="Agent management"
        title="Agents"
      />

      <OfficeAgentsClient
        canManageAgents={canManageOfficeAgents(context.currentMembership.role)}
        canManageGoals={canManageOfficeGoals(context.currentMembership.role)}
        canManageOnboarding={canManageOfficeOnboarding(context.currentMembership.role)}
        canManageTeams={canManageOfficeTeams(context.currentMembership.role)}
        snapshot={snapshot}
      />
    </PageShell>
  );
}
