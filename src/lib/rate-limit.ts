/**
 * Lightweight in-memory rate limiter for auth actions.
 * Works per server instance (sufficient to blunt casual abuse on Vercel).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true };
}

/** Best-effort client key from server action / request headers. */
export async function clientRateKey(prefix: string): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = fwd || h.get("x-real-ip") || "unknown";
    return `${prefix}:${ip}`;
  } catch {
    return `${prefix}:unknown`;
  }
}
