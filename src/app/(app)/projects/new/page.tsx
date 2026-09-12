"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction } from "@/app/actions/projects";

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const inMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm opacity-60">Set the window; CPM will schedule tasks inside it.</p>
      </div>

      <div className="panel">
        <form
          className="panel-body gap-2"
          action={(fd) => {
            startTransition(async () => {
              const result = await createProjectAction(fd);
              if (result.error) setError(result.error);
              else if (result.id) router.push(`/projects/${result.id}`);
            });
          }}
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Name</legend>
            <input name="name" required className="input w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Project key</legend>
            <input
              name="key"
              placeholder="WEB"
              pattern="[A-Z][A-Z0-9]{1,9}"
              className="input w-full uppercase"
            />
            <p className="label text-xs opacity-50">Optional · used for keys like WEB-12</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea name="description" rows={3} className="textarea w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Status</legend>
            <select name="status" defaultValue="PLANNING" className="select w-full">
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DONE">Done</option>
            </select>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Start date</legend>
              <input name="startDate" type="date" required defaultValue={today} className="input w-full" />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Deadline</legend>
              <input name="deadline" type="date" required defaultValue={inMonth} className="input w-full" />
            </fieldset>
          </div>

          {error && (
            <div role="alert" className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2 justify-end">
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? <span className="loading loading-spinner loading-sm" /> : null}
              {pending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
