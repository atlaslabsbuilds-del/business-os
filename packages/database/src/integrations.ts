import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  IntegrationAccount,
  IntegrationActivity,
  IntegrationActivityEvent,
  IntegrationCatalogItem,
  IntegrationConnectionStatus,
  IntegrationSyncJob,
  IntegrationSyncJobStatus,
  Json,
} from "@repo/types";
import { createAdminClient } from "./admin";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type CatalogRow = Database["public"]["Tables"]["integrations"]["Row"];
type AccountRow = Database["public"]["Tables"]["integration_accounts"]["Row"];
type ActivityRow = Database["public"]["Tables"]["integration_activity"]["Row"];
type SyncJobRow = Database["public"]["Tables"]["integration_sync_jobs"]["Row"];

function mapCatalog(row: CatalogRow): IntegrationCatalogItem {
  const actions = Array.isArray(row.kairos_actions)
    ? row.kairos_actions.filter((item): item is string => typeof item === "string")
    : [];
  return {
    id: row.id,
    name: row.name,
    category: row.category as IntegrationCatalogItem["category"],
    description: row.description,
    logoKey: row.logo_key,
    authType: row.auth_type,
    featured: row.featured,
    launch: row.launch,
    kairosActions: actions,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAccount(row: AccountRow): IntegrationAccount {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    accountEmail: row.account_email,
    accountName: row.account_name,
    externalAccountId: row.external_account_id,
    status: row.status,
    permissions: row.permissions ?? [],
    scopes: row.scopes ?? [],
    lastSyncAt: row.last_sync_at,
    syncFrequency: row.sync_frequency,
    autoSync: row.auto_sync,
    notificationsEnabled: row.notifications_enabled,
    kairosAccess: row.kairos_access,
    health: row.health,
    errorMessage: row.error_message,
    connectedBy: row.connected_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): IntegrationActivity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    provider: row.provider,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    actorId: row.actor_id,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function mapSyncJob(row: SyncJobRow): IntegrationSyncJob {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    provider: row.provider,
    status: row.status,
    trigger: row.trigger,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    result: jsonToRecord(row.result),
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listIntegrationCatalog(input?: {
  client?: SupabaseClient<Database>;
}): Promise<IntegrationCatalogItem[]> {
  const supabase = await clientOrDefault(input?.client);
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("launch", true)
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to list integrations: ${error.message}`);
  return (data ?? []).map(mapCatalog);
}

export async function getIntegrationCatalogItem(input: {
  provider: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationCatalogItem | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", input.provider)
    .maybeSingle();
  if (error) throw new Error(`Failed to load integration: ${error.message}`);
  return data ? mapCatalog(data) : null;
}

export async function listWorkspaceIntegrationAccounts(input: {
  workspaceId: string;
  provider?: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("integration_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });
  if (input.provider) builder = builder.eq("provider", input.provider);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list integration accounts: ${error.message}`);
  return (data ?? []).map(mapAccount);
}

export async function getIntegrationAccount(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load integration account: ${error.message}`);
  return data ? mapAccount(data) : null;
}

export async function getIntegrationAccountByProvider(input: {
  workspaceId: string;
  provider: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount | null> {
  const accounts = await listWorkspaceIntegrationAccounts(input);
  return (
    accounts.find((account) => account.status === "connected") ??
    accounts[0] ??
    null
  );
}

export async function upsertIntegrationAccount(input: {
  workspaceId: string;
  provider: string;
  userId: string;
  accountEmail?: string | null;
  accountName?: string | null;
  externalAccountId?: string | null;
  status?: IntegrationConnectionStatus;
  permissions?: string[];
  scopes?: string[];
  health?: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount> {
  const supabase = await clientOrDefault(input.client);
  const existing = await listWorkspaceIntegrationAccounts({
    workspaceId: input.workspaceId,
    provider: input.provider,
    client: input.client,
  });
  const match =
    existing.find(
      (account) =>
        account.externalAccountId === (input.externalAccountId ?? null) ||
        (!account.externalAccountId && !input.externalAccountId),
    ) ?? existing[0];

  if (match) {
    const { data, error } = await supabase
      .from("integration_accounts")
      .update({
        account_email: input.accountEmail ?? match.accountEmail,
        account_name: input.accountName ?? match.accountName,
        external_account_id: input.externalAccountId ?? match.externalAccountId,
        status: input.status ?? "connected",
        permissions: input.permissions ?? match.permissions,
        scopes: input.scopes ?? match.scopes,
        health: input.health ?? "healthy",
        error_message: input.errorMessage ?? null,
        connected_by: input.userId,
        metadata: (input.metadata ?? match.metadata) as Json,
      })
      .eq("id", match.id)
      .eq("workspace_id", input.workspaceId)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`Failed to update integration account: ${error?.message ?? "Unknown"}`);
    }
    return mapAccount(data);
  }

  const { data, error } = await supabase
    .from("integration_accounts")
    .insert({
      workspace_id: input.workspaceId,
      provider: input.provider,
      account_email: input.accountEmail ?? null,
      account_name: input.accountName ?? null,
      external_account_id: input.externalAccountId ?? null,
      status: input.status ?? "connected",
      permissions: input.permissions ?? [],
      scopes: input.scopes ?? [],
      health: input.health ?? "healthy",
      error_message: input.errorMessage ?? null,
      connected_by: input.userId,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create integration account: ${error?.message ?? "Unknown"}`);
  }
  return mapAccount(data);
}

export async function updateIntegrationAccountSettings(input: {
  workspaceId: string;
  accountId: string;
  autoSync?: boolean;
  notificationsEnabled?: boolean;
  kairosAccess?: boolean;
  syncFrequency?: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["integration_accounts"]["Update"] = {};
  if (input.autoSync !== undefined) patch.auto_sync = input.autoSync;
  if (input.notificationsEnabled !== undefined) {
    patch.notifications_enabled = input.notificationsEnabled;
  }
  if (input.kairosAccess !== undefined) patch.kairos_access = input.kairosAccess;
  if (input.syncFrequency !== undefined) patch.sync_frequency = input.syncFrequency;

  const { data, error } = await supabase
    .from("integration_accounts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update integration settings: ${error?.message ?? "Unknown"}`);
  }
  return mapAccount(data);
}

export async function disconnectIntegrationAccount(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_accounts")
    .update({
      status: "disconnected",
      health: "disconnected",
      error_message: null,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to disconnect integration: ${error?.message ?? "Unknown"}`);
  }

  // Wipe tokens via admin client
  const admin = createAdminClient();
  await admin.from("integration_tokens").delete().eq("account_id", input.accountId);

  return mapAccount(data);
}

export async function deleteIntegrationAccount(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const admin = createAdminClient();
  await admin.from("integration_tokens").delete().eq("account_id", input.accountId);
  const { error } = await supabase
    .from("integration_accounts")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId);
  if (error) throw new Error(`Failed to delete integration: ${error.message}`);
}

export async function logIntegrationActivity(input: {
  workspaceId: string;
  provider: string;
  eventType: IntegrationActivityEvent;
  title: string;
  body?: string | null;
  accountId?: string | null;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationActivity> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_activity")
    .insert({
      workspace_id: input.workspaceId,
      account_id: input.accountId ?? null,
      provider: input.provider,
      event_type: input.eventType,
      title: input.title,
      body: input.body ?? null,
      actor_id: input.actorId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to log integration activity: ${error?.message ?? "Unknown"}`);
  }
  return mapActivity(data);
}

export async function listIntegrationActivity(input: {
  workspaceId: string;
  accountId?: string;
  provider?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationActivity[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("integration_activity")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 40);
  if (input.accountId) builder = builder.eq("account_id", input.accountId);
  if (input.provider) builder = builder.eq("provider", input.provider);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list activity: ${error.message}`);
  return (data ?? []).map(mapActivity);
}

export async function createIntegrationSyncJob(input: {
  workspaceId: string;
  accountId: string;
  provider: string;
  trigger?: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationSyncJob> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .insert({
      workspace_id: input.workspaceId,
      account_id: input.accountId,
      provider: input.provider,
      status: "queued",
      trigger: input.trigger ?? "manual",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create sync job: ${error?.message ?? "Unknown"}`);
  }
  return mapSyncJob(data);
}

export async function updateIntegrationSyncJob(input: {
  workspaceId: string;
  jobId: string;
  status: IntegrationSyncJobStatus;
  attempts?: number;
  errorMessage?: string | null;
  result?: Record<string, unknown>;
  startedAt?: string | null;
  finishedAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationSyncJob> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .update({
      status: input.status,
      attempts: input.attempts,
      error_message: input.errorMessage ?? null,
      result: (input.result ?? {}) as Json,
      started_at: input.startedAt,
      finished_at: input.finishedAt,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.jobId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update sync job: ${error?.message ?? "Unknown"}`);
  }
  return mapSyncJob(data);
}

export async function markIntegrationSynced(input: {
  workspaceId: string;
  accountId: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("integration_accounts")
    .update({
      last_sync_at: new Date().toISOString(),
      status: "connected",
      health: "healthy",
      error_message: null,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.accountId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to mark synced: ${error?.message ?? "Unknown"}`);
  }
  return mapAccount(data);
}

export async function listConnectedKairosProviders(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<IntegrationAccount[]> {
  const accounts = await listWorkspaceIntegrationAccounts(input);
  return accounts.filter(
    (account) => account.status === "connected" && account.kairosAccess,
  );
}
