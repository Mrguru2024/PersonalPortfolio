import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  const raw =
    process.env.SCHEDULING_TOKEN_ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET?.trim() || "";
  if (raw.length < 16) {
    throw new Error(
      "Set SCHEDULING_TOKEN_ENCRYPTION_KEY (preferred) or SESSION_SECRET (min 16 chars) to encrypt scheduling OAuth tokens.",
    );
  }
  return scryptSync(raw, "ascendra-scheduling-oauth", 32);
}

/** Encrypt refresh tokens for storage in scheduling_integration_configs.configJson */
export function encryptSchedulingSecret(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptSchedulingSecret(blob: string): string {
  const buf = Buffer.from(blob, "base64url");
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const enc = buf.subarray(32);
  const decipher = createDecipheriv(ALGO, deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function canEncryptSchedulingSecrets(): boolean {
  const raw =
    process.env.SCHEDULING_TOKEN_ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET?.trim() || "";
  return raw.length >= 16;
}
