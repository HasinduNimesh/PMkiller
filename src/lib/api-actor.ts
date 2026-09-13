import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/rbac";
import { hashApiToken, isPersonalApiToken } from "@/lib/api-tokens";

export type ApiActor = {
  userId: string;
  email: string;
  name: string | null;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
};

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function isProductionRuntime() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

async function actorFromUserId(userId: string): Promise<ApiActor | NextResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) {
    return NextResponse.json(
      { error: "No organization membership found for this token." },
      { status: 403 },
    );
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}

async function actorFromEmail(email: string): Promise<ApiActor | NextResponse> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      memberships: {
        include: { organization: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) {
    return NextResponse.json(
      { error: "No organization membership found for this actor." },
      { status: 403 },
    );
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}

/**
 * Auth for /api/v1:
 * 1. Personal token `pmk_…` (preferred) — identity + role from the token owner.
 * 2. Legacy shared `MCP_API_KEY` — only when explicitly allowed; actor is fixed
 *    via server env `MCP_ACT_AS_EMAIL` (request header Act-As is ignored).
 */
export async function requireApiActor(req: Request | NextRequest): Promise<ApiActor | NextResponse> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isPersonalApiToken(token)) {
    const tokenHash = hashApiToken(token);
    const row = await prisma.apiToken.findUnique({ where: { tokenHash } });
    if (!row || row.revokedAt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    void prisma.apiToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
    return actorFromUserId(row.userId);
  }

  const expected = process.env.MCP_API_KEY?.trim();
  if (!expected || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Shared key is dangerous: disabled in production unless explicitly opted in.
  const allowShared =
    process.env.MCP_ALLOW_SHARED_KEY === "true" || !isProductionRuntime();
  if (!allowShared) {
    return NextResponse.json(
      {
        error:
          "Shared MCP_API_KEY is disabled in production. Create a personal pmk_ token on /integrations.",
      },
      { status: 401 },
    );
  }

  // Never trust client-supplied Act-As — only the server env pin.
  const actAs = process.env.MCP_ACT_AS_EMAIL?.trim().toLowerCase();
  if (!actAs) {
    return NextResponse.json(
      {
        error:
          "Shared MCP key requires MCP_ACT_AS_EMAIL on the server (fixed actor). Prefer a personal pmk_ token.",
      },
      { status: 400 },
    );
  }

  // Ignore spoofable X-Act-As-Email header entirely.
  if (req.headers.get("x-act-as-email")) {
    console.warn("[api] Ignoring X-Act-As-Email header; using MCP_ACT_AS_EMAIL only");
  }

  return actorFromEmail(actAs);
}

export function requireActorRole(actor: ApiActor, min: OrgRole): NextResponse | null {
  if (!hasMinRole(actor.role, min)) {
    return NextResponse.json(
      { error: `Requires role ${min} or higher (you are ${actor.role}).` },
      { status: 403 },
    );
  }
  return null;
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
