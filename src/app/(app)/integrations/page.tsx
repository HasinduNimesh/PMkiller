import { headers } from "next/headers";
import { auth } from "@/auth";
import { McpConnectPanel } from "@/components/mcp-connect-panel";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = (process.env.AUTH_URL ?? `${proto}://${host}`).replace(/\/$/, "");
  const apiConfigured = Boolean(process.env.MCP_API_KEY?.trim());

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
            Connect AI clients so agents can plan sprints, create issues, and assign work in{" "}
            {session.user.organizationName}.
          </p>
        </div>
      </div>

      <McpConnectPanel
        baseUrl={base}
        actorEmail={session.user.email ?? ""}
        apiConfigured={apiConfigured}
      />
    </div>
  );
}
