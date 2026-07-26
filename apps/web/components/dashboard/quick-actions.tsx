import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Inbox,
  MailPlus,
  Target,
  Users,
} from "lucide-react";
import { SectionShell } from "./section-shell";

const ACTIONS = [
  {
    label: "Ask Kairos",
    description: "Open your AI copilot",
    href: "/chat",
    icon: Bot,
  },
  {
    label: "Inbox",
    description: "Review unread threads",
    href: "/inbox",
    icon: Inbox,
  },
  {
    label: "Add lead",
    description: "Capture a new opportunity",
    href: "/crm/leads",
    icon: Target,
  },
  {
    label: "Schedule",
    description: "View calendar",
    href: "/inbox/calendar",
    icon: CalendarDays,
  },
  {
    label: "Compose reply",
    description: "Jump into inbox replies",
    href: "/inbox",
    icon: MailPlus,
  },
  {
    label: "Invite team",
    description: "Grow the workspace",
    href: "/team",
    icon: Users,
  },
] as const;

export function QuickActions() {
  return (
    <SectionShell
      title="Quick Actions"
      description="Jump into the highest-leverage Actora workflows."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-elevated px-3 py-3 transition duration-200 hover:border-primary/40 hover:bg-surface"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary transition group-hover:scale-105">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">
                  {action.label}
                </span>
                <span className="block text-xs text-muted">
                  {action.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}
