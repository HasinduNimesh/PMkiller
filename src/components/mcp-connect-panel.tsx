"use client";

import { useState } from "react";
import { Check, Copy, Terminal, Sparkles, Code2 } from "lucide-react";

type MethodId = "cursor" | "claude-code" | "claude-desktop";

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="copy-block">
      <div className="flex items-center justify-between gap-2 border-b border-primary/10 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/55">
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
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-base-content/85">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function McpConnectPanel({
  baseUrl,
  actorEmail,
  actorRole,
}: {
  baseUrl: string;
  actorEmail: string;
  actorRole: string;
}) {
  const [method, setMethod] = useState<MethodId>("cursor");

  const envBlock = [
    `PROJMANAGER_URL=${baseUrl}`,
    `MCP_API_KEY=<paste-your-personal-pmk_token>`,
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
            MCP_API_KEY: "<paste-your-personal-pmk_token>",
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
            MCP_API_KEY: "<paste-your-personal-pmk_token>",
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
    `  MCP_API_KEY=<paste-your-personal-pmk_token> \\`,
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
      <div className="callout callout-ok" role="status">
        <Check className="mt-0.5 h-5 w-5 shrink-0" />
        <span>
          Logged in as <code>{actorEmail}</code> ({actorRole}). Create a personal token above, then
          paste it as <code>MCP_API_KEY</code> in your client — no Vercel email env needed.
        </span>
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
                  ? "border-primary bg-primary text-primary-content shadow-[0_0_28px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]"
                  : "glass border-primary/25 hover:shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_20%,transparent)]"
              }`}
            >
              <Icon className={`mb-2 h-5 w-5 ${active ? "opacity-90" : "text-primary"}`} />
              <div className="font-display text-base font-semibold tracking-tight">{m.title}</div>
              <div className={`mt-0.5 text-xs ${active ? "text-primary-content/80" : "text-base-content/55"}`}>
                {m.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel neon-ring">
        <div className="panel-body space-y-4">
          {method === "cursor" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Connect Cursor</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Use your personal <code className="font-mono text-primary">pmk_</code> token from
                  above. The agent runs as you ({actorRole}).
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/75">
                <li>Create a personal token in the section above and copy it.</li>
                <li>Clone this repo (needs <code className="font-mono text-primary">mcp/server.ts</code>).</li>
                <li>
                  Open <strong>Cursor Settings → MCP</strong> and paste the JSON below (replace the
                  token placeholder).
                </li>
              </ol>
              <CopyBlock label="Cursor mcp.json" value={cursorJson} />
              <CopyBlock label="Env values" value={envBlock} />
            </>
          )}

          {method === "claude-code" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Connect Claude Code</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Same personal token — no <code className="font-mono text-primary">MCP_ACT_AS_EMAIL</code>.
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/75">
                <li>Create a personal token above.</li>
                <li>
                  Prefer CLI, or create <code className="font-mono text-primary">.mcp.json</code> and
                  restart Claude Code.
                </li>
                <li>
                  Verify with <code className="font-mono text-primary">claude mcp list</code>.
                </li>
              </ol>
              <CopyBlock label="CLI (user scope)" value={claudeCli} />
              <CopyBlock label=".mcp.json / ~/.claude.json" value={claudeCodeJson} />
            </>
          )}

          {method === "claude-desktop" && (
            <>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Connect Claude Desktop
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Claude Desktop uses a separate config file from Claude Code.
                </p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/75">
                <li>
                  Edit <code className="font-mono text-primary">claude_desktop_config.json</code>:
                  <ul className="mt-1 list-disc pl-5">
                    <li>
                      macOS:{" "}
                      <code className="font-mono text-primary">
                        ~/Library/Application Support/Claude/
                      </code>
                    </li>
                    <li>
                      Windows: <code className="font-mono text-primary">%APPDATA%\Claude\</code>
                    </li>
                  </ul>
                </li>
                <li>
                  Merge the JSON below under <code className="font-mono text-primary">mcpServers</code>.
                </li>
                <li>Fully quit and reopen Claude Desktop.</li>
              </ol>
              <CopyBlock label="claude_desktop_config.json" value={claudeCodeJson} />
              <CopyBlock label="Env values" value={envBlock} />
            </>
          )}

          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-base-content/70">
            Tools available after connect: <code className="font-mono text-primary">list_projects</code>,{" "}
            <code className="font-mono text-primary">list_issues</code>,{" "}
            <code className="font-mono text-primary">create_issue</code>,{" "}
            <code className="font-mono text-primary">update_issue</code>,{" "}
            <code className="font-mono text-primary">list_sprints</code>,{" "}
            <code className="font-mono text-primary">create_sprint</code>,{" "}
            <code className="font-mono text-primary">start_sprint</code>,{" "}
            <code className="font-mono text-primary">complete_sprint</code>,{" "}
            <code className="font-mono text-primary">my_work</code>, prompt{" "}
            <code className="font-mono text-primary">plan_sprint</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
