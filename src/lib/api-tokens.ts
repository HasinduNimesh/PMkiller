import { createHash, randomBytes } from "crypto";

export const API_TOKEN_PREFIX = "pmk_";

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a new personal token. Returns the plaintext once — store only the hash. */
export function mintApiToken(): { token: string; prefix: string; tokenHash: string } {
  const secret = randomBytes(32).toString("base64url");
  const token = `${API_TOKEN_PREFIX}${secret}`;
  return {
    token,
    prefix: token.slice(0, 12),
    tokenHash: hashApiToken(token),
  };
}

export function isPersonalApiToken(token: string): boolean {
  return token.startsWith(API_TOKEN_PREFIX);
}
