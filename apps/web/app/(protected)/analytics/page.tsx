import Link from "next/link";
import { redirect } from "next/navigation";
import { getCrmDashboardStats } from "@repo/database/crm";
import { getInboxDashboardStats } from "@repo/database/inbox";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ModulePageShell } from "../../../components/app/module-page-shell";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const workspaceId = context.active.workspace.id;
  const [crm, inbox] = await Promise.all([
    getCrmDashboardStats({ workspaceId }),
    getInboxDashboardStats({ workspaceId }),
  ]);

  const cards = [
    {
      title: "Pipeline value",
      value: `$${crm.pipelineValue.toLocaleString()}`,
      hint: "Open deals",
      href: "/crm/deals",
    },
    {
      title: "Contacts",
      value: String(crm.contacts),
      hint: "Customer directory",
      href: "/customers",
    },
    {
      title: "Unread threads",
      value: String(inbox.unread),
      hint: "Inbox attention",
      href: "/inbox",
    },
    {
      title: "Open deals",
      value: String(crm.openDeals),
      hint: "Active pipeline",
      href: "/crm",
    },
  ];

  return (
    <ModulePageShell
      badge="Analytics"
      title="Analytics"
      description="Cross-module momentum for CRM, Inbox, and growth — ask Kairos for deeper insight."
      actions={
        <Link
          href="/chat?prompt=Analyze%20workspace%20performance"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Ask Kairos
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition hover:border-primary/40 hover:bg-elevated/60">
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-3xl tracking-tight">{card.value}</CardTitle>
                <CardDescription>{card.hint}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </ModulePageShell>
  );
}
