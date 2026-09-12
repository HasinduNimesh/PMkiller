"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
} from "@/app/actions/projects";

type Member = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
};

type OrgUser = {
  id: string;
  name: string | null;
  email: string;
};

export function ProjectMembersPanel({
  projectId,
  members,
  orgUsers,
  canManage,
}: {
  projectId: string;
  members: Member[];
  orgUsers: OrgUser[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const memberIds = new Set(members.map((m) => m.userId));
  const available = orgUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div className="panel">
      <div className="panel-body gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Project members</h2>
          <p className="text-sm opacity-60">
            People on this project. When members are listed here, issue assignees must be chosen from
            this list (otherwise any org member can be assigned).
          </p>
        </div>

        <ul className="divide-y divide-base-200">
          {members.length === 0 && (
            <li className="py-4 text-sm opacity-50">No project members yet.</li>
          )}
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="text-sm font-medium">{m.user.name ?? "User"}</div>
                <div className="text-xs opacity-50">{m.user.email}</div>
              </div>
              {canManage && (
                <button
                  type="button"
                  disabled={pending}
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await removeProjectMemberAction(projectId, m.userId);
                      if (result.error) {
                        setError(result.error);
                        setMessage(null);
                      } else {
                        setError(null);
                        setMessage("Member removed.");
                        router.refresh();
                      }
                    });
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <form
            className="flex flex-wrap items-end gap-2 border-t border-base-200 pt-3"
            action={(fd) => {
              startTransition(async () => {
                const result = await addProjectMemberAction(projectId, fd);
                if (result.error) {
                  setError(result.error);
                  setMessage(null);
                } else {
                  setError(null);
                  setMessage(result.message ?? "Member added.");
                  router.refresh();
                }
              });
            }}
          >
            <fieldset className="fieldset min-w-0 flex-1">
              <legend className="fieldset-legend">Add org user</legend>
              <select
                name="userId"
                required
                className="select select-sm w-full"
                defaultValue=""
                disabled={available.length === 0}
              >
                <option value="" disabled>
                  {available.length === 0 ? "Everyone is already on this project" : "Select user…"}
                </option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email} ({u.email})
                  </option>
                ))}
              </select>
            </fieldset>
            <button
              type="submit"
              disabled={pending || available.length === 0}
              className="btn btn-primary btn-sm"
            >
              {pending ? <span className="loading loading-spinner loading-xs" /> : null}
              Add
            </button>
          </form>
        )}

        {error && (
          <div role="alert" className="callout callout-error">
            <span>{error}</span>
          </div>
        )}
        {message && !error && (
          <div role="alert" className="callout callout-ok">
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
