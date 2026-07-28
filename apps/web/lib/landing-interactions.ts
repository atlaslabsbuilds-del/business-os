export type OverlayId =
  | "demo"
  | "command-palette"
  | "assistant"
  | "module-preview"
  | "integration-detail"
  | "exit-intent"
  | "credits-explainer"
  | "book-demo"
  | "roi-calculator"
  | "waitlist";

export type ModulePreviewPayload = {
  id: string;
  title: string;
  body: string;
};

export type IntegrationDetailPayload = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  available: boolean;
};

export type OverlayPayload = {
  "module-preview": ModulePreviewPayload;
  "integration-detail": IntegrationDetailPayload;
  demo: undefined;
  "command-palette": undefined;
  assistant: undefined;
  "exit-intent": undefined;
  "credits-explainer": undefined;
  "book-demo": undefined;
  "roi-calculator": undefined;
  waitlist: undefined;
};

export const DEMO_ACTIVITY_EVENTS = [
  { id: "1", actor: "Maya C.", action: "published a LinkedIn post", module: "Social OS", ago: "just now" },
  { id: "2", actor: "Rafael O.", action: "moved Acme Corp to Negotiation", module: "CRM", ago: "12s ago" },
  { id: "3", actor: "AI Agent", action: "drafted follow-up for 3 deals", module: "AI Studio", ago: "28s ago" },
  { id: "4", actor: "Aisha P.", action: "scheduled 4 meetings", module: "Calendar", ago: "45s ago" },
  { id: "5", actor: "Jonah L.", action: "sent invoice #1042", module: "Finance", ago: "1m ago" },
  { id: "6", actor: "Northstar", action: "captured 8 new leads", module: "Lead Gen", ago: "2m ago" },
  { id: "7", actor: "Signal Works", action: "synced Gmail inbox", module: "Inbox", ago: "3m ago" },
  { id: "8", actor: "Kindred Labs", action: "generated landing page draft", module: "Website", ago: "4m ago" },
] as const;

export const DEMO_TESTIMONIAL_TOASTS = [
  {
    id: "t1",
    quote: "We replaced six tools in the first week.",
    name: "Maya Chen",
    role: "Founder, Northstar Studio",
  },
  {
    id: "t2",
    quote: "The AI actually knows our pipeline context.",
    name: "Rafael Ortiz",
    role: "COO, Signal Works",
  },
  {
    id: "t3",
    quote: "Inbox summaries alone save an hour daily.",
    name: "Aisha Patel",
    role: "Founder, Kindred Labs",
  },
  {
    id: "t4",
    quote: "One workspace. One rhythm. Finally.",
    name: "Jonah Lee",
    role: "Agency Owner, Frame & Co",
  },
] as const;

export const CREDIT_ACTIONS = [
  { action: "AI chat reply", credits: 1 },
  { action: "Inbox thread summary", credits: 2 },
  { action: "Content draft (long-form)", credits: 4 },
  { action: "Social post batch (5)", credits: 3 },
  { action: "Pipeline forecast", credits: 5 },
  { action: "Agent workflow run", credits: 8 },
] as const;

export const MODULE_DETAILS: Record<string, { headline: string; bullets: string[] }> = {
  crm: {
    headline: "Pipeline that stays in sync with every conversation.",
    bullets: ["Contact timelines", "Deal stages & tags", "AI lead scoring", "Activity from Inbox & Calendar"],
  },
  inbox: {
    headline: "Inbox that summarizes, drafts, and routes.",
    bullets: ["Thread summaries", "Smart reply drafts", "Meeting detection", "CRM auto-linking"],
  },
  chat: {
    headline: "Workspace-aware AI with tools and memory.",
    bullets: ["Cross-module context", "Tool use with approval", "Shared workspace memory", "Credit-aware responses"],
  },
  content: {
    headline: "From idea to publish-ready drafts.",
    bullets: ["Brand voice presets", "Editorial calendar", "Repurpose workflows", "Social handoff"],
  },
  social: {
    headline: "Schedule once, stay on-brand everywhere.",
    bullets: ["Multi-channel queue", "Best-time suggestions", "Performance snapshots", "AI caption drafts"],
  },
  website: {
    headline: "Landing pages without leaving the OS.",
    bullets: ["Block editor", "Form capture to CRM", "Link surfaces", "Publish previews"],
  },
  calendar: {
    headline: "Availability, bookings, and reminders unified.",
    bullets: ["Booking links", "Meeting sync", "Reminder automations", "CRM event linking"],
  },
  leads: {
    headline: "Capture, score, enrich, and route automatically.",
    bullets: ["Form & page capture", "Enrichment hooks", "Lead scoring", "CRM routing rules"],
  },
  finance: {
    headline: "Revenue, invoices, and cash flow in one view.",
    bullets: ["Invoice generation", "Payment status", "Revenue snapshots", "Export-ready reports"],
  },
  analytics: {
    headline: "Cross-module KPIs with AI commentary.",
    bullets: ["Unified dashboard", "Period comparisons", "Anomaly highlights", "Shareable reports"],
  },
  studio: {
    headline: "Agents that plan, act, and report with guardrails.",
    bullets: ["Prompt library", "Approval gates", "Multi-step workflows", "Run history & credits"],
  },
};

export const INTEGRATION_DETAILS: Record<string, { sync: string; features: string[] }> = {
  default: {
    sync: "Bi-directional sync in under 2 seconds.",
    features: ["OAuth connect", "Field mapping", "Webhook events", "Workspace-scoped permissions"],
  },
  stripe: {
    sync: "Real-time payment and subscription events.",
    features: ["Checkout sync", "Invoice webhooks", "Customer linking", "Revenue reporting"],
  },
  openai: {
    sync: "Model routing through workspace AI layer.",
    features: ["GPT completions", "Tool use", "Credit metering", "Fallback models"],
  },
  slack: {
    sync: "Instant notifications to channels.",
    features: ["Deal alerts", "Inbox mentions", "Agent updates", "Custom routing"],
  },
};
