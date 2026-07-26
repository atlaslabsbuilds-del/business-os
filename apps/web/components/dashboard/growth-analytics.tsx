import type { DashboardSnapshot } from "@repo/types";
import { SectionShell } from "./section-shell";

export function GrowthAnalytics({ snapshot }: { snapshot: DashboardSnapshot }) {
  const metrics = [
    { label: "Contacts", value: snapshot.growth.contacts },
    { label: "Companies", value: snapshot.growth.companies },
    { label: "Leads", value: snapshot.growth.leads },
    { label: "Open deals", value: snapshot.growth.openDeals },
    { label: "Conversations", value: snapshot.growth.conversations },
    { label: "Unread", value: snapshot.growth.unread },
    { label: "Members", value: snapshot.growth.members },
  ];
  const max = Math.max(...metrics.map((metric) => metric.value), 1);

  return (
    <SectionShell
      title="Growth Analytics"
      description="Cross-module momentum across Actora CRM, Inbox, Chat, and Workspace."
      actionHref="/crm"
      actionLabel="CRM overview"
    >
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">{metric.label}</span>
              <span className="font-medium text-foreground">
                {metric.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.max(metric.value === 0 ? 0 : 6, (metric.value / max) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
