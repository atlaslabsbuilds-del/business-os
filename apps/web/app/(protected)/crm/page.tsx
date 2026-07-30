import { redirect } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureCrmAiToolsRegistered } from "../../../lib/crm-ai";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getCrmModuleData } from "../actions/crm";
import { CrmShell } from "../../../components/crm/crm-shell";
import { CrmAiInsightsCard } from "../../../components/crm/crm-extra";
import { CrmGlobalSearch } from "../../../components/crm/crm-global-search";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { registered } = ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();
  const recentActivities = data.activities.slice(0, 6);

  return (
    <CrmShell
      title="CRM Overview"
      description="Leads, pipeline, and customer relationships in one AI-native workspace."
      actions={<CrmGlobalSearch />}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total leads" value={data.stats.leads} hint="Lifecycle = lead" />
        <StatCard
          title="Qualified leads"
          value={data.stats.qualifiedLeads}
          hint="Ready for outreach"
        />
        <StatCard title="Open deals" value={data.stats.openDeals} hint="Active pipeline" />
        <StatCard title="Won deals" value={data.stats.wonDeals} hint="Closed won" />
        <StatCard title="Lost deals" value={data.stats.lostDeals} hint="Closed lost" />
        <StatCard
          title="Revenue pipeline"
          value={`$${data.stats.pipelineValue.toLocaleString()}`}
          hint="Open deal value"
        />
        <StatCard
          title="Conversion rate"
          value={`${data.stats.conversionRate}%`}
          hint="Won / closed"
        />
        <StatCard
          title="Sales this month"
          value={`$${data.stats.salesThisMonth.toLocaleString()}`}
          hint="Won amount MTD"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activities</CardTitle>
            <CardDescription>Latest calls, meetings, emails, and tasks</CardDescription>
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
        <CrmAiInsightsCard stats={data.stats} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kairos CRM tools</CardTitle>
          <CardDescription>
            Ask Kairos to show hot leads, create deals, summarize history, or predict closings.
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
