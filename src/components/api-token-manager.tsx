"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { createApiTokenAction, revokeApiTokenAction } from "@/app/actions/api-tokens";

export type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

function CopyOnce({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary btn-sm gap-1 rounded-xl"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy token"}
    </button>
  );
}

export function ApiTokenManager({
  tokens,
  baseUrl,
  actorEmail,
  actorRole,
}: {
  tokens: TokenRow[];
  baseUrl: string;
  actorEmail: string;
  actorRole: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const cursorJson = freshToken
    ? JSON.stringify(
        {
          mcpServers: {
            projmanager: {
              command: "pnpm",
              args: ["exec", "tsx", "mcp/server.ts"],
              cwd: "<path-to-Proj-Manager-repo>",
              env: {
                PROJMANAGER_URL: baseUrl,
                MCP_API_KEY: freshToken,
              },
            },
          },
        },
        null,
        2,
      )
    : null;

  return (
    <div className="panel neon-ring">
      <div className="panel-body space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">Your MCP token</h2>
          </div>
          <p className="mt-1 text-sm text-base-content/60">
            Create a personal token while logged in. Agents use <strong>your</strong> account (
            {actorEmail} · {actorRole}) — no shared email env on Vercel.
          </p>
        </div>

        {freshToken && (
          <div className="callout callout-ok space-y-3" role="status">
            <p className="font-medium">Copy this token now — it won’t be shown again.</p>
            <pre className="overflow-x-auto rounded-xl bg-base-100/50 p-3 font-mono text-xs break-all">
              {freshToken}
            </pre>
            <div className="flex flex-wrap gap-2">
              <CopyOnce value={freshToken} />
              {cursorJson && <CopyOnce value={cursorJson} />}
            </div>
            <p className="text-xs opacity-80">
              Paste as <code>MCP_API_KEY</code> in Cursor. Do not set <code>MCP_ACT_AS_EMAIL</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="callout callout-error" role="alert">
            {error}
          </div>
        )}

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            start(async () => {
              const res = await createApiTokenAction(fd);
              if ("error" in res && res.error) {
                setError(res.error);
                return;
              }
              if ("token" in res && res.token) {
                setFreshToken(res.token);
                e.currentTarget.reset();
              }
            });
          }}
        >
          <label className="form-control w-full max-w-xs">
            <span className="label-text text-xs text-base-content/55">Label</span>
            <input
              name="name"
              className="input input-bordered input-sm rounded-xl"
              placeholder="Cursor MCP"
              defaultValue="Cursor MCP"
              maxLength={80}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-sm rounded-xl" disabled={pending}>
            {pending ? "Creating…" : "Create token"}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="table table-sm table-modern">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Created</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-base-content/50">
                    No active tokens yet.
                  </td>
                </tr>
              )}
              {tokens.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.name}</td>
                  <td className="font-mono text-xs text-primary/80">{t.prefix}…</td>
                  <td className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="text-xs">
                    {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "—"}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error gap-1"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        start(async () => {
                          const res = await revokeApiTokenAction(t.id);
                          if ("error" in res && res.error) setError(res.error);
                          if (freshToken?.startsWith(t.prefix)) setFreshToken(null);
                        });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
