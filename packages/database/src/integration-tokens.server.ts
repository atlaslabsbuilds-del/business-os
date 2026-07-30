import "server-only";

import { createAdminClient } from "./admin";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "./token-encryption";
import type { Database } from "@repo/types";

type TokenRow = Database["public"]["Tables"]["integration_tokens"]["Row"];

export async function upsertIntegrationTokens(input: {
  workspaceId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  tokenType?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const accessEncrypted = encryptIntegrationSecret(input.accessToken);
  const refreshEncrypted = input.refreshToken
    ? encryptIntegrationSecret(input.refreshToken)
    : null;

  const { data: existing } = await admin
    .from("integration_tokens")
    .select("id")
    .eq("account_id", input.accountId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("integration_tokens")
      .update({
        access_token_encrypted: accessEncrypted,
        refresh_token_encrypted: refreshEncrypted,
        expires_at: input.expiresAt ?? null,
        token_type: input.tokenType ?? "Bearer",
        encryption_version: 1,
      })
      .eq("account_id", input.accountId);
    if (error) throw new Error(`Failed to update tokens: ${error.message}`);
    return;
  }

  const { error } = await admin.from("integration_tokens").insert({
    account_id: input.accountId,
    workspace_id: input.workspaceId,
    access_token_encrypted: accessEncrypted,
    refresh_token_encrypted: refreshEncrypted,
    expires_at: input.expiresAt ?? null,
    token_type: input.tokenType ?? "Bearer",
    encryption_version: 1,
  });
  if (error) throw new Error(`Failed to store tokens: ${error.message}`);
}

export async function getDecryptedIntegrationTokens(input: {
  accountId: string;
}): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  tokenType: string;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("integration_tokens")
    .select("*")
    .eq("account_id", input.accountId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load tokens: ${error.message}`);
  if (!data) return null;
  const row = data as TokenRow;
  return {
    accessToken: decryptIntegrationSecret(row.access_token_encrypted),
    refreshToken: row.refresh_token_encrypted
      ? decryptIntegrationSecret(row.refresh_token_encrypted)
      : null,
    expiresAt: row.expires_at,
    tokenType: row.token_type,
  };
}
