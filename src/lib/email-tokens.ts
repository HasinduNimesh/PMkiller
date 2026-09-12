import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export type EmailTokenKind = "email-verify" | "password-reset";

const TTL_MS: Record<EmailTokenKind, number> = {
  "email-verify": 24 * 60 * 60 * 1000,
  "password-reset": 60 * 60 * 1000,
};

function identifierFor(kind: EmailTokenKind, email: string) {
  return `${kind}:${email.toLowerCase()}`;
}

/** Store a hash of the raw token so a DB leak cannot be used as a link. */
function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createEmailToken(kind: EmailTokenKind, email: string) {
  const raw = randomBytes(32).toString("hex");
  const token = hashToken(raw);
  const identifier = identifierFor(kind, email);
  const expires = new Date(Date.now() + TTL_MS[kind]);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return { rawToken: raw, expires };
}

export async function consumeEmailToken(
  kind: EmailTokenKind,
  email: string,
  rawToken: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const identifier = identifierFor(kind, email);
  const token = hashToken(rawToken);
  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });

  if (!row) return { ok: false, error: "Invalid or expired link." };
  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return { ok: false, error: "This link has expired. Request a new one." };
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return { ok: true };
}
