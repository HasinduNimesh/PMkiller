import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { McpConnectPanel } from "@/components/mcp-connect-panel";
import { ApiTokenManager } from "@/components/api-token-manager";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = (process.env.AUTH_URL ?? `${proto}://${host}`).replace(/\/$/, "");

  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl panel neon-ring">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl neon-orb"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />
        <div className="panel-body relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            MCP · Agent connect
          </p>
          <h1 className="page-title mt-1 neon-text">Integrations</h1>
          <p className="page-subtitle">
            Connect AI clients as <strong>{session.user.email}</strong> ({session.user.role}) in{" "}
            {session.user.organizationName} — create a personal token, no shared email env.
          </p>
        </div>
      </div>

      <ApiTokenManager
        baseUrl={base}
        actorEmail={session.user.email ?? ""}
        actorRole={session.user.role}
        tokens={tokens.map((t) => ({
          id: t.id,
          name: t.name,
          prefix: t.prefix,
          lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
      />

      <McpConnectPanel
        baseUrl={base}
        actorEmail={session.user.email ?? ""}
        actorRole={session.user.role}
      />
    </div>
  );
}
