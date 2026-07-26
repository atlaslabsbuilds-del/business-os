import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Inbox,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import { getDashboardSnapshot } from "@repo/database/dashboard";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { PERSONAL_BRAND_MODULES } from "../../../lib/modules";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, email, memberships, userId } = context;
  const snapshot = await getDashboardSnapshot({
    workspaceId: active.workspace.id,
    userId,
    membershipCount: memberships.length,
    role: active.role,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pbos-animate-rise">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <Badge variant="accent" className="w-fit gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden />
            Personal Brand OS
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {active.workspace.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              One workspace for leads, clients, content, inbox, AI, and revenue.
              Signed in as{" "}
              <span className="text-foreground">{email ?? "unknown"}</span>.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-2 text-center shadow-soft sm:min-w-[320px]">
          <MiniStat label="Members" value={snapshot.workspace.members} />
          <MiniStat label="Invites" value={snapshot.workspace.pendingInvites} />
          <MiniStat label="Role" value={snapshot.workspace.role} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Revenue pipeline"
          value={formatCurrency(snapshot.kpis.revenue)}
          hint={`${snapshot.crm.openDeals} open deals tracked in CRM`}
          icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
          href="/crm/deals"
        />
        <KpiCard
          title="Leads"
          value={snapshot.kpis.leads.toLocaleString()}
          hint={`${snapshot.crm.contacts} contacts · ${snapshot.crm.companies} companies`}
          icon={<Target className="h-4 w-4" aria-hidden />}
          href="/crm/leads"
        />
        <KpiCard
          title="Open tasks"
          value={snapshot.kpis.openTasks.toLocaleString()}
          hint="Tasks shared across inbox and follow-up workflows"
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
          href="/inbox/tasks"
        />
        <KpiCard
          title="Calendar"
          value={snapshot.kpis.upcomingEvents.toLocaleString()}
          hint="Upcoming meetings and events"
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          href="/inbox/calendar"
        />
        <KpiCard
          title="Inbox"
          value={snapshot.inbox.unread.toLocaleString()}
          hint={`${snapshot.inbox.openThreads} open threads`}
          icon={<Inbox className="h-4 w-4" aria-hidden />}
          href="/inbox"
        />
        <KpiCard
          title="AI credits"
          value={snapshot.kpis.aiCredits.toLocaleString()}
          hint={`${snapshot.chat.conversations} assistant conversations`}
          icon={<Bot className="h-4 w-4" aria-hidden />}
          href="/chat"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card elevated>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
              AI insights
            </CardTitle>
            <CardDescription>
              Workspace-aware signals from CRM, inbox, calendar, and credits.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {snapshot.insights.map((insight) => (
              <Link
                key={`${insight.module}-${insight.title}`}
                href={insight.actionUrl}
                className="group flex gap-3 rounded-2xl border border-border bg-surface p-3 transition duration-200 hover:border-primary/40 hover:bg-elevated"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {insight.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-secondary">
                    {insight.body}
                  </span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 text-muted transition group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" aria-hidden />
              Notifications
            </CardTitle>
            <CardDescription>Shared notification feed for every module.</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            {snapshot.notifications.length === 0 ? (
              <EmptyState text="No notifications yet. Module alerts will appear here." />
            ) : (
              snapshot.notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.actionUrl ?? "/dashboard"}
                  className="block rounded-xl border border-border bg-elevated px-3 py-2 transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <Badge variant={notification.readAt ? "default" : "accent"}>
                      {notification.module}
                    </Badge>
                  </div>
                  {notification.body ? (
                    <p className="mt-1 line-clamp-2 text-xs text-secondary">
                      {notification.body}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardList
          title="Tasks"
          description="Open follow-ups"
          empty="No open tasks"
          items={snapshot.tasks.map((task) => ({
            id: task.id,
            label: task.title,
            meta: formatDateTime(task.dueAt),
            href: task.actionUrl,
          }))}
        />
        <DashboardList
          title="Calendar"
          description="Upcoming events"
          empty="No scheduled events"
          items={snapshot.events.map((event) => ({
            id: event.id,
            label: event.title,
            meta: formatDateTime(event.startsAt),
            href: event.actionUrl,
          }))}
        />
        <DashboardList
          title="Activity"
          description="Recent workspace events"
          empty="No activity yet"
          items={snapshot.activity.slice(0, 5).map((event) => ({
            id: event.id,
            label: event.title,
            meta: `${event.module} · ${formatDateTime(event.createdAt)}`,
            href: event.actionUrl ?? "/dashboard",
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Shared AI memory</CardTitle>
            <CardDescription>
              Persisted workspace context available to module AI workflows.
            </CardDescription>
          </CardHeader>
          <div className="space-y-2">
            {snapshot.memory.length === 0 ? (
              <EmptyState text="No saved workspace memories yet." />
            ) : (
              snapshot.memory.map((memory) => (
                <div
                  key={memory.id}
                  className="rounded-xl border border-border bg-elevated px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="accent">{memory.sourceModule}</Badge>
                    <span className="text-xs text-muted">
                      Importance {memory.importance}/5
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-secondary">
                    {memory.summary ?? memory.fact}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating system modules</CardTitle>
            <CardDescription>
              Actora and Advora capabilities live inside the same workspace.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSONAL_BRAND_MODULES.map((module) => {
              const enabled = module.status !== "coming_soon";
              const content = (
                <div className="h-full rounded-2xl border border-border bg-elevated p-4 transition duration-200 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {module.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-secondary">
                        {module.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        module.status === "active"
                          ? "success"
                          : module.status === "foundation"
                            ? "accent"
                            : "default"
                      }
                    >
                      {module.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {module.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability}
                        className="rounded-lg border border-border px-2 py-0.5 text-[11px] text-muted"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              );

              return enabled ? (
                <Link key={module.id} href={module.route}>
                  {content}
                </Link>
              ) : (
                <div key={module.id} aria-disabled="true">
                  {content}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-elevated px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium capitalize text-foreground">
        {value}
      </p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon,
  href,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group h-full hover:border-primary/40 hover:bg-elevated">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{title}</CardTitle>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-muted text-primary transition group-hover:scale-105">
              {icon}
            </span>
          </div>
          <CardDescription>{hint}</CardDescription>
        </CardHeader>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </Card>
    </Link>
  );
}

function DashboardList({
  title,
  description,
  empty,
  items,
}: {
  title: string;
  description: string;
  empty: string;
  items: Array<{ id: string; label: string; meta: string; href: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Clock3 className="h-4 w-4 text-primary" aria-hidden />
        </div>
      </CardHeader>
      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyState text={empty} />
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-xl border border-border bg-elevated px-3 py-2 transition hover:border-primary/40"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-muted">{item.meta}</p>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-elevated px-3 py-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
