export type PersonalBrandModuleStatus = "active" | "foundation" | "coming_soon";

export type PersonalBrandModuleOrigin = "vanderbase" | "pbos";

export type PersonalBrandModule = {
  id:
    | "dashboard"
    | "content"
    | "social"
    | "website"
    | "calendar"
    | "leads"
    | "client_portal"
    | "finance"
    | "projects"
    | "documents"
    | "digital_products"
    | "email_marketing"
    | "community"
    | "ai_studio"
    | "analytics"
    | "workspace";
  label: string;
  description: string;
  route: string;
  status: PersonalBrandModuleStatus;
  origin: PersonalBrandModuleOrigin;
  capabilities: string[];
};

export const PERSONAL_BRAND_MODULES: PersonalBrandModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Unified command center for revenue, leads, tasks, calendar, AI insights, and activity.",
    route: "/dashboard",
    status: "active",
    origin: "pbos",
    capabilities: ["KPIs", "AI insights", "Recent activity", "Workspace overview"],
  },
  {
    id: "content",
    label: "Content OS",
    description: "Plan, draft, approve, repurpose, and organize high-leverage content.",
    route: "/content",
    status: "active",
    origin: "pbos",
    capabilities: ["Planner", "Calendar", "Drafts", "Repurpose", "Library"],
  },
  {
    id: "social",
    label: "Social Media OS",
    description: "Schedule, publish, and analyze Instagram, LinkedIn, X, YouTube, and Facebook.",
    route: "/social",
    status: "active",
    origin: "pbos",
    capabilities: ["Scheduling", "Publishing", "Analytics", "Channel inbox"],
  },
  {
    id: "website",
    label: "Website & Landing Pages",
    description: "Build websites, landing pages, link-in-bio pages, media kits, and forms.",
    route: "/website",
    status: "active",
    origin: "pbos",
    capabilities: ["Website builder", "Landing pages", "Media kit", "Forms"],
  },
  {
    id: "calendar",
    label: "Calendar & Booking",
    description: "Manage availability, booking links, meetings, reminders, and events.",
    route: "/calendar",
    status: "active",
    origin: "pbos",
    capabilities: ["Calendar", "Meetings", "Booking links", "Availability", "Notes", "Analytics"],
  },
  {
    id: "leads",
    label: "CRM",
    description: "Manage leads, contacts, companies, deals, pipeline, and customer relationships.",
    route: "/crm",
    status: "active",
    origin: "vanderbase",
    capabilities: [
      "Leads",
      "Contacts",
      "Companies",
      "Deals",
      "Pipeline",
      "Activities",
      "Tasks",
      "Reports",
      "AI insights",
    ],
  },
  {
    id: "projects",
    label: "Projects",
    description: "Plan projects, tasks, kanban boards, timelines, teams, and delivery reports.",
    route: "/projects",
    status: "active",
    origin: "vanderbase",
    capabilities: [
      "Projects",
      "Tasks",
      "Kanban",
      "Timeline",
      "Calendar",
      "Teams",
      "Reports",
      "AI insights",
    ],
  },
  {
    id: "documents",
    label: "Documents",
    description: "Write docs, manage folders, knowledge base, templates, and AI-assisted content.",
    route: "/documents",
    status: "active",
    origin: "vanderbase",
    capabilities: [
      "Documents",
      "Folders",
      "Knowledge base",
      "Templates",
      "Versions",
      "Sharing",
      "AI writing",
    ],
  },
  {
    id: "client_portal",
    label: "Client Portal",
    description: "Centralize clients, contracts, files, deliverables, and feedback.",
    route: "/clients",
    status: "active",
    origin: "pbos",
    capabilities: ["Clients", "Contracts", "Files", "Deliverables"],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Track revenue, invoices, payments, expenses, and profit.",
    route: "/finance",
    status: "coming_soon",
    origin: "pbos",
    capabilities: ["Revenue", "Invoices", "Payments", "Expenses", "Budgets", "Reports", "AI insights"],
  },
  {
    id: "digital_products",
    label: "Digital Products",
    description: "Sell and manage courses, templates, memberships, and downloads.",
    route: "/products",
    status: "coming_soon",
    origin: "pbos",
    capabilities: ["Courses", "Templates", "Memberships", "Downloads"],
  },
  {
    id: "email_marketing",
    label: "Email Marketing",
    description: "Create campaigns, broadcasts, automations, and audience segments.",
    route: "/email",
    status: "coming_soon",
    origin: "vanderbase",
    capabilities: ["Campaigns", "Broadcasts", "Automation", "Segments"],
  },
  {
    id: "community",
    label: "Community",
    description: "Run members, events, and discussions in the same workspace.",
    route: "/community",
    status: "coming_soon",
    origin: "pbos",
    capabilities: ["Members", "Events", "Discussions"],
  },
  {
    id: "ai_studio",
    label: "AI Studio",
    description: "Kairos memory, agents, command center, activity, and version history.",
    route: "/ai",
    status: "active",
    origin: "vanderbase",
    capabilities: ["AI Assistant", "Agents", "Memory", "Commands", "Versions"],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Executive dashboards across revenue, finance, CRM, projects, team, and operations.",
    route: "/analytics",
    status: "active",
    origin: "vanderbase",
    capabilities: ["Executive dashboard", "Finance", "CRM", "Projects", "Team", "Operations", "AI insights", "Reports"],
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Manage team members, permissions, roles, billing, and activity logs.",
    route: "/settings",
    status: "foundation",
    origin: "pbos",
    capabilities: ["Team", "Roles", "Settings", "Billing"],
  },
];

export const ACTIVE_PERSONAL_BRAND_MODULES = PERSONAL_BRAND_MODULES.filter(
  (module) => module.status !== "coming_soon",
);
