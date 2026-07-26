export type KairosCommand = {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  module: string;
};

export const KAIROS_COMMANDS: KairosCommand[] = [
  {
    id: "summarize-emails",
    label: "Summarize today's emails",
    description: "Open Inbox and ask Kairos for a daily email digest.",
    href: "/chat?prompt=Summarize%20today%27s%20emails",
    keywords: ["email", "inbox", "summarize", "digest"],
    module: "inbox",
  },
  {
    id: "linkedin-content",
    label: "Generate LinkedIn content",
    description: "Jump into Content OS with a LinkedIn draft brief.",
    href: "/content?tab=composer&prompt=linkedin",
    keywords: ["linkedin", "content", "social", "post"],
    module: "content",
  },
  {
    id: "overdue-deals",
    label: "Show overdue deals",
    description: "Review CRM deals that need attention.",
    href: "/crm/deals",
    keywords: ["deals", "crm", "overdue", "pipeline"],
    module: "crm",
  },
  {
    id: "schedule-meeting",
    label: "Schedule meeting",
    description: "Open Calendar OS to book time.",
    href: "/calendar",
    keywords: ["meeting", "calendar", "schedule", "booking"],
    module: "calendar",
  },
  {
    id: "create-workflow",
    label: "Create workflow",
    description: "Ask Operations Agent to design a workflow.",
    href: "/ai/agents?agent=operations&prompt=Create%20a%20workflow",
    keywords: ["workflow", "automation", "operations"],
    module: "ai_studio",
  },
  {
    id: "analyze-revenue",
    label: "Analyze revenue",
    description: "Open the Finance Agent with a revenue brief.",
    href: "/ai/agents?agent=finance&prompt=Analyze%20revenue",
    keywords: ["revenue", "finance", "analyze"],
    module: "finance",
  },
  {
    id: "ask-kairos",
    label: "Ask Kairos",
    description: "Open your AI Business Copilot.",
    href: "/chat",
    keywords: ["kairos", "chat", "ask", "ai"],
    module: "chat",
  },
  {
    id: "memory",
    label: "Manage Kairos memory",
    description: "View, edit, or turn memory on/off.",
    href: "/ai/memory",
    keywords: ["memory", "remember", "brand", "preferences"],
    module: "ai_studio",
  },
  {
    id: "activity",
    label: "Workspace activity timeline",
    description: "See what happened across the workspace.",
    href: "/ai/activity",
    keywords: ["activity", "timeline", "history", "audit"],
    module: "workspace",
  },
  {
    id: "versions",
    label: "AI version history",
    description: "Restore, compare, and duplicate AI outputs.",
    href: "/ai/versions",
    keywords: ["version", "restore", "history", "compare"],
    module: "ai_studio",
  },
];

export function matchKairosCommands(query: string, limit = 8): KairosCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return KAIROS_COMMANDS.slice(0, limit);
  return KAIROS_COMMANDS.filter((command) => {
    const haystack = [
      command.label,
      command.description,
      command.module,
      ...command.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }).slice(0, limit);
}
