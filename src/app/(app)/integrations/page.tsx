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
      <div>
        <h1 className="page-title">Integrations</h1>
        <p className="page-subtitle">
          Connect AI clients so agents can plan sprints, create issues, and assign work in{" "}
          {session.user.organizationName}.
        </p>
      </div>

      <McpConnectPanel
        baseUrl={base}
        actorEmail={session.user.email ?? ""}
        apiConfigured={apiConfigured}
      />
    </div>
  );
}
