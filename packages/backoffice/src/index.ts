import type { UserRole } from "@acre/auth";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
};

export type WorkspaceSection = {
  id: string;
  title: string;
  summary: string;
  items: NavItem[];
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
};

export type OfficeSummary = {
  id: string;
  name: string;
  slug: string;
  market: string;
  companyLabel: string;
};

export type AcreMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  officeId: string;
  title: string;
};

export type AgentTask = {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  priority: "High" | "Medium" | "Low";
};

export type ListingSnapshot = {
  id: string;
  name: string;
  area: string;
  city: string;
  price: string;
  status: string;
  hook: string;
  sourceUrl: string;
  isPublic: boolean;
  trackedClicks: number;
};

export type ClientSnapshot = {
  id: string;
  fullName: string;
  stage: string;
  intent: string;
  budget: string;
  areas: string[];
  lastContactLabel: string;
  nextFollowUpLabel: string;
  source: string;
};

export type EventSnapshot = {
  id: string;
  title: string;
  kind: string;
  startsAtLabel: string;
  location: string;
  visibility: string;
  rsvpCount: number;
};

export type NotificationSnapshot = {
  id: string;
  kind: "system" | "listing" | "follow_up" | "event";
  title: string;
  body: string;
  actionLabel: string;
};

export type ResourceSnapshot = {
  id: string;
  type: "training_video" | "document" | "template" | "playbook";
  title: string;
  summary: string;
  tags: string[];
};

export type VendorSnapshot = {
  id: string;
  category: string;
  name: string;
  headline: string;
  neighborhoods: string[];
};

export type MetricCard = {
  label: string;
  value: string;
  trend: string;
};

export type AgentDashboardSnapshot = {
  organization: OrganizationSummary;
  user: AcreMember;
  tasks: AgentTask[];
  listings: ListingSnapshot[];
  notifications: NotificationSnapshot[];
  resources: ResourceSnapshot[];
  metrics: MetricCard[];
};

export type OfficeDashboardSnapshot = {
  organization: OrganizationSummary;
  offices: OfficeSummary[];
  manager: AcreMember;
  metrics: MetricCard[];
  listings: ListingSnapshot[];
  events: EventSnapshot[];
  resources: ResourceSnapshot[];
  workflowNotes: string[];
};

export const organization: OrganizationSummary = {
  id: "org-acre",
  name: "Acre",
  slug: "acre",
  timezone: "America/New_York"
};

export const offices: OfficeSummary[] = [
  { id: "office-ny", name: "Acre NY Realty Inc", slug: "acre-ny", market: "New York Sales", companyLabel: "Primary office" },
  { id: "office-nj", name: "Acre NJ LLC", slug: "acre-nj", market: "New Jersey Sales", companyLabel: "Expansion office" },
  { id: "office-rentals", name: "Acre NY Rentals LLC", slug: "acre-rentals", market: "NY Rentals", companyLabel: "Leasing arm" }
];

export const members: AcreMember[] = [
  {
    id: "member-jane",
    firstName: "Jane",
    lastName: "Wu",
    email: "jane@acre.com",
    role: "agent",
    officeId: "office-ny",
    title: "Senior Agent"
  },
  {
    id: "member-simon",
    firstName: "Simon",
    lastName: "Park",
    email: "simon@acre.com",
    role: "office_manager",
    officeId: "office-ny",
    title: "Office Manager"
  },
  {
    id: "member-naomi",
    firstName: "Naomi",
    lastName: "Chen",
    email: "naomi@acre.com",
    role: "office_admin",
    officeId: "office-ny",
    title: "Operations Admin"
  }
];

export const agentSections: WorkspaceSection[] = [
  {
    id: "overview",
    title: "Agent Workspace",
    summary: "Daily execution for listings, client follow-up, activity, and knowledge access.",
    items: [
      {
        href: "/agent/dashboard",
        label: "Dashboard",
        shortLabel: "Home",
        description: "Today follow-ups, latest listings, activity cards, and quick actions."
      },
      {
        href: "/agent/listings",
        label: "Listings",
        shortLabel: "Listings",
        description: "Search listings, create posters, and generate tracked marketing links."
      },
      {
        href: "/agent/clients",
        label: "Clients",
        shortLabel: "Clients",
        description: "Lightweight CRM with OCR capture, reminders, and next-step guidance."
      },
      {
        href: "/agent/notifications",
        label: "Activity",
        shortLabel: "Alerts",
        description: "Events, notices, RSVP status, and reminder queue."
      },
      {
        href: "/agent/resources",
        label: "Resources",
        shortLabel: "Resources",
        description: "Training videos, vendors, templates, and searchable internal knowledge."
      }
    ]
  }
];

export const officeSections: WorkspaceSection[] = [
  {
    id: "operations",
    title: "Office Console",
    summary: "Control listings, campaigns, events, and analytics across the company.",
    items: [
      {
        href: "/office/dashboard",
        label: "Analytics",
        shortLabel: "Analytics",
        description: "Weekly visibility into listing distribution, clicks, and agent activity."
      },
      {
        href: "/office/listings",
        label: "Listings Admin",
        shortLabel: "Listings",
        description: "Ingest URLs, run AI parsing, review status changes, and publish inventory."
      },
      {
        href: "/office/events",
        label: "Events",
        shortLabel: "Events",
        description: "Publish workshops and offline events, monitor RSVP, and send reminders."
      },
      {
        href: "/office/resources",
        label: "Resources Admin",
        shortLabel: "Resources",
        description: "Manage training media, vendor cards, templates, and searchable docs."
      }
    ]
  }
];

export const agentTasks: AgentTask[] = [
  {
    id: "task-followup-lic",
    title: "Follow up LIC investor lead",
    subtitle: "Last contact 3 days ago. Interest: 1B / LIC / budget $950k.",
    dueLabel: "Due today",
    priority: "High"
  },
  {
    id: "task-poster-orchard",
    title: "Generate poster for The Orchard",
    subtitle: "Use new skyline headline and update QR-tracked sharing link.",
    dueLabel: "Due in 4h",
    priority: "Medium"
  },
  {
    id: "task-rsvp-workshop",
    title: "RSVP for Thursday workshop",
    subtitle: "Workshop: New Development Buyer Objections.",
    dueLabel: "Closes tonight",
    priority: "Low"
  }
];

export const listings: ListingSnapshot[] = [
  {
    id: "listing-orchard",
    name: "The Orchard",
    area: "Long Island City",
    city: "New York",
    price: "$1.42M",
    status: "Active",
    hook: "7 min walk to subway, corner light, gym and terrace.",
    sourceUrl: "https://acre.example/listings/the-orchard",
    isPublic: true,
    trackedClicks: 138
  },
  {
    id: "listing-riverline",
    name: "Riverline West",
    area: "Jersey City",
    city: "New Jersey",
    price: "$865K",
    status: "Hot link",
    hook: "Highest click-through this week from WeChat tracked links.",
    sourceUrl: "https://acre.example/listings/riverline-west",
    isPublic: true,
    trackedClicks: 216
  },
  {
    id: "listing-kent",
    name: "Kent House",
    area: "Brooklyn",
    city: "New York",
    price: "$2.18M",
    status: "Off-market watch",
    hook: "Status monitor detected possible developer update overnight.",
    sourceUrl: "https://acre.example/listings/kent-house",
    isPublic: false,
    trackedClicks: 42
  },
  {
    id: "listing-aurelia",
    name: "Aurelia Tower",
    area: "Downtown Brooklyn",
    city: "New York",
    price: "$1.08M",
    status: "Pending review",
    hook: "Fresh brochure uploaded. AI parse flagged school and tax fields for office review.",
    sourceUrl: "https://acre.example/listings/aurelia-tower",
    isPublic: false,
    trackedClicks: 19
  }
];

export const clients: ClientSnapshot[] = [
  {
    id: "client-evelyn",
    fullName: "Evelyn Zhao",
    stage: "Warm",
    intent: "Investor",
    budget: "$850k - $1.05M",
    areas: ["Long Island City", "Astoria"],
    lastContactLabel: "3 days ago",
    nextFollowUpLabel: "Today at 5 PM",
    source: "WeChat OCR import"
  },
  {
    id: "client-daniel",
    fullName: "Daniel Morgan",
    stage: "Tour booked",
    intent: "End-user",
    budget: "$1.2M - $1.5M",
    areas: ["Brooklyn Heights", "Downtown Brooklyn"],
    lastContactLabel: "Yesterday",
    nextFollowUpLabel: "After Saturday tour",
    source: "Website inquiry"
  },
  {
    id: "client-iris",
    fullName: "Iris Chen",
    stage: "Nurture",
    intent: "Rental",
    budget: "$4,800 / month",
    areas: ["Midtown", "Long Island City"],
    lastContactLabel: "1 week ago",
    nextFollowUpLabel: "Thursday morning",
    source: "Agent manual entry"
  }
];

export const events: EventSnapshot[] = [
  {
    id: "event-workshop",
    title: "New Development Buyer Objections",
    kind: "Workshop",
    startsAtLabel: "Thu 7:00 PM",
    location: "Zoom room",
    visibility: "All agents",
    rsvpCount: 54
  },
  {
    id: "event-appreciation",
    title: "Corporate Appreciation Night",
    kind: "Field Event",
    startsAtLabel: "Sat 6:30 PM",
    location: "Hudson Yards",
    visibility: "Invite-only",
    rsvpCount: 30
  }
];

export const notifications: NotificationSnapshot[] = [
  {
    id: "note-system-1",
    kind: "event",
    title: "Corporate Appreciation Night",
    body: "RSVP in one tap. Reminder will trigger 24 hours before the event.",
    actionLabel: "RSVP now"
  },
  {
    id: "note-system-2",
    kind: "event",
    title: "New Development Workshop",
    body: "Virtual session. Reminder carries the meeting link directly.",
    actionLabel: "View event"
  },
  {
    id: "note-listing-1",
    kind: "listing",
    title: "Kent House status monitor",
    body: "A listing status monitor flagged one project as potentially off-market.",
    actionLabel: "Review listing"
  }
];

export const resources: ResourceSnapshot[] = [
  {
    id: "resource-training-1",
    type: "training_video",
    title: "LIC Inventory Positioning",
    summary: "Short training on how to frame LIC projects for investors versus end-users.",
    tags: ["training", "LIC", "positioning"]
  },
  {
    id: "resource-doc-1",
    type: "document",
    title: "Acre Brand Voice Guide",
    summary: "Internal tone guide used by the reply assistant and listing writer.",
    tags: ["brand", "ai", "copy"]
  },
  {
    id: "resource-template-1",
    type: "template",
    title: "WeChat Follow-up Starter Pack",
    summary: "Editable response templates for warm leads, tour reminders, and objection handling.",
    tags: ["template", "wechat", "follow-up"]
  }
];

export const vendors: VendorSnapshot[] = [
  {
    id: "vendor-loanwise",
    category: "Mortgage",
    name: "Loanwise Capital",
    headline: "Fast pre-approval partner for condo and investor cases.",
    neighborhoods: ["Long Island City", "Brooklyn", "Jersey City"]
  },
  {
    id: "vendor-harbor-law",
    category: "Attorney",
    name: "Harbor Law Group",
    headline: "Closing counsel experienced with new development deals.",
    neighborhoods: ["Manhattan", "Brooklyn"]
  },
  {
    id: "vendor-pinnacle",
    category: "Insurance",
    name: "Pinnacle Coverage",
    headline: "Homeowner and landlord package options for investor clients.",
    neighborhoods: ["Queens", "Brooklyn", "Jersey City"]
  }
];

export const officeWorkflowNotes = [
  "URL parsing should output normalized sponsor, transit, school, and investment fields.",
  "Every agent share link must support individual tracking for clicks and downstream lead capture.",
  "OCR CRM intake should write structured needs summaries and next follow-up timestamps.",
  "Resource hub needs one search surface across videos, docs, templates, and vendor cards."
];

export function getCurrentOrganization() {
  return organization;
}

export function getOffices() {
  return offices;
}

export function getMembers(role?: UserRole) {
  return role ? members.filter((member) => member.role === role) : members;
}

export function listListings(audience: "agent" | "office" = "agent") {
  return audience === "agent" ? listings.filter((listing) => listing.status !== "Pending review") : listings;
}

export function listClients() {
  return clients;
}

export function listNotifications() {
  return notifications;
}

export function listResources() {
  return resources;
}

export function listVendors() {
  return vendors;
}

export function listEvents() {
  return events;
}

export function getAgentDashboardSnapshot(userId = "member-jane"): AgentDashboardSnapshot {
  const user = members.find((member) => member.id === userId) ?? members[0];

  return {
    organization,
    user,
    tasks: agentTasks,
    listings: listListings("agent").slice(0, 3),
    notifications,
    resources: resources.slice(0, 2),
    metrics: [
      { label: "Clients to touch", value: "7", trend: "3 follow-ups due by end of day" },
      { label: "Tracked links today", value: "138", trend: "Riverline West is leading click volume" },
      { label: "Upcoming events", value: "2", trend: "Both RSVP windows close this week" },
      { label: "AI drafts generated", value: "11", trend: "Listing writer usage is up 22% this week" }
    ]
  };
}

export function getOfficeDashboardSnapshot(userId = "member-simon"): OfficeDashboardSnapshot {
  const manager = members.find((member) => member.id === userId) ?? members[1];

  return {
    organization,
    offices,
    manager,
    metrics: [
      { label: "Tracked Link Clicks", value: "4,280", trend: "+18% week over week" },
      { label: "Listings Shared", value: "612", trend: "LIC units dominate the top 10" },
      { label: "Event RSVP", value: "84", trend: "Workshop registration closes in 2 days" },
      { label: "AI Parsing Queue", value: "9", trend: "3 status changes need review" }
    ],
    listings: listListings("office"),
    events,
    resources,
    workflowNotes: officeWorkflowNotes
  };
}

export function getApiCatalog() {
  return [
    "/api/health",
    "/api/agent/dashboard",
    "/api/office/dashboard",
    "/api/listings",
    "/api/clients",
    "/api/events",
    "/api/resources"
  ];
}
