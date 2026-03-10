import type { UserRole } from "@acre/auth";
import { prisma } from "./client";

export type SessionMembershipContext = {
  currentUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    timezone: string;
    locale: string;
  };
  currentMembership: {
    id: string;
    role: UserRole;
    title: string | null;
    status: "active" | "invited" | "disabled";
  };
  currentOrganization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  currentOffice: {
    id: string;
    name: string;
    slug: string;
    market: string;
  } | null;
};

function mapMembershipContext(
  membership: {
    id: string;
    role: UserRole;
    title: string | null;
    status: "active" | "invited" | "disabled";
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      timezone: string;
      locale: string;
    };
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
  }
): SessionMembershipContext {
  return {
    currentUser: {
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      timezone: membership.user.timezone,
      locale: membership.user.locale
    },
    currentMembership: {
      id: membership.id,
      role: membership.role,
      title: membership.title,
      status: membership.status
    },
    currentOrganization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      timezone: membership.organization.timezone
    },
    currentOffice: membership.office
      ? {
          id: membership.office.id,
          name: membership.office.name,
          slug: membership.office.slug,
          market: membership.office.market
        }
      : null
  };
}

export async function findActiveMembershipContextByEmail(email: string): Promise<SessionMembershipContext | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      status: "active",
      user: {
        email: normalizedEmail,
        isActive: true
      }
    },
    include: {
      user: true,
      organization: true,
      office: true
    },
    orderBy: [{ createdAt: "asc" }]
  });

  return membership ? mapMembershipContext(membership) : null;
}

export async function getSessionMembershipContext(membershipId: string): Promise<SessionMembershipContext | null> {
  if (!membershipId) {
    return null;
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      user: true,
      organization: true,
      office: true
    }
  });

  if (!membership || membership.status !== "active" || !membership.user.isActive) {
    return null;
  }

  return mapMembershipContext(membership);
}
