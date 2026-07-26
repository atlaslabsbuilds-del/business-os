import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  WorkspaceAiMemory,
  WorkspaceAiSettings,
} from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type MemoryRow = Database["public"]["Tables"]["workspace_ai_memory"]["Row"];
type SettingsRow = Database["public"]["Tables"]["workspace_ai_settings"]["Row"];

function mapMemory(row: MemoryRow): WorkspaceAiMemory {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceModule: row.source_module,
    scope: row.scope,
    fact: row.fact,
    summary: row.summary,
    importance: row.importance,
    createdBy: row.created_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): WorkspaceAiSettings {
  return {
    workspaceId: row.workspace_id,
    memoryEnabled: row.memory_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkspaceAiMemory(input: {
  workspaceId: string;
  sourceModule?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiMemory[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("workspace_ai_memory")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("importance", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (input.sourceModule) {
    builder = builder.eq("source_module", input.sourceModule);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list workspace AI memory: ${error.message}`);
  }
  return (data ?? []).map(mapMemory);
}

export async function updateWorkspaceAiMemory(input: {
  workspaceId: string;
  memoryId: string;
  fact?: string;
  summary?: string | null;
  importance?: number;
  scope?: string;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiMemory> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["workspace_ai_memory"]["Update"] =
    {};
  if (input.fact !== undefined) patch.fact = input.fact;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.importance !== undefined) patch.importance = input.importance;
  if (input.scope !== undefined) patch.scope = input.scope;
  if (input.metadata !== undefined) patch.metadata = input.metadata as Json;

  const { data, error } = await supabase
    .from("workspace_ai_memory")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.memoryId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update workspace AI memory: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapMemory(data);
}

export async function deleteWorkspaceAiMemory(input: {
  workspaceId: string;
  memoryId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("workspace_ai_memory")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.memoryId);
  if (error) {
    throw new Error(`Failed to delete workspace AI memory: ${error.message}`);
  }
}

export async function getWorkspaceAiSettings(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_ai_settings")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load AI settings: ${error.message}`);
  }
  if (data) return mapSettings(data);

  const { data: created, error: createError } = await supabase
    .from("workspace_ai_settings")
    .upsert({ workspace_id: input.workspaceId, memory_enabled: true })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(
      `Failed to initialize AI settings: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(created);
}

export async function setWorkspaceMemoryEnabled(input: {
  workspaceId: string;
  enabled: boolean;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_ai_settings")
    .upsert({
      workspace_id: input.workspaceId,
      memory_enabled: input.enabled,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update memory setting: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(data);
}

export async function createWorkspaceAiMemory(input: {
  workspaceId: string;
  sourceModule?: string;
  scope?: string;
  fact: string;
  summary?: string | null;
  importance?: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiMemory> {
  const settings = await getWorkspaceAiSettings({
    workspaceId: input.workspaceId,
    client: input.client,
  });
  if (!settings.memoryEnabled) {
    throw new Error("Kairos memory is turned off for this workspace.");
  }
  return createWorkspaceAiMemoryUnchecked(input);
}

async function createWorkspaceAiMemoryUnchecked(input: {
  workspaceId: string;
  sourceModule?: string;
  scope?: string;
  fact: string;
  summary?: string | null;
  importance?: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiMemory> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_ai_memory")
    .insert({
      workspace_id: input.workspaceId,
      source_module: input.sourceModule ?? "assistant",
      scope: input.scope ?? "workspace",
      fact: input.fact,
      summary: input.summary ?? null,
      importance: input.importance ?? 1,
      created_by: input.userId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create workspace AI memory: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapMemory(data);
}
