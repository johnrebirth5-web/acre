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
      dueAt: new Date("2026-03-10T22:00:00.000Z")
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
      dueAt: new Date("2026-03-14T16:00:00.000Z"),
      status: "todo",
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
      sortOrder: 0
    }
  ];

  for (const task of seededTransactionTasks) {
    const assigneeMembership = membershipByEmail.get(task.assigneeEmail) ?? null;

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
        sortOrder: task.sortOrder
      }
    });
  }

  console.log(
    `Seeded organization ${organization.slug} with office ${office.slug}, ${memberships.length} memberships, ${seededTransactions.length} transactions, ${seededClients.length} clients, ${seededTasks.length} follow-up tasks, ${seededEvents.length} events, ${seededNotifications.length} notifications, and ${seededTransactionTasks.length} transaction tasks.`
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
