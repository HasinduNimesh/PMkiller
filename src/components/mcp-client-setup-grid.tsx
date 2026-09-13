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

function CopyBtn({
  id,
  value,
  label,
  copiedKey,
  onCopy,
  primary,
}: {
  id: string;
  value: string;
  label: string;
  copiedKey: string | null;
  onCopy: (id: string, value: string) => void;
  primary?: boolean;
}) {
  const done = copiedKey === id;
  return (
    <button
      type="button"
      className={`btn btn-sm gap-1.5 rounded-xl ${primary ? "btn-primary" : "btn-outline"}`}
      onClick={() => onCopy(id, value)}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied!" : label}
    </button>
  );
}

function Snippet({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/15 bg-base-100/50">
      <div className="border-b border-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
        {label}
      </div>
      <pre className="max-h-48 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-base-content/80">
        <code>{value}</code>
      </pre>
    </div>
  );
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
    pathHint: "Paste into Cursor MCP config",
  },
  {
    id: "claude-code",
    title: "Claude Code",
    subtitle: "CLI or .mcp.json",
    icon: Terminal,
    pathHint: "Run CLI or merge into .mcp.json",
  },
  {
    id: "claude-desktop",
    title: "Claude Desktop",
    subtitle: "claude_desktop_config.json",
    icon: Sparkles,
    pathHint: "macOS ~/Library/Application Support/Claude/ · Windows %APPDATA%\\Claude\\",
  },
];

/** One-click setup cards for all clients — used after token creation and in the guide. */
export function McpClientSetupGrid({
  baseUrl,
  apiKey,
  emphasize,
}: {
  baseUrl: string;
  apiKey: string;
  /** When true, treat as “ready to paste” (real token). */
  emphasize?: boolean;
}) {
  const { copiedKey, copy } = useCopy();
  const [open, setOpen] = useState<ClientId | null>(emphasize ? "cursor" : null);

  const configs = {
    cursor: {
      primary: { id: "cursor-json", label: "Copy Cursor JSON", value: mcpCursorJson(baseUrl, apiKey) },
      secondary: { id: "cursor-env", label: "Copy env", value: mcpEnvBlock(baseUrl, apiKey) },
      preview: mcpCursorJson(baseUrl, apiKey),
      previewLabel: "mcp.json",
    },
    "claude-code": {
      primary: {
        id: "claude-cli",
        label: "Copy CLI command",
        value: mcpClaudeCodeCli(baseUrl, apiKey),
      },
      secondary: {
        id: "claude-code-json",
        label: "Copy .mcp.json",
        value: mcpClaudeCodeJson(baseUrl, apiKey),
      },
      preview: mcpClaudeCodeCli(baseUrl, apiKey),
      previewLabel: "CLI (user scope)",
    },
    "claude-desktop": {
      primary: {
        id: "desktop-json",
        label: "Copy Desktop JSON",
        value: mcpClaudeDesktopJson(baseUrl, apiKey),
      },
      secondary: {
        id: "desktop-env",
        label: "Copy env",
        value: mcpEnvBlock(baseUrl, apiKey),
      },
      preview: mcpClaudeDesktopJson(baseUrl, apiKey),
      previewLabel: "claude_desktop_config.json",
    },
  } as const;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {CLIENTS.map((c) => {
          const Icon = c.icon;
          const cfg = configs[c.id];
          const active = open === c.id;
          return (
            <div
              key={c.id}
              className={`flex flex-col rounded-2xl border p-4 transition ${
                emphasize
                  ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_color-mix(in_oklab,var(--color-primary)_12%,transparent)]"
                  : active
                    ? "border-primary/40 bg-base-100/80"
                    : "border-base-300/80 bg-base-100/40"
              }`}
            >
              <button
                type="button"
                className="flex flex-1 flex-col items-start text-left"
                onClick={() => setOpen(active ? null : c.id)}
              >
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <div className="font-display text-base font-semibold tracking-tight">{c.title}</div>
                <div className="mt-0.5 text-xs text-base-content/55">{c.subtitle}</div>
              </button>
              <div className="mt-3 flex flex-col gap-2">
                <CopyBtn
                  id={cfg.primary.id}
                  value={cfg.primary.value}
                  label={cfg.primary.label}
                  copiedKey={copiedKey}
                  onCopy={copy}
                  primary
                />
                <CopyBtn
                  id={cfg.secondary.id}
                  value={cfg.secondary.value}
                  label={cfg.secondary.label}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              </div>
              {active && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-base-content/55">{c.pathHint}</p>
                  <Snippet label={cfg.previewLabel} value={cfg.preview} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!emphasize && apiKey === MCP_PLACEHOLDER_TOKEN && (
        <p className="text-xs text-base-content/50">
          These snippets use a placeholder token. Create a personal token above, then use the
          one-click buttons in the green success card (token already filled in).
        </p>
      )}
    </div>
  );
}
