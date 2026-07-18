import { redirect } from "next/navigation";
import { getCrmDashboardStats, listActivities, listDeals } from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureCrmAiToolsRegistered } from "../../../lib/crm-ai";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { CrmShell } from "../../../components/crm/crm-shell";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { registered } = ensureCrmAiToolsRegistered();
  const workspaceId = context.active.workspace.id;
  const [stats, deals, activities] = await Promise.all([
    getCrmDashboardStats({ workspaceId }),
    listDeals({ workspaceId }),
    listActivities({ workspaceId }),
  ]);

  const recentDeals = deals.slice(0, 5);
  const recentActivities = activities.slice(0, 5);

  return (
    <CrmShell
      title="CRM Dashboard"
      description="Actora foundation — contacts, pipeline, and activity in one workspace-aware surface."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Contacts" value={stats.contacts} hint="People in this workspace" />
        <StatCard title="Companies" value={stats.companies} hint="Accounts tracked" />
        <StatCard title="Leads" value={stats.leads} hint="Lifecycle stage = lead" />
        <StatCard title="Open deals" value={stats.openDeals} hint="Not won or lost" />
        <StatCard
          title="Pipeline"
          value={`$${stats.pipelineValue.toLocaleString()}`}
          hint="Open deal value"
        />
        <StatCard title="Activities" value={stats.activities} hint="Calls, tasks, meetings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent deals</CardTitle>
            <CardDescription>Latest pipeline movement</CardDescription>
          </CardHeader>
          <ul className="space-y-2">
            {recentDeals.length === 0 ? (
              <li className="text-sm text-muted">No deals yet</li>
            ) : (
              recentDeals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                >
                  <span className="truncate text-foreground">{deal.title}</span>
                  <span className="text-secondary">
                    ${deal.amount.toLocaleString()} · {deal.stage}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>What the team has logged</CardDescription>
          </CardHeader>
          <ul className="space-y-2">
            {recentActivities.length === 0 ? (
              <li className="text-sm text-muted">No activities yet</li>
            ) : (
              recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                >
                  <span className="truncate text-foreground">{activity.subject}</span>
                  <Badge variant="default">{activity.type}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI tools registered</CardTitle>
          <CardDescription>
            CRM actions keep these tools available to the AI Tool Registry automatically.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {(registered.length
            ? registered
            : [
                "crm.listContacts",
                "crm.createLead",
                "crm.updateDeal",
                "crm.searchCompany",
                "crm.getCustomerTimeline",
                "crm.listDeals",
              ]
          ).map((name) => (
            <Badge key={name} variant="accent">
              {name}
            </Badge>
          ))}
        </div>
      </Card>
    </CrmShell>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </Card>
  );
}
