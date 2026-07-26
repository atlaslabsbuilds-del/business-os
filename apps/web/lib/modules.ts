export type PersonalBrandModuleStatus = "active" | "foundation" | "coming_soon";

export type PersonalBrandModuleOrigin = "actora" | "advora" | "pbos";

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
    status: "coming_soon",
    origin: "advora",
    capabilities: ["Scheduling", "Publishing", "Analytics", "Channel inbox"],
  },
  {
    id: "website",
    label: "Website & Landing Pages",
    description: "Build websites, landing pages, link-in-bio pages, media kits, and forms.",
    route: "/website",
    status: "coming_soon",
    origin: "pbos",
    capabilities: ["Website builder", "Landing pages", "Media kit", "Forms"],
  },
  {
    id: "calendar",
    label: "Calendar & Booking",
    description: "Manage Google Calendar, availability, booking links, meetings, and events.",
    route: "/inbox/calendar",
    status: "foundation",
    origin: "actora",
    capabilities: ["Calendar", "Meetings", "Booking links", "Availability"],
  },
  {
    id: "leads",
    label: "Lead Generation",
    description: "Capture, score, and convert leads through forms, funnels, and CRM context.",
    route: "/crm/leads",
    status: "foundation",
    origin: "actora",
    capabilities: ["Leads", "Forms", "Scoring", "Funnels"],
  },
  {
    id: "client_portal",
    label: "Client Portal",
    description: "Centralize clients, contracts, files, deliverables, and feedback.",
    route: "/clients",
    status: "coming_soon",
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
    capabilities: ["Revenue", "Invoices", "Payments", "Expenses"],
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
    origin: "advora",
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
    description: "Build AI agents, workflows, prompt libraries, and automations.",
    route: "/chat",
    status: "foundation",
    origin: "actora",
    capabilities: ["AI Assistant", "Agents", "Prompts", "Automations"],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Unify revenue, leads, content, audience, and client analytics.",
    route: "/analytics",
    status: "coming_soon",
    origin: "pbos",
    capabilities: ["Revenue", "Leads", "Audience", "Client analytics"],
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
