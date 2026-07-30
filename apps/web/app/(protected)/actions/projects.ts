"use server";

import { getUser } from "@repo/auth/server";
import {
  createProject,
  createProjectComment,
  createProjectReport,
  createProjectTask,
  createSubtask,
  createTimeLog,
  deleteProject,
  deleteProjectTask,
  duplicateProject,
  getProjectDashboardStats,
  getProjectReportSnapshot,
  getProjectSettings,
  listProjectMembers,
  listProjectReports,
  listProjectTasks,
  listProjects,
  listSubtasks,
  listTimeLogs,
  moveOverdueTasks,
  updateProject,
  updateProjectSettings,
  updateProjectTask,
  updateSubtask,
} from "@repo/database/projects";
import { getMembershipRole } from "@repo/database/workspace";
import {
  createProjectSchema,
  createProjectTaskSchema,
  createSubtaskSchema,
  createTimeLogSchema,
  updateProjectSchema,
  updateProjectSettingsSchema,
  updateProjectTaskSchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type ProjectsActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireProjectsContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: context.active.workspace.id };
}

function fail(error: unknown): ProjectsActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function getProjectsModuleData() {
  const ctx = await requireProjectsContext();
  const [stats, projects, tasks, members, reports, settings, snapshot, logs] =
    await Promise.all([
      getProjectDashboardStats({ workspaceId: ctx.workspaceId }),
      listProjects({ workspaceId: ctx.workspaceId }),
      listProjectTasks({ workspaceId: ctx.workspaceId }),
      listProjectMembers({ workspaceId: ctx.workspaceId }),
      listProjectReports({ workspaceId: ctx.workspaceId }),
      getProjectSettings({ workspaceId: ctx.workspaceId }),
      getProjectReportSnapshot({ workspaceId: ctx.workspaceId }),
      listTimeLogs({ workspaceId: ctx.workspaceId }),
    ]);
  return {
    stats,
    projects,
    tasks,
    members,
    reports,
    settings,
    snapshot,
    logs,
    userId: ctx.userId,
  };
}

export async function createProjectAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = createProjectSchema.parse(input);
    const project = await createProject({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: project.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateProjectAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = updateProjectSchema.parse(input);
    const { id, ...patch } = parsed;
    const project = await updateProject({
      workspaceId: ctx.workspaceId,
      id,
      ...patch,
    });
    return { ok: true, data: { id: project.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function duplicateProjectAction(input: {
  id: string;
}): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const project = await duplicateProject({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      id: input.id,
    });
    return { ok: true, data: { id: project.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProjectAction(input: {
  id: string;
}): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    await deleteProject({ workspaceId: ctx.workspaceId, id: input.id });
    return { ok: true, data: { id: input.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createProjectTaskAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = createProjectTaskSchema.parse(input);
    const task = await createProjectTask({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateProjectTaskAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = updateProjectTaskSchema.parse(input);
    const { id, ...patch } = parsed;
    const task = await updateProjectTask({
      workspaceId: ctx.workspaceId,
      id,
      ...patch,
    });
    return { ok: true, data: { id: task.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProjectTaskAction(input: {
  id: string;
}): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    await deleteProjectTask({ workspaceId: ctx.workspaceId, id: input.id });
    return { ok: true, data: { id: input.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createSubtaskAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = createSubtaskSchema.parse(input);
    const subtask = await createSubtask({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: subtask.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleSubtaskAction(input: {
  id: string;
  isDone: boolean;
}): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const subtask = await updateSubtask({
      workspaceId: ctx.workspaceId,
      id: input.id,
      isDone: input.isDone,
    });
    return { ok: true, data: { id: subtask.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function listTaskSubtasksAction(input: {
  taskId: string;
}): Promise<ProjectsActionResult<{ items: Awaited<ReturnType<typeof listSubtasks>> }>> {
  try {
    const ctx = await requireProjectsContext();
    const items = await listSubtasks({
      workspaceId: ctx.workspaceId,
      taskId: input.taskId,
    });
    return { ok: true, data: { items } };
  } catch (error) {
    return fail(error);
  }
}

export async function createTimeLogAction(
  input: unknown,
): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = createTimeLogSchema.parse(input);
    const log = await createTimeLog({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: log.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createProjectCommentAction(input: {
  body: string;
  projectId?: string;
  taskId?: string;
}): Promise<ProjectsActionResult<{ id: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const comment = await createProjectComment({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      body: input.body,
      projectId: input.projectId,
      taskId: input.taskId,
    });
    return { ok: true, data: { id: comment.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateProjectSettingsAction(
  input: unknown,
): Promise<ProjectsActionResult<{ workspaceId: string }>> {
  try {
    const ctx = await requireProjectsContext();
    const parsed = updateProjectSettingsSchema.parse(input);
    const settings = await updateProjectSettings({
      workspaceId: ctx.workspaceId,
      ...parsed,
    });
    return { ok: true, data: { workspaceId: settings.workspaceId } };
  } catch (error) {
    return fail(error);
  }
}

export async function generateProjectReportAction(): Promise<
  ProjectsActionResult<{ id: string }>
> {
  try {
    const ctx = await requireProjectsContext();
    const snapshot = await getProjectReportSnapshot({
      workspaceId: ctx.workspaceId,
    });
    const report = await createProjectReport({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      title: `Project health · ${new Date().toISOString().slice(0, 10)}`,
      summary: `Health ${snapshot.healthScore}% · Completion ${snapshot.completionRate}% · Velocity ${snapshot.velocity}/day`,
      reportType: "health",
      data: snapshot as unknown as Record<string, unknown>,
    });
    return { ok: true, data: { id: report.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function moveOverdueTasksAction(): Promise<
  ProjectsActionResult<{ count: number }>
> {
  try {
    const ctx = await requireProjectsContext();
    const count = await moveOverdueTasks({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { count } };
  } catch (error) {
    return fail(error);
  }
}
