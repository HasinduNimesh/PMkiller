"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteUserAction } from "@/app/actions/users";

export function InviteUserForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card bg-base-100 shadow">
      <form
        className="card-body gap-2"
        action={(fd) => {
          startTransition(async () => {
            const result = await inviteUserAction(fd);
            if (result.error) {
              setError(result.error);
              setMessage(null);
            } else {
              setError(null);
              setMessage(result.message ?? "User added.");
              router.refresh();
            }
          });
        }}
      >
        <h2 className="card-title text-lg">Add organization user</h2>
        <p className="text-sm opacity-60">
          Create a new login for your org, or add an existing email if they already registered.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <input name="name" required className="input input-sm w-full" />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input name="email" type="email" required className="input input-sm w-full" />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Role</legend>
            <select name="role" defaultValue="MEMBER" className="select select-sm w-full">
              <option value="ADMIN">Admin</option>
              <option value="PM">PM</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Temporary password</legend>
            <input
              name="password"
              type="text"
              minLength={6}
              placeholder="Required for new accounts"
              className="input input-sm w-full"
            />
            <p className="label text-xs opacity-50">Leave blank when adding an existing account</p>
          </fieldset>
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div role="alert" className="alert alert-success text-sm">
            <span>{message}</span>
          </div>
        )}

        <div className="card-actions justify-end">
          <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
            {pending ? <span className="loading loading-spinner loading-xs" /> : null}
            Add user
          </button>
        </div>
      </form>
    </div>
  );
}
