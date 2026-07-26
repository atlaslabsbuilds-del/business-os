import { createAdminClient } from "./admin";
import type { Json } from "@repo/types";

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
