import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiOutputVersion,
  Database,
  Json,
  KairosAgentRun,
  WorkspaceAiSuggestion,
  WorkspaceOnboardingProgress,
} from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type AgentRunRow = Database["public"]["Tables"]["kairos_agent_runs"]["Row"];
type VersionRow = Database["public"]["Tables"]["ai_output_versions"]["Row"];
type OnboardingRow =
  Database["public"]["Tables"]["workspace_onboarding_progress"]["Row"];
type SuggestionRow =
  Database["public"]["Tables"]["workspace_ai_suggestions"]["Row"];

function mapAgentRun(row: AgentRunRow): KairosAgentRun {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    agentId: row.agent_id,
    title: row.title,
    prompt: row.prompt,
    status: row.status,
    resultSummary: row.result_summary,
    createdBy: row.created_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: VersionRow): AiOutputVersion {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    content: row.content,
    versionNumber: row.version_number,
    isCurrent: row.is_current,
    createdBy: row.created_by,
    parentVersionId: row.parent_version_id,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseSteps(json: Json): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is string => typeof item === "string");
}

function mapOnboarding(row: OnboardingRow): WorkspaceOnboardingProgress {
  return {
    workspaceId: row.workspace_id,
    completedSteps: parseSteps(row.completed_steps),
    celebratedAt: row.celebrated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSuggestion(row: SuggestionRow): WorkspaceAiSuggestion {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    module: row.module,
    title: row.title,
    body: row.body,
    actionLabel: row.action_label,
    actionUrl: row.action_url,
    severity: row.severity,
    dismissedAt: row.dismissed_at,
    createdBy: row.created_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listKairosAgentRuns(input: {
  workspaceId: string;
  agentId?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<KairosAgentRun[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("kairos_agent_runs")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);
  if (input.agentId) builder = builder.eq("agent_id", input.agentId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list agent runs: ${error.message}`);
  return (data ?? []).map(mapAgentRun);
}

export async function createKairosAgentRun(input: {
  workspaceId: string;
  agentId: string;
  title: string;
  prompt: string;
  userId?: string | null;
  resultSummary?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<KairosAgentRun> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("kairos_agent_runs")
    .insert({
      workspace_id: input.workspaceId,
      agent_id: input.agentId,
      title: input.title,
      prompt: input.prompt,
      status: input.status ?? "completed",
      result_summary: input.resultSummary ?? null,
      created_by: input.userId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create agent run: ${error?.message ?? "Unknown"}`);
  }
  return mapAgentRun(data);
}

export async function listAiOutputVersions(input: {
  workspaceId: string;
  entityType?: string;
  entityId?: string | null;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<AiOutputVersion[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("ai_output_versions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 40);
  if (input.entityType) builder = builder.eq("entity_type", input.entityType);
  if (input.entityId) builder = builder.eq("entity_id", input.entityId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list versions: ${error.message}`);
  return (data ?? []).map(mapVersion);
}

export async function createAiOutputVersion(input: {
  workspaceId: string;
  entityType: string;
  entityId?: string | null;
  title: string;
  content: string;
  userId?: string | null;
  parentVersionId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<AiOutputVersion> {
  const supabase = await clientOrDefault(input.client);
  const existing = await listAiOutputVersions({
    workspaceId: input.workspaceId,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    limit: 1,
    client: input.client,
  });
  const nextVersion = (existing[0]?.versionNumber ?? 0) + 1;

  if (existing.length > 0) {
    await supabase
      .from("ai_output_versions")
      .update({ is_current: false })
      .eq("workspace_id", input.workspaceId)
      .eq("entity_type", input.entityType)
      .eq("is_current", true);
  }

  const { data, error } = await supabase
    .from("ai_output_versions")
    .insert({
      workspace_id: input.workspaceId,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      title: input.title,
      content: input.content,
      version_number: nextVersion,
      is_current: true,
      created_by: input.userId ?? null,
      parent_version_id: input.parentVersionId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create version: ${error?.message ?? "Unknown"}`);
  }
  return mapVersion(data);
}

export async function renameAiOutputVersion(input: {
  workspaceId: string;
  versionId: string;
  title: string;
  client?: SupabaseClient<Database>;
}): Promise<AiOutputVersion> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("ai_output_versions")
    .update({ title: input.title })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.versionId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to rename version: ${error?.message ?? "Unknown"}`);
  }
  return mapVersion(data);
}

export async function restoreAiOutputVersion(input: {
  workspaceId: string;
  versionId: string;
  userId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<AiOutputVersion> {
  const supabase = await clientOrDefault(input.client);
  const { data: source, error } = await supabase
    .from("ai_output_versions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.versionId)
    .single();
  if (error || !source) {
    throw new Error(`Version not found: ${error?.message ?? "Unknown"}`);
  }
  return createAiOutputVersion({
    workspaceId: input.workspaceId,
    entityType: source.entity_type,
    entityId: source.entity_id,
    title: `${source.title} (restored)`,
    content: source.content,
    userId: input.userId,
    parentVersionId: source.id,
    metadata: { restoredFrom: source.id },
    client: input.client,
  });
}

export async function duplicateAiOutputVersion(input: {
  workspaceId: string;
  versionId: string;
  userId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<AiOutputVersion> {
  const supabase = await clientOrDefault(input.client);
  const { data: source, error } = await supabase
    .from("ai_output_versions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.versionId)
    .single();
  if (error || !source) {
    throw new Error(`Version not found: ${error?.message ?? "Unknown"}`);
  }
  return createAiOutputVersion({
    workspaceId: input.workspaceId,
    entityType: source.entity_type,
    entityId: source.entity_id,
    title: `${source.title} (copy)`,
    content: source.content,
    userId: input.userId,
    parentVersionId: source.id,
    metadata: { duplicatedFrom: source.id },
    client: input.client,
  });
}

export async function getOnboardingProgress(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceOnboardingProgress> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_onboarding_progress")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load onboarding: ${error.message}`);
  if (data) return mapOnboarding(data);
  const { data: created, error: createError } = await supabase
    .from("workspace_onboarding_progress")
    .upsert({ workspace_id: input.workspaceId, completed_steps: [] })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(
      `Failed to init onboarding: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapOnboarding(created);
}

export async function completeOnboardingStep(input: {
  workspaceId: string;
  stepId: string;
  celebrate?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceOnboardingProgress> {
  const current = await getOnboardingProgress(input);
  const steps = Array.from(new Set([...current.completedSteps, input.stepId]));
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_onboarding_progress")
    .upsert({
      workspace_id: input.workspaceId,
      completed_steps: steps,
      celebrated_at:
        input.celebrate && !current.celebratedAt
          ? new Date().toISOString()
          : current.celebratedAt,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update onboarding: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapOnboarding(data);
}

export async function listAiSuggestions(input: {
  workspaceId: string;
  module?: string;
  includeDismissed?: boolean;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiSuggestion[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("workspace_ai_suggestions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 12);
  if (input.module) builder = builder.eq("module", input.module);
  if (!input.includeDismissed) builder = builder.is("dismissed_at", null);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list suggestions: ${error.message}`);
  return (data ?? []).map(mapSuggestion);
}

export async function upsertAiSuggestions(input: {
  workspaceId: string;
  suggestions: Array<{
    module: string;
    title: string;
    body: string;
    actionLabel?: string | null;
    actionUrl?: string | null;
    severity?: string;
  }>;
  userId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiSuggestion[]> {
  const existing = await listAiSuggestions({
    workspaceId: input.workspaceId,
    includeDismissed: false,
    limit: 50,
    client: input.client,
  });
  const existingTitles = new Set(existing.map((item) => item.title));
  const toInsert = input.suggestions.filter(
    (item) => !existingTitles.has(item.title),
  );
  if (toInsert.length === 0) return existing;

  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_ai_suggestions")
    .insert(
      toInsert.map((item) => ({
        workspace_id: input.workspaceId,
        module: item.module,
        title: item.title,
        body: item.body,
        action_label: item.actionLabel ?? null,
        action_url: item.actionUrl ?? null,
        severity: item.severity ?? "info",
        created_by: input.userId ?? null,
      })),
    )
    .select("*");
  if (error) throw new Error(`Failed to save suggestions: ${error.message}`);
  return [...(data ?? []).map(mapSuggestion), ...existing].slice(0, 12);
}

export async function dismissAiSuggestion(input: {
  workspaceId: string;
  suggestionId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("workspace_ai_suggestions")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.suggestionId);
  if (error) throw new Error(`Failed to dismiss suggestion: ${error.message}`);
}
