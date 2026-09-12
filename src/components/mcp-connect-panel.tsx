"use client";

import { useState } from "react";
import { Check, Copy, Terminal, Sparkles, Code2 } from "lucide-react";

type MethodId = "cursor" | "claude-code" | "claude-desktop";

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-base-300/60 bg-base-200/40">
      <div className="flex items-center justify-between gap-2 border-b border-base-300/50 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
          {label}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-xs gap-1 rounded-lg"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-base-content/80">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function McpConnectPanel({
  baseUrl,
  actorEmail,
  apiConfigured,
}: {
  baseUrl: string;
  actorEmail: string;
  apiConfigured: boolean;
}) {
  const [method, setMethod] = useState<MethodId>("cursor");

  const envBlock = [
    `PROJMANAGER_URL=${baseUrl}`,
    `MCP_API_KEY=<your-MCP_API_KEY>`,
    `MCP_ACT_AS_EMAIL=${actorEmail}`,
  ].join("\n");

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        projmanager: {
          command: "pnpm",
          args: ["exec", "tsx", "mcp/server.ts"],
          cwd: "<path-to-Proj-Manager-repo>",
          env: {
            PROJMANAGER_URL: baseUrl,
            MCP_API_KEY: "<your-MCP_API_KEY>",
            MCP_ACT_AS_EMAIL: actorEmail,
          },
        },
      },
    },
    null,
    2,
  );

  const claudeCodeJson = JSON.stringify(
    {
      mcpServers: {
        projmanager: {
          type: "stdio",
          command: "pnpm",
          args: ["exec", "tsx", "mcp/server.ts"],
          env: {
            PROJMANAGER_URL: baseUrl,
            MCP_API_KEY: "<your-MCP_API_KEY>",
            MCP_ACT_AS_EMAIL: actorEmail,
          },
        },
      },
    },
    null,
    2,
  );

  const claudeCli = [
    `cd <path-to-Proj-Manager-repo>`,
    `claude mcp add --scope user projmanager -- env \\`,
    `  PROJMANAGER_URL=${baseUrl} \\`,
    `  MCP_API_KEY=<your-MCP_API_KEY> \\`,
    `  MCP_ACT_AS_EMAIL=${actorEmail} \\`,
    `  pnpm exec tsx mcp/server.ts`,
  ].join("\n");

  const methods: {
    id: MethodId;
    title: string;
    subtitle: string;
    icon: typeof Code2;
  }[] = [
    {
      id: "cursor",
      title: "Cursor",
      subtitle: "IDE · Agent Mode",
      icon: Code2,
    },
    {
      id: "claude-code",
      title: "Claude Code",
      subtitle: "CLI · .mcp.json",
      icon: Terminal,
    },
    {
      id: "claude-desktop",
      title: "Claude Desktop",
      subtitle: "App connectors",
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          apiConfigured
            ? "border-success/30 bg-success/10 text-success"
            : "border-warning/30 bg-warning/10 text-warning"
        }`}
      >
        {apiConfigured ? (
          <span>
            MCP API is enabled on this deployment. Use your server <code className="font-mono">MCP_API_KEY</code>{" "}
            in the client config below.
          </span>
        ) : (
          <span>
            Set <code className="font-mono">MCP_API_KEY</code> and{" "}
            <code className="font-mono">MCP_ACT_AS_EMAIL</code> on the server (Vercel env), then redeploy
            before connecting a client.
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-base-content bg-base-content text-base-100"
                  : "border-base-300/60 bg-base-100/80 hover:border-base-content/30"
              }`}
            >
              <Icon className={`mb-2 h-5 w-5 ${active ? "opacity-90" : "text-primary"}`} />
              <div className="font-display text-base font-semibold tracking-tight">{m.title}</div>
              <div className={`mt-0.5 text-xs ${active ? "opacity-70" : "text-base-content/50"}`}>
                {m.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-body space-y-4">
          {method === "cursor" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Connect Cursor</h2>
                <p className="mt-1 text-sm text-base-content/55">
                  Add ProjManager as an MCP server so Agent Mode can plan sprints, create issues, and
                  assign work.
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/70">
                <li>Clone this repo (needs <code className="font-mono">mcp/server.ts</code>).</li>
                <li>
                  Open <strong>Cursor Settings → MCP</strong> (or project <code className="font-mono">.cursor/mcp.json</code>).
                </li>
                <li>Paste the JSON below, set repo path + API key, then restart MCP / reload Cursor.</li>
              </ol>
              <CopyBlock label="Cursor mcp.json" value={cursorJson} />
              <CopyBlock label="Env values" value={envBlock} />
            </>
          )}

          {method === "claude-code" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Connect Claude Code</h2>
                <p className="mt-1 text-sm text-base-content/55">
                  Use project <code className="font-mono">.mcp.json</code> or add via CLI so Claude Code can
                  call the same scrum tools.
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/70">
                <li>From the ProjManager repo root, add a user-scoped or project-scoped server.</li>
                <li>
                  Prefer CLI, or create <code className="font-mono">.mcp.json</code> and restart Claude Code.
                </li>
                <li>
                  Verify with <code className="font-mono">claude mcp list</code>.
                </li>
              </ol>
              <CopyBlock label="CLI (user scope)" value={claudeCli} />
              <CopyBlock label=".mcp.json / ~/.claude.json" value={claudeCodeJson} />
            </>
          )}

          {method === "claude-desktop" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Connect Claude Desktop</h2>
                <p className="mt-1 text-sm text-base-content/55">
                  Claude Desktop uses a separate config file from Claude Code.
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/70">
                <li>
                  Edit <code className="font-mono">claude_desktop_config.json</code>:
                  <ul className="mt-1 list-disc pl-5">
                    <li>macOS: <code className="font-mono">~/Library/Application Support/Claude/</code></li>
                    <li>Windows: <code className="font-mono">%APPDATA%\Claude\</code></li>
                  </ul>
                </li>
                <li>Merge the JSON below under <code className="font-mono">mcpServers</code>.</li>
                <li>Fully quit and reopen Claude Desktop.</li>
              </ol>
              <CopyBlock label="claude_desktop_config.json" value={claudeCodeJson} />
              <CopyBlock label="Env values" value={envBlock} />
            </>
          )}

          <div className="rounded-xl bg-base-200/60 px-4 py-3 text-xs text-base-content/55">
            Tools available after connect: <code className="font-mono">list_projects</code>,{" "}
            <code className="font-mono">list_issues</code>, <code className="font-mono">create_issue</code>,{" "}
            <code className="font-mono">update_issue</code>, <code className="font-mono">list_sprints</code>,{" "}
            <code className="font-mono">create_sprint</code>, <code className="font-mono">start_sprint</code>,{" "}
            <code className="font-mono">complete_sprint</code>, <code className="font-mono">my_work</code>,
            prompt <code className="font-mono">plan_sprint</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
