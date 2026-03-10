import { Prisma, TransactionContactRole, TransactionRepresenting } from "@prisma/client";
import { activityLogActions, recordActivityLogEvent } from "./activity-log";
import { prisma } from "./client";

export type OfficeTransactionContact = {
  id: string;
  transactionId: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
  notes: string;
};

export type OfficeTransactionContactOption = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  label: string;
};

export type LinkTransactionContactInput = {
  role?: TransactionContactRole;
  isPrimary?: boolean;
  notes?: string | null;
  actorMembershipId?: string;
};

type TransactionContactRecord = {
  id: string;
  transactionId: string;
  clientId: string;
  role: TransactionContactRole;
  isPrimary: boolean;
  notes: string | null;
  client: {
    fullName: string;
    email: string | null;
    phone: string | null;
  };
};

const transactionContactRoleLabelMap: Record<TransactionContactRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  co_buyer: "Co-buyer",
  co_seller: "Co-seller",
  tenant: "Tenant",
  landlord: "Landlord",
  other: "Other"
};

const transactionContactRoleByRepresenting: Record<TransactionRepresenting, TransactionContactRole> = {
  buyer: "buyer",
  seller: "seller",
  both: "buyer",
  tenant: "tenant",
  landlord: "landlord"
};

function mapTransactionContactRecord(record: TransactionContactRecord): OfficeTransactionContact {
  return {
    id: record.id,
    transactionId: record.transactionId,
    clientId: record.clientId,
    fullName: record.client.fullName,
    email: record.client.email ?? "",
    phone: record.client.phone ?? "",
    role: transactionContactRoleLabelMap[record.role],
    isPrimary: record.isPrimary,
    notes: record.notes ?? ""
  };
}

function buildTransactionObjectLabel(transaction: {
  title: string;
  address: string;
  city: string;
  state: string;
}) {
  return `${transaction.title} · ${transaction.address}, ${transaction.city}, ${transaction.state}`;
}

async function ensurePrimaryTransactionContact(
  tx: Prisma.TransactionClient,
  organizationId: string,
  transactionId: string
): Promise<string | null> {
  const existingPrimary = await tx.transactionContact.findFirst({
    where: {
      organizationId,
      transactionId,
      isPrimary: true
    },
    select: {
      clientId: true
    }
  });

  if (existingPrimary) {
    return existingPrimary.clientId;
  }

  const fallback = await tx.transactionContact.findFirst({
    where: {
      organizationId,
      transactionId
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      clientId: true
    }
  });

  if (!fallback) {
    return null;
  }

  await tx.transactionContact.update({
    where: {
      transactionId_clientId: {
        transactionId,
        clientId: fallback.clientId
      }
    },
    data: {
      isPrimary: true
    }
  });

  return fallback.clientId;
}

async function syncTransactionPrimaryClientId(
  tx: Prisma.TransactionClient,
  organizationId: string,
  transactionId: string
) {
  const primaryClientId = await ensurePrimaryTransactionContact(tx, organizationId, transactionId);

  await tx.transaction.updateMany({
    where: {
      id: transactionId,
      organizationId
    },
    data: {
      primaryClientId
    }
  });
}

export function getDefaultTransactionContactRole(representing: TransactionRepresenting): TransactionContactRole {
  return transactionContactRoleByRepresenting[representing] ?? "other";
}

export async function listTransactionContacts(organizationId: string, transactionId: string): Promise<OfficeTransactionContact[]> {
  const transactionContacts = await prisma.transactionContact.findMany({
    where: {
      organizationId,
      transactionId
    },
    include: {
      client: {
        select: {
          fullName: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
  });

  return transactionContacts.map(mapTransactionContactRecord);
}

export async function listAvailableContactsForTransaction(
  organizationId: string,
  transactionId: string
): Promise<OfficeTransactionContactOption[]> {
  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      transactionContacts: {
        none: {
          transactionId
        }
      }
    },
    orderBy: [{ fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true
    }
  });

  return clients.map((client) => ({
    id: client.id,
    fullName: client.fullName,
    email: client.email ?? "",
    phone: client.phone ?? "",
    label: client.email ? `${client.fullName} · ${client.email}` : client.fullName
  }));
}

export async function getTransactionContactLink(
  organizationId: string,
  transactionId: string,
  contactLinkId: string
): Promise<{ id: string; clientId: string; isPrimary: boolean } | null> {
  const relation = await prisma.transactionContact.findFirst({
    where: {
      id: contactLinkId,
      organizationId,
      transactionId
    },
    select: {
      id: true,
      clientId: true,
      isPrimary: true
    }
  });

  return relation;
}

export async function linkContactToTransaction(
  organizationId: string,
  contactId: string,
  transactionId: string,
  options?: LinkTransactionContactInput
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [client, transaction, previousPrimary] = await Promise.all([
      tx.client.findFirst({
        where: {
          id: contactId,
          organizationId
        },
        select: {
          id: true,
          fullName: true
        }
      }),
      tx.transaction.findFirst({
        where: {
          id: transactionId,
          organizationId
        },
        select: {
          id: true,
          officeId: true,
          representing: true,
          title: true,
          address: true,
          city: true,
          state: true
        }
      }),
      tx.transactionContact.findFirst({
        where: {
          organizationId,
          transactionId,
          isPrimary: true
        },
        include: {
          client: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      })
    ]);

    if (!client || !transaction) {
      return false;
    }

    const shouldSetPrimary = options?.isPrimary ?? true;

    if (shouldSetPrimary) {
      await tx.transactionContact.updateMany({
        where: {
          organizationId,
          transactionId,
          isPrimary: true,
          NOT: {
            clientId: contactId
          }
        },
        data: {
          isPrimary: false
        }
      });
    }

    await tx.transactionContact.upsert({
      where: {
        transactionId_clientId: {
          transactionId,
          clientId: contactId
        }
      },
      update: {
        organizationId,
        role: options?.role ?? getDefaultTransactionContactRole(transaction.representing),
        isPrimary: shouldSetPrimary,
        notes: options?.notes?.trim() || null
      },
      create: {
        organizationId,
        transactionId,
        clientId: contactId,
        role: options?.role ?? getDefaultTransactionContactRole(transaction.representing),
        isPrimary: shouldSetPrimary,
        notes: options?.notes?.trim() || null
      }
    });

    await syncTransactionPrimaryClientId(tx, organizationId, transactionId);

    const transactionLabel = buildTransactionObjectLabel(transaction);
    await recordActivityLogEvent(tx, {
      organizationId,
      membershipId: options?.actorMembershipId ?? null,
      entityType: "transaction",
      entityId: transactionId,
      action: activityLogActions.transactionContactLinked,
      payload: {
        officeId: transaction.officeId,
        transactionId,
        contactId,
        contactName: client.fullName,
        transactionLabel,
        objectLabel: transactionLabel,
        details: [
          `Contact: ${client.fullName}`,
          `Role: ${transactionContactRoleLabelMap[options?.role ?? getDefaultTransactionContactRole(transaction.representing)]}`,
          ...(shouldSetPrimary ? ["Primary contact: Yes"] : [])
        ]
      }
    });

    if (shouldSetPrimary && previousPrimary?.client.id !== contactId) {
      await recordActivityLogEvent(tx, {
        organizationId,
        membershipId: options?.actorMembershipId ?? null,
        entityType: "transaction",
        entityId: transactionId,
        action: activityLogActions.transactionPrimaryContactChanged,
        payload: {
          officeId: transaction.officeId,
          transactionId,
          contactId,
          contactName: client.fullName,
          transactionLabel,
          objectLabel: transactionLabel,
          details: [
            `Previous primary: ${previousPrimary?.client.fullName ?? "None"}`,
            `New primary: ${client.fullName}`
          ]
        }
      });
    }

    return true;
  });
}

export async function unlinkContactFromTransaction(
  organizationId: string,
  contactId: string,
  transactionId: string,
  actorMembershipId?: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [relation, transaction] = await Promise.all([
      tx.transactionContact.findFirst({
        where: {
          organizationId,
          transactionId,
          clientId: contactId
        },
        include: {
          client: {
            select: {
              fullName: true
            }
          }
        }
      }),
      tx.transaction.findFirst({
        where: {
          id: transactionId,
          organizationId
        },
        select: {
          officeId: true,
          title: true,
          address: true,
          city: true,
          state: true
        }
      })
    ]);

    if (!relation || !transaction) {
      return false;
    }

    await tx.transactionContact.delete({
      where: {
        id: relation.id
      }
    });

    await syncTransactionPrimaryClientId(tx, organizationId, transactionId);

    const transactionLabel = buildTransactionObjectLabel(transaction);
    await recordActivityLogEvent(tx, {
      organizationId,
      membershipId: actorMembershipId ?? null,
      entityType: "transaction",
      entityId: transactionId,
      action: activityLogActions.transactionContactUnlinked,
      payload: {
        officeId: transaction.officeId,
        transactionId,
        contactId,
        contactName: relation.client.fullName,
        transactionLabel,
        objectLabel: transactionLabel,
        details: [
          `Contact: ${relation.client.fullName}`,
          `Role: ${transactionContactRoleLabelMap[relation.role]}`,
          ...(relation.isPrimary ? ["Removed the primary contact"] : [])
        ]
      }
    });

    return true;
  });
}

export async function setPrimaryTransactionContact(
  organizationId: string,
  transactionId: string,
  contactId: string,
  actorMembershipId?: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const [relation, previousPrimary, transaction] = await Promise.all([
      tx.transactionContact.findFirst({
        where: {
          organizationId,
          transactionId,
          clientId: contactId
        },
        include: {
          client: {
            select: {
              fullName: true
            }
          }
        }
      }),
      tx.transactionContact.findFirst({
        where: {
          organizationId,
          transactionId,
          isPrimary: true
        },
        include: {
          client: {
            select: {
              fullName: true
            }
          }
        }
      }),
      tx.transaction.findFirst({
        where: {
          id: transactionId,
          organizationId
        },
        select: {
          officeId: true,
          title: true,
          address: true,
          city: true,
          state: true
        }
      })
    ]);

    if (!relation || !transaction) {
      return false;
    }

    if (relation.isPrimary) {
      return true;
    }

    await tx.transactionContact.updateMany({
      where: {
        organizationId,
        transactionId,
        isPrimary: true
      },
      data: {
        isPrimary: false
      }
    });

    await tx.transactionContact.update({
      where: {
        id: relation.id
      },
      data: {
        isPrimary: true
      }
    });

    await syncTransactionPrimaryClientId(tx, organizationId, transactionId);

    const transactionLabel = buildTransactionObjectLabel(transaction);
    await recordActivityLogEvent(tx, {
      organizationId,
      membershipId: actorMembershipId ?? null,
      entityType: "transaction",
      entityId: transactionId,
      action: activityLogActions.transactionPrimaryContactChanged,
      payload: {
        officeId: transaction.officeId,
        transactionId,
        contactId,
        contactName: relation.client.fullName,
        transactionLabel,
        objectLabel: transactionLabel,
        details: [
          `Previous primary: ${previousPrimary?.client.fullName ?? "None"}`,
          `New primary: ${relation.client.fullName}`
        ]
      }
    });

    return true;
  });
}
