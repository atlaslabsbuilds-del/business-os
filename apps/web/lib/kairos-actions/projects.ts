import "server-only";

import { z } from "zod";
import {
  createProject,
  createProjectReport,
  createProjectTask,
  getProjectDashboardStats,
  getProjectReportSnapshot,
  listProjectTasks,
  listProjects,
  moveOverdueTasks,
  updateProjectTask,
} from "@repo/database";
import type { KairosToolDefinition } from "./types";

export function buildKairosProjectsTools(): KairosToolDefinition[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Array<KairosToolDefinition<any, any>> = [
    {
      name: "createProject",
      description: "Create a new project",
      requiredRole: "Manager",
      schema: z.object({
        name: z.string().trim().min(1).max(160),
        description: z.string().trim().max(4000).optional(),
        dueDate: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const project = await createProject({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          name: input.name,
          description: input.description ?? null,
          dueDate: input.dueDate ?? null,
          status: "active",
        });
        return { project };
      },
    },
    {
      name: "summarizeTodaysTasks",
      description: "Summarize tasks due today",
      requiredRole: "Sales",
      schema: z.object({}),
      execute: async (ctx) => {
        const tasks = await listProjectTasks({ workspaceId: ctx.workspaceId });
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const today = tasks.filter((task) => {
          if (!task.dueAt) return false;
          const due = Date.parse(task.dueAt);
          return due >= start.getTime() && due < end.getTime();
        });
        return {
          count: today.length,
          summary:
            today.length === 0
              ? "No tasks are due today."
              : today
                  .slice(0, 8)
                  .map((task) => `${task.title} (${task.status}/${task.priority})`)
                  .join("; "),
          tasks: today.slice(0, 8),
        };
      },
    },
    {
      name: "moveOverdueProjectTasks",
      description: "Move all overdue project tasks back to todo",
      requiredRole: "Manager",
      schema: z.object({}),
      execute: async (ctx) => {
        const count = await moveOverdueTasks({
          workspaceId: ctx.workspaceId,
          status: "todo",
        });
        return { moved: count };
      },
    },
    {
      name: "generateProjectHealthReport",
      description: "Generate and save a project health report",
      requiredRole: "Manager",
      schema: z.object({}),
      execute: async (ctx) => {
        const snapshot = await getProjectReportSnapshot({
          workspaceId: ctx.workspaceId,
        });
        const report = await createProjectReport({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: `Kairos project report · ${new Date().toISOString().slice(0, 10)}`,
          summary: `Health ${snapshot.healthScore}% · Completion ${snapshot.completionRate}% · Velocity ${snapshot.velocity}`,
          data: snapshot as unknown as Record<string, unknown>,
        });
        return { reportId: report.id, snapshot };
      },
    },
    {
      name: "estimateProjectCompletion",
      description: "Estimate project completion based on progress and velocity",
      requiredRole: "Manager",
      schema: z.object({ projectName: z.string().trim().max(160).optional() }),
      execute: async (ctx, input) => {
        const [projects, snapshot, stats] = await Promise.all([
          listProjects({ workspaceId: ctx.workspaceId }),
          getProjectReportSnapshot({ workspaceId: ctx.workspaceId }),
          getProjectDashboardStats({ workspaceId: ctx.workspaceId }),
        ]);
        const project = input.projectName
          ? projects.find((item) =>
              item.name.toLowerCase().includes(input.projectName!.toLowerCase()),
            )
          : projects.find((item) => item.status === "active") ?? projects[0];
        const remaining = Math.max(0, 100 - (project?.progress ?? stats.averageProgress));
        const days =
          snapshot.velocity <= 0 ? null : Math.ceil(remaining / Math.max(1, snapshot.velocity * 5));
        return {
          projectId: project?.id ?? null,
          projectName: project?.name ?? "Workspace average",
          progress: project?.progress ?? stats.averageProgress,
          estimatedDaysRemaining: days,
          confidence: snapshot.velocity > 0 ? "moderate" : "low",
        };
      },
    },
    {
      name: "assignTasksAutomatically",
      description: "Assign open tasks without assignees to the current user",
      requiredRole: "Manager",
      schema: z.object({ limit: z.number().int().min(1).max(20).optional() }),
      execute: async (ctx, input) => {
        const tasks = await listProjectTasks({ workspaceId: ctx.workspaceId });
        const unassigned = tasks
          .filter((task) => !task.assigneeId && task.status !== "completed")
          .slice(0, input.limit ?? 5);
        await Promise.all(
          unassigned.map((task) =>
            updateProjectTask({
              workspaceId: ctx.workspaceId,
              id: task.id,
              assigneeId: ctx.userId,
            }),
          ),
        );
        return { assigned: unassigned.length, taskIds: unassigned.map((task) => task.id) };
      },
    },
    {
      name: "createProjectTaskQuick",
      description: "Create a project task quickly",
      requiredRole: "Sales",
      schema: z.object({
        title: z.string().trim().min(1).max(200),
        projectName: z.string().trim().max(160).optional(),
      }),
      execute: async (ctx, input) => {
        const projects = await listProjects({ workspaceId: ctx.workspaceId });
        const project = input.projectName
          ? projects.find((item) =>
              item.name.toLowerCase().includes(input.projectName!.toLowerCase()),
            )
          : projects[0];
        if (!project) throw new Error("Create a project first.");
        const task = await createProjectTask({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          projectId: project.id,
          title: input.title,
          status: "todo",
        });
        return { task, projectId: project.id };
      },
    },
  ];
  return tools;
}
