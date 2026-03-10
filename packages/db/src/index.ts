export const databaseEnv = {
  primaryUrl: "DATABASE_URL"
} as const;

export const databaseModules = [
  "organizations",
  "offices",
  "users",
  "memberships",
  "listings",
  "listing_share_links",
  "clients",
  "follow_up_tasks",
  "notifications",
  "events",
  "resources",
  "vendors",
  "audit_logs",
  "transactions"
] as const;

export { assertDatabaseUrl, getPrismaClient, prisma } from "./client";
export { findActiveMembershipContextByEmail, getSessionMembershipContext } from "./auth";
export { getSeededWorkspaceSnapshot } from "./bootstrap";
export { getOfficeDashboardBusinessSnapshot } from "./dashboard";
export { createContact, createFollowUpTask, getContactById, linkContactToTransaction, listContacts, updateContact } from "./contacts";
export { getOfficeReportsSnapshot } from "./reports";
export { createTransaction, getTransactionById, listTransactions, updateTransactionStatus } from "./transactions";
export type { SessionMembershipContext } from "./auth";
export type { SeededMembershipSnapshot, SeededWorkspaceSnapshot } from "./bootstrap";
export type { OfficeDashboardBusinessSnapshot, OfficeDashboardChartPoint, OfficeDashboardRecentTransaction, OfficeDashboardStatusMetric } from "./dashboard";
export type {
  CreateFollowUpTaskInput,
  ListContactsInput,
  OfficeContactDetail,
  OfficeContactLinkedTransaction,
  OfficeContactListResult,
  OfficeContactRecord,
  OfficeContactTask,
  OfficeTransactionLinkOption,
  SaveContactInput
} from "./contacts";
export type { GetOfficeReportsSnapshotInput, OfficeReportOwnerMetric, OfficeReportOwnerOption, OfficeReportsFilters, OfficeReportsSnapshot } from "./reports";
export type {
  CreateTransactionInput,
  OfficeTransactionDetail,
  OfficeTransactionListResult,
  OfficeTransactionRecord,
  OfficeTransactionSummary,
  OfficeTransactionStatus,
  UpdateTransactionStatusInput
} from "./transactions";
