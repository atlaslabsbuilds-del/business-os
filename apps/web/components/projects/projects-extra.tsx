"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type {
  Project,
  ProjectDashboardStats,
  ProjectMember,
  ProjectReportSnapshot,
  ProjectSettings,
  ProjectTask,
  ProjectTaskStatus,
  ProjectTimeLog,
} from "@repo/types";
import {
  createProjectAction,
  createProjectTaskAction,
  deleteProjectAction,
  duplicateProjectAction,
  generateProjectReportAction,
  updateProjectAction,
  updateProjectSettingsAction,
  updateProjectTaskAction,
} from "../../app/(protected)/actions/projects";

const inputClass =
  "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none focus:border-primary/50";

const KANBAN: Array<{ key: ProjectTaskStatus; label: string; color: string }> = [
  { key: "backlog", label: "Backlog", color: "#94a3b8" },
  { key: "todo", label: "Todo", color: "#38bdf8" },
  { key: "in_progress", label: "In Progress", color: "#f97316" },
  { key: "review", label: "Review", color: "#a78bfa" },
  { key: "completed", label: "Completed", color: "#22c55e" },
];

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-secondary">
      {text}
    </div>
  );
}

export function ProjectsAiInsights({ stats }: { stats: ProjectDashboardStats }) {
  const insights = [
    stats.overdueTasks > 0
      ? `${stats.overdueTasks} overdue tasks need triage today.`
      : "No overdue tasks — keep the cadence.",
    stats.todayTasks > 0
      ? `${stats.todayTasks} tasks are due today.`
      : "Clear day ahead — pull from backlog or plan milestones.",
    `Team productivity is at ${stats.teamProductivity}% completion.`,
    `Average project progress sits at ${stats.averageProgress}%.`,
  ];
  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
        <CardDescription>Live coaching from project and task telemetry.</CardDescription>
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

export function ProjectsListPanel({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const filtered = projects.filter((project) =>
    project.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Spin up a workspace with owner, priority, and due date.</CardDescription>
        </CardHeader>
        <form
          className="grid gap-3 px-5 pb-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await createProjectAction({
                name: String(form.get("name") ?? ""),
                description: String(form.get("description") ?? "") || null,
                priority: String(form.get("priority") ?? "medium"),
                status: String(form.get("status") ?? "planning"),
                dueDate: String(form.get("dueDate") ?? "") || null,
                teamName: String(form.get("teamName") ?? "") || null,
                tags: String(form.get("tags") ?? "")
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input name="name" required placeholder="Project name" className={inputClass} />
          <input name="teamName" placeholder="Team" className={inputClass} />
          <select name="status" defaultValue="planning" className={inputClass}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
          <select name="priority" defaultValue="medium" className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input name="dueDate" type="date" className={inputClass} />
          <input name="tags" placeholder="Tags (comma separated)" className={inputClass} />
          <textarea
            name="description"
            placeholder="Description"
            className={`${inputClass} min-h-24 sm:col-span-2`}
          />
          <Button type="submit" loading={pending}>
            Create project
          </Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects"
          className={`${inputClass} max-w-sm`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyPanel text="No projects yet. Create one to unlock kanban, timeline, and reports." />
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <Card key={project.id} elevated className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="mt-1 text-sm text-secondary">
                    {project.description || "No description"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="default">{project.status}</Badge>
                    <Badge variant="accent">{project.priority}</Badge>
                    <Badge variant="default">{project.progress}%</Badge>
                    {project.dueDate ? <Badge variant="default">Due {project.dueDate}</Badge> : null}
                    {project.teamName ? <Badge variant="default">{project.teamName}</Badge> : null}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await updateProjectAction({
                          id: project.id,
                          isArchived: true,
                          status: "archived",
                        });
                        router.refresh();
                      });
                    }}
                  >
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await duplicateProjectAction({ id: project.id });
                        router.refresh();
                      });
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteProjectAction({ id: project.id });
                        router.refresh();
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsTasksPanel({
  projects,
  tasks,
}: {
  projects: Project[];
  tasks: ProjectTask[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaultProjectId = projects[0]?.id ?? "";

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Create task</CardTitle>
          <CardDescription>Priority, due date, assignee-ready tasks with dependencies support.</CardDescription>
        </CardHeader>
        <form
          className="grid gap-3 px-5 pb-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!defaultProjectId) {
              setError("Create a project first.");
              return;
            }
            const form = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await createProjectTaskAction({
                projectId: String(form.get("projectId") ?? defaultProjectId),
                title: String(form.get("title") ?? ""),
                description: String(form.get("description") ?? "") || null,
                priority: String(form.get("priority") ?? "medium"),
                status: String(form.get("status") ?? "todo"),
                dueAt: String(form.get("dueAt") ?? "") || null,
                labels: String(form.get("labels") ?? "")
                  .split(",")
                  .map((label) => label.trim())
                  .filter(Boolean),
                isMilestone: form.get("isMilestone") === "on",
                isRecurring: form.get("isRecurring") === "on",
              });
              if (!result.ok) setError(result.error);
              else {
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <select name="projectId" defaultValue={defaultProjectId} className={inputClass}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <input name="title" required placeholder="Task title" className={inputClass} />
          <select name="status" defaultValue="todo" className={inputClass}>
            {KANBAN.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue="medium" className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input name="dueAt" type="datetime-local" className={inputClass} />
          <input name="labels" placeholder="Labels" className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input name="isMilestone" type="checkbox" /> Milestone
          </label>
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input name="isRecurring" type="checkbox" /> Recurring
          </label>
          <textarea
            name="description"
            placeholder="Description / checklist notes"
            className={`${inputClass} min-h-24 sm:col-span-2`}
          />
          <Button type="submit" loading={pending} disabled={!projects.length}>
            Create task
          </Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>

      {tasks.length === 0 ? (
        <EmptyPanel text="No tasks yet." />
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
                    <Badge variant="accent">{task.priority}</Badge>
                    {task.isMilestone ? <Badge variant="warning">Milestone</Badge> : null}
                    {task.dueAt ? (
                      <Badge variant="default">
                        Due {new Date(task.dueAt).toLocaleString()}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {task.status !== "completed" ? (
                  <Button
                    size="sm"
                    loading={pending}
                    onClick={() => {
                      startTransition(async () => {
                        await updateProjectTaskAction({
                          id: task.id,
                          status: "completed",
                        });
                        router.refresh();
                      });
                    }}
                  >
                    Complete
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsKanbanBoard({ tasks }: { tasks: ProjectTask[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {KANBAN.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <div
              key={column.key}
              className="bos-glass min-w-[250px] flex-1 rounded-2xl p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggingId) return;
                setError(null);
                startTransition(async () => {
                  const result = await updateProjectTaskAction({
                    id: draggingId,
                    status: column.key,
                  });
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                });
                setDraggingId(null);
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="text-sm font-semibold">{column.label}</h3>
                </div>
                <Badge variant="default">{columnTasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    draggable
                    disabled={pending}
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="w-full rounded-xl border border-border bg-elevated/70 p-3 text-left"
                  >
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-secondary">{task.priority}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectsTimeline({ tasks }: { tasks: ProjectTask[] }) {
  const dated = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.startAt || task.dueAt)
        .sort(
          (a, b) =>
            Date.parse(a.startAt ?? a.dueAt ?? "") -
            Date.parse(b.startAt ?? b.dueAt ?? ""),
        ),
    [tasks],
  );
  const milestones = tasks.filter((task) => task.isMilestone);

  if (dated.length === 0) {
    return <EmptyPanel text="Add start/due dates to visualize the Gantt timeline." />;
  }

  const min = Math.min(
    ...dated.map((task) => Date.parse(task.startAt ?? task.dueAt ?? "")),
  );
  const max = Math.max(
    ...dated.map((task) => Date.parse(task.dueAt ?? task.startAt ?? "")),
  );
  const span = Math.max(1, max - min);

  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader>
          <CardTitle>Gantt timeline</CardTitle>
          <CardDescription>Dependencies and milestones with progress tracking.</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          {dated.map((task) => {
            const start = Date.parse(task.startAt ?? task.dueAt ?? "");
            const end = Date.parse(task.dueAt ?? task.startAt ?? "");
            const left = ((start - min) / span) * 100;
            const width = Math.max(4, ((end - start || span * 0.05) / span) * 100);
            return (
              <div key={task.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{task.title}</span>
                  <span className="text-xs text-muted">{task.progress}%</span>
                </div>
                <div className="relative h-3 rounded-full bg-elevated">
                  <div
                    className={`absolute h-full rounded-full ${
                      task.isMilestone ? "bg-warning" : "bg-primary"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                {task.dependsOn.length > 0 ? (
                  <p className="mt-1 text-[11px] text-muted">
                    Depends on {task.dependsOn.length} task(s)
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Milestones & critical path</CardTitle>
          <CardDescription>
            {milestones.length} milestones flagged. Late-stage incomplete tasks form the critical path.
          </CardDescription>
        </CardHeader>
        <ul className="space-y-2 px-5 pb-5">
          {tasks
            .filter((task) => task.status === "review" || task.isMilestone)
            .slice(0, 8)
            .map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
              >
                <span>{task.title}</span>
                <Badge variant={task.isMilestone ? "warning" : "default"}>
                  {task.status}
                </Badge>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}

export function ProjectsCalendar({ tasks }: { tasks: ProjectTask[] }) {
  const byDay = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const key = task.dueAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {byDay.length === 0 ? (
        <div className="md:col-span-2 xl:col-span-3">
          <EmptyPanel text="No deadlines yet. Assign due dates to populate the calendar." />
        </div>
      ) : (
        byDay.map(([day, dayTasks]) => (
          <Card key={day} elevated>
            <CardHeader>
              <CardTitle>{day}</CardTitle>
              <CardDescription>
                {dayTasks.length} deadline{dayTasks.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <ul className="space-y-2 px-5 pb-5">
              {dayTasks.map((task) => (
                <li key={task.id} className="rounded-xl bg-elevated/60 px-3 py-2 text-sm">
                  {task.title}
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}

export function ProjectsTeamsPanel({
  projects,
  members,
}: {
  projects: Project[];
  members: ProjectMember[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.length === 0 ? (
        <EmptyPanel text="Create projects to assign team members." />
      ) : (
        projects.map((project) => {
          const team = members.filter((member) => member.projectId === project.id);
          return (
            <Card key={project.id} elevated>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  {project.teamName || "Unnamed team"} · {team.length} members
                </CardDescription>
              </CardHeader>
              <ul className="space-y-2 px-5 pb-5">
                {team.length === 0 ? (
                  <li className="text-sm text-secondary">Owner only for now</li>
                ) : (
                  team.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-mono text-xs">{member.userId}</span>
                      <Badge variant="default">{member.role}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function ProjectsReportsPanel({
  snapshot,
  logs,
}: {
  snapshot: ProjectReportSnapshot;
  logs: ProjectTimeLog[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const maxRemaining = Math.max(1, ...snapshot.burndown.map((point) => point.remaining));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          loading={pending}
          onClick={() => {
            startTransition(async () => {
              await generateProjectReportAction();
              router.refresh();
            });
          }}
        >
          Generate project report
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Stat title="Health" value={`${snapshot.healthScore}%`} />
        <Stat title="Completion" value={`${snapshot.completionRate}%`} />
        <Stat title="Velocity" value={`${snapshot.velocity}/day`} />
        <Stat title="Time tracked" value={`${snapshot.totalHours.toFixed(1)}h`} />
      </div>
      <Card elevated>
        <CardHeader>
          <CardTitle>Burndown</CardTitle>
          <CardDescription>Remaining vs completed work over the last 7 days.</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-7 items-end gap-2 px-5 pb-5">
          {snapshot.burndown.map((point) => (
            <div key={point.day} className="min-w-0">
              <div className="flex h-32 items-end rounded-t-lg bg-elevated">
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{
                    height: `${Math.max(8, (point.remaining / maxRemaining) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 truncate text-center text-[10px] text-muted">
                {point.day.slice(5)}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Task completion by status</CardTitle>
        </CardHeader>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-5">
          {snapshot.tasksByStatus.map((row) => (
            <div key={row.status} className="rounded-xl bg-elevated p-3">
              <p className="text-xs uppercase tracking-wide text-muted">{row.status}</p>
              <p className="mt-2 text-xl font-semibold">{row.count}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card elevated>
        <CardHeader>
          <CardTitle>Recent time logs</CardTitle>
        </CardHeader>
        <ul className="space-y-2 px-5 pb-5">
          {logs.slice(0, 8).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
            >
              <span>{log.loggedOn}</span>
              <span>{log.hours}h</span>
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="text-sm text-secondary">No time tracked yet.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <p className="px-5 pb-5 text-3xl font-semibold">{value}</p>
    </Card>
  );
}

export function ProjectsSettingsPanel({ settings }: { settings: ProjectSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stages, setStages] = useState(settings.customStages.join(", "));
  const [error, setError] = useState<string | null>(null);

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>Pipeline stages & automation</CardTitle>
        <CardDescription>Customize kanban columns and default task priority.</CardDescription>
      </CardHeader>
      <div className="space-y-3 px-5 pb-5">
        <textarea
          value={stages}
          onChange={(event) => setStages(event.target.value)}
          className={`${inputClass} min-h-28`}
        />
        <select
          defaultValue={settings.defaultPriority}
          className={inputClass}
          onChange={(event) => {
            startTransition(async () => {
              await updateProjectSettingsAction({
                defaultPriority: event.target.value,
              });
              router.refresh();
            });
          }}
        >
          <option value="low">Default priority: Low</option>
          <option value="medium">Default priority: Medium</option>
          <option value="high">Default priority: High</option>
          <option value="urgent">Default priority: Urgent</option>
        </select>
        <Button
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await updateProjectSettingsAction({
                customStages: stages
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              if (!result.ok) setError(result.error);
              else router.refresh();
            });
          }}
        >
          Save settings
        </Button>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    </Card>
  );
}
