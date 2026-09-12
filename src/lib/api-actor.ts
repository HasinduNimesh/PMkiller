import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasMinRole } from "@/lib/rbac";

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

/** Accept Bearer MCP_API_KEY (env). Optional X-Act-As-Email to pick the org user. */
export async function requireApiActor(req: Request | NextRequest): Promise<ApiActor | NextResponse> {
  const expected = process.env.MCP_API_KEY?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "MCP API is not configured. Set MCP_API_KEY on the server." },
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actAs =
    req.headers.get("x-act-as-email")?.trim().toLowerCase() ||
    process.env.MCP_ACT_AS_EMAIL?.trim().toLowerCase();

  if (!actAs) {
    return NextResponse.json(
      {
        error:
          "Missing actor. Set MCP_ACT_AS_EMAIL or send X-Act-As-Email with an org member email.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: actAs },
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
      { error: `No organization membership found for ${actAs}` },
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
