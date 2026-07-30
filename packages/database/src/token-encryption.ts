import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "vb1";

function resolveEncryptionKey(): Buffer {
  const configured = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim();
  if (configured) {
    // Accept 32-byte hex or any passphrase (hashed to 32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(configured)) {
      return Buffer.from(configured, "hex");
    }
    return createHash("sha256").update(configured).digest();
  }

  // Local/dev fallback — never use empty storage for tokens
  const fallbackSeed =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    "vanderbase-dev-integration-token-key";
  return createHash("sha256").update(fallbackSeed).digest();
}

/** Encrypt a secret for storage in integration_tokens. */
export function encryptIntegrationSecret(plaintext: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/** Decrypt a secret previously stored with encryptIntegrationSecret. */
export function decryptIntegrationSecret(payload: string): string {
  const [prefix, ivB64, tagB64, dataB64] = payload.split(".");
  if (prefix !== PREFIX || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted token payload");
  }
  const key = resolveEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
