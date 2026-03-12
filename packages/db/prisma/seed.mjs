import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the Acre seed workflow.");
}

function getSeedDocumentsRoot() {
  return process.env.ACRE_DOCUMENTS_STORAGE_DIR?.trim() || path.join(process.cwd(), ".local-storage", "documents");
}

function sanitizeStorageSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "file";
}

async function writeSeedStoredDocument({ organizationId, transactionId, fileName, content }) {
  const directory = path.join(
    getSeedDocumentsRoot(),
    sanitizeStorageSegment(organizationId),
    sanitizeStorageSegment(transactionId)
  );
  await mkdir(directory, { recursive: true });

  const normalizedFileName = sanitizeStorageSegment(fileName);
  const absolutePath = path.join(directory, normalizedFileName);
  const fileBody = typeof content === "string" ? content : JSON.stringify(content, null, 2);

  await writeFile(absolutePath, fileBody, "utf8");

  return {
    fileName: normalizedFileName,
    storageKey: absolutePath,
    fileSizeBytes: Buffer.byteLength(fileBody)
  };
}

async function upsertUser({ email, firstName, lastName }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      isActive: true
    },
    create: {
      email,
      firstName,
      lastName,
      timezone: "America/New_York",
      locale: "en-US",
      isActive: true
    }
  });
}

async function upsertLedgerAccount({ organizationId, officeId, code, name, accountType, isSystem = true, isActive = true }) {
  return prisma.ledgerAccount.upsert({
    where: {
      organizationId_code: {
        organizationId,
        code
      }
    },
    update: {
      officeId,
      name,
      accountType,
      isSystem,
      isActive
    },
    create: {
      organizationId,
      officeId,
      code,
      name,
      accountType,
      isSystem,
      isActive
    }
  });
}

async function upsertAccountingTransactionWithPostings({
  id,
  organizationId,
  officeId,
  relatedTransactionId,
  relatedMembershipId,
  isAgentBilling = false,
  billingCategory = null,
  originRecurringChargeRuleId = null,
  type,
  status,
  accountingDate,
  dueDate,
  paymentMethod,
  referenceNumber,
  counterpartyName,
  memo,
  notes,
  totalAmount,
  createdByMembershipId,
  postedAt,
  lineItems,
  ledgerEntries
}) {
  const transaction = await prisma.accountingTransaction.upsert({
    where: { id },
    update: {
      organizationId,
      officeId,
      relatedTransactionId,
      relatedMembershipId,
      isAgentBilling,
      billingCategory,
      originRecurringChargeRuleId,
      type,
      status,
      accountingDate,
      dueDate,
      paymentMethod,
      referenceNumber,
      counterpartyName,
      memo,
      notes,
      totalAmount,
      createdByMembershipId,
      postedAt
    },
    create: {
      id,
      organizationId,
      officeId,
      relatedTransactionId,
      relatedMembershipId,
      isAgentBilling,
      billingCategory,
      originRecurringChargeRuleId,
      type,
      status,
      accountingDate,
      dueDate,
      paymentMethod,
      referenceNumber,
      counterpartyName,
      memo,
      notes,
      totalAmount,
      createdByMembershipId,
      postedAt
    }
  });

  await prisma.accountingTransactionLineItem.deleteMany({
    where: {
      accountingTransactionId: id
    }
  });

  await prisma.generalLedgerEntry.deleteMany({
    where: {
      accountingTransactionId: id
    }
  });

  if (lineItems.length) {
    await prisma.accountingTransactionLineItem.createMany({
      data: lineItems.map((lineItem, index) => ({
        id: lineItem.id,
        organizationId,
        officeId,
        accountingTransactionId: id,
        relatedTransactionId,
        ledgerAccountId: lineItem.ledgerAccountId,
        description: lineItem.description ?? null,
        entrySide: lineItem.entrySide,
        amount: lineItem.amount,
        sortOrder: lineItem.sortOrder ?? index
      }))
    });
  }

  if (ledgerEntries.length) {
    await prisma.generalLedgerEntry.createMany({
      data: ledgerEntries.map((entry) => ({
        id: entry.id,
        organizationId,
        officeId,
        accountingTransactionId: id,
        relatedTransactionId,
        accountId: entry.accountId,
        entryDate: entry.entryDate,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        memo: entry.memo ?? null
      }))
    });
  }

  return transaction;
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "acre" },
    update: {
      name: "Acre",
      timezone: "America/New_York"
    },
    create: {
      name: "Acre",
      slug: "acre",
      timezone: "America/New_York"
    }
  });

  const office = await prisma.office.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "acre-ny"
      }
    },
    update: {
      name: "Acre NY Realty Inc",
      market: "New York Sales",
      isPrimary: true
    },
    create: {
      organizationId: organization.id,
      name: "Acre NY Realty Inc",
      slug: "acre-ny",
      market: "New York Sales",
      isPrimary: true
    }
  });

  const users = await Promise.all([
    upsertUser({ email: "jane@acre.com", firstName: "Jane", lastName: "Wu" }),
    upsertUser({ email: "simon@acre.com", firstName: "Simon", lastName: "Park" }),
    upsertUser({ email: "naomi@acre.com", firstName: "Naomi", lastName: "Chen" })
  ]);

  const memberships = [
    { user: users[0], role: "agent", title: "Senior Agent" },
    { user: users[1], role: "office_manager", title: "Office Manager" },
    { user: users[2], role: "office_admin", title: "Office Admin" }
  ];

  const membershipByEmail = new Map();

  for (const membership of memberships) {
    const savedMembership = await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: membership.user.id
        }
      },
      update: {
        officeId: office.id,
        role: membership.role,
        status: "active",
        title: membership.title,
        permissions: null
      },
      create: {
        organizationId: organization.id,
        officeId: office.id,
        userId: membership.user.id,
        role: membership.role,
        status: "active",
        title: membership.title,
        permissions: null
      }
    });

    membershipByEmail.set(membership.user.email, savedMembership);
  }

  const seededAgentProfiles = [
    {
      membershipEmail: "jane@acre.com",
      displayName: "Jane Wu",
      bio: "Buyer-side agent focused on Brooklyn and LIC investor inventory.",
      notes: "Primary mentor for new buyer-side workflows.",
      licenseNumber: "NY-AG-10428",
      licenseState: "NY",
      startDate: new Date("2025-09-01T00:00:00.000Z"),
      onboardingStatus: "in_progress",
      commissionPlanName: "Senior agent split",
      avatarUrl: "",
      internalExtension: "201"
    },
    {
      membershipEmail: "simon@acre.com",
      displayName: "Simon Park",
      bio: "Office manager supervising transaction operations and finance review.",
      notes: "Reviews finance-side tasks and vendor billing workflows.",
      licenseNumber: "",
      licenseState: "",
      startDate: new Date("2024-07-15T00:00:00.000Z"),
      onboardingStatus: "complete",
      commissionPlanName: "",
      avatarUrl: "",
      internalExtension: "102"
    },
    {
      membershipEmail: "naomi@acre.com",
      displayName: "Naomi Chen",
      bio: "Office administrator coordinating approvals, documents, and back-office operations.",
      notes: "Primary secondary approver for compliance-sensitive work.",
      licenseNumber: "",
      licenseState: "",
      startDate: new Date("2024-11-01T00:00:00.000Z"),
      onboardingStatus: "complete",
      commissionPlanName: "",
      avatarUrl: "",
      internalExtension: "101"
    }
  ];

  for (const profile of seededAgentProfiles) {
    const membership = membershipByEmail.get(profile.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.agentProfile.upsert({
      where: {
        membershipId: membership.id
      },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        displayName: profile.displayName,
        bio: profile.bio,
        notes: profile.notes,
        licenseNumber: profile.licenseNumber || null,
        licenseState: profile.licenseState || null,
        startDate: profile.startDate,
        onboardingStatus: profile.onboardingStatus,
        commissionPlanName: profile.commissionPlanName || null,
        avatarUrl: profile.avatarUrl || null,
        internalExtension: profile.internalExtension || null
      },
      create: {
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        displayName: profile.displayName,
        bio: profile.bio,
        notes: profile.notes,
        licenseNumber: profile.licenseNumber || null,
        licenseState: profile.licenseState || null,
        startDate: profile.startDate,
        onboardingStatus: profile.onboardingStatus,
        commissionPlanName: profile.commissionPlanName || null,
        avatarUrl: profile.avatarUrl || null,
        internalExtension: profile.internalExtension || null
      }
    });
  }

  const seededTeams = [
    {
      id: "seed-team-east-river",
      name: "East River Team",
      slug: "east-river-team",
      isActive: true
    },
    {
      id: "seed-team-operations",
      name: "Operations",
      slug: "operations",
      isActive: true
    }
  ];

  for (const team of seededTeams) {
    await prisma.team.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: team.slug
        }
      },
      update: {
        officeId: office.id,
        name: team.name,
        isActive: team.isActive
      },
      create: {
        id: team.id,
        organizationId: organization.id,
        officeId: office.id,
        name: team.name,
        slug: team.slug,
        isActive: team.isActive
      }
    });
  }

  const seededTeamMemberships = [
    {
      id: "seed-team-membership-jane",
      teamId: "seed-team-east-river",
      membershipEmail: "jane@acre.com",
      role: "lead"
    },
    {
      id: "seed-team-membership-simon",
      teamId: "seed-team-operations",
      membershipEmail: "simon@acre.com",
      role: "lead"
    },
    {
      id: "seed-team-membership-naomi",
      teamId: "seed-team-operations",
      membershipEmail: "naomi@acre.com",
      role: "member"
    }
  ];

  for (const teamMembership of seededTeamMemberships) {
    const membership = membershipByEmail.get(teamMembership.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.teamMembership.upsert({
      where: {
        teamId_membershipId: {
          teamId: teamMembership.teamId,
          membershipId: membership.id
        }
      },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        role: teamMembership.role
      },
      create: {
        id: teamMembership.id,
        organizationId: organization.id,
        officeId: office.id,
        teamId: teamMembership.teamId,
        membershipId: membership.id,
        role: teamMembership.role
      }
    });
  }

  const seededAgentOnboardingTemplates = [
    {
      id: "seed-agent-template-license",
      title: "Upload license and state ID",
      description: "Provide the current NY license and state ID for compliance review.",
      category: "Compliance",
      dueDaysOffset: 3,
      sortOrder: 0
    },
    {
      id: "seed-agent-template-packet",
      title: "Complete brokerage onboarding packet",
      description: "Review commission setup, office policies, and required agreements.",
      category: "Operations",
      dueDaysOffset: 5,
      sortOrder: 1
    },
    {
      id: "seed-agent-template-training",
      title: "Review transaction workflow basics",
      description: "Walk through tasks, documents, approvals, and finance checkpoints before going live.",
      category: "Training",
      dueDaysOffset: 7,
      sortOrder: 2
    }
  ];

  for (const template of seededAgentOnboardingTemplates) {
    await prisma.agentOnboardingTemplateItem.upsert({
      where: { id: template.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        title: template.title,
        description: template.description,
        category: template.category,
        dueDaysOffset: template.dueDaysOffset,
        sortOrder: template.sortOrder,
        isActive: true
      },
      create: {
        id: template.id,
        organizationId: organization.id,
        officeId: office.id,
        title: template.title,
        description: template.description,
        category: template.category,
        dueDaysOffset: template.dueDaysOffset,
        sortOrder: template.sortOrder,
        isActive: true
      }
    });
  }

  const janeMembership = membershipByEmail.get("jane@acre.com") ?? null;
  const seededAgentOnboardingItems = janeMembership
    ? [
        {
          id: "seed-agent-onboarding-license",
          membershipId: janeMembership.id,
          templateItemId: "seed-agent-template-license",
          title: "Upload license and state ID",
          description: "Provide the current NY license and state ID for compliance review.",
          category: "Compliance",
          dueAt: new Date("2026-03-18T00:00:00.000Z"),
          status: "completed",
          sortOrder: 0,
          completedAt: new Date("2026-03-07T15:00:00.000Z"),
          completedByMembershipId: membershipByEmail.get("naomi@acre.com")?.id ?? null
        },
        {
          id: "seed-agent-onboarding-packet",
          membershipId: janeMembership.id,
          templateItemId: "seed-agent-template-packet",
          title: "Complete brokerage onboarding packet",
          description: "Review commission setup, office policies, and required agreements.",
          category: "Operations",
          dueAt: new Date("2026-03-20T00:00:00.000Z"),
          status: "in_progress",
          sortOrder: 1,
          completedAt: null,
          completedByMembershipId: null
        },
        {
          id: "seed-agent-onboarding-training",
          membershipId: janeMembership.id,
          templateItemId: "seed-agent-template-training",
          title: "Review transaction workflow basics",
          description: "Walk through tasks, documents, approvals, and finance checkpoints before going live.",
          category: "Training",
          dueAt: new Date("2026-03-24T00:00:00.000Z"),
          status: "pending",
          sortOrder: 2,
          completedAt: null,
          completedByMembershipId: null
        }
      ]
    : [];

  for (const item of seededAgentOnboardingItems) {
    await prisma.agentOnboardingItem.upsert({
      where: { id: item.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        membershipId: item.membershipId,
        templateItemId: item.templateItemId,
        title: item.title,
        description: item.description,
        category: item.category,
        dueAt: item.dueAt,
        status: item.status,
        sortOrder: item.sortOrder,
        completedAt: item.completedAt,
        completedByMembershipId: item.completedByMembershipId
      },
      create: {
        id: item.id,
        organizationId: organization.id,
        officeId: office.id,
        membershipId: item.membershipId,
        templateItemId: item.templateItemId,
        title: item.title,
        description: item.description,
        category: item.category,
        dueAt: item.dueAt,
        status: item.status,
        sortOrder: item.sortOrder,
        completedAt: item.completedAt,
        completedByMembershipId: item.completedByMembershipId
      }
    });
  }

  const seededAgentGoals = [
    {
      id: "seed-agent-goal-jane-annual",
      membershipEmail: "jane@acre.com",
      periodType: "annual",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-12-31T23:59:59.000Z"),
      targetTransactionCount: 8,
      targetClosedVolume: "6000000",
      targetOfficeNet: "90000",
      targetAgentNet: "55000",
      notes: "Focus on buyer-side production and clean task compliance."
    },
    {
      id: "seed-agent-goal-simon-quarterly",
      membershipEmail: "simon@acre.com",
      periodType: "quarterly",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-03-31T23:59:59.000Z"),
      targetTransactionCount: 4,
      targetClosedVolume: "3000000",
      targetOfficeNet: "45000",
      targetAgentNet: "20000",
      notes: "Balance office operations leadership with direct production."
    }
  ];

  for (const goal of seededAgentGoals) {
    const membership = membershipByEmail.get(goal.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.agentGoal.upsert({
      where: { id: goal.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        periodType: goal.periodType,
        startsAt: goal.startsAt,
        endsAt: goal.endsAt,
        targetTransactionCount: goal.targetTransactionCount,
        targetClosedVolume: goal.targetClosedVolume,
        targetOfficeNet: goal.targetOfficeNet,
        targetAgentNet: goal.targetAgentNet,
        notes: goal.notes
      },
      create: {
        id: goal.id,
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        periodType: goal.periodType,
        startsAt: goal.startsAt,
        endsAt: goal.endsAt,
        targetTransactionCount: goal.targetTransactionCount,
        targetClosedVolume: goal.targetClosedVolume,
        targetOfficeNet: goal.targetOfficeNet,
        targetAgentNet: goal.targetAgentNet,
        notes: goal.notes
      }
    });
  }

  const seededTransactions = [
    {
      id: "seed-tx-600-frank",
      ownerEmail: "simon@acre.com",
      type: "sales",
      status: "active",
      representing: "buyer",
      title: "600 Frank E Rodgers Blvd S",
      address: "600 Frank E Rodgers Blvd S",
      city: "Harrison",
      state: "NJ",
      zipCode: "07029",
      price: "2470",
      importantDate: null,
      grossCommission: "2470",
      referralFee: "0",
      officeNet: "1800",
      agentNet: "670",
      financeNotes: "Seeded lease-side commission snapshot."
    },
    {
      id: "seed-tx-70-christopher",
      ownerEmail: "naomi@acre.com",
      type: "sales",
      status: "active",
      representing: "buyer",
      title: "70 Christopher Columbus Dr",
      address: "70 Christopher Columbus Dr",
      city: "Jersey City",
      state: "NJ",
      zipCode: "07302",
      price: "3585",
      importantDate: null,
      closingDate: new Date("2026-03-13T00:00:00.000Z"),
      grossCommission: "3585",
      referralFee: "0",
      officeNet: "2500",
      agentNet: "1085",
      financeNotes: "Seeded rental commission snapshot."
    },
    {
      id: "seed-tx-3820-parson",
      ownerEmail: "naomi@acre.com",
      type: "sales_listing",
      status: "active",
      representing: "seller",
      title: "3820 Parson Blvd",
      address: "3820 Parson Blvd",
      city: "Flushing",
      state: "NY",
      zipCode: "11354",
      price: "625000",
      importantDate: new Date("2026-12-26T00:00:00.000Z"),
      grossCommission: "18750",
      referralFee: "2500",
      officeNet: "10000",
      agentNet: "6250",
      financeNotes: "Referral split pending final settlement."
    },
    {
      id: "seed-tx-graham-court",
      ownerEmail: "jane@acre.com",
      type: "sales",
      status: "opportunity",
      representing: "buyer",
      title: "Graham Court 4F",
      address: "Graham Court 4F",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11206",
      price: "925000",
      importantDate: null,
      grossCommission: null,
      referralFee: null,
      officeNet: null,
      agentNet: null,
      financeNotes: null
    },
    {
      id: "seed-tx-45-10-court-square",
      ownerEmail: "simon@acre.com",
      type: "commercial_sales",
      status: "pending",
      representing: "seller",
      title: "45-10 Court Square W",
      address: "45-10 Court Square W",
      city: "Long Island City",
      state: "NY",
      zipCode: "11101",
      price: "0",
      importantDate: new Date("2026-04-15T00:00:00.000Z"),
      companyReferral: true,
      companyReferralEmployeeName: "Acre小助手",
      grossCommission: "32000",
      referralFee: "3200",
      officeNet: "18000",
      agentNet: "10800",
      financeNotes: "Company referral 10% applied in seed data."
    }
  ];

  for (const transaction of seededTransactions) {
    const ownerMembership = membershipByEmail.get(transaction.ownerEmail) ?? null;

    await prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        ownerMembershipId: ownerMembership?.id ?? null,
        type: transaction.type,
        status: transaction.status,
        representing: transaction.representing,
        title: transaction.title,
        address: transaction.address,
        city: transaction.city,
        state: transaction.state,
        zipCode: transaction.zipCode,
        price: transaction.price,
        importantDate: transaction.importantDate,
        closingDate: transaction.closingDate ?? null,
        grossCommission: transaction.grossCommission,
        referralFee: transaction.referralFee,
        officeNet: transaction.officeNet,
        agentNet: transaction.agentNet,
        financeNotes: transaction.financeNotes ?? null,
        companyReferral: transaction.companyReferral ?? false,
        companyReferralEmployeeName: transaction.companyReferralEmployeeName ?? null,
        additionalFields: { seeded: true }
      },
      create: {
        id: transaction.id,
        organizationId: organization.id,
        officeId: office.id,
        ownerMembershipId: ownerMembership?.id ?? null,
        type: transaction.type,
        status: transaction.status,
        representing: transaction.representing,
        title: transaction.title,
        address: transaction.address,
        city: transaction.city,
        state: transaction.state,
        zipCode: transaction.zipCode,
        price: transaction.price,
        importantDate: transaction.importantDate,
        closingDate: transaction.closingDate ?? null,
        grossCommission: transaction.grossCommission,
        referralFee: transaction.referralFee,
        officeNet: transaction.officeNet,
        agentNet: transaction.agentNet,
        financeNotes: transaction.financeNotes ?? null,
        companyReferral: transaction.companyReferral ?? false,
        companyReferralEmployeeName: transaction.companyReferralEmployeeName ?? null,
        additionalFields: { seeded: true }
      }
    });
  }

  const seededClients = [
    {
      id: "seed-client-evelyn",
      ownerEmail: "jane@acre.com",
      fullName: "Evelyn Zhao",
      email: "evelyn@example.com",
      phone: "917-555-0110",
      contactType: "Buyer",
      source: "WeChat OCR import",
      stage: "Warm",
      intent: "Investor",
      budgetMin: "850000",
      budgetMax: "1050000",
      preferredAreas: ["Long Island City", "Astoria"],
      notes: "Interested in LIC investor inventory.",
      lastContactAt: new Date("2026-03-06T15:00:00.000Z"),
      nextFollowUpAt: new Date("2026-03-10T22:00:00.000Z")
    },
    {
      id: "seed-client-daniel",
      ownerEmail: "simon@acre.com",
      fullName: "Daniel Morgan",
      email: "daniel@example.com",
      phone: "646-555-0144",
      contactType: "Buyer",
      source: "Website inquiry",
      stage: "Tour booked",
      intent: "End-user",
      budgetMin: "1200000",
      budgetMax: "1500000",
      preferredAreas: ["Brooklyn Heights", "Downtown Brooklyn"],
      notes: "Saturday tour booked for Downtown Brooklyn.",
      lastContactAt: new Date("2026-03-08T18:30:00.000Z"),
      nextFollowUpAt: new Date("2026-03-15T14:00:00.000Z")
    },
    {
      id: "seed-client-iris",
      ownerEmail: "naomi@acre.com",
      fullName: "Iris Chen",
      email: "iris@example.com",
      phone: "718-555-0138",
      contactType: "Tenant",
      source: "Agent manual entry",
      stage: "Nurture",
      intent: "Rental",
      budgetMin: "4800",
      budgetMax: "4800",
      preferredAreas: ["Midtown", "Long Island City"],
      notes: "Wants a spring rental move-in.",
      lastContactAt: new Date("2026-03-03T16:00:00.000Z"),
      nextFollowUpAt: new Date("2026-03-12T15:00:00.000Z")
    }
  ];

  const clientById = new Map();

  for (const client of seededClients) {
    const ownerMembership = membershipByEmail.get(client.ownerEmail) ?? null;

    const savedClient = await prisma.client.upsert({
      where: { id: client.id },
      update: {
        organizationId: organization.id,
        ownerMembershipId: ownerMembership?.id ?? null,
        fullName: client.fullName,
        email: client.email,
        phone: client.phone,
        contactType: client.contactType,
        source: client.source,
        stage: client.stage,
        intent: client.intent,
        budgetMin: client.budgetMin,
        budgetMax: client.budgetMax,
        preferredAreas: client.preferredAreas,
        notes: client.notes,
        lastContactAt: client.lastContactAt,
        nextFollowUpAt: client.nextFollowUpAt
      },
      create: {
        id: client.id,
        organizationId: organization.id,
        ownerMembershipId: ownerMembership?.id ?? null,
        fullName: client.fullName,
        email: client.email,
        phone: client.phone,
        contactType: client.contactType,
        source: client.source,
        stage: client.stage,
        intent: client.intent,
        budgetMin: client.budgetMin,
        budgetMax: client.budgetMax,
        preferredAreas: client.preferredAreas,
        notes: client.notes,
        lastContactAt: client.lastContactAt,
        nextFollowUpAt: client.nextFollowUpAt
      }
    });

    clientById.set(client.id, savedClient);
  }

  const seededTasks = [
    {
      id: "seed-task-evelyn",
      clientId: "seed-client-evelyn",
      assigneeEmail: "jane@acre.com",
      title: "Follow up on LIC investor inventory",
      status: "queued",
      dueAt: new Date("2026-03-09T22:00:00.000Z")
    },
    {
      id: "seed-task-daniel",
      clientId: "seed-client-daniel",
      assigneeEmail: "simon@acre.com",
      title: "Confirm Saturday tour logistics",
      status: "in_progress",
      dueAt: new Date("2026-03-12T16:00:00.000Z")
    }
  ];

  for (const task of seededTasks) {
    const assigneeMembership = membershipByEmail.get(task.assigneeEmail) ?? null;
    const client = clientById.get(task.clientId) ?? null;

    await prisma.followUpTask.upsert({
      where: { id: task.id },
      update: {
        organizationId: organization.id,
        clientId: client?.id ?? null,
        assigneeMemberId: assigneeMembership?.id ?? null,
        title: task.title,
        status: task.status,
        dueAt: task.dueAt,
        metadata: null
      },
      create: {
        id: task.id,
        organizationId: organization.id,
        clientId: client?.id ?? null,
        assigneeMemberId: assigneeMembership?.id ?? null,
        title: task.title,
        status: task.status,
        dueAt: task.dueAt,
        metadata: null
      }
    });
  }

  const seededEvents = [
    {
      id: "seed-event-weekly-meeting",
      createdByEmail: "simon@acre.com",
      title: "Acre Weekly Meeting",
      description: "Weekly office ops sync covering pending transactions and marketing priorities.",
      visibility: "office_only",
      startsAt: new Date("2026-03-12T15:00:00.000Z"),
      endsAt: new Date("2026-03-12T15:30:00.000Z"),
      location: "Zoom",
      meetingUrl: "https://us06web.zoom.us/j/88901672776",
      officeScoped: true
    },
    {
      id: "seed-event-contract-workshop",
      createdByEmail: "naomi@acre.com",
      title: "Contract review workshop",
      description: "Walk through current pending deals and contract pain points with the office team.",
      visibility: "all_agents",
      startsAt: new Date("2026-03-14T18:00:00.000Z"),
      endsAt: new Date("2026-03-14T19:00:00.000Z"),
      location: "45-10 Court Square W, LIC",
      meetingUrl: null,
      officeScoped: false
    }
  ];

  for (const event of seededEvents) {
    const createdByMembership = membershipByEmail.get(event.createdByEmail) ?? null;

    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        organizationId: organization.id,
        officeId: event.officeScoped ? office.id : null,
        createdByMemberId: createdByMembership?.id ?? null,
        title: event.title,
        description: event.description,
        visibility: event.visibility,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        meetingUrl: event.meetingUrl
      },
      create: {
        id: event.id,
        organizationId: organization.id,
        officeId: event.officeScoped ? office.id : null,
        createdByMemberId: createdByMembership?.id ?? null,
        title: event.title,
        description: event.description,
        visibility: event.visibility,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        meetingUrl: event.meetingUrl
      }
    });
  }

  const seededEventRsvps = [
    {
      eventId: "seed-event-weekly-meeting",
      membershipEmail: "jane@acre.com",
      status: "going"
    },
    {
      eventId: "seed-event-weekly-meeting",
      membershipEmail: "naomi@acre.com",
      status: "going"
    },
    {
      eventId: "seed-event-contract-workshop",
      membershipEmail: "simon@acre.com",
      status: "maybe"
    }
  ];

  for (const rsvp of seededEventRsvps) {
    const membership = membershipByEmail.get(rsvp.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.eventRsvp.upsert({
      where: {
        eventId_membershipId: {
          eventId: rsvp.eventId,
          membershipId: membership.id
        }
      },
      update: {
        status: rsvp.status
      },
      create: {
        eventId: rsvp.eventId,
        membershipId: membership.id,
        status: rsvp.status
      }
    });
  }

  const seededNotifications = [
    {
      id: "seed-notification-followup-evelyn",
      membershipEmail: "jane@acre.com",
      followUpTaskId: "seed-task-evelyn",
      eventId: null,
      type: "follow_up",
      title: "Follow up due for Evelyn Zhao",
      body: "LIC investor follow-up is due today. Review the contact note before calling.",
      actionUrl: "/office/contacts/seed-client-evelyn",
      readAt: null
    },
    {
      id: "seed-notification-weekly-meeting",
      membershipEmail: null,
      followUpTaskId: null,
      eventId: "seed-event-weekly-meeting",
      type: "event",
      title: "Weekly office meeting this Thursday",
      body: "Acre Weekly Meeting starts at 10:00 AM. Review pending transaction blockers before joining.",
      actionUrl: "/office/activity",
      readAt: null
    },
    {
      id: "seed-notification-contract-workshop",
      membershipEmail: "simon@acre.com",
      followUpTaskId: null,
      eventId: "seed-event-contract-workshop",
      type: "system",
      title: "Contract review workshop reminder",
      body: "Bring open pending deals and current finance questions to the workshop.",
      actionUrl: "/office/reports",
      readAt: new Date("2026-03-09T18:00:00.000Z")
    }
  ];

  for (const notification of seededNotifications) {
    const membership = notification.membershipEmail ? membershipByEmail.get(notification.membershipEmail) ?? null : null;

    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        organizationId: organization.id,
        membershipId: membership?.id ?? null,
        followUpTaskId: notification.followUpTaskId,
        eventId: notification.eventId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        readAt: notification.readAt
      },
      create: {
        id: notification.id,
        organizationId: organization.id,
        membershipId: membership?.id ?? null,
        followUpTaskId: notification.followUpTaskId,
        eventId: notification.eventId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        readAt: notification.readAt
      }
    });
  }

  await prisma.transaction.update({
    where: { id: "seed-tx-graham-court" },
    data: {
      primaryClientId: "seed-client-evelyn"
    }
  });

  await prisma.transactionContact.updateMany({
    where: {
      transactionId: "seed-tx-graham-court",
      NOT: {
        clientId: "seed-client-evelyn"
      }
    },
    data: {
      isPrimary: false
    }
  });

  await prisma.transaction.update({
    where: { id: "seed-tx-45-10-court-square" },
    data: {
      primaryClientId: "seed-client-daniel"
    }
  });

  await prisma.transactionContact.updateMany({
    where: {
      transactionId: "seed-tx-45-10-court-square",
      NOT: {
        clientId: "seed-client-daniel"
      }
    },
    data: {
      isPrimary: false
    }
  });

  await prisma.transactionContact.upsert({
    where: {
      transactionId_clientId: {
        transactionId: "seed-tx-graham-court",
        clientId: "seed-client-evelyn"
      }
    },
    update: {
      organizationId: organization.id,
      role: "buyer",
      isPrimary: true,
      notes: "Seeded primary client link"
    },
    create: {
      id: "seed-transaction-contact-evelyn",
      organizationId: organization.id,
      transactionId: "seed-tx-graham-court",
      clientId: "seed-client-evelyn",
      role: "buyer",
      isPrimary: true,
      notes: "Seeded primary client link"
    }
  });

  await prisma.transactionContact.upsert({
    where: {
      transactionId_clientId: {
        transactionId: "seed-tx-45-10-court-square",
        clientId: "seed-client-daniel"
      }
    },
    update: {
      organizationId: organization.id,
      role: "tenant",
      isPrimary: true,
      notes: "Seeded primary client link"
    },
    create: {
      id: "seed-transaction-contact-daniel",
      organizationId: organization.id,
      transactionId: "seed-tx-45-10-court-square",
      clientId: "seed-client-daniel",
      role: "tenant",
      isPrimary: true,
      notes: "Seeded primary client link"
    }
  });

  const seededTransactionTasks = [
    {
      id: "seed-transaction-task-graham-contract",
      transactionId: "seed-tx-graham-court",
      checklistGroup: "Contract",
      title: "Collect signed buyer agreement",
      description: "Confirm executed contract PDF is available from the buyer side.",
      assigneeEmail: "jane@acre.com",
      dueAt: new Date("2026-03-08T16:00:00.000Z"),
      status: "review_requested",
      requiresDocument: true,
      requiresDocumentApproval: true,
      requiresSecondaryApproval: false,
      reviewStatus: "review_requested",
      complianceStatus: "in_review",
      completedAt: null,
      completedByEmail: null,
      submittedForReviewAt: new Date("2026-03-07T15:30:00.000Z"),
      firstApprovedAt: null,
      firstApprovedByEmail: null,
      secondApprovedAt: null,
      secondApprovedByEmail: null,
      rejectedAt: null,
      rejectedByEmail: null,
      reopenedAt: null,
      sortOrder: 0
    },
    {
      id: "seed-transaction-task-graham-intro",
      transactionId: "seed-tx-graham-court",
      checklistGroup: "Client care",
      title: "Send attorney introduction",
      description: "Email the standard attorney introduction once offer terms are confirmed.",
      assigneeEmail: "jane@acre.com",
      dueAt: new Date("2026-03-16T15:00:00.000Z"),
      status: "in_progress",
      requiresDocument: false,
      requiresDocumentApproval: false,
      requiresSecondaryApproval: false,
      reviewStatus: "not_required",
      complianceStatus: "not_applicable",
      completedAt: null,
      completedByEmail: null,
      submittedForReviewAt: null,
      firstApprovedAt: null,
      firstApprovedByEmail: null,
      secondApprovedAt: null,
      secondApprovedByEmail: null,
      rejectedAt: null,
      rejectedByEmail: null,
      reopenedAt: null,
      sortOrder: 1
    },
    {
      id: "seed-transaction-task-court-square-invoice",
      transactionId: "seed-tx-45-10-court-square",
      checklistGroup: "Finance",
      title: "Upload vendor invoice package",
      description: "Prepare the pending invoice package for vendor review.",
      assigneeEmail: "simon@acre.com",
      dueAt: new Date("2026-03-18T17:00:00.000Z"),
      status: "completed",
      requiresDocument: true,
      requiresDocumentApproval: true,
      requiresSecondaryApproval: true,
      reviewStatus: "approved",
      complianceStatus: "approved",
      completedAt: new Date("2026-03-09T16:30:00.000Z"),
      completedByEmail: "simon@acre.com",
      submittedForReviewAt: new Date("2026-03-08T19:00:00.000Z"),
      firstApprovedAt: new Date("2026-03-09T13:00:00.000Z"),
      firstApprovedByEmail: "naomi@acre.com",
      secondApprovedAt: new Date("2026-03-09T16:00:00.000Z"),
      secondApprovedByEmail: "simon@acre.com",
      rejectedAt: null,
      rejectedByEmail: null,
      reopenedAt: null,
      sortOrder: 0
    }
  ];

  for (const task of seededTransactionTasks) {
    const assigneeMembership = membershipByEmail.get(task.assigneeEmail) ?? null;
    const completedByMembership = task.completedByEmail ? membershipByEmail.get(task.completedByEmail) ?? null : null;
    const firstApprovedByMembership = task.firstApprovedByEmail ? membershipByEmail.get(task.firstApprovedByEmail) ?? null : null;
    const secondApprovedByMembership = task.secondApprovedByEmail ? membershipByEmail.get(task.secondApprovedByEmail) ?? null : null;
    const rejectedByMembership = task.rejectedByEmail ? membershipByEmail.get(task.rejectedByEmail) ?? null : null;

    await prisma.transactionTask.upsert({
      where: { id: task.id },
      update: {
        organizationId: organization.id,
        transactionId: task.transactionId,
        checklistGroup: task.checklistGroup,
        title: task.title,
        description: task.description,
        assigneeMembershipId: assigneeMembership?.id ?? null,
        dueAt: task.dueAt,
        status: task.status,
        requiresDocument: task.requiresDocument,
        requiresDocumentApproval: task.requiresDocumentApproval,
        requiresSecondaryApproval: task.requiresSecondaryApproval,
        reviewStatus: task.reviewStatus,
        complianceStatus: task.complianceStatus,
        completedAt: task.completedAt,
        completedByMembershipId: completedByMembership?.id ?? null,
        submittedForReviewAt: task.submittedForReviewAt,
        firstApprovedAt: task.firstApprovedAt,
        firstApprovedByMembershipId: firstApprovedByMembership?.id ?? null,
        secondApprovedAt: task.secondApprovedAt,
        secondApprovedByMembershipId: secondApprovedByMembership?.id ?? null,
        rejectedAt: task.rejectedAt,
        rejectedByMembershipId: rejectedByMembership?.id ?? null,
        reopenedAt: task.reopenedAt,
        sortOrder: task.sortOrder
      },
      create: {
        id: task.id,
        organizationId: organization.id,
        transactionId: task.transactionId,
        checklistGroup: task.checklistGroup,
        title: task.title,
        description: task.description,
        assigneeMembershipId: assigneeMembership?.id ?? null,
        dueAt: task.dueAt,
        status: task.status,
        requiresDocument: task.requiresDocument,
        requiresDocumentApproval: task.requiresDocumentApproval,
        requiresSecondaryApproval: task.requiresSecondaryApproval,
        reviewStatus: task.reviewStatus,
        complianceStatus: task.complianceStatus,
        completedAt: task.completedAt,
        completedByMembershipId: completedByMembership?.id ?? null,
        submittedForReviewAt: task.submittedForReviewAt,
        firstApprovedAt: task.firstApprovedAt,
        firstApprovedByMembershipId: firstApprovedByMembership?.id ?? null,
        secondApprovedAt: task.secondApprovedAt,
        secondApprovedByMembershipId: secondApprovedByMembership?.id ?? null,
        rejectedAt: task.rejectedAt,
        rejectedByMembershipId: rejectedByMembership?.id ?? null,
        reopenedAt: task.reopenedAt,
        sortOrder: task.sortOrder
      }
    });
  }

  const seededFormTemplates = [
    {
      id: "seed-form-template-buyer-agreement",
      key: "buyer-agreement-packet",
      name: "Buyer agreement packet",
      description: "Basic buyer-side agreement packet merged from transaction and contact data.",
      documentType: "Buyer agreement",
      mergeFields: [
        "transaction_title",
        "transaction_address",
        "transaction_city",
        "transaction_state",
        "transaction_zip_code",
        "transaction_type",
        "transaction_status",
        "transaction_representing",
        "transaction_owner",
        "primary_contact_name",
        "primary_contact_email",
        "primary_contact_phone",
        "finance_gross_commission",
        "finance_office_net"
      ]
    },
    {
      id: "seed-form-template-emd-receipt",
      key: "emd-receipt",
      name: "Earnest money receipt",
      description: "Internal receipt used to document EMD expectations and receipt details.",
      documentType: "Earnest money receipt",
      mergeFields: [
        "transaction_title",
        "transaction_address",
        "transaction_status",
        "finance_office_net",
        "closing_date"
      ]
    }
  ];

  for (const template of seededFormTemplates) {
    await prisma.formTemplate.upsert({
      where: { key: template.key },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        name: template.name,
        description: template.description,
        documentType: template.documentType,
        mergeFields: template.mergeFields,
        isSystem: true,
        isActive: true
      },
      create: {
        id: template.id,
        organizationId: organization.id,
        officeId: office.id,
        key: template.key,
        name: template.name,
        description: template.description,
        documentType: template.documentType,
        mergeFields: template.mergeFields,
        isSystem: true,
        isActive: true
      }
    });
  }

  const storedSeedFiles = {
    grahamContractUpload: await writeSeedStoredDocument({
      organizationId: organization.id,
      transactionId: "seed-tx-graham-court",
      fileName: "graham-court-buyer-agreement-upload.txt",
      content: [
        "Graham Court 4F buyer agreement upload",
        "Uploaded by Jane Wu for contract review.",
        "Linked task: Collect signed buyer agreement."
      ].join("\n")
    }),
    grahamUnsortedEmail: await writeSeedStoredDocument({
      organizationId: organization.id,
      transactionId: "seed-tx-graham-court",
      fileName: "graham-court-unsorted-email-pdf.txt",
      content: [
        "Loose PDF from email import.",
        "This file is intentionally unsorted so the transaction workflow has something to classify."
      ].join("\n")
    }),
    grahamGeneratedPacket: await writeSeedStoredDocument({
      organizationId: organization.id,
      transactionId: "seed-tx-graham-court",
      fileName: "graham-court-buyer-packet.json",
      content: {
        template: "Buyer agreement packet",
        transaction: "Graham Court 4F",
        primaryContact: "Evelyn Zhao",
        owner: "Jane Wu"
      }
    }),
    courtSquareInvoicePackage: await writeSeedStoredDocument({
      organizationId: organization.id,
      transactionId: "seed-tx-45-10-court-square",
      fileName: "court-square-vendor-invoice-package.txt",
      content: [
        "Vendor invoice package",
        "Prepared for secondary approval in the finance checklist."
      ].join("\n")
    })
  };

  const seededTransactionDocuments = [
    {
      id: "seed-doc-graham-contract-upload",
      transactionId: "seed-tx-graham-court",
      uploadedByEmail: "jane@acre.com",
      linkedTaskId: "seed-transaction-task-graham-contract",
      title: "Buyer agreement upload",
      fileName: storedSeedFiles.grahamContractUpload.fileName,
      mimeType: "text/plain",
      fileSizeBytes: storedSeedFiles.grahamContractUpload.fileSizeBytes,
      storageKey: storedSeedFiles.grahamContractUpload.storageKey,
      documentType: "Buyer agreement",
      status: "submitted",
      source: "manual_upload",
      isRequired: true,
      isSigned: false,
      isUnsorted: false,
      signedAt: null
    },
    {
      id: "seed-doc-graham-unsorted-email",
      transactionId: "seed-tx-graham-court",
      uploadedByEmail: "jane@acre.com",
      linkedTaskId: null,
      title: "Loose email PDF",
      fileName: storedSeedFiles.grahamUnsortedEmail.fileName,
      mimeType: "text/plain",
      fileSizeBytes: storedSeedFiles.grahamUnsortedEmail.fileSizeBytes,
      storageKey: storedSeedFiles.grahamUnsortedEmail.storageKey,
      documentType: "Email PDF",
      status: "uploaded",
      source: "email_pdf",
      isRequired: false,
      isSigned: false,
      isUnsorted: true,
      signedAt: null
    },
    {
      id: "seed-doc-graham-generated-packet",
      transactionId: "seed-tx-graham-court",
      uploadedByEmail: "jane@acre.com",
      linkedTaskId: "seed-transaction-task-graham-contract",
      title: "Buyer agreement packet document",
      fileName: storedSeedFiles.grahamGeneratedPacket.fileName,
      mimeType: "application/json",
      fileSizeBytes: storedSeedFiles.grahamGeneratedPacket.fileSizeBytes,
      storageKey: storedSeedFiles.grahamGeneratedPacket.storageKey,
      documentType: "Buyer agreement",
      status: "signed",
      source: "generated_form",
      isRequired: true,
      isSigned: true,
      isUnsorted: false,
      signedAt: new Date("2026-03-10T18:00:00.000Z")
    },
    {
      id: "seed-doc-court-square-invoice-package",
      transactionId: "seed-tx-45-10-court-square",
      uploadedByEmail: "simon@acre.com",
      linkedTaskId: "seed-transaction-task-court-square-invoice",
      title: "Vendor invoice support package",
      fileName: storedSeedFiles.courtSquareInvoicePackage.fileName,
      mimeType: "text/plain",
      fileSizeBytes: storedSeedFiles.courtSquareInvoicePackage.fileSizeBytes,
      storageKey: storedSeedFiles.courtSquareInvoicePackage.storageKey,
      documentType: "Vendor invoice",
      status: "approved",
      source: "manual_upload",
      isRequired: true,
      isSigned: false,
      isUnsorted: false,
      signedAt: null
    }
  ];

  for (const document of seededTransactionDocuments) {
    const uploadedByMembership = document.uploadedByEmail ? membershipByEmail.get(document.uploadedByEmail) ?? null : null;

    await prisma.transactionDocument.upsert({
      where: { id: document.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        transactionId: document.transactionId,
        uploadedByMembershipId: uploadedByMembership?.id ?? null,
        linkedTaskId: document.linkedTaskId,
        title: document.title,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSizeBytes: document.fileSizeBytes,
        storageKey: document.storageKey,
        storageUrl: null,
        documentType: document.documentType,
        status: document.status,
        source: document.source,
        isRequired: document.isRequired,
        isSigned: document.isSigned,
        isUnsorted: document.isUnsorted,
        signedAt: document.signedAt
      },
      create: {
        id: document.id,
        organizationId: organization.id,
        officeId: office.id,
        transactionId: document.transactionId,
        uploadedByMembershipId: uploadedByMembership?.id ?? null,
        linkedTaskId: document.linkedTaskId,
        title: document.title,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSizeBytes: document.fileSizeBytes,
        storageKey: document.storageKey,
        storageUrl: null,
        documentType: document.documentType,
        status: document.status,
        source: document.source,
        isRequired: document.isRequired,
        isSigned: document.isSigned,
        isUnsorted: document.isUnsorted,
        signedAt: document.signedAt
      }
    });
  }

  const seededTransactionForms = [
    {
      id: "seed-form-graham-buyer-agreement",
      transactionId: "seed-tx-graham-court",
      templateKey: "buyer-agreement-packet",
      linkedTaskId: "seed-transaction-task-graham-contract",
      documentId: "seed-doc-graham-generated-packet",
      name: "Graham Court buyer agreement packet",
      status: "fully_signed",
      createdByEmail: "jane@acre.com",
      generatedPayload: {
        transaction_title: "Graham Court 4F",
        transaction_address: "Graham Court 4F",
        transaction_city: "Brooklyn",
        transaction_state: "NY",
        transaction_zip_code: "11206",
        transaction_type: "Sales",
        transaction_status: "Opportunity",
        transaction_representing: "Buyer",
        transaction_owner: "Jane Wu",
        primary_contact_name: "Evelyn Zhao",
        primary_contact_email: "evelyn@example.com",
        finance_gross_commission: "",
        finance_office_net: ""
      }
    },
    {
      id: "seed-form-court-square-emd-receipt",
      transactionId: "seed-tx-45-10-court-square",
      templateKey: "emd-receipt",
      linkedTaskId: null,
      documentId: null,
      name: "Court Square earnest money receipt",
      status: "prepared",
      createdByEmail: "simon@acre.com",
      generatedPayload: {
        transaction_title: "45-10 Court Square W",
        transaction_address: "45-10 Court Square W",
        transaction_status: "Pending",
        finance_office_net: "18000",
        closing_date: ""
      }
    }
  ];

  for (const form of seededTransactionForms) {
    const createdByMembership = membershipByEmail.get(form.createdByEmail) ?? null;
    const template = seededFormTemplates.find((template) => template.key === form.templateKey);

    await prisma.transactionForm.upsert({
      where: { id: form.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        transactionId: form.transactionId,
        templateId: template?.id ?? null,
        linkedTaskId: form.linkedTaskId,
        documentId: form.documentId,
        name: form.name,
        status: form.status,
        generatedPayload: form.generatedPayload,
        createdByMembershipId: createdByMembership?.id ?? membershipByEmail.get("naomi@acre.com")?.id
      },
      create: {
        id: form.id,
        organizationId: organization.id,
        officeId: office.id,
        transactionId: form.transactionId,
        templateId: template?.id ?? null,
        linkedTaskId: form.linkedTaskId,
        documentId: form.documentId,
        name: form.name,
        status: form.status,
        generatedPayload: form.generatedPayload,
        createdByMembershipId: createdByMembership?.id ?? membershipByEmail.get("naomi@acre.com")?.id
      }
    });
  }

  const seededSignatureRequests = [
    {
      id: "seed-signature-graham-buyer",
      transactionId: "seed-tx-graham-court",
      formId: "seed-form-graham-buyer-agreement",
      documentId: "seed-doc-graham-generated-packet",
      requestedByEmail: "jane@acre.com",
      recipientName: "Evelyn Zhao",
      recipientEmail: "evelyn@example.com",
      recipientRole: "Buyer",
      signingOrder: 1,
      status: "signed",
      sentAt: new Date("2026-03-10T15:00:00.000Z"),
      viewedAt: new Date("2026-03-10T16:00:00.000Z"),
      completedAt: new Date("2026-03-10T18:00:00.000Z"),
      declinedAt: null
    },
    {
      id: "seed-signature-court-square-manager",
      transactionId: "seed-tx-45-10-court-square",
      formId: "seed-form-court-square-emd-receipt",
      documentId: null,
      requestedByEmail: "simon@acre.com",
      recipientName: "Office manager review",
      recipientEmail: "simon@acre.com",
      recipientRole: "Office manager",
      signingOrder: 1,
      status: "sent",
      sentAt: new Date("2026-03-11T14:00:00.000Z"),
      viewedAt: null,
      completedAt: null,
      declinedAt: null
    }
  ];

  for (const request of seededSignatureRequests) {
    const requestedByMembership = membershipByEmail.get(request.requestedByEmail) ?? null;

    await prisma.signatureRequest.upsert({
      where: { id: request.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        transactionId: request.transactionId,
        formId: request.formId,
        documentId: request.documentId,
        requestedByMembershipId: requestedByMembership?.id ?? membershipByEmail.get("naomi@acre.com")?.id,
        recipientName: request.recipientName,
        recipientEmail: request.recipientEmail,
        recipientRole: request.recipientRole,
        signingOrder: request.signingOrder,
        status: request.status,
        sentAt: request.sentAt,
        viewedAt: request.viewedAt,
        completedAt: request.completedAt,
        declinedAt: request.declinedAt
      },
      create: {
        id: request.id,
        organizationId: organization.id,
        officeId: office.id,
        transactionId: request.transactionId,
        formId: request.formId,
        documentId: request.documentId,
        requestedByMembershipId: requestedByMembership?.id ?? membershipByEmail.get("naomi@acre.com")?.id,
        recipientName: request.recipientName,
        recipientEmail: request.recipientEmail,
        recipientRole: request.recipientRole,
        signingOrder: request.signingOrder,
        status: request.status,
        sentAt: request.sentAt,
        viewedAt: request.viewedAt,
        completedAt: request.completedAt,
        declinedAt: request.declinedAt
      }
    });
  }

  const seededIncomingUpdates = [
    {
      id: "seed-incoming-graham-closing-review",
      transactionId: "seed-tx-graham-court",
      sourceSystem: "Manual test feed",
      sourceReference: "graham-closing-review-001",
      status: "pending_review",
      summary: "Closing date revision requires review",
      payload: {
        closingDate: "2026-03-28",
        importantDate: "2026-03-22",
        status: "pending"
      },
      reviewedAt: null,
      reviewedByEmail: null,
      acceptedAt: null,
      rejectedAt: null
    },
    {
      id: "seed-incoming-graham-price-rejected",
      transactionId: "seed-tx-graham-court",
      sourceSystem: "Manual test feed",
      sourceReference: "graham-price-rejected-001",
      status: "rejected",
      summary: "Unsupported outside price revision was rejected",
      payload: {
        price: "950000",
        summary: "Price update from external intake"
      },
      reviewedAt: new Date("2026-03-10T13:15:00.000Z"),
      reviewedByEmail: "simon@acre.com",
      acceptedAt: null,
      rejectedAt: new Date("2026-03-10T13:15:00.000Z")
    }
  ];

  for (const incomingUpdate of seededIncomingUpdates) {
    const reviewedByMembership = incomingUpdate.reviewedByEmail
      ? membershipByEmail.get(incomingUpdate.reviewedByEmail) ?? null
      : null;

    await prisma.incomingUpdate.upsert({
      where: {
        organizationId_sourceSystem_sourceReference: {
          organizationId: organization.id,
          sourceSystem: incomingUpdate.sourceSystem,
          sourceReference: incomingUpdate.sourceReference
        }
      },
      update: {
        officeId: office.id,
        transactionId: incomingUpdate.transactionId,
        status: incomingUpdate.status,
        summary: incomingUpdate.summary,
        payload: incomingUpdate.payload,
        receivedAt: new Date("2026-03-10T12:00:00.000Z"),
        reviewedAt: incomingUpdate.reviewedAt,
        reviewedByMembershipId: reviewedByMembership?.id ?? null,
        acceptedAt: incomingUpdate.acceptedAt,
        rejectedAt: incomingUpdate.rejectedAt
      },
      create: {
        id: incomingUpdate.id,
        organizationId: organization.id,
        officeId: office.id,
        transactionId: incomingUpdate.transactionId,
        sourceSystem: incomingUpdate.sourceSystem,
        sourceReference: incomingUpdate.sourceReference,
        status: incomingUpdate.status,
        summary: incomingUpdate.summary,
        payload: incomingUpdate.payload,
        receivedAt: new Date("2026-03-10T12:00:00.000Z"),
        reviewedAt: incomingUpdate.reviewedAt,
        reviewedByMembershipId: reviewedByMembership?.id ?? null,
        acceptedAt: incomingUpdate.acceptedAt,
        rejectedAt: incomingUpdate.rejectedAt
      }
    });
  }

  const seededLedgerAccounts = [
    { code: "1000", name: "Operating Bank", accountType: "asset" },
    { code: "1010", name: "Earnest Money Holding Bank", accountType: "asset" },
    { code: "1100", name: "Accounts Receivable", accountType: "asset" },
    { code: "2000", name: "Accounts Payable", accountType: "liability" },
    { code: "2100", name: "Earnest Money Liability", accountType: "liability" },
    { code: "4000", name: "Commission Income", accountType: "income" },
    { code: "4010", name: "Agent Billing Income", accountType: "income" },
    { code: "4050", name: "Refund / Contra Revenue", accountType: "contra_income" },
    { code: "5000", name: "Agent Commission Expense", accountType: "expense" },
    { code: "5100", name: "Referral Expense", accountType: "expense" }
  ];

  const ledgerAccountByCode = new Map();

  for (const account of seededLedgerAccounts) {
    const savedAccount = await upsertLedgerAccount({
      organizationId: organization.id,
      officeId: office.id,
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      isSystem: true,
      isActive: true
    });

    ledgerAccountByCode.set(account.code, savedAccount);
  }

  const seededAccountingTransactions = [
    {
      id: "seed-acct-invoice-parson",
      relatedTransactionId: "seed-tx-3820-parson",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "invoice",
      status: "open",
      accountingDate: new Date("2026-03-01T00:00:00.000Z"),
      dueDate: new Date("2026-03-10T00:00:00.000Z"),
      paymentMethod: null,
      referenceNumber: "INV-3820-01",
      counterpartyName: "Queenie Cao",
      memo: "Listing commission invoice",
      notes: "Seeded listing-side invoice.",
      totalAmount: "18750",
      lineItems: [
        {
          id: "seed-acct-li-invoice-parson",
          ledgerAccountCode: "4000",
          description: "Listing commission income",
          entrySide: "credit",
          amount: "18750"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-invoice-parson-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-01T00:00:00.000Z"),
          debitAmount: "18750",
          creditAmount: "0",
          memo: "Invoice INV-3820-01"
        },
        {
          id: "seed-gl-invoice-parson-income",
          accountCode: "4000",
          entryDate: new Date("2026-03-01T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "18750",
          memo: "Invoice INV-3820-01"
        }
      ]
    },
    {
      id: "seed-acct-payment-parson",
      relatedTransactionId: "seed-tx-3820-parson",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "received_payment",
      status: "completed",
      accountingDate: new Date("2026-03-05T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "wire",
      referenceNumber: "PAY-3820-01",
      counterpartyName: "Title Company",
      memo: "Wire received for listing commission",
      notes: "Seeded received payment.",
      totalAmount: "18750",
      lineItems: [],
      ledgerEntries: [
        {
          id: "seed-gl-payment-parson-bank",
          accountCode: "1000",
          entryDate: new Date("2026-03-05T00:00:00.000Z"),
          debitAmount: "18750",
          creditAmount: "0",
          memo: "Received payment PAY-3820-01"
        },
        {
          id: "seed-gl-payment-parson-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-05T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "18750",
          memo: "Received payment PAY-3820-01"
        }
      ]
    },
    {
      id: "seed-acct-bill-referral",
      relatedTransactionId: "seed-tx-3820-parson",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "bill",
      status: "open",
      accountingDate: new Date("2026-03-04T00:00:00.000Z"),
      dueDate: new Date("2026-03-12T00:00:00.000Z"),
      paymentMethod: null,
      referenceNumber: "BILL-3820-REF",
      counterpartyName: "Acre Referral Desk",
      memo: "Referral fee payable",
      notes: "Seeded referral expense bill.",
      totalAmount: "2500",
      lineItems: [
        {
          id: "seed-acct-li-bill-referral",
          ledgerAccountCode: "5100",
          description: "Referral expense",
          entrySide: "debit",
          amount: "2500"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-bill-referral-expense",
          accountCode: "5100",
          entryDate: new Date("2026-03-04T00:00:00.000Z"),
          debitAmount: "2500",
          creditAmount: "0",
          memo: "Bill BILL-3820-REF"
        },
        {
          id: "seed-gl-bill-referral-ap",
          accountCode: "2000",
          entryDate: new Date("2026-03-04T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "2500",
          memo: "Bill BILL-3820-REF"
        }
      ]
    },
    {
      id: "seed-acct-payment-referral",
      relatedTransactionId: "seed-tx-3820-parson",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "made_payment",
      status: "completed",
      accountingDate: new Date("2026-03-09T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "check",
      referenceNumber: "CHK-3820-REF",
      counterpartyName: "Acre Referral Desk",
      memo: "Referral fee paid",
      notes: "Seeded referral payment.",
      totalAmount: "2500",
      lineItems: [],
      ledgerEntries: [
        {
          id: "seed-gl-payment-referral-ap",
          accountCode: "2000",
          entryDate: new Date("2026-03-09T00:00:00.000Z"),
          debitAmount: "2500",
          creditAmount: "0",
          memo: "Made payment CHK-3820-REF"
        },
        {
          id: "seed-gl-payment-referral-bank",
          accountCode: "1000",
          entryDate: new Date("2026-03-09T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "2500",
          memo: "Made payment CHK-3820-REF"
        }
      ]
    },
    {
      id: "seed-acct-deposit-emd-70",
      relatedTransactionId: "seed-tx-70-christopher",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "deposit",
      status: "posted",
      accountingDate: new Date("2026-03-04T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "check",
      referenceNumber: "EMD-70-DEP",
      counterpartyName: "Earnest Money Holding",
      memo: "Earnest money deposited to holding bank",
      notes: "Seeded EMD deposit.",
      totalAmount: "5000",
      lineItems: [
        {
          id: "seed-acct-li-deposit-emd-70",
          ledgerAccountCode: "2100",
          description: "Earnest money liability",
          entrySide: "credit",
          amount: "5000"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-deposit-emd-70-bank",
          accountCode: "1010",
          entryDate: new Date("2026-03-04T00:00:00.000Z"),
          debitAmount: "5000",
          creditAmount: "0",
          memo: "Deposit EMD-70-DEP"
        },
        {
          id: "seed-gl-deposit-emd-70-liability",
          accountCode: "2100",
          entryDate: new Date("2026-03-04T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "5000",
          memo: "Deposit EMD-70-DEP"
        }
      ]
    },
    {
      id: "seed-acct-refund-broker-credit",
      relatedTransactionId: "seed-tx-70-christopher",
      relatedMembershipEmail: "naomi@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "refund",
      status: "completed",
      accountingDate: new Date("2026-03-10T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "check",
      referenceNumber: "RFND-70-001",
      counterpartyName: "Brokerage client credit",
      memo: "Client refund",
      notes: "Seeded refund entry.",
      totalAmount: "500",
      lineItems: [
        {
          id: "seed-acct-li-refund-70",
          ledgerAccountCode: "4050",
          description: "Contra revenue refund",
          entrySide: "debit",
          amount: "500"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-refund-70-contra",
          accountCode: "4050",
          entryDate: new Date("2026-03-10T00:00:00.000Z"),
          debitAmount: "500",
          creditAmount: "0",
          memo: "Refund RFND-70-001"
        },
        {
          id: "seed-gl-refund-70-bank",
          accountCode: "1000",
          entryDate: new Date("2026-03-10T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "500",
          memo: "Refund RFND-70-001"
        }
      ]
    },
    {
      id: "seed-acct-journal-adjustment",
      relatedTransactionId: "seed-tx-graham-court",
      relatedMembershipEmail: "jane@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "journal_entry",
      status: "posted",
      accountingDate: new Date("2026-03-06T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: null,
      referenceNumber: "JE-2026-03-01",
      counterpartyName: "Internal adjustment",
      memo: "Manual journal adjustment",
      notes: "Seeded journal entry for view coverage.",
      totalAmount: "300",
      lineItems: [
        {
          id: "seed-acct-li-je-debit",
          ledgerAccountCode: "5100",
          description: "Manual adjustment debit",
          entrySide: "debit",
          amount: "300"
        },
        {
          id: "seed-acct-li-je-credit",
          ledgerAccountCode: "4050",
          description: "Manual adjustment credit",
          entrySide: "credit",
          amount: "300"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-je-debit",
          accountCode: "5100",
          entryDate: new Date("2026-03-06T00:00:00.000Z"),
          debitAmount: "300",
          creditAmount: "0",
          memo: "Journal entry JE-2026-03-01"
        },
        {
          id: "seed-gl-je-credit",
          accountCode: "4050",
          entryDate: new Date("2026-03-06T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "300",
          memo: "Journal entry JE-2026-03-01"
        }
      ]
    },
    {
      id: "seed-acct-transfer-liquidity",
      relatedTransactionId: "seed-tx-45-10-court-square",
      relatedMembershipEmail: "simon@acre.com",
      createdByEmail: "naomi@acre.com",
      type: "transfer",
      status: "posted",
      accountingDate: new Date("2026-03-11T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "internal_transfer",
      referenceNumber: "XFER-2026-03",
      counterpartyName: "Internal bank transfer",
      memo: "Transfer between operating and earnest money accounts",
      notes: "Seeded transfer for accounting type coverage.",
      totalAmount: "1000",
      lineItems: [
        {
          id: "seed-acct-li-transfer-debit",
          ledgerAccountCode: "1000",
          description: "Operating bank increase",
          entrySide: "debit",
          amount: "1000"
        },
        {
          id: "seed-acct-li-transfer-credit",
          ledgerAccountCode: "1010",
          description: "Earnest money bank decrease",
          entrySide: "credit",
          amount: "1000"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-gl-transfer-debit",
          accountCode: "1000",
          entryDate: new Date("2026-03-11T00:00:00.000Z"),
          debitAmount: "1000",
          creditAmount: "0",
          memo: "Transfer XFER-2026-03"
        },
        {
          id: "seed-gl-transfer-credit",
          accountCode: "1010",
          entryDate: new Date("2026-03-11T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "1000",
          memo: "Transfer XFER-2026-03"
        }
      ]
    }
  ];

  for (const accountingTransaction of seededAccountingTransactions) {
    const relatedMembership = accountingTransaction.relatedMembershipEmail
      ? membershipByEmail.get(accountingTransaction.relatedMembershipEmail) ?? null
      : null;
    const createdByMembership = membershipByEmail.get(accountingTransaction.createdByEmail) ?? null;

    await upsertAccountingTransactionWithPostings({
      id: accountingTransaction.id,
      organizationId: organization.id,
      officeId: office.id,
      relatedTransactionId: accountingTransaction.relatedTransactionId ?? null,
      relatedMembershipId: relatedMembership?.id ?? null,
      type: accountingTransaction.type,
      status: accountingTransaction.status,
      accountingDate: accountingTransaction.accountingDate,
      dueDate: accountingTransaction.dueDate ?? null,
      paymentMethod: accountingTransaction.paymentMethod ?? null,
      referenceNumber: accountingTransaction.referenceNumber,
      counterpartyName: accountingTransaction.counterpartyName,
      memo: accountingTransaction.memo,
      notes: accountingTransaction.notes,
      totalAmount: accountingTransaction.totalAmount,
      createdByMembershipId: createdByMembership.id,
      postedAt: ["draft", "void"].includes(accountingTransaction.status) ? null : accountingTransaction.accountingDate,
      lineItems: accountingTransaction.lineItems.map((lineItem) => ({
        ...lineItem,
        ledgerAccountId: ledgerAccountByCode.get(lineItem.ledgerAccountCode).id
      })),
      ledgerEntries: accountingTransaction.ledgerEntries.map((entry) => ({
        ...entry,
        accountId: ledgerAccountByCode.get(entry.accountCode).id
      }))
    });
  }

  const seededAgentBillingTransactions = [
    {
      id: "seed-agent-invoice-jane-desk-fee",
      relatedTransactionId: null,
      relatedMembershipEmail: "jane@acre.com",
      createdByEmail: "naomi@acre.com",
      isAgentBilling: true,
      billingCategory: "desk_fee",
      type: "invoice",
      status: "open",
      accountingDate: new Date("2026-03-01T00:00:00.000Z"),
      dueDate: new Date("2026-03-12T00:00:00.000Z"),
      paymentMethod: null,
      referenceNumber: "AGINV-2026-03-001",
      counterpartyName: "Jane Wu",
      memo: "March desk fee",
      notes: "Seeded monthly desk fee invoice.",
      totalAmount: "350",
      lineItems: [
        {
          id: "seed-agent-li-jane-desk-fee",
          ledgerAccountCode: "4010",
          description: "Monthly desk fee",
          entrySide: "credit",
          amount: "350"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-agent-gl-jane-desk-fee-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-01T00:00:00.000Z"),
          debitAmount: "350",
          creditAmount: "0",
          memo: "Agent invoice AGINV-2026-03-001"
        },
        {
          id: "seed-agent-gl-jane-desk-fee-income",
          accountCode: "4010",
          entryDate: new Date("2026-03-01T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "350",
          memo: "Agent invoice AGINV-2026-03-001"
        }
      ]
    },
    {
      id: "seed-agent-invoice-jane-marketing-fee",
      relatedTransactionId: "seed-tx-graham-court",
      relatedMembershipEmail: "jane@acre.com",
      createdByEmail: "naomi@acre.com",
      isAgentBilling: true,
      billingCategory: "marketing_fee",
      type: "invoice",
      status: "draft",
      accountingDate: new Date("2026-04-01T00:00:00.000Z"),
      dueDate: new Date("2026-04-01T00:00:00.000Z"),
      paymentMethod: null,
      referenceNumber: "AGINV-2026-04-001",
      counterpartyName: "Jane Wu",
      memo: "April marketing package",
      notes: "Future-dated marketing fee invoice.",
      totalAmount: "125",
      lineItems: [
        {
          id: "seed-agent-li-jane-marketing-fee",
          ledgerAccountCode: "4010",
          description: "Marketing package",
          entrySide: "credit",
          amount: "125"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-agent-gl-jane-marketing-fee-ar",
          accountCode: "1100",
          entryDate: new Date("2026-04-01T00:00:00.000Z"),
          debitAmount: "125",
          creditAmount: "0",
          memo: "Agent invoice AGINV-2026-04-001"
        },
        {
          id: "seed-agent-gl-jane-marketing-fee-income",
          accountCode: "4010",
          entryDate: new Date("2026-04-01T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "125",
          memo: "Agent invoice AGINV-2026-04-001"
        }
      ]
    },
    {
      id: "seed-agent-invoice-simon-office-fee",
      relatedTransactionId: null,
      relatedMembershipEmail: "simon@acre.com",
      createdByEmail: "naomi@acre.com",
      isAgentBilling: true,
      billingCategory: "office_fee",
      type: "invoice",
      status: "open",
      accountingDate: new Date("2026-03-03T00:00:00.000Z"),
      dueDate: new Date("2026-03-15T00:00:00.000Z"),
      paymentMethod: null,
      referenceNumber: "AGINV-2026-03-002",
      counterpartyName: "Simon Park",
      memo: "Office support fee",
      notes: "Seeded office support fee invoice.",
      totalAmount: "400",
      lineItems: [
        {
          id: "seed-agent-li-simon-office-fee",
          ledgerAccountCode: "4010",
          description: "Office support fee",
          entrySide: "credit",
          amount: "400"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-agent-gl-simon-office-fee-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-03T00:00:00.000Z"),
          debitAmount: "400",
          creditAmount: "0",
          memo: "Agent invoice AGINV-2026-03-002"
        },
        {
          id: "seed-agent-gl-simon-office-fee-income",
          accountCode: "4010",
          entryDate: new Date("2026-03-03T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "400",
          memo: "Agent invoice AGINV-2026-03-002"
        }
      ]
    },
    {
      id: "seed-agent-payment-jane-march",
      relatedTransactionId: null,
      relatedMembershipEmail: "jane@acre.com",
      createdByEmail: "naomi@acre.com",
      isAgentBilling: true,
      billingCategory: "collections",
      type: "received_payment",
      status: "completed",
      accountingDate: new Date("2026-03-06T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: "check",
      referenceNumber: "AGPAY-2026-03-001",
      counterpartyName: "Jane Wu",
      memo: "Received agent payment",
      notes: "Partial payment against March charges.",
      totalAmount: "200",
      lineItems: [],
      ledgerEntries: [
        {
          id: "seed-agent-gl-payment-jane-bank",
          accountCode: "1000",
          entryDate: new Date("2026-03-06T00:00:00.000Z"),
          debitAmount: "200",
          creditAmount: "0",
          memo: "Agent payment AGPAY-2026-03-001"
        },
        {
          id: "seed-agent-gl-payment-jane-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-06T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "200",
          memo: "Agent payment AGPAY-2026-03-001"
        }
      ]
    },
    {
      id: "seed-agent-credit-jane-courtesy",
      relatedTransactionId: null,
      relatedMembershipEmail: "jane@acre.com",
      createdByEmail: "naomi@acre.com",
      isAgentBilling: true,
      billingCategory: "courtesy_credit",
      type: "credit_memo",
      status: "posted",
      accountingDate: new Date("2026-03-07T00:00:00.000Z"),
      dueDate: null,
      paymentMethod: null,
      referenceNumber: "AGCR-2026-03-001",
      counterpartyName: "Jane Wu",
      memo: "Courtesy credit",
      notes: "Applied courtesy credit to March desk fee.",
      totalAmount: "50",
      lineItems: [
        {
          id: "seed-agent-li-credit-jane-contra",
          ledgerAccountCode: "4050",
          description: "Courtesy credit",
          entrySide: "debit",
          amount: "50"
        },
        {
          id: "seed-agent-li-credit-jane-ar",
          ledgerAccountCode: "1100",
          description: "Accounts receivable reduction",
          entrySide: "credit",
          amount: "50"
        }
      ],
      ledgerEntries: [
        {
          id: "seed-agent-gl-credit-jane-contra",
          accountCode: "4050",
          entryDate: new Date("2026-03-07T00:00:00.000Z"),
          debitAmount: "50",
          creditAmount: "0",
          memo: "Agent credit AGCR-2026-03-001"
        },
        {
          id: "seed-agent-gl-credit-jane-ar",
          accountCode: "1100",
          entryDate: new Date("2026-03-07T00:00:00.000Z"),
          debitAmount: "0",
          creditAmount: "50",
          memo: "Agent credit AGCR-2026-03-001"
        }
      ]
    }
  ];

  for (const accountingTransaction of seededAgentBillingTransactions) {
    const relatedMembership = accountingTransaction.relatedMembershipEmail
      ? membershipByEmail.get(accountingTransaction.relatedMembershipEmail) ?? null
      : null;
    const createdByMembership = membershipByEmail.get(accountingTransaction.createdByEmail) ?? null;

    await upsertAccountingTransactionWithPostings({
      id: accountingTransaction.id,
      organizationId: organization.id,
      officeId: office.id,
      relatedTransactionId: accountingTransaction.relatedTransactionId ?? null,
      relatedMembershipId: relatedMembership?.id ?? null,
      isAgentBilling: accountingTransaction.isAgentBilling,
      billingCategory: accountingTransaction.billingCategory,
      type: accountingTransaction.type,
      status: accountingTransaction.status,
      accountingDate: accountingTransaction.accountingDate,
      dueDate: accountingTransaction.dueDate ?? null,
      paymentMethod: accountingTransaction.paymentMethod ?? null,
      referenceNumber: accountingTransaction.referenceNumber,
      counterpartyName: accountingTransaction.counterpartyName,
      memo: accountingTransaction.memo,
      notes: accountingTransaction.notes,
      totalAmount: accountingTransaction.totalAmount,
      createdByMembershipId: createdByMembership.id,
      postedAt: ["draft", "void"].includes(accountingTransaction.status) ? null : accountingTransaction.accountingDate,
      lineItems: accountingTransaction.lineItems.map((lineItem) => ({
        ...lineItem,
        ledgerAccountId: ledgerAccountByCode.get(lineItem.ledgerAccountCode).id
      })),
      ledgerEntries: accountingTransaction.ledgerEntries.map((entry) => ({
        ...entry,
        accountId: ledgerAccountByCode.get(entry.accountCode).id
      }))
    });
  }

  const seededAgentBillingApplications = [
    {
      id: "seed-agent-application-payment-jane-desk-fee",
      sourceAccountingTransactionId: "seed-agent-payment-jane-march",
      targetAccountingTransactionId: "seed-agent-invoice-jane-desk-fee",
      amount: "200",
      memo: "Applied payment to March desk fee"
    },
    {
      id: "seed-agent-application-credit-jane-desk-fee",
      sourceAccountingTransactionId: "seed-agent-credit-jane-courtesy",
      targetAccountingTransactionId: "seed-agent-invoice-jane-desk-fee",
      amount: "50",
      memo: "Applied courtesy credit"
    }
  ];

  for (const application of seededAgentBillingApplications) {
    await prisma.accountingTransactionApplication.upsert({
      where: {
        id: application.id
      },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        sourceAccountingTransactionId: application.sourceAccountingTransactionId,
        targetAccountingTransactionId: application.targetAccountingTransactionId,
        createdByMembershipId: membershipByEmail.get("naomi@acre.com")?.id ?? null,
        amount: application.amount,
        memo: application.memo,
        appliedAt: new Date("2026-03-08T00:00:00.000Z")
      },
      create: {
        id: application.id,
        organizationId: organization.id,
        officeId: office.id,
        sourceAccountingTransactionId: application.sourceAccountingTransactionId,
        targetAccountingTransactionId: application.targetAccountingTransactionId,
        createdByMembershipId: membershipByEmail.get("naomi@acre.com")?.id ?? null,
        amount: application.amount,
        memo: application.memo,
        appliedAt: new Date("2026-03-08T00:00:00.000Z")
      }
    });
  }

  const seededAgentRecurringRules = [
    {
      id: "seed-agent-recurring-jane-marketing",
      membershipEmail: "jane@acre.com",
      name: "Monthly marketing package",
      chargeType: "marketing_fee",
      description: "Standard monthly marketing package for active agents.",
      amount: "125",
      frequency: "monthly",
      customIntervalDays: null,
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      nextDueDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: null,
      lastGeneratedAt: new Date("2026-03-01T00:00:00.000Z"),
      autoGenerateInvoice: true,
      isActive: true
    }
  ];

  for (const rule of seededAgentRecurringRules) {
    const membership = membershipByEmail.get(rule.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.agentRecurringChargeRule.upsert({
      where: {
        id: rule.id
      },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        name: rule.name,
        chargeType: rule.chargeType,
        description: rule.description,
        amount: rule.amount,
        frequency: rule.frequency,
        customIntervalDays: rule.customIntervalDays,
        startDate: rule.startDate,
        nextDueDate: rule.nextDueDate,
        endDate: rule.endDate,
        lastGeneratedAt: rule.lastGeneratedAt,
        autoGenerateInvoice: rule.autoGenerateInvoice,
        isActive: rule.isActive
      },
      create: {
        id: rule.id,
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        name: rule.name,
        chargeType: rule.chargeType,
        description: rule.description,
        amount: rule.amount,
        frequency: rule.frequency,
        customIntervalDays: rule.customIntervalDays,
        startDate: rule.startDate,
        nextDueDate: rule.nextDueDate,
        endDate: rule.endDate,
        lastGeneratedAt: rule.lastGeneratedAt,
        autoGenerateInvoice: rule.autoGenerateInvoice,
        isActive: rule.isActive
      }
    });
  }

  const seededAgentPaymentMethods = [
    {
      id: "seed-agent-payment-method-jane-card",
      membershipEmail: "jane@acre.com",
      type: "card_on_file",
      label: "Visa ending 4242",
      provider: "Manual",
      last4: "4242",
      isDefault: true,
      autoPayEnabled: false,
      externalReferenceId: "pm_jane_demo",
      status: "active"
    },
    {
      id: "seed-agent-payment-method-simon-invalid",
      membershipEmail: "simon@acre.com",
      type: "bank_account",
      label: "Bank account ending 8811",
      provider: "Manual",
      last4: "8811",
      isDefault: true,
      autoPayEnabled: false,
      externalReferenceId: "pm_simon_demo",
      status: "invalid"
    }
  ];

  for (const paymentMethod of seededAgentPaymentMethods) {
    const membership = membershipByEmail.get(paymentMethod.membershipEmail) ?? null;

    if (!membership) {
      continue;
    }

    await prisma.agentPaymentMethod.upsert({
      where: {
        id: paymentMethod.id
      },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        type: paymentMethod.type,
        label: paymentMethod.label,
        provider: paymentMethod.provider,
        last4: paymentMethod.last4,
        isDefault: paymentMethod.isDefault,
        autoPayEnabled: paymentMethod.autoPayEnabled,
        externalReferenceId: paymentMethod.externalReferenceId,
        status: paymentMethod.status
      },
      create: {
        id: paymentMethod.id,
        organizationId: organization.id,
        officeId: office.id,
        membershipId: membership.id,
        type: paymentMethod.type,
        label: paymentMethod.label,
        provider: paymentMethod.provider,
        last4: paymentMethod.last4,
        isDefault: paymentMethod.isDefault,
        autoPayEnabled: paymentMethod.autoPayEnabled,
        externalReferenceId: paymentMethod.externalReferenceId,
        status: paymentMethod.status
      }
    });
  }

  const seededEarnestMoneyRecords = [
    {
      id: "seed-emd-graham",
      transactionId: "seed-tx-graham-court",
      expectedAmount: "15000",
      dueAt: new Date("2026-03-05T00:00:00.000Z"),
      receivedAmount: "0",
      refundedAmount: "0",
      paymentDate: null,
      depositDate: null,
      heldByOffice: true,
      heldExternally: false,
      trackInLedger: true,
      status: "overdue",
      notes: "Buyer still owes earnest money."
    },
    {
      id: "seed-emd-70-christopher",
      transactionId: "seed-tx-70-christopher",
      expectedAmount: "5000",
      dueAt: new Date("2026-03-02T00:00:00.000Z"),
      receivedAmount: "5000",
      refundedAmount: "0",
      paymentDate: new Date("2026-03-03T00:00:00.000Z"),
      depositDate: new Date("2026-03-04T00:00:00.000Z"),
      heldByOffice: true,
      heldExternally: false,
      trackInLedger: true,
      status: "fully_deposited",
      notes: "Earnest money received and deposited."
    }
  ];

  for (const record of seededEarnestMoneyRecords) {
    await prisma.earnestMoneyRecord.upsert({
      where: { id: record.id },
      update: {
        organizationId: organization.id,
        officeId: office.id,
        transactionId: record.transactionId,
        expectedAmount: record.expectedAmount,
        dueAt: record.dueAt,
        receivedAmount: record.receivedAmount,
        refundedAmount: record.refundedAmount,
        paymentDate: record.paymentDate,
        depositDate: record.depositDate,
        heldByOffice: record.heldByOffice,
        heldExternally: record.heldExternally,
        trackInLedger: record.trackInLedger,
        status: record.status,
        notes: record.notes,
        createdByMembershipId: membershipByEmail.get("naomi@acre.com")?.id ?? null
      },
      create: {
        id: record.id,
        organizationId: organization.id,
        officeId: office.id,
        transactionId: record.transactionId,
        expectedAmount: record.expectedAmount,
        dueAt: record.dueAt,
        receivedAmount: record.receivedAmount,
        refundedAmount: record.refundedAmount,
        paymentDate: record.paymentDate,
        depositDate: record.depositDate,
        heldByOffice: record.heldByOffice,
        heldExternally: record.heldExternally,
        trackInLedger: record.trackInLedger,
        status: record.status,
        notes: record.notes,
        createdByMembershipId: membershipByEmail.get("naomi@acre.com")?.id ?? null
      }
    });
  }

  const seededAuditLogs = [
    {
      id: "seed-audit-transaction-created-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction",
      entityId: "seed-tx-graham-court",
      action: "transaction.created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        details: ["Status: Opportunity", "Representing: buyer", "Owner: Jane Wu"]
      }
    },
    {
      id: "seed-audit-transaction-status-court-square",
      membershipEmail: "simon@acre.com",
      entityType: "transaction",
      entityId: "seed-tx-45-10-court-square",
      action: "transaction.status_changed",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-45-10-court-square",
        transactionLabel: "45-10 Court Square W · 45-10 Court Square W, Long Island City, NY",
        objectLabel: "45-10 Court Square W · 45-10 Court Square W, Long Island City, NY",
        details: ["Status: Active -> Pending"]
      }
    },
    {
      id: "seed-audit-transaction-contact-linked-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction",
      entityId: "seed-tx-graham-court",
      action: "transaction.contact_linked",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        contactId: "seed-client-evelyn",
        contactName: "Evelyn Zhao",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        details: ["Contact: Evelyn Zhao", "Role: Buyer", "Primary contact: Yes"]
      }
    },
    {
      id: "seed-audit-transaction-primary-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction",
      entityId: "seed-tx-graham-court",
      action: "transaction.primary_contact_changed",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        contactId: "seed-client-evelyn",
        contactName: "Evelyn Zhao",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        details: ["Previous primary: None", "New primary: Evelyn Zhao"]
      }
    },
    {
      id: "seed-audit-transaction-finance-parson",
      membershipEmail: "naomi@acre.com",
      entityType: "transaction",
      entityId: "seed-tx-3820-parson",
      action: "transaction.finance_updated",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-3820-parson",
        transactionLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        objectLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        details: [
          "Gross commission: $18,750",
          "Referral fee: $2,500",
          "Office net: $10,000",
          "Agent net: $6,250"
        ]
      }
    },
    {
      id: "seed-audit-task-created-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction_task",
      entityId: "seed-transaction-task-graham-contract",
      action: "transaction.task_created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        taskId: "seed-transaction-task-graham-contract",
        taskTitle: "Collect signed buyer agreement",
        objectLabel: "Collect signed buyer agreement · Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        details: ["Group: Contract", "Status: Todo", "Due: 2026-03-14"]
      }
    },
    {
      id: "seed-audit-task-updated-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction_task",
      entityId: "seed-transaction-task-graham-intro",
      action: "transaction.task_updated",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        taskId: "seed-transaction-task-graham-intro",
        taskTitle: "Send attorney introduction",
        objectLabel: "Send attorney introduction · Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        details: ["Status: Todo -> In progress"]
      }
    },
    {
      id: "seed-audit-task-completed-court-square",
      membershipEmail: "simon@acre.com",
      entityType: "transaction_task",
      entityId: "seed-transaction-task-court-square-invoice",
      action: "transaction.task_completed",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-45-10-court-square",
        taskId: "seed-transaction-task-court-square-invoice",
        taskTitle: "Upload vendor invoice package",
        objectLabel: "Upload vendor invoice package · 45-10 Court Square W · 45-10 Court Square W, Long Island City, NY",
        details: ["Status: In progress -> Completed"]
      }
    },
    {
      id: "seed-audit-contact-created-evelyn",
      membershipEmail: "jane@acre.com",
      entityType: "contact",
      entityId: "seed-client-evelyn",
      action: "contact.created",
      payload: {
        officeId: office.id,
        contactId: "seed-client-evelyn",
        contactName: "Evelyn Zhao",
        objectLabel: "Evelyn Zhao · evelyn@example.com",
        details: ["Stage: Warm", "Intent: Investor"]
      }
    },
    {
      id: "seed-audit-contact-updated-iris",
      membershipEmail: "naomi@acre.com",
      entityType: "contact",
      entityId: "seed-client-iris",
      action: "contact.updated",
      payload: {
        officeId: office.id,
        contactId: "seed-client-iris",
        contactName: "Iris Chen",
        objectLabel: "Iris Chen · iris@example.com",
        details: ["Stage: New -> Nurture", "Notes: rental timing updated"]
      }
    },
    {
      id: "seed-audit-document-uploaded-graham-contract",
      membershipEmail: "jane@acre.com",
      entityType: "transaction_document",
      entityId: "seed-doc-graham-contract-upload",
      action: "document.uploaded",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Buyer agreement upload",
        details: ["Document type: Buyer agreement", "Status: Submitted", "Linked task: Collect signed buyer agreement"]
      }
    },
    {
      id: "seed-audit-form-created-graham",
      membershipEmail: "jane@acre.com",
      entityType: "transaction_form",
      entityId: "seed-form-graham-buyer-agreement",
      action: "form.created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Graham Court buyer agreement packet",
        details: ["Template: Buyer agreement packet", "Status: Fully signed"]
      }
    },
    {
      id: "seed-audit-signature-completed-graham",
      membershipEmail: "jane@acre.com",
      entityType: "signature_request",
      entityId: "seed-signature-graham-buyer",
      action: "signature_request.completed",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Signature request · Evelyn Zhao",
        details: ["Recipient: Evelyn Zhao", "Status: Signed", "Completed: Mar 10, 2026"]
      }
    },
    {
      id: "seed-audit-incoming-update-received-graham",
      membershipEmail: "jane@acre.com",
      entityType: "incoming_update",
      entityId: "seed-incoming-graham-closing-review",
      action: "incoming_update.received",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Closing date revision requires review",
        details: ["Source: Manual test feed", "Status: Pending review"]
      }
    },
    {
      id: "seed-audit-incoming-update-rejected-graham",
      membershipEmail: "simon@acre.com",
      entityType: "incoming_update",
      entityId: "seed-incoming-graham-price-rejected",
      action: "incoming_update.rejected",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Unsupported outside price revision was rejected",
        details: ["Source: Manual test feed", "Decision: Rejected"]
      }
    },
    {
      id: "seed-audit-accounting-invoice-parson",
      membershipEmail: "naomi@acre.com",
      entityType: "accounting_transaction",
      entityId: "seed-acct-invoice-parson",
      action: "accounting.invoice_created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-3820-parson",
        transactionLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        objectLabel: "Invoice INV-3820-01",
        details: ["Type: Invoice", "Status: Open", "Amount: $18,750"]
      }
    },
    {
      id: "seed-audit-accounting-payment-parson",
      membershipEmail: "naomi@acre.com",
      entityType: "accounting_transaction",
      entityId: "seed-acct-payment-parson",
      action: "accounting.payment_received",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-3820-parson",
        transactionLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        objectLabel: "Received payment PAY-3820-01",
        details: ["Type: Received payment", "Status: Completed", "Amount: $18,750"]
      }
    },
    {
      id: "seed-audit-accounting-bill-referral",
      membershipEmail: "naomi@acre.com",
      entityType: "accounting_transaction",
      entityId: "seed-acct-bill-referral",
      action: "accounting.bill_created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-3820-parson",
        transactionLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        objectLabel: "Bill BILL-3820-REF",
        details: ["Type: Bill", "Status: Open", "Amount: $2,500"]
      }
    },
    {
      id: "seed-audit-accounting-payment-made-referral",
      membershipEmail: "naomi@acre.com",
      entityType: "accounting_transaction",
      entityId: "seed-acct-payment-referral",
      action: "accounting.payment_made",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-3820-parson",
        transactionLabel: "3820 Parson Blvd · 3820 Parson Blvd, Flushing, NY",
        objectLabel: "Made payment CHK-3820-REF",
        details: ["Type: Made payment", "Status: Completed", "Amount: $2,500"]
      }
    },
    {
      id: "seed-audit-emd-expected-graham",
      membershipEmail: "naomi@acre.com",
      entityType: "earnest_money",
      entityId: "seed-emd-graham",
      action: "emd.expected_created",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-graham-court",
        transactionLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        objectLabel: "Graham Court 4F · Graham Court 4F, Brooklyn, NY",
        contextHref: "/office/accounting#earnest-money",
        details: ["Expected amount: $15,000", "Due: Mar 5, 2026"]
      }
    },
    {
      id: "seed-audit-emd-received-70",
      membershipEmail: "naomi@acre.com",
      entityType: "earnest_money",
      entityId: "seed-emd-70-christopher",
      action: "emd.received",
      payload: {
        officeId: office.id,
        transactionId: "seed-tx-70-christopher",
        transactionLabel: "70 Christopher Columbus Dr · 70 Christopher Columbus Dr, Jersey City, NJ",
        objectLabel: "70 Christopher Columbus Dr · 70 Christopher Columbus Dr, Jersey City, NJ",
        contextHref: "/office/accounting#earnest-money",
        details: ["Received amount: $5,000", "Status: Fully deposited"]
      }
    }
  ];

  for (const auditLog of seededAuditLogs) {
    const membership = auditLog.membershipEmail ? membershipByEmail.get(auditLog.membershipEmail) ?? null : null;

    await prisma.auditLog.upsert({
      where: { id: auditLog.id },
      update: {
        organizationId: organization.id,
        membershipId: membership?.id ?? null,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        payload: auditLog.payload
      },
      create: {
        id: auditLog.id,
        organizationId: organization.id,
        membershipId: membership?.id ?? null,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: auditLog.action,
        payload: auditLog.payload
      }
    });
  }

  console.log(
    `Seeded organization ${organization.slug} with office ${office.slug}, ${memberships.length} memberships, ${seededAgentProfiles.length} agent profiles, ${seededTeams.length} teams, ${seededAgentOnboardingTemplates.length} onboarding templates, ${seededAgentOnboardingItems.length} onboarding items, ${seededAgentGoals.length} agent goals, ${seededTransactions.length} transactions, ${seededClients.length} clients, ${seededTasks.length} follow-up tasks, ${seededEvents.length} events, ${seededNotifications.length} notifications, ${seededTransactionTasks.length} transaction tasks, ${seededFormTemplates.length} form templates, ${seededTransactionDocuments.length} transaction documents, ${seededTransactionForms.length} transaction forms, ${seededSignatureRequests.length} signature requests, ${seededIncomingUpdates.length} incoming updates, ${seededLedgerAccounts.length} ledger accounts, ${seededAccountingTransactions.length} accounting transactions, ${seededEarnestMoneyRecords.length} earnest money records, and ${seededAuditLogs.length} audit logs.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
