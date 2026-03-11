export type UserRole = "agent" | "office_manager" | "office_admin";

export type AppPermission =
  | "dashboard:view"
  | "activity:view"
  | "listings:view"
  | "listings:manage"
  | "listings:publish"
  | "clients:view"
  | "clients:manage"
  | "events:view"
  | "events:manage"
  | "resources:view"
  | "resources:manage"
  | "analytics:view"
  | "notifications:view"
  | "users:manage"
  | "integrations:manage"
  | "ai:use";

export type RoleSummary = {
  role: UserRole;
  label: string;
  description: string;
};

const roleSummaries: Record<UserRole, RoleSummary> = {
  agent: {
    role: "agent",
    label: "Agent",
    description: "Field-facing user focused on listings, clients, notifications, resources, and AI tools."
  },
  office_manager: {
    role: "office_manager",
    label: "Office Manager",
    description: "Operations user focused on listings intake, events, resources, and analytics."
  },
  office_admin: {
    role: "office_admin",
    label: "Office Admin",
    description: "Administrative owner with permissions across users, publishing, integrations, and settings."
  }
};

const permissionMap: Record<UserRole, AppPermission[]> = {
  agent: ["dashboard:view", "listings:view", "clients:view", "clients:manage", "events:view", "resources:view", "notifications:view", "ai:use"],
  office_manager: [
    "dashboard:view",
    "activity:view",
    "listings:view",
    "listings:manage",
    "listings:publish",
    "events:view",
    "events:manage",
    "resources:view",
    "resources:manage",
    "analytics:view",
    "notifications:view",
    "ai:use"
  ],
  office_admin: [
    "dashboard:view",
    "activity:view",
    "listings:view",
    "listings:manage",
    "listings:publish",
    "clients:view",
    "clients:manage",
    "events:view",
    "events:manage",
    "resources:view",
    "resources:manage",
    "analytics:view",
    "notifications:view",
    "users:manage",
    "integrations:manage",
    "ai:use"
  ]
};

export function getRoleSummary(role: UserRole): RoleSummary {
  return roleSummaries[role];
}

export function getPermissionsForRole(role: UserRole): AppPermission[] {
  return permissionMap[role];
}

export function can(role: UserRole, permission: AppPermission): boolean {
  return permissionMap[role].includes(permission);
}

export function isOfficeRole(role: UserRole): boolean {
  return role === "office_manager" || role === "office_admin";
}

export function canAccessAccountActivity(role: UserRole): boolean {
  return can(role, "activity:view");
}

export function getDefaultAppPath(role: UserRole): string {
  return isOfficeRole(role) ? "/office/dashboard" : "/agent/dashboard";
}

export function summarizeAccess(role: UserRole) {
  const permissions = getPermissionsForRole(role);

  return {
    ...getRoleSummary(role),
    permissionCount: permissions.length,
    permissions
  };
}
