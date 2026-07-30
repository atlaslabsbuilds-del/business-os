"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type {
  CrmDeal,
  CrmDealStage,
  CrmPipelineStage,
  CrmReportSnapshot,
  CrmSettings,
  CrmTask,
} from "@repo/types";
import {
  createCrmPipelineStageAction,
  createCrmTaskAction,
  updateCrmDealAction,
  updateCrmSettingsAction,
  updateCrmTaskAction,
} from "../../app/(protected)/actions/crm";

const inputClass =
  "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none focus:border-primary/50";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const DEFAULT_STAGES: Array<{ slug: CrmDealStage; name: string; color: string }> = [
  { slug: "lead", name: "Lead", color: "#94a3b8" },
  { slug: "qualified", name: "Qualified", color: "#38bdf8" },
  { slug: "proposal", name: "Proposal", color: "#a78bfa" },
  { slug: "negotiation", name: "Negotiation", color: "#f97316" },
  { slug: "won", name: "Won", color: "#22c55e" },
  { slug: "lost", name: "Lost", color: "#ef4444" },
];

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-secondary">
      {text}
    </div>
  );
}

export function CrmPipelineBoard({
  deals,
  stages,
  pipelineId,
}: {
  deals: CrmDeal[];
  stages: CrmPipelineStage[];
  pipelineId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (stages.length > 0) {
      return stages.map((stage) => ({
        key: stage.slug,
        name: stage.name,
        color: stage.color,
      }));
    }
    return DEFAULT_STAGES.map((stage) => ({
      key: stage.slug,
      name: stage.name,
      color: stage.color,
    }));
  }, [stages]);

  function moveDeal(dealId: string, stage: string) {
    const allowed = new Set(DEFAULT_STAGES.map((item) => item.slug));
    if (!allowed.has(stage as CrmDealStage)) {
      setError(
        "Move deals onto Lead, Qualified, Proposal, Negotiation, Won, or Lost. Custom columns are for planning labels.",
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateCrmDealAction({
        id: dealId,
        stage,
      });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary">
          Drag deals across stages. Custom stages sync from Settings.
        </p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get("name") ?? "").trim();
            if (!name) return;
            setError(null);
            startTransition(async () => {
              const result = await createCrmPipelineStageAction({
                pipelineId,
                name,
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input
            name="name"
            placeholder="Custom stage"
            className={`${inputClass} w-44`}
          />
          <Button type="submit" loading={pending} size="sm">
            Add stage
          </Button>
        </form>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => {
          const columnDeals = deals.filter((deal) => deal.stage === column.key);
          return (
            <div
              key={column.key}
              className="bos-glass min-w-[260px] flex-1 rounded-2xl p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggingId) return;
                moveDeal(draggingId, column.key);
                setDraggingId(null);
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="text-sm font-semibold text-foreground">{column.name}</h3>
                </div>
                <Badge variant="default">{columnDeals.length}</Badge>
              </div>
              <div className="space-y-2">
                {columnDeals.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                    Drop deals here
                  </p>
                ) : (
                  columnDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className={`w-full rounded-xl border border-border bg-elevated/70 p-3 text-left transition hover:border-primary/40 ${
                        draggingId === deal.id ? "opacity-60" : ""
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {deal.title}
                      </p>
                      <p className="mt-1 text-xs text-secondary">
                        {money(deal.amount)} · {deal.probability}%
                      </p>
                      {deal.expectedCloseDate ? (
                        <p className="mt-1 text-[11px] text-muted">
                          Close {deal.expectedCloseDate}
                        </p>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CrmTasksPanel({ tasks }: { tasks: CrmTask[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Create task</CardTitle>
          <CardDescription>Track follow-ups with priority, due date, and reminders.</CardDescription>
        </CardHeader>
        <form
          className="grid gap-3 px-5 pb-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await createCrmTaskAction({
                title: String(form.get("title") ?? ""),
                description: String(form.get("description") ?? "") || null,
                priority: String(form.get("priority") ?? "medium") as CrmTask["priority"],
                dueAt: String(form.get("dueAt") ?? "") || null,
                reminderAt: String(form.get("reminderAt") ?? "") || null,
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input name="title" required placeholder="Follow up with Acme" className={inputClass} />
          <select name="priority" defaultValue="medium" className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input name="dueAt" type="datetime-local" className={inputClass} />
          <input name="reminderAt" type="datetime-local" className={inputClass} />
          <textarea
            name="description"
            placeholder="Notes"
            className={`${inputClass} min-h-24 sm:col-span-2`}
          />
          <Button type="submit" loading={pending}>
            Create task
          </Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>

      {tasks.length === 0 ? (
        <EmptyPanel text="No CRM tasks yet. Create one to start the follow-up queue." />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} elevated className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="mt-1 text-sm text-secondary">
                    {task.description || "No description"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="default">{task.status}</Badge>
                    <Badge variant={task.priority === "urgent" || task.priority === "high" ? "warning" : "default"}>
                      {task.priority}
                    </Badge>
                    {task.dueAt ? (
                      <Badge variant="default">Due {new Date(task.dueAt).toLocaleString()}</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status !== "done" ? (
                    <Button
                      size="sm"
                      loading={pending}
                      onClick={() => {
                        startTransition(async () => {
                          await updateCrmTaskAction({ id: task.id, status: "done" });
                          router.refresh();
                        });
                      }}
                    >
                      Complete
                    </Button>
                  ) : null}
                  {task.status === "open" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={pending}
                      onClick={() => {
                        startTransition(async () => {
                          await updateCrmTaskAction({ id: task.id, status: "in_progress" });
                          router.refresh();
                        });
                      }}
                    >
                      Start
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CrmReportsPanel({ report }: { report: CrmReportSnapshot }) {
  const maxStage = Math.max(1, ...report.dealsByStage.map((row) => row.value));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card elevated>
        <CardHeader>
          <CardTitle>Revenue forecast</CardTitle>
          <CardDescription>Open pipeline weighted as near-term opportunity.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          <p className="text-3xl font-semibold text-accent">{money(report.openValue)}</p>
          <p className="text-sm text-secondary">
            Won {money(report.wonValue)} · Lost {money(report.lostValue)} · Win rate {report.winRate}%
          </p>
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Win / loss</CardTitle>
          <CardDescription>Closed deal performance.</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <div className="rounded-xl bg-elevated p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Won</p>
            <p className="mt-1 text-xl font-semibold text-success">{money(report.wonValue)}</p>
          </div>
          <div className="rounded-xl bg-elevated p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Lost</p>
            <p className="mt-1 text-xl font-semibold text-error">{money(report.lostValue)}</p>
          </div>
        </div>
      </Card>
      <Card elevated className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Pipeline report</CardTitle>
          <CardDescription>Deal count and value by stage.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-6">
          {report.dealsByStage.map((row) => (
            <div key={row.stage} className="rounded-xl bg-elevated p-3">
              <p className="text-xs uppercase tracking-wide text-muted">{row.stage}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{row.count}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(8, (row.value / maxStage) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-secondary">{money(row.value)}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card elevated className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales by month</CardTitle>
          <CardDescription>Won and lost value over recent months.</CardDescription>
        </CardHeader>
        {report.salesByMonth.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyPanel text="Close deals to unlock monthly performance charts." />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 px-5 pb-5 sm:grid-cols-6">
            {report.salesByMonth.map((point) => (
              <div key={point.month} className="min-w-0">
                <div className="flex h-32 items-end gap-1 rounded-t-lg bg-elevated px-2 pb-0">
                  <div
                    className="w-1/2 rounded-t-md bg-success/80"
                    style={{
                      height: `${Math.max(6, Math.min(100, (point.won / Math.max(1, report.wonValue)) * 100))}%`,
                    }}
                  />
                  <div
                    className="w-1/2 rounded-t-md bg-error/70"
                    style={{
                      height: `${Math.max(6, Math.min(100, (point.lost / Math.max(1, report.lostValue || report.wonValue || 1)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 truncate text-center text-[10px] text-muted">{point.month}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function CrmSettingsPanel({
  settings,
  pipelineId,
}: {
  settings: CrmSettings;
  pipelineId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState(settings.leadSources.join(", "));
  const [automation, setAutomation] = useState(
    JSON.stringify(settings.automationRules, null, 2),
  );
  const [customFields, setCustomFields] = useState(
    JSON.stringify(settings.customFields, null, 2),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card elevated>
        <CardHeader>
          <CardTitle>Lead sources</CardTitle>
          <CardDescription>Comma-separated sources available on leads.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          <textarea
            value={sources}
            onChange={(event) => setSources(event.target.value)}
            className={`${inputClass} min-h-28`}
          />
          <Button
            loading={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await updateCrmSettingsAction({
                  leadSources: sources
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  defaultPipelineId: pipelineId,
                });
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
          >
            Save sources
          </Button>
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Import / export and CRM operator controls.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5 text-sm text-secondary">
          <p>Export: {settings.permissions.canExport === false ? "Disabled" : "Enabled"}</p>
          <p>Import: {settings.permissions.canImport === false ? "Disabled" : "Enabled"}</p>
          <Button
            variant="secondary"
            loading={pending}
            onClick={() => {
              startTransition(async () => {
                await updateCrmSettingsAction({
                  permissions: {
                    ...settings.permissions,
                    canExport: settings.permissions.canExport !== false,
                    canImport: settings.permissions.canImport !== false,
                  },
                });
                router.refresh();
              });
            }}
          >
            Refresh permissions defaults
          </Button>
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Custom fields</CardTitle>
          <CardDescription>JSON array of workspace field definitions.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          <textarea
            value={customFields}
            onChange={(event) => setCustomFields(event.target.value)}
            className={`${inputClass} min-h-40 font-mono text-xs`}
          />
          <Button
            loading={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const parsed = JSON.parse(customFields) as Array<Record<string, unknown>>;
                  const result = await updateCrmSettingsAction({ customFields: parsed });
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                } catch {
                  setError("Custom fields must be valid JSON.");
                }
              });
            }}
          >
            Save custom fields
          </Button>
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Automation rules</CardTitle>
          <CardDescription>JSON rules for lead routing and stage triggers.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          <textarea
            value={automation}
            onChange={(event) => setAutomation(event.target.value)}
            className={`${inputClass} min-h-40 font-mono text-xs`}
          />
          <Button
            loading={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const parsed = JSON.parse(automation) as Array<Record<string, unknown>>;
                  const result = await updateCrmSettingsAction({ automationRules: parsed });
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                } catch {
                  setError("Automation rules must be valid JSON.");
                }
              });
            }}
          >
            Save automation
          </Button>
        </div>
      </Card>
      {error ? <p className="text-sm text-error lg:col-span-2">{error}</p> : null}
    </div>
  );
}

export function CrmAiInsightsCard({
  stats,
}: {
  stats: {
    qualifiedLeads: number;
    openDeals: number;
    conversionRate: number;
    pipelineValue: number;
    salesThisMonth: number;
  };
}) {
  const insights = [
    stats.qualifiedLeads > 0
      ? `${stats.qualifiedLeads} qualified leads are ready for outreach.`
      : "Qualify more leads to improve pipeline health.",
    stats.openDeals > 0
      ? `${money(stats.pipelineValue)} sits in open deals — prioritize negotiation-stage movement.`
      : "Create deals from hot leads to activate the revenue pipeline.",
    stats.conversionRate >= 40
      ? `Win rate is strong at ${stats.conversionRate}%. Double down on current playbooks.`
      : `Conversion is at ${stats.conversionRate}%. Review stalled proposals and lost-deal notes.`,
    stats.salesThisMonth > 0
      ? `Sales this month: ${money(stats.salesThisMonth)}.`
      : "No closed won deals yet this month — schedule follow-ups on active opportunities.",
  ];

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>AI sales insights</CardTitle>
        <CardDescription>Deterministic coaching from live CRM metrics.</CardDescription>
      </CardHeader>
      <ul className="space-y-2 px-5 pb-5">
        {insights.map((insight) => (
          <li
            key={insight}
            className="rounded-xl border border-border/70 bg-elevated/50 px-3 py-2 text-sm text-secondary"
          >
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  );
}
