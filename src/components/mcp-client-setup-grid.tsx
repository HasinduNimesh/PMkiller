"use client";

import { useState } from "react";
import { Check, Copy, Code2, Terminal, Sparkles } from "lucide-react";
import {
  MCP_PLACEHOLDER_TOKEN,
  mcpClaudeCodeCli,
  mcpClaudeCodeJson,
  mcpClaudeDesktopJson,
  mcpCursorJson,
  mcpEnvBlock,
} from "@/lib/mcp-client-configs";

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      /* ignore */
    }
  }
  return { copiedKey, copy };
}

type ClientId = "cursor" | "claude-code" | "claude-desktop";

const CLIENTS: {
  id: ClientId;
  title: string;
  subtitle: string;
  icon: typeof Code2;
  pathHint: string;
}[] = [
  {
    id: "cursor",
    title: "Cursor",
    subtitle: "Settings → MCP",
    icon: Code2,
    pathHint: "Paste into Cursor Settings → MCP. Set cwd to your Proj-Manager clone.",
  },
  {
    id: "claude-code",
    title: "Claude Code",
    subtitle: "CLI or .mcp.json",
    icon: Terminal,
    pathHint: "Run the CLI, or merge into .mcp.json / ~/.claude.json, then claude mcp list.",
  },
  {
    id: "claude-desktop",
    title: "Claude Desktop",
    subtitle: "App config file",
    icon: Sparkles,
    pathHint:
      "Merge into claude_desktop_config.json (macOS: ~/Library/Application Support/Claude/, Windows: %APPDATA%\\Claude\\), then fully quit and reopen.",
  },
];

/** Equal-height client cards with one-click copy. Preview sits below the row. */
export function McpClientSetupGrid({
  baseUrl,
  apiKey,
  emphasize,
}: {
  baseUrl: string;
  apiKey: string;
  emphasize?: boolean;
}) {
  const { copiedKey, copy } = useCopy();
  const [selected, setSelected] = useState<ClientId>("cursor");

  const configs = {
    cursor: {
      buttons: [
        { id: "cursor-json", label: "Copy Cursor JSON", value: mcpCursorJson(baseUrl, apiKey), primary: true },
        { id: "cursor-env", label: "Copy env", value: mcpEnvBlock(baseUrl, apiKey), primary: false },
      ],
      previewLabel: "Cursor mcp.json",
      preview: mcpCursorJson(baseUrl, apiKey),
    },
    "claude-code": {
      buttons: [
        { id: "claude-cli", label: "Copy CLI command", value: mcpClaudeCodeCli(baseUrl, apiKey), primary: true },
        { id: "claude-code-json", label: "Copy .mcp.json", value: mcpClaudeCodeJson(baseUrl, apiKey), primary: false },
      ],
      previewLabel: "Claude Code CLI",
      preview: mcpClaudeCodeCli(baseUrl, apiKey),
    },
    "claude-desktop": {
      buttons: [
        {
          id: "desktop-json",
          label: "Copy Desktop JSON",
          value: mcpClaudeDesktopJson(baseUrl, apiKey),
          primary: true,
        },
        { id: "desktop-env", label: "Copy env", value: mcpEnvBlock(baseUrl, apiKey), primary: false },
      ],
      previewLabel: "claude_desktop_config.json",
      preview: mcpClaudeDesktopJson(baseUrl, apiKey),
    },
  } as const;

  const active = configs[selected];
  const activeMeta = CLIENTS.find((c) => c.id === selected)!;

  return (
    <div className="w-full space-y-4">
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:items-stretch">
        {CLIENTS.map((c) => {
          const Icon = c.icon;
          const cfg = configs[c.id];
          const isSelected = selected === c.id;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(c.id);
                }
              }}
              className={`flex h-full min-h-[11.5rem] flex-col rounded-2xl border p-4 outline-none transition ${
                isSelected
                  ? emphasize
                    ? "border-primary bg-base-100 ring-2 ring-primary/30"
                    : "border-primary bg-base-100 ring-2 ring-primary/25"
                  : "border-base-300/70 bg-base-100/70 hover:border-primary/40"
              }`}
            >
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold tracking-tight">{c.title}</div>
                  <div className="mt-0.5 text-xs text-base-content/55">{c.subtitle}</div>
                </div>
              </div>

              <div className="mt-auto flex w-full flex-col gap-2">
                {cfg.buttons.map((b) => {
                  const done = copiedKey === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`btn btn-sm w-full justify-center gap-1.5 rounded-xl ${
                        b.primary ? "btn-primary" : "btn-outline"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        void copy(b.id, b.value);
                      }}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {done ? "Copied!" : b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300/60 px-4 py-2.5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              {active.previewLabel}
            </div>
            <p className="mt-0.5 text-xs text-base-content/55">{activeMeta.pathHint}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 rounded-lg"
            onClick={() => void copy(`preview-${selected}`, active.preview)}
          >
            {copiedKey === `preview-${selected}` ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedKey === `preview-${selected}` ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="max-h-56 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-base-content/80">
          <code>{active.preview}</code>
        </pre>
      </div>

      {!emphasize && apiKey === MCP_PLACEHOLDER_TOKEN && (
        <p className="text-xs text-base-content/50">
          Placeholder token in snippets. Create a personal token above for configs with your real{" "}
          <code className="font-mono">pmk_</code> key filled in.
        </p>
      )}
    </div>
  );
}
