"use server";

import {
  createWorkspaceApiKey,
  getSecurityDashboardSnapshot,
  revokeUserDeviceSession,
  revokeWorkspaceApiKey,
  upsertWorkspaceSecuritySettings,
} from "@repo/database/security";
import {
  createWorkspaceApiKeySchema,
  revokeDeviceSessionSchema,
  revokeWorkspaceApiKeySchema,
  updateWorkspaceSecuritySettingsSchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireAdminContext() {
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Workspace required");
  if (context.active.role !== "owner" && context.active.role !== "admin") {
    throw new Error("Admin access required");
  }
  return {
    workspaceId: context.active.workspace.id,
    userId: context.userId,
    role: context.active.role,
  };
}

async function requireContext() {
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Workspace required");
  return {
    workspaceId: context.active.workspace.id,
    userId: context.userId,
    role: context.active.role,
    isAdmin: context.active.role === "owner" || context.active.role === "admin",
  };
}

export async function getSecurityDashboardAction(): Promise<Result<unknown>> {
  try {
    const ctx = await requireContext();
    const snapshot = await getSecurityDashboardSnapshot({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
    return { ok: true, data: { ...snapshot, isAdmin: ctx.isAdmin } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load security",
    };
  }
}

export async function updateSecuritySettingsAction(
  input: unknown,
): Promise<Result<{ settings: unknown }>> {
  const parsed = updateWorkspaceSecuritySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireAdminContext();
    const settings = await upsertWorkspaceSecuritySettings({
      workspaceId: ctx.workspaceId,
      ...parsed.data,
    });
    return { ok: true, data: { settings } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

export async function createApiKeyAction(
  input: unknown,
): Promise<Result<{ key: unknown; secret: string }>> {
  const parsed = createWorkspaceApiKeySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireAdminContext();
    const result = await createWorkspaceApiKey({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: parsed.data.name,
      scopes: parsed.data.scopes,
      expiresAt: parsed.data.expiresAt,
    });
    return { ok: true, data: { key: result.key, secret: result.secret } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create API key",
    };
  }
}

export async function revokeApiKeyAction(
  input: unknown,
): Promise<Result<{ revoked: true }>> {
  const parsed = revokeWorkspaceApiKeySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireAdminContext();
    await revokeWorkspaceApiKey({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      apiKeyId: parsed.data.apiKeyId,
    });
    return { ok: true, data: { revoked: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to revoke API key",
    };
  }
}

export async function revokeSessionAction(
  input: unknown,
): Promise<Result<{ revoked: true }>> {
  const parsed = revokeDeviceSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireContext();
    await revokeUserDeviceSession({
      userId: ctx.userId,
      sessionId: parsed.data.sessionId,
    });
    return { ok: true, data: { revoked: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to revoke session",
    };
  }
}
