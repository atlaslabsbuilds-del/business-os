import { listWorkspaceActivityEvents } from "@repo/database/activity";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { NotificationsShell } from "../../../../components/notifications/notifications-shell";
import { formatRelative } from "../../../../components/dashboard/format";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

const MODULE_FILTERS = [
  "all",
  "tasks",
  "projects",
  "documents",
  "crm",
  "finance",
  "calendar",
  "integrations",
  "ai",
] as const;

export default async function ActivityCenterPage({
  searchParams,
}: {
  searchParams?: Promise<{ module?: string }>;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const params = searchParams ? await searchParams : {};
  const moduleFilter =
    params.module && MODULE_FILTERS.includes(params.module as (typeof MODULE_FILTERS)[number])
      ? params.module
      : undefined;

  const events = await listWorkspaceActivityEvents({
    workspaceId: context.active.workspace.id,
    module: moduleFilter && moduleFilter !== "all" ? moduleFilter : undefined,
    limit: 80,
  });

  return (
    <NotificationsShell
      title="Activity Center"
      description="Unified timeline across tasks, projects, documents, CRM, finance, calendar, integrations, and user actions."
    >
      <div className="flex flex-wrap gap-2">
        {MODULE_FILTERS.map((item) => {
          const href =
            item === "all"
              ? "/notifications/activity"
              : `/notifications/activity?module=${item}`;
          const active = (moduleFilter ?? "all") === item;
          return (
            <a
              key={item}
              href={href}
              className={`rounded-xl px-3 py-1.5 text-xs capitalize transition ${
                active
                  ? "bg-primary-muted font-medium text-foreground"
                  : "border border-border text-secondary hover:text-foreground"
              }`}
            >
              {item}
            </a>
          );
        })}
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            {events.length} recent events in {context.active.workspace.name}
          </CardDescription>
        </CardHeader>
        <ul className="space-y-3 px-5 pb-5">
          {events.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
              No activity yet. Workspace actions will appear here.
            </li>
          ) : (
            events.map((event) => (
              <li
                key={event.id}
                className="flex gap-3 rounded-2xl border border-border/70 bg-elevated/30 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <Badge variant="default">{event.module}</Badge>
                    <Badge variant="default">{event.eventType}</Badge>
                  </div>
                  {event.body ? (
                    <p className="mt-1 text-xs text-secondary">{event.body}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted">
                    {formatRelative(event.createdAt)}
                  </p>
                </div>
                {event.actionUrl ? (
                  <a
                    href={event.actionUrl}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    Open
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Card>
    </NotificationsShell>
  );
}
