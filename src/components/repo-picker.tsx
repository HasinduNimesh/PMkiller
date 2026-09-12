"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { linkGithubRepoAction } from "@/app/actions/github";

type Repo = {
  id: number;
  fullName: string;
  private: boolean;
  description: string | null;
  htmlUrl: string;
};

export function RepoPicker({
  projectId,
  currentRepo,
  repos,
}: {
  projectId: string;
  currentRepo: string | null;
  repos: Repo[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return repos;
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(needle) ||
        (r.description ?? "").toLowerCase().includes(needle),
    );
  }, [q, repos]);

  return (
    <div className="panel">
      <div className="panel-body gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search repositories…"
          className="input input-bordered w-full max-w-md"
        />

        {error && (
          <div role="alert" className="callout callout-error">
            <span>{error}</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 bg-base-200/40 px-4 py-10 text-center">
            <p className="text-sm font-medium">
              {repos.length === 0
                ? "No admin-accessible repositories found"
                : `No repositories match “${q.trim()}”`}
            </p>
            <p className="mt-1 text-xs opacity-60">
              Re-authorize with an account that has admin rights, or clear the search filter.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-base-200">
            {filtered.map((repo) => {
              const selected = currentRepo?.toLowerCase() === repo.fullName.toLowerCase();
              return (
                <li
                  key={repo.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="font-medium">
                      {repo.fullName}
                      {repo.private ? (
                        <span className="badge badge-ghost badge-sm ml-2">private</span>
                      ) : (
                        <span className="badge badge-outline badge-sm ml-2">public</span>
                      )}
                      {selected && (
                        <span className="badge badge-success badge-sm ml-2">connected</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs opacity-60">{repo.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    className={`btn btn-sm ${selected ? "btn-outline" : "btn-primary"}`}
                    onClick={() => {
                      setPendingId(repo.id);
                      startTransition(async () => {
                        const result = await linkGithubRepoAction(projectId, repo.fullName);
                        setPendingId(null);
                        if (result.error) setError(result.error);
                        else {
                          setError(null);
                          router.push(`/projects/${projectId}/settings?linked=1`);
                          router.refresh();
                        }
                      });
                    }}
                  >
                    {pending && pendingId === repo.id ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : null}
                    {selected ? "Reconnect webhook" : "Connect"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
