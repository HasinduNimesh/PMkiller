"use client";

import { Check } from "lucide-react";
import { McpClientSetupGrid } from "@/components/mcp-client-setup-grid";
import { MCP_PLACEHOLDER_TOKEN } from "@/lib/mcp-client-configs";

export function McpConnectPanel({
  baseUrl,
  actorEmail,
  actorRole,
}: {
  baseUrl: string;
  actorEmail: string;
  actorRole: string;
}) {
  return (
    <div className="space-y-5">
      <div className="callout callout-ok" role="status">
        <Check className="mt-0.5 h-5 w-5 shrink-0" />
        <span>
          Logged in as <code>{actorEmail}</code> ({actorRole}). Create a token above for ready-to-paste
          configs with your key filled in. Below is the same layout with a placeholder if you already
          have a token.
        </span>
      </div>

      <div className="panel neon-ring">
        <div className="panel-body space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Connect any AI client
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              Cursor, Claude Code, and Claude Desktop — each card has one-click copy. Prefer creating a
              fresh token above so the JSON/CLI already includes <code className="font-mono text-primary">pmk_…</code>.
            </p>
          </div>

          <McpClientSetupGrid baseUrl={baseUrl} apiKey={MCP_PLACEHOLDER_TOKEN} />

          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-base-content/70">
            <p className="font-medium text-base-content/80">Quick paths</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                <strong>Cursor:</strong> Settings → MCP → paste JSON → set{" "}
                <code className="font-mono text-primary">cwd</code> to your Proj-Manager clone.
              </li>
              <li>
                <strong>Claude Code:</strong> run the CLI snippet, or merge{" "}
                <code className="font-mono text-primary">.mcp.json</code> then{" "}
                <code className="font-mono text-primary">claude mcp list</code>.
              </li>
              <li>
                <strong>Claude Desktop:</strong> merge into{" "}
                <code className="font-mono text-primary">claude_desktop_config.json</code>, fully quit
                the app, reopen.
              </li>
            </ul>
            <p className="mt-3">
              Tools: <code className="font-mono text-primary">list_projects</code>,{" "}
              <code className="font-mono text-primary">list_issues</code>,{" "}
              <code className="font-mono text-primary">create_issue</code>,{" "}
              <code className="font-mono text-primary">update_issue</code>,{" "}
              <code className="font-mono text-primary">list_sprints</code>,{" "}
              <code className="font-mono text-primary">create_sprint</code>,{" "}
              <code className="font-mono text-primary">start_sprint</code>,{" "}
              <code className="font-mono text-primary">complete_sprint</code>,{" "}
              <code className="font-mono text-primary">reset_project_planning</code>,{" "}
              <code className="font-mono text-primary">my_work</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
