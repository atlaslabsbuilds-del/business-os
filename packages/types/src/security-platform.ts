import { z } from "zod";

export type WorkspaceSecuritySettings = {
  workspaceId: string;
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  allowApiKeys: boolean;
  rateLimitPerMinute: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceApiKey = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserLoginHistoryItem = {
  id: string;
  userId: string;
  workspaceId: string | null;
  eventType: string;
  ipHash: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  locationHint: string | null;
  success: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type UserDeviceSession = {
  id: string;
  userId: string;
  workspaceId: string | null;
  deviceLabel: string | null;
  deviceType: string;
  browser: string | null;
  os: string | null;
  ipHash: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SecurityAuditLogItem = {
  id: string;
  workspaceId: string | null;
  actorUserId: string | null;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  ipHash: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export const createWorkspaceApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const revokeWorkspaceApiKeySchema = z.object({
  apiKeyId: z.string().uuid(),
});

export const revokeDeviceSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const updateWorkspaceSecuritySettingsSchema = z.object({
  mfaRequired: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().min(15).max(43200).optional(),
  allowApiKeys: z.boolean().optional(),
  rateLimitPerMinute: z.number().int().min(10).max(10000).optional(),
});

export type CreateWorkspaceApiKeyInput = z.infer<typeof createWorkspaceApiKeySchema>;
export type UpdateWorkspaceSecuritySettingsInput = z.infer<
  typeof updateWorkspaceSecuritySettingsSchema
>;
