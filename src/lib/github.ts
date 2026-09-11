import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** Extract issue keys like WEB-12 from PR title/body. */
export function extractIssueKeys(text: string, projectKey?: string): string[] {
  const pattern = projectKey
    ? new RegExp(`\\b${escapeRegExp(projectKey)}-(\\d+)\\b`, "gi")
    : /\b([A-Z][A-Z0-9]+-\d+)\b/g;

  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (projectKey) {
      found.add(`${projectKey.toUpperCase()}-${match[1]}`);
    } else {
      found.add(match[1].toUpperCase());
    }
  }
  return [...found];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function verifyGithubSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function generateWebhookSecret() {
  return randomBytes(24).toString("hex");
}

export function normalizeGithubRepo(input: string): string | null {
  const trimmed = input.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  const match = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) return null;
  // GitHub owner/repo is case-insensitive; store canonical lowercase for stable matching
  return `${match[1]}/${match[2]}`.toLowerCase();
}
