"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  disconnectGithubAccountAction,
  disconnectGithubRepoAction,
  setAutoCloseAction,
  updateGithubSettingsAction,
} from "@/app/actions/github";
import { GitBranch, Settings2 } from "lucide-react";

type Props = {
  projectId: string;
  projectKey: string;
  githubRepo: string | null;
  autoCloseOnPrMerge: boolean;
  hasSecret: boolean;
  webhookUrl: string;
  oauthConfigured: boolean;
  githubLogin: string | null;
};

export function GithubSettingsForm({
  projectId,
  projectKey,
  githubRepo,
  autoCloseOnPrMerge,
  hasSecret,
  webhookUrl,
  oauthConfigured,
  githubLogin,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="panel border-primary/20">
      <div className="panel-body space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">GitHub integration</h2>
          <p className="text-sm opacity-70">
            Connect a repository so merged PRs that mention{" "}
            <code className="font-mono">{projectKey}-12</code> auto-mark issues DONE.
          </p>
        </div>

        {!oauthConfigured ? (
          <div className="rounded-box border border-warning/40 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div className="space-y-2 text-sm">
                <div className="font-semibold">One-click GitHub connect is not configured</div>
                <p className="opacity-80">
                  Create a GitHub OAuth App and set these environment variables, then restart the
                  server:
                </p>
                <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
                  <li>GITHUB_CLIENT_ID</li>
                  <li>GITHUB_CLIENT_SECRET</li>
                  <li>AUTH_URL (public app URL, used for OAuth callback)</li>
                </ul>
                <p className="opacity-70">
                  Authorization callback URL should be{" "}
                  <code className="rounded bg-base-100 px-1 font-mono text-xs">
                    {"{AUTH_URL}/api/github/oauth/callback"}
                  </code>
                  . Until then, use manual webhook setup below.
                </p>
              </div>
            </div>
          </div>
        ) : !githubLogin && !githubRepo ? (
          <div className="rounded-box border border-dashed border-base-300 bg-base-200/50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-base-100 shadow-sm">
              <GitBranch className="h-5 w-5 opacity-50" />
            </div>
            <h3 className="font-medium">Connect GitHub to this project</h3>
            <p className="mx-auto mt-1 max-w-md text-sm opacity-60">
              Authorize once for your organization, pick a repository, and we&apos;ll create the
              webhook that closes issues when PRs merge.
            </p>
            <ol className="mx-auto mt-4 max-w-sm space-y-1 text-left text-xs opacity-70">
              <li>1. Authorize GitHub (admin access to repos)</li>
              <li>2. Choose owner/repo from the picker</li>
              <li>
                3. Mention <code className="font-mono">{projectKey}-n</code> in PR titles
              </li>
            </ol>
            <a
              href={`/api/github/oauth/start?projectId=${projectId}`}
              className="btn btn-primary btn-sm mt-4"
            >
              Connect GitHub
            </a>
          </div>
        ) : (
          <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                {githubLogin ? (
                  <>
                    GitHub account: <span className="font-mono font-medium">{githubLogin}</span>
                  </>
                ) : (
                  <>Authorize GitHub, then pick a repository from the list.</>
                )}
                {githubRepo ? (
                  <div className="mt-1">
                    Linked repo:{" "}
                    <a
                      className="link link-primary font-mono"
                      href={`https://github.com/${githubRepo}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {githubRepo}
                    </a>
                    {hasSecret ? (
                      <span className="badge badge-success badge-sm ml-2">webhook active</span>
                    ) : (
                      <span className="badge badge-warning badge-sm ml-2">webhook pending</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-xs opacity-60">
                    Account connected — pick a repository to finish setup.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={
                    githubLogin
                      ? `/projects/${projectId}/settings/github`
                      : `/api/github/oauth/start?projectId=${projectId}`
                  }
                  className="btn btn-primary btn-sm"
                >
                  {githubRepo ? "Change repository" : githubLogin ? "Pick repository" : "Connect GitHub"}
                </a>
                {githubRepo && (
                  <button
                    type="button"
                    disabled={pending}
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      startTransition(async () => {
                        await disconnectGithubRepoAction(projectId);
                        router.refresh();
                      });
                    }}
                  >
                    Disconnect repo
                  </button>
                )}
                {githubLogin && (
                  <button
                    type="button"
                    disabled={pending}
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      startTransition(async () => {
                        await disconnectGithubAccountAction();
                        router.refresh();
                      });
                    }}
                  >
                    Disconnect account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <label className="label cursor-pointer justify-start gap-3">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={autoCloseOnPrMerge}
            disabled={pending}
            onChange={(e) => {
              startTransition(async () => {
                await setAutoCloseAction(projectId, e.target.checked);
                router.refresh();
              });
            }}
          />
          <span>Auto-mark issues DONE when matching PR is merged</span>
        </label>

        <div className="rounded-box border border-base-300 bg-base-200/60 p-3 text-sm">
          <div className="font-medium">PR title / description examples</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 opacity-80">
            <li>
              <code className="font-mono">Fix {projectKey}-12 login redirect</code>
            </li>
            <li>
              <code className="font-mono">
                Closes {projectKey}-12, {projectKey}-15
              </code>
            </li>
          </ul>
        </div>

        <div className="collapse collapse-arrow border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium">Manual webhook setup (advanced)</div>
          <div className="collapse-content">
            <form
              className="space-y-3 pt-1"
              action={(fd) => {
                startTransition(async () => {
                  const result = await updateGithubSettingsAction(projectId, fd);
                  if (result.error) {
                    setError(result.error);
                    setMsg(null);
                    setSecret(null);
                  } else {
                    setError(null);
                    setMsg("Manual GitHub settings saved.");
                    if (result.rotated && result.webhookSecret) setSecret(result.webhookSecret);
                  }
                });
              }}
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Repository</legend>
                <input
                  name="githubRepo"
                  defaultValue={githubRepo ?? ""}
                  placeholder="owner/repo"
                  className="input input-sm w-full"
                />
              </fieldset>

              <div className="rounded-box bg-base-200 p-3 text-xs">
                <div className="opacity-50">Webhook URL</div>
                <code className="break-all">{webhookUrl}</code>
              </div>

              <input type="hidden" name="autoCloseOnPrMerge" value="true" />
              <label className="label cursor-pointer justify-start gap-3">
                <input type="checkbox" name="rotateSecret" className="checkbox checkbox-sm" />
                <span className="text-sm">Generate / rotate webhook secret</span>
              </label>

              {secret && (
                <div role="alert" className="alert alert-warning text-sm">
                  <div>
                    <div className="font-semibold">Copy webhook secret into GitHub:</div>
                    <code className="mt-1 block break-all select-all">{secret}</code>
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}
              {msg && !secret && (
                <div role="alert" className="alert alert-success text-sm">
                  <span>{msg}</span>
                </div>
              )}

              <button type="submit" disabled={pending} className="btn btn-sm">
                Save manual settings
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
