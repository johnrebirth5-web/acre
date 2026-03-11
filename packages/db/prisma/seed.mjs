import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run the Acre seed workflow.");
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

  await prisma.transaction.update({
    where: { id: "seed-tx-45-10-court-square" },
    data: {
      primaryClientId: "seed-client-daniel"
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

  const seededLedgerAccounts = [
    { code: "1000", name: "Operating Bank", accountType: "asset" },
    { code: "1010", name: "Earnest Money Holding Bank", accountType: "asset" },
    { code: "1100", name: "Accounts Receivable", accountType: "asset" },
    { code: "2000", name: "Accounts Payable", accountType: "liability" },
    { code: "2100", name: "Earnest Money Liability", accountType: "liability" },
    { code: "4000", name: "Commission Income", accountType: "income" },
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
    `Seeded organization ${organization.slug} with office ${office.slug}, ${memberships.length} memberships, ${seededTransactions.length} transactions, ${seededClients.length} clients, ${seededTasks.length} follow-up tasks, ${seededEvents.length} events, ${seededNotifications.length} notifications, ${seededTransactionTasks.length} transaction tasks, ${seededLedgerAccounts.length} ledger accounts, ${seededAccountingTransactions.length} accounting transactions, ${seededEarnestMoneyRecords.length} earnest money records, and ${seededAuditLogs.length} audit logs.`
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
