import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function keyFromSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is required to encrypt secrets at rest");
  }
  return createHash("sha256").update(`pmk-secrets:${secret}`).digest();
}

/** AES-256-GCM encrypt. Returns `enc:v1:<iv>:<tag>:<ciphertext>` (base64url parts). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

/**
 * Decrypt `enc:v1:…` values. Legacy plaintext (pre-encryption) is returned as-is
 * so existing GitHub tokens keep working until reconnected.
 */
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncryptedSecret(stored: string) {
  return stored.startsWith(PREFIX);
}
