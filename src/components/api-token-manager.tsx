"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { createApiTokenAction, revokeApiTokenAction } from "@/app/actions/api-tokens";
import { McpClientSetupGrid } from "@/components/mcp-client-setup-grid";

export type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
};

function CopyOnce({ value, label = "Copy token" }: { value: string; label?: string }) {
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
      {copied ? "Copied" : label}
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
          <div
            className="space-y-4 rounded-2xl border border-success/35 bg-success/5 p-4 sm:p-5"
            role="status"
          >
            <div>
              <p className="font-medium text-success">Token ready — copy setup for any client</p>
              <p className="mt-1 text-xs text-base-content/60">
                Shown once. Configs already include this token.
              </p>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-base-300/50 bg-base-100 p-3 font-mono text-xs break-all">
              {freshToken}
            </pre>
            <CopyOnce value={freshToken} label="Copy raw token" />

            <div className="border-t border-success/20 pt-4">
              <p className="mb-3 text-sm font-semibold">One-click client setup</p>
              <McpClientSetupGrid baseUrl={baseUrl} apiKey={freshToken} emphasize />
            </div>
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
            const form = e.currentTarget;
            const fd = new FormData(form);
            setError(null);
            start(async () => {
              const res = await createApiTokenAction(fd);
              if ("error" in res && res.error) {
                setError(res.error);
                return;
              }
              if ("token" in res && res.token) {
                setFreshToken(res.token);
                if (form.isConnected) form.reset();
              }
            });
          }}
        >
          <label className="form-control w-full max-w-xs">
            <span className="label-text text-xs text-base-content/55">Label</span>
            <input
              name="name"
              className="input input-bordered input-sm rounded-xl"
              placeholder="My laptop MCP"
              defaultValue="My MCP client"
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
