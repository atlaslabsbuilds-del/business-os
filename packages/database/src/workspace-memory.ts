import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, WorkspaceAiMemory } from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type MemoryRow = Database["public"]["Tables"]["workspace_ai_memory"]["Row"];

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

export async function updateWorkspaceAiMemory(input: {
  workspaceId: string;
  memoryId: string;
  fact?: string;
  summary?: string | null;
  importance?: number;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceAiMemory> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["workspace_ai_memory"]["Update"] =
    {};
  if (input.fact !== undefined) patch.fact = input.fact;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.importance !== undefined) patch.importance = input.importance;
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
