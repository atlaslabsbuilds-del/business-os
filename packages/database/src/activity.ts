import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, WorkspaceActivityEvent } from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type ActivityRow =
  Database["public"]["Tables"]["workspace_activity_events"]["Row"];

function mapActivityEvent(row: ActivityRow): WorkspaceActivityEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    module: row.module,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorId: row.actor_id,
    actionUrl: row.action_url,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
  };
}

export async function listWorkspaceActivityEvents(input: {
  workspaceId: string;
  module?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceActivityEvent[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("workspace_activity_events")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (input.module) {
    builder = builder.eq("module", input.module);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list workspace activity: ${error.message}`);
  }
  return (data ?? []).map(mapActivityEvent);
}

export async function createWorkspaceActivityEvent(input: {
  workspaceId: string;
  module: string;
  eventType: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceActivityEvent> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_activity_events")
    .insert({
      workspace_id: input.workspaceId,
      module: input.module,
      event_type: input.eventType,
      title: input.title,
      body: input.body ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action_url: input.actionUrl ?? null,
      actor_id: input.userId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create workspace activity: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapActivityEvent(data);
}
