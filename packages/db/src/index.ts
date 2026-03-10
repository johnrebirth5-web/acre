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
  "transactions",
  "transaction_contacts",
  "transaction_tasks"
] as const;

export { assertDatabaseUrl, getPrismaClient, prisma } from "./client";
export { findActiveMembershipContextByEmail, getSessionMembershipContext } from "./auth";
export { getSeededWorkspaceSnapshot } from "./bootstrap";
export { getOfficeDashboardBusinessSnapshot } from "./dashboard";
export { createContact, createFollowUpTask, getContactById, linkContactToTransaction, listContacts, updateContact } from "./contacts";
export { getOfficePipelineBuckets } from "./pipeline";
export { getOfficeReportsSnapshot, listOfficeReportTransactionsForExport } from "./reports";
export {
  getDefaultTransactionContactRole,
  getTransactionContactLink,
  listAvailableContactsForTransaction,
  listTransactionContacts,
  setPrimaryTransactionContact,
  unlinkContactFromTransaction
} from "./transaction-contacts";
export {
  createTransactionTask,
  listTransactionTaskAssigneeOptions,
  listTransactionTasks,
  updateTransactionTask
} from "./transaction-tasks";
export { createTransaction, getTransactionById, listTransactions, updateTransactionFinance, updateTransactionStatus } from "./transactions";
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
export type { GetOfficePipelineBucketsInput, OfficePipelineBucket, OfficePipelineItem, OfficePipelineStatus } from "./pipeline";
export type {
  GetOfficeReportsSnapshotInput,
  OfficeReportOwnerMetric,
  OfficeReportOwnerOption,
  OfficeReportTransactionExportRow,
  OfficeReportsFilters,
  OfficeReportsSnapshot
} from "./reports";
export type { LinkTransactionContactInput, OfficeTransactionContact, OfficeTransactionContactOption } from "./transaction-contacts";
export type {
  CreateTransactionTaskInput,
  OfficeTransactionTask,
  OfficeTransactionTaskAssigneeOption,
  OfficeTransactionTaskStatus,
  UpdateTransactionTaskInput
} from "./transaction-tasks";
export type {
  CreateTransactionInput,
  OfficeTransactionDetail,
  OfficeTransactionListResult,
  OfficeTransactionRecord,
  OfficeTransactionSummary,
  OfficeTransactionStatus,
  UpdateTransactionFinanceInput,
  UpdateTransactionStatusInput
} from "./transactions";
