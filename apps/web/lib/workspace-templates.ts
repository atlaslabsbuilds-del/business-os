import {
  BarChart3,
  Briefcase,
  Building2,
  Megaphone,
  Rocket,
  Settings2,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceTemplateKey } from "@repo/types";

export type WorkspaceTemplate = {
  key: WorkspaceTemplateKey;
  name: string;
  description: string;
  icon: LucideIcon;
  modules: string[];
  quickStarts: Array<{ title: string; href: string }>;
};

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    key: "startup",
    name: "Startup",
    description: "Launch CRM, projects, finance, docs, and Kairos operating rhythms.",
    icon: Rocket,
    modules: ["CRM", "Projects", "Finance", "Documents", "Kairos"],
    quickStarts: [
      { title: "Create launch plan", href: "/projects" },
      { title: "Track investor pipeline", href: "/crm/deals" },
    ],
  },
  {
    key: "agency",
    name: "Agency",
    description: "Manage clients, proposals, projects, retainers, and team delivery.",
    icon: Briefcase,
    modules: ["CRM", "Projects", "Finance", "Calendar", "Documents"],
    quickStarts: [
      { title: "Build client pipeline", href: "/crm" },
      { title: "Plan delivery board", href: "/projects/kanban" },
    ],
  },
  {
    key: "saas",
    name: "SaaS",
    description: "Track product launches, sales pipeline, customer success, and analytics.",
    icon: BarChart3,
    modules: ["Analytics", "CRM", "Projects", "Documents", "Notifications"],
    quickStarts: [
      { title: "Review analytics", href: "/analytics" },
      { title: "Create roadmap document", href: "/documents" },
    ],
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Campaign planning, content systems, social ops, and reporting.",
    icon: Megaphone,
    modules: ["Content", "Social", "Website", "Analytics", "Kairos"],
    quickStarts: [
      { title: "Open marketing hub", href: "/marketing" },
      { title: "Draft content plan", href: "/content" },
    ],
  },
  {
    key: "sales",
    name: "Sales",
    description: "Contacts, deals, tasks, follow-ups, meetings, and forecasts.",
    icon: Users,
    modules: ["CRM", "Calendar", "Notifications", "Analytics", "Finance"],
    quickStarts: [
      { title: "Open pipeline", href: "/crm/pipeline" },
      { title: "Find follow-ups", href: "/crm/tasks" },
    ],
  },
  {
    key: "operations",
    name: "Operations",
    description: "Processes, projects, knowledge base, meetings, and security.",
    icon: Settings2,
    modules: ["Projects", "Documents", "Calendar", "Security", "Activity"],
    quickStarts: [
      { title: "Create SOP", href: "/documents/knowledge" },
      { title: "Review security", href: "/settings/security" },
    ],
  },
  {
    key: "consulting",
    name: "Consulting",
    description: "Client workspaces, proposals, invoices, project delivery, and knowledge.",
    icon: Building2,
    modules: ["CRM", "Finance", "Projects", "Documents", "Calendar"],
    quickStarts: [
      { title: "Create client project", href: "/projects" },
      { title: "Send first invoice", href: "/finance/invoices" },
    ],
  },
  {
    key: "blank",
    name: "Blank Workspace",
    description: "Start clean and let Kairos help build your operating system.",
    icon: Sparkles,
    modules: ["Dashboard", "Kairos", "Settings"],
    quickStarts: [
      { title: "Ask Kairos", href: "/chat" },
      { title: "Configure settings", href: "/settings" },
    ],
  },
];

export function getWorkspaceTemplate(key?: string | null): WorkspaceTemplate {
  return (
    WORKSPACE_TEMPLATES.find((template) => template.key === key) ??
    WORKSPACE_TEMPLATES[WORKSPACE_TEMPLATES.length - 1]!
  );
}
