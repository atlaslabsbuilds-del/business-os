import type { KairosAgentId } from "@repo/types";

export type KairosAgentDefinition = {
  id: KairosAgentId;
  name: string;
  icon: string;
  description: string;
  color: string;
  suggestedPrompts: string[];
  chatHref: string;
};

export const KAIROS_AGENTS: KairosAgentDefinition[] = [
  {
    id: "sales",
    name: "Sales Agent",
    icon: "Briefcase",
    description:
      "Qualify leads, draft follow-ups, and keep your pipeline moving.",
    color: "#fb923c",
    suggestedPrompts: [
      "Show overdue deals and suggest next steps",
      "Draft a follow-up for my hottest lead",
      "Summarize this week's pipeline movement",
    ],
    chatHref: "/chat?agent=sales",
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    icon: "Megaphone",
    description:
      "Campaign ideas, positioning, and go-to-market messaging for your brand.",
    color: "#f97316",
    suggestedPrompts: [
      "Generate LinkedIn content for this week",
      "Propose a launch campaign outline",
      "Rewrite this offer with stronger positioning",
    ],
    chatHref: "/chat?agent=marketing",
  },
  {
    id: "content",
    name: "Content Agent",
    icon: "PenLine",
    description:
      "Write, repurpose, and schedule content that matches your brand voice.",
    color: "#fdba74",
    suggestedPrompts: [
      "Draft a LinkedIn post in our brand voice",
      "Repurpose my latest blog into 3 social posts",
      "Suggest content for tomorrow at 6 PM",
    ],
    chatHref: "/chat?agent=content",
  },
  {
    id: "support",
    name: "Customer Support Agent",
    icon: "MessageCircle",
    description:
      "Triage inbox threads, draft replies, and surface customer intent.",
    color: "#ffffff",
    suggestedPrompts: [
      "Summarize today's emails",
      "Draft a polite reply for the unread high-priority thread",
      "List customers waiting more than 2 hours",
    ],
    chatHref: "/chat?agent=support",
  },
  {
    id: "finance",
    name: "Finance Agent",
    icon: "Wallet",
    description:
      "Revenue snapshots, credit usage, and finance-ready summaries.",
    color: "#fbbf24",
    suggestedPrompts: [
      "Analyze revenue and open pipeline",
      "Explain this week's AI credit spend",
      "Prepare a finance snapshot for investors",
    ],
    chatHref: "/chat?agent=finance",
  },
  {
    id: "operations",
    name: "Operations Agent",
    icon: "Settings2",
    description:
      "Workflows, tasks, and operational checklists across your workspace.",
    color: "#f59e0b",
    suggestedPrompts: [
      "Create a workflow for lead follow-up",
      "List open tasks due this week",
      "Suggest an ops cadence for our team",
    ],
    chatHref: "/chat?agent=operations",
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    icon: "BarChart3",
    description:
      "Turn workspace metrics into clear insights and recommended actions.",
    color: "#ea580c",
    suggestedPrompts: [
      "Analyze growth across CRM and content",
      "What changed in the last 7 days?",
      "Highlight risks in our pipeline conversion",
    ],
    chatHref: "/chat?agent=analytics",
  },
  {
    id: "hr",
    name: "HR Agent",
    icon: "Users",
    description:
      "Team onboarding, role clarity, and internal communication drafts.",
    color: "#fff7ed",
    suggestedPrompts: [
      "Draft an invite message for a new teammate",
      "Outline onboarding steps for a new hire",
      "Suggest role permissions for a manager",
    ],
    chatHref: "/chat?agent=hr",
  },
];

export function getKairosAgent(id: string): KairosAgentDefinition | undefined {
  return KAIROS_AGENTS.find((agent) => agent.id === id);
}
