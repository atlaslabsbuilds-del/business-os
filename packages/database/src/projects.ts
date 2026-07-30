import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  Project,
  ProjectComment,
  ProjectDashboardStats,
  ProjectMember,
  ProjectPriority,
  ProjectReport,
  ProjectReportSnapshot,
  ProjectSettings,
  ProjectStatus,
  ProjectSubtask,
  ProjectTask,
  ProjectTaskStatus,
  ProjectTimeLog,
} from "@repo/types";
import { createServerClient } from "./server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type SubtaskRow = Database["public"]["Tables"]["subtasks"]["Row"];
type MemberRow = Database["public"]["Tables"]["project_members"]["Row"];
type CommentRow = Database["public"]["Tables"]["project_comments"]["Row"];
type TimeLogRow = Database["public"]["Tables"]["time_logs"]["Row"];
type ReportRow = Database["public"]["Tables"]["project_reports"]["Row"];
type SettingsRow = Database["public"]["Tables"]["project_settings"]["Row"];

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

function asChecklist(value: unknown): ProjectTask["checklist"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.text !== "string") return null;
      return { id: row.id, text: row.text, done: Boolean(row.done) };
    })
    .filter((item): item is ProjectTask["checklist"][number] => !!item);
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    startDate: row.start_date,
    dueDate: row.due_date,
    tags: row.tags ?? [],
    teamName: row.team_name,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: TaskRow): ProjectTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    createdBy: row.created_by,
    assigneeId: row.assignee_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    startAt: row.start_at,
    completedAt: row.completed_at,
    estimateHours:
      row.estimate_hours === null || row.estimate_hours === undefined
        ? null
        : Number(row.estimate_hours),
    progress: row.progress,
    position: row.position,
    dependsOn: row.depends_on ?? [],
    checklist: asChecklist(row.checklist),
    isMilestone: row.is_milestone,
    isRecurring: row.is_recurring,
    recurrenceRule: row.recurrence_rule,
    labels: row.labels ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubtask(row: SubtaskRow): ProjectSubtask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    taskId: row.task_id,
    createdBy: row.created_by,
    title: row.title,
    isDone: row.is_done,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: MemberRow): ProjectMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): ProjectComment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    taskId: row.task_id,
    createdBy: row.created_by,
    body: row.body,
    mentions: row.mentions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTimeLog(row: TimeLogRow): ProjectTimeLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    taskId: row.task_id,
    userId: row.user_id,
    hours: Number(row.hours),
    note: row.note,
    loggedOn: row.logged_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReport(row: ReportRow): ProjectReport {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    createdBy: row.created_by,
    reportType: row.report_type,
    title: row.title,
    summary: row.summary,
    data:
      row.data && typeof row.data === "object" && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): ProjectSettings {
  return {
    workspaceId: row.workspace_id,
    customStages: Array.isArray(row.custom_stages)
      ? row.custom_stages.filter((item): item is string => typeof item === "string")
      : ["backlog", "todo", "in_progress", "review", "completed"],
    defaultPriority: row.default_priority,
    automationRules: Array.isArray(row.automation_rules)
      ? (row.automation_rules as Array<Record<string, unknown>>)
      : [],
    permissions:
      row.permissions && typeof row.permissions === "object" && !Array.isArray(row.permissions)
        ? (row.permissions as Record<string, unknown>)
        : { canCreate: true, canArchive: true },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(input: {
  workspaceId: string;
  query?: string;
  status?: ProjectStatus;
  includeArchived?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<Project[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });
  if (!input.includeArchived) builder = builder.eq("is_archived", false);
  if (input.status) builder = builder.eq("status", input.status);
  if (input.query) builder = builder.ilike("name", `%${input.query}%`);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list projects: ${error.message}`);
  return (data ?? []).map(mapProject);
}

export async function createProject(input: {
  workspaceId: string;
  userId: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  teamName?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<Project> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "planning",
      priority: input.priority ?? "medium",
      start_date: input.startDate ?? null,
      due_date: input.dueDate ?? null,
      tags: input.tags ?? [],
      team_name: input.teamName ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create project: ${error?.message ?? "Unknown"}`);
  }
  await supabase.from("project_members").insert({
    workspace_id: input.workspaceId,
    project_id: data.id,
    user_id: input.userId,
    role: "owner",
  });
  return mapProject(data);
}

export async function updateProject(input: {
  workspaceId: string;
  id: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
  teamName?: string | null;
  isArchived?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<Project> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["projects"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.progress !== undefined) patch.progress = input.progress;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.teamName !== undefined) patch.team_name = input.teamName;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update project: ${error?.message ?? "Unknown"}`);
  }
  return mapProject(data);
}

export async function duplicateProject(input: {
  workspaceId: string;
  userId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<Project> {
  const projects = await listProjects({
    workspaceId: input.workspaceId,
    includeArchived: true,
    client: input.client,
  });
  const source = projects.find((project) => project.id === input.id);
  if (!source) throw new Error("Project not found");
  return createProject({
    workspaceId: input.workspaceId,
    userId: input.userId,
    name: `${source.name} (Copy)`,
    description: source.description,
    status: "planning",
    priority: source.priority,
    startDate: source.startDate,
    dueDate: source.dueDate,
    tags: source.tags,
    teamName: source.teamName,
    client: input.client,
  });
}

export async function deleteProject(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

export async function listProjectTasks(input: {
  workspaceId: string;
  projectId?: string;
  status?: ProjectTaskStatus;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectTask[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });
  if (input.projectId) builder = builder.eq("project_id", input.projectId);
  if (input.status) builder = builder.eq("status", input.status);
  if (input.query) builder = builder.ilike("title", `%${input.query}%`);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list tasks: ${error.message}`);
  return (data ?? []).map(mapTask);
}

export async function createProjectTask(input: {
  workspaceId: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  priority?: ProjectPriority;
  dueAt?: string | null;
  startAt?: string | null;
  assigneeId?: string | null;
  estimateHours?: number | null;
  isMilestone?: boolean;
  isRecurring?: boolean;
  labels?: string[];
  dependsOn?: string[];
  client?: SupabaseClient<Database>;
}): Promise<ProjectTask> {
  const supabase = await clientOrDefault(input.client);
  const existing = await listProjectTasks({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    client: input.client,
  });
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      project_id: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "backlog",
      priority: input.priority ?? "medium",
      due_at: input.dueAt ?? null,
      start_at: input.startAt ?? null,
      assignee_id: input.assigneeId ?? null,
      estimate_hours: input.estimateHours ?? null,
      is_milestone: input.isMilestone ?? false,
      is_recurring: input.isRecurring ?? false,
      labels: input.labels ?? [],
      depends_on: input.dependsOn ?? [],
      position: existing.length,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

export async function updateProjectTask(input: {
  workspaceId: string;
  id: string;
  title?: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  priority?: ProjectPriority;
  dueAt?: string | null;
  startAt?: string | null;
  assigneeId?: string | null;
  estimateHours?: number | null;
  progress?: number;
  completedAt?: string | null;
  isMilestone?: boolean;
  isRecurring?: boolean;
  labels?: string[];
  dependsOn?: string[];
  checklist?: ProjectTask["checklist"];
  position?: number;
  client?: SupabaseClient<Database>;
}): Promise<ProjectTask> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["tasks"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "completed" && input.completedAt === undefined) {
      patch.completed_at = new Date().toISOString();
      patch.progress = 100;
    }
  }
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueAt !== undefined) patch.due_at = input.dueAt;
  if (input.startAt !== undefined) patch.start_at = input.startAt;
  if (input.assigneeId !== undefined) patch.assignee_id = input.assigneeId;
  if (input.estimateHours !== undefined) patch.estimate_hours = input.estimateHours;
  if (input.progress !== undefined) patch.progress = input.progress;
  if (input.completedAt !== undefined) patch.completed_at = input.completedAt;
  if (input.isMilestone !== undefined) patch.is_milestone = input.isMilestone;
  if (input.isRecurring !== undefined) patch.is_recurring = input.isRecurring;
  if (input.labels !== undefined) patch.labels = input.labels;
  if (input.dependsOn !== undefined) patch.depends_on = input.dependsOn;
  if (input.checklist !== undefined) patch.checklist = input.checklist as Json;
  if (input.position !== undefined) patch.position = input.position;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

export async function deleteProjectTask(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
}

export async function listSubtasks(input: {
  workspaceId: string;
  taskId: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectSubtask[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("task_id", input.taskId)
    .order("position", { ascending: true });
  if (error) throw new Error(`Failed to list subtasks: ${error.message}`);
  return (data ?? []).map(mapSubtask);
}

export async function createSubtask(input: {
  workspaceId: string;
  userId: string;
  taskId: string;
  title: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectSubtask> {
  const supabase = await clientOrDefault(input.client);
  const existing = await listSubtasks({
    workspaceId: input.workspaceId,
    taskId: input.taskId,
    client: input.client,
  });
  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      task_id: input.taskId,
      title: input.title,
      position: existing.length,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create subtask: ${error?.message ?? "Unknown"}`);
  }
  return mapSubtask(data);
}

export async function updateSubtask(input: {
  workspaceId: string;
  id: string;
  title?: string;
  isDone?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<ProjectSubtask> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["subtasks"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.isDone !== undefined) patch.is_done = input.isDone;
  const { data, error } = await supabase
    .from("subtasks")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update subtask: ${error?.message ?? "Unknown"}`);
  }
  return mapSubtask(data);
}

export async function listProjectMembers(input: {
  workspaceId: string;
  projectId?: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectMember[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("project_members")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: true });
  if (input.projectId) builder = builder.eq("project_id", input.projectId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list project members: ${error.message}`);
  return (data ?? []).map(mapMember);
}

export async function addProjectMember(input: {
  workspaceId: string;
  projectId: string;
  userId: string;
  role?: ProjectMember["role"];
  client?: SupabaseClient<Database>;
}): Promise<ProjectMember> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("project_members")
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId,
      user_id: input.userId,
      role: input.role ?? "member",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to add project member: ${error?.message ?? "Unknown"}`);
  }
  return mapMember(data);
}

export async function listProjectComments(input: {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectComment[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("project_comments")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (input.projectId) builder = builder.eq("project_id", input.projectId);
  if (input.taskId) builder = builder.eq("task_id", input.taskId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list comments: ${error.message}`);
  return (data ?? []).map(mapComment);
}

export async function createProjectComment(input: {
  workspaceId: string;
  userId: string;
  body: string;
  projectId?: string | null;
  taskId?: string | null;
  mentions?: string[];
  client?: SupabaseClient<Database>;
}): Promise<ProjectComment> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("project_comments")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      body: input.body,
      project_id: input.projectId ?? null,
      task_id: input.taskId ?? null,
      mentions: input.mentions ?? [],
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create comment: ${error?.message ?? "Unknown"}`);
  }
  return mapComment(data);
}

export async function listTimeLogs(input: {
  workspaceId: string;
  projectId?: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectTimeLog[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("time_logs")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("logged_on", { ascending: false });
  if (input.projectId) builder = builder.eq("project_id", input.projectId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list time logs: ${error.message}`);
  return (data ?? []).map(mapTimeLog);
}

export async function createTimeLog(input: {
  workspaceId: string;
  userId: string;
  projectId: string;
  taskId?: string | null;
  hours: number;
  note?: string | null;
  loggedOn?: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectTimeLog> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("time_logs")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      project_id: input.projectId,
      task_id: input.taskId ?? null,
      hours: input.hours,
      note: input.note ?? null,
      logged_on: input.loggedOn ?? new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create time log: ${error?.message ?? "Unknown"}`);
  }
  return mapTimeLog(data);
}

export async function getProjectSettings(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("project_settings")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load project settings: ${error.message}`);
  if (data) return mapSettings(data);
  const { data: created, error: createError } = await supabase
    .from("project_settings")
    .insert({ workspace_id: input.workspaceId })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(
      `Failed to create project settings: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(created);
}

export async function updateProjectSettings(input: {
  workspaceId: string;
  customStages?: string[];
  defaultPriority?: ProjectPriority;
  automationRules?: Array<Record<string, unknown>>;
  permissions?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<ProjectSettings> {
  const supabase = await clientOrDefault(input.client);
  await getProjectSettings(input);
  const patch: Database["public"]["Tables"]["project_settings"]["Update"] = {};
  if (input.customStages !== undefined) patch.custom_stages = input.customStages as Json;
  if (input.defaultPriority !== undefined) patch.default_priority = input.defaultPriority;
  if (input.automationRules !== undefined) {
    patch.automation_rules = input.automationRules as Json;
  }
  if (input.permissions !== undefined) patch.permissions = input.permissions as Json;
  const { data, error } = await supabase
    .from("project_settings")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update project settings: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(data);
}

export async function createProjectReport(input: {
  workspaceId: string;
  userId: string;
  title: string;
  summary?: string | null;
  reportType?: string;
  projectId?: string | null;
  data?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<ProjectReport> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("project_reports")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title,
      summary: input.summary ?? null,
      report_type: input.reportType ?? "health",
      project_id: input.projectId ?? null,
      data: (input.data ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create project report: ${error?.message ?? "Unknown"}`);
  }
  return mapReport(data);
}

export async function listProjectReports(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectReport[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("project_reports")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list project reports: ${error.message}`);
  return (data ?? []).map(mapReport);
}

export async function getProjectDashboardStats(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectDashboardStats> {
  const [projects, tasks] = await Promise.all([
    listProjects({
      workspaceId: input.workspaceId,
      includeArchived: false,
      client: input.client,
    }),
    listProjectTasks({ workspaceId: input.workspaceId, client: input.client }),
  ]);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const week = new Date(start);
  week.setDate(week.getDate() + 7);

  const activeProjects = projects.filter((project) => project.status === "active").length;
  const completedProjects = projects.filter(
    (project) => project.status === "completed",
  ).length;
  const overdueTasks = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.dueAt &&
      Date.parse(task.dueAt) < start.getTime(),
  ).length;
  const todayTasks = tasks.filter((task) => {
    if (!task.dueAt) return false;
    const due = Date.parse(task.dueAt);
    return due >= start.getTime() && due < end.getTime();
  }).length;
  const upcomingDeadlines = tasks.filter((task) => {
    if (!task.dueAt || task.status === "completed") return false;
    const due = Date.parse(task.dueAt);
    return due >= end.getTime() && due <= week.getTime();
  }).length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const teamProductivity =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const averageProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length,
        );

  return {
    activeProjects,
    completedProjects,
    overdueTasks,
    todayTasks,
    upcomingDeadlines,
    teamProductivity,
    averageProgress,
  };
}

export async function getProjectReportSnapshot(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<ProjectReportSnapshot> {
  const [tasks, logs, stats] = await Promise.all([
    listProjectTasks({ workspaceId: input.workspaceId, client: input.client }),
    listTimeLogs({ workspaceId: input.workspaceId, client: input.client }),
    getProjectDashboardStats(input),
  ]);
  const statuses: ProjectTaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "review",
    "completed",
  ];
  const completed = tasks.filter((task) => task.status === "completed").length;
  const burndown: ProjectReportSnapshot["burndown"] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const completedByDay = tasks.filter(
      (task) =>
        task.completedAt && task.completedAt.slice(0, 10) <= key,
    ).length;
    burndown.push({
      day: key,
      remaining: Math.max(0, tasks.length - completedByDay),
      completed: completedByDay,
    });
  }

  return {
    healthScore: Math.round(
      (stats.averageProgress * 0.5 + stats.teamProductivity * 0.5),
    ),
    completionRate:
      tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
    velocity: Math.round(completed / 7),
    totalHours: logs.reduce((sum, log) => sum + log.hours, 0),
    tasksByStatus: statuses.map((status) => ({
      status,
      count: tasks.filter((task) => task.status === status).length,
    })),
    burndown,
  };
}

export async function moveOverdueTasks(input: {
  workspaceId: string;
  status?: ProjectTaskStatus;
  client?: SupabaseClient<Database>;
}): Promise<number> {
  const tasks = await listProjectTasks({
    workspaceId: input.workspaceId,
    client: input.client,
  });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const overdue = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.dueAt &&
      Date.parse(task.dueAt) < start.getTime(),
  );
  await Promise.all(
    overdue.map((task) =>
      updateProjectTask({
        workspaceId: input.workspaceId,
        id: task.id,
        status: input.status ?? "todo",
        client: input.client,
      }),
    ),
  );
  return overdue.length;
}
