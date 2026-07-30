import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  SecurityAuditLogItem,
  UserDeviceSession,
  UserLoginHistoryItem,
  WorkspaceApiKey,
  WorkspaceSecuritySettings,
} from "@repo/types";
import { createAdminClient } from "./admin";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

export type SecurityAuditEvent = {
  workspaceId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

type SettingsRow =
  Database["public"]["Tables"]["workspace_security_settings"]["Row"];
type ApiKeyRow = Database["public"]["Tables"]["workspace_api_keys"]["Row"];
type LoginRow = Database["public"]["Tables"]["user_login_history"]["Row"];
type SessionRow = Database["public"]["Tables"]["user_device_sessions"]["Row"];
type AuditRow = Database["public"]["Tables"]["security_audit_logs"]["Row"];

function mapSettings(row: SettingsRow): WorkspaceSecuritySettings {
  return {
    workspaceId: row.workspace_id,
    mfaRequired: row.mfa_required,
    sessionTimeoutMinutes: row.session_timeout_minutes,
    allowApiKeys: row.allow_api_keys,
    rateLimitPerMinute: row.rate_limit_per_minute,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApiKey(row: ApiKeyRow): WorkspaceApiKey {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: row.scopes ?? [],
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLogin(row: LoginRow): UserLoginHistoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    eventType: row.event_type,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    deviceLabel: row.device_label,
    locationHint: row.location_hint,
    success: row.success,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function mapSession(row: SessionRow): UserDeviceSession {
  return {
    id: row.id,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    deviceLabel: row.device_label,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    lastActiveAt: row.last_active_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAudit(row: AuditRow): SecurityAuditLogItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    actorUserId: row.actor_user_id,
    eventType: row.event_type,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Writes security events with the service role so clients cannot forge or
 * delete audit history. Callers should avoid putting secrets in metadata.
 */
export async function writeSecurityAuditLog(
  event: SecurityAuditEvent,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("security_audit_logs").insert({
    workspace_id: event.workspaceId ?? null,
    actor_user_id: event.actorUserId ?? null,
    event_type: event.eventType,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    ip_hash: event.ipHash ?? null,
    user_agent: event.userAgent ?? null,
    metadata: (event.metadata ?? {}) as Json,
  });

  if (error) {
    console.error("[security.audit]", { eventType: event.eventType });
  }
}

export async function recordLoginHistory(input: {
  userId: string;
  workspaceId?: string | null;
  eventType?: string;
  ipHash?: string | null;
  userAgent?: string | null;
  deviceLabel?: string | null;
  locationHint?: string | null;
  success?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("user_login_history").insert({
    user_id: input.userId,
    workspace_id: input.workspaceId ?? null,
    event_type: input.eventType ?? "login",
    ip_hash: input.ipHash ?? null,
    user_agent: input.userAgent ?? null,
    device_label: input.deviceLabel ?? null,
    location_hint: input.locationHint ?? null,
    success: input.success ?? true,
    metadata: (input.metadata ?? {}) as Json,
  });
  if (error) {
    console.error("[security.login_history]", error.message);
  }
}

export async function getWorkspaceSecuritySettings(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceSecuritySettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_security_settings")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load security settings: ${error.message}`);
  }

  if (!data) {
    const now = new Date().toISOString();
    return {
      workspaceId: input.workspaceId,
      mfaRequired: false,
      sessionTimeoutMinutes: 1440,
      allowApiKeys: true,
      rateLimitPerMinute: 120,
      createdAt: now,
      updatedAt: now,
    };
  }

  return mapSettings(data);
}

export async function upsertWorkspaceSecuritySettings(input: {
  workspaceId: string;
  mfaRequired?: boolean;
  sessionTimeoutMinutes?: number;
  allowApiKeys?: boolean;
  rateLimitPerMinute?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceSecuritySettings> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["workspace_security_settings"]["Insert"] =
    {
      workspace_id: input.workspaceId,
    };
  if (input.mfaRequired !== undefined) patch.mfa_required = input.mfaRequired;
  if (input.sessionTimeoutMinutes !== undefined) {
    patch.session_timeout_minutes = input.sessionTimeoutMinutes;
  }
  if (input.allowApiKeys !== undefined) patch.allow_api_keys = input.allowApiKeys;
  if (input.rateLimitPerMinute !== undefined) {
    patch.rate_limit_per_minute = input.rateLimitPerMinute;
  }

  const { data, error } = await supabase
    .from("workspace_security_settings")
    .upsert(patch, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update security settings: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(data);
}

export async function listSecurityAuditLogs(input: {
  workspaceId: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<SecurityAuditLogItem[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("security_audit_logs")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (error) {
    throw new Error(`Failed to list audit logs: ${error.message}`);
  }
  return (data ?? []).map(mapAudit);
}

export async function listUserLoginHistory(input: {
  userId: string;
  workspaceId?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<UserLoginHistoryItem[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("user_login_history")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 30);

  if (input.workspaceId) {
    builder = builder.eq("workspace_id", input.workspaceId);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list login history: ${error.message}`);
  }
  return (data ?? []).map(mapLogin);
}

export async function listUserDeviceSessions(input: {
  userId: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<UserDeviceSession[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("user_device_sessions")
    .select("*")
    .eq("user_id", input.userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (error) {
    throw new Error(`Failed to list device sessions: ${error.message}`);
  }
  return (data ?? []).map(mapSession);
}

export async function upsertUserDeviceSession(input: {
  userId: string;
  workspaceId?: string | null;
  sessionToken: string;
  deviceLabel?: string | null;
  deviceType?: string;
  browser?: string | null;
  os?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<UserDeviceSession> {
  const supabase = await clientOrDefault(input.client);
  const tokenHash = hashSecret(input.sessionToken);
  const { data, error } = await supabase
    .from("user_device_sessions")
    .upsert(
      {
        user_id: input.userId,
        workspace_id: input.workspaceId ?? null,
        session_token_hash: tokenHash,
        device_label: input.deviceLabel ?? null,
        device_type: input.deviceType ?? "unknown",
        browser: input.browser ?? null,
        os: input.os ?? null,
        ip_hash: input.ipHash ?? null,
        user_agent: input.userAgent ?? null,
        last_active_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "user_id,session_token_hash" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to upsert device session: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSession(data);
}

export async function revokeUserDeviceSession(input: {
  userId: string;
  sessionId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("user_device_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", input.userId)
    .eq("id", input.sessionId);

  if (error) {
    throw new Error(`Failed to revoke session: ${error.message}`);
  }
}

export async function listWorkspaceApiKeys(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceApiKey[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_api_keys")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }
  return (data ?? []).map(mapApiKey);
}

export async function createWorkspaceApiKey(input: {
  workspaceId: string;
  userId: string;
  name: string;
  scopes?: string[];
  expiresAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<{ key: WorkspaceApiKey; secret: string }> {
  const supabase = await clientOrDefault(input.client);
  const secret = `vb_${randomBytes(24).toString("hex")}`;
  const keyPrefix = secret.slice(0, 10);
  const keyHash = hashSecret(secret);

  const { data, error } = await supabase
    .from("workspace_api_keys")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: input.scopes ?? ["read"],
      expires_at: input.expiresAt ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create API key: ${error?.message ?? "Unknown"}`);
  }

  await writeSecurityAuditLog({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    eventType: "api_key.created",
    resourceType: "workspace_api_key",
    resourceId: data.id,
    metadata: { name: input.name, prefix: keyPrefix },
  });

  return { key: mapApiKey(data), secret };
}

export async function revokeWorkspaceApiKey(input: {
  workspaceId: string;
  userId: string;
  apiKeyId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("workspace_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.apiKeyId);

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  await writeSecurityAuditLog({
    workspaceId: input.workspaceId,
    actorUserId: input.userId,
    eventType: "api_key.revoked",
    resourceType: "workspace_api_key",
    resourceId: input.apiKeyId,
  });
}

export async function getSecurityDashboardSnapshot(input: {
  workspaceId: string;
  userId: string;
  client?: SupabaseClient<Database>;
}) {
  const [settings, auditLogs, loginHistory, sessions, apiKeys] =
    await Promise.all([
      getWorkspaceSecuritySettings(input),
      listSecurityAuditLogs({ workspaceId: input.workspaceId, limit: 20, client: input.client }),
      listUserLoginHistory({ userId: input.userId, limit: 15, client: input.client }),
      listUserDeviceSessions({ userId: input.userId, limit: 10, client: input.client }),
      listWorkspaceApiKeys({ workspaceId: input.workspaceId, client: input.client }).catch(
        () => [] as WorkspaceApiKey[],
      ),
    ]);

  return {
    settings,
    auditLogs,
    loginHistory,
    sessions,
    apiKeys,
    mfaReady: true,
    score: Math.min(
      100,
      40 +
        (settings.mfaRequired ? 25 : 0) +
        (sessions.length > 0 ? 10 : 0) +
        (auditLogs.length > 0 ? 10 : 0) +
        (settings.allowApiKeys ? 5 : 15),
    ),
  };
}
