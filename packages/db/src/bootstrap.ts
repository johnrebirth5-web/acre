import type { UserRole } from "@acre/auth";
import { assertDatabaseUrl, prisma } from "./client";

export type SeededMembershipSnapshot = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  officeName: string | null;
  title: string | null;
};

export type SeededWorkspaceSnapshot = {
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  office: {
    id: string;
    name: string;
    slug: string;
    market: string;
  } | null;
  memberships: SeededMembershipSnapshot[];
};

export async function getSeededWorkspaceSnapshot(organizationSlug = "acre"): Promise<SeededWorkspaceSnapshot | null> {
  assertDatabaseUrl();

  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    include: {
      offices: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }]
      },
      memberships: {
        include: {
          user: true,
          office: true
        },
        orderBy: [{ createdAt: "asc" }]
      }
    }
  });

  if (!organization) {
    return null;
  }

  const primaryOffice = organization.offices[0] ?? null;

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone
    },
    office: primaryOffice
      ? {
          id: primaryOffice.id,
          name: primaryOffice.name,
          slug: primaryOffice.slug,
          market: primaryOffice.market
        }
      : null,
    memberships: organization.memberships.map((membership) => ({
      membershipId: membership.id,
      userId: membership.userId,
      email: membership.user.email,
      fullName: `${membership.user.firstName} ${membership.user.lastName}`,
      role: membership.role,
      officeName: membership.office?.name ?? null,
      title: membership.title ?? null
    }))
  };
}
