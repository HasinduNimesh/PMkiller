"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTaskAction } from "@/app/actions/tasks";

type Member = { id: string; name: string | null; email: string };
type TaskOption = { id: string; title: string; issueKey?: string; issueType?: string };
type LabelOpt = { id: string; name: string; color: string };
type ComponentOpt = { id: string; name: string };
type SprintOpt = { id: string; name: string };
type VersionOpt = { id: string; name: string };

export function TaskCreateForm({
  projectId,
  members,
  tasks,
  labels = [],
  components = [],
  sprints = [],
  versions = [],
}: {
  projectId: string;
  members: Member[];
  tasks: TaskOption[];
  labels?: LabelOpt[];
  components?: ComponentOpt[];
  sprints?: SprintOpt[];
  versions?: VersionOpt[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [preds, setPreds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [componentIds, setComponentIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const epics = tasks.filter((t) => t.issueType === "EPIC");
  const parents = tasks.filter((t) => t.issueType !== "EPIC" && t.issueType !== "SUBTASK");

  return (
    <div className="collapse collapse-arrow border border-primary/20 bg-base-100 shadow">
      <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
      <div className="collapse-title font-semibold text-primary">+ Create issue</div>
      <div className="collapse-content">
        <form
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          action={(fd) => {
            fd.set("predecessorIds", preds.join(","));
            fd.set("labelIds", labelIds.join(","));
            fd.set("componentIds", componentIds.join(","));
            startTransition(async () => {
              const result = await createTaskAction(projectId, fd);
              if (result.error) setError(result.error);
              else {
                setError(null);
                setPreds([]);
                setLabelIds([]);
                setComponentIds([]);
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <fieldset className="fieldset sm:col-span-2 lg:col-span-3">
            <legend className="fieldset-legend">Summary</legend>
            <input name="title" required className="input w-full" />
          </fieldset>

          <fieldset className="fieldset sm:col-span-2 lg:col-span-3">
            <legend className="fieldset-legend">Description</legend>
            <textarea name="description" rows={2} className="textarea w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Issue type</legend>
            <select name="issueType" defaultValue="TASK" className="select w-full">
              <option value="EPIC">Epic</option>
              <option value="STORY">Story</option>
              <option value="TASK">Task</option>
              <option value="BUG">Bug</option>
              <option value="SUBTASK">Sub-task</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Priority</legend>
            <select name="severity" defaultValue="MEDIUM" className="select w-full">
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Status</legend>
            <select name="status" defaultValue="BACKLOG" className="select w-full">
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="IN_REVIEW">In review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Done</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Story points</legend>
            <input name="storyPoints" type="number" min={0} step={0.5} className="input w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Duration (days / CPM)</legend>
            <input name="durationDays" type="number" min={0} step={0.5} defaultValue={2} className="input w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Original estimate (h)</legend>
            <input name="originalEstimate" type="number" min={0} step={0.5} className="input w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Assignee</legend>
            <select name="assigneeId" defaultValue="" className="select w-full">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Epic</legend>
            <select name="epicId" defaultValue="" className="select w-full">
              <option value="">None</option>
              {epics.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.issueKey} — {e.title}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Parent (sub-task)</legend>
            <select name="parentId" defaultValue="" className="select w-full">
              <option value="">None</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.issueKey} — {p.title}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Sprint</legend>
            <select name="sprintId" defaultValue="" className="select w-full">
              <option value="">Backlog</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Fix version</legend>
            <select name="fixVersionId" defaultValue="" className="select w-full">
              <option value="">None</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Due date</legend>
            <input name="dueDate" type="date" className="input w-full" />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Environment (bugs)</legend>
            <input name="environment" placeholder="prod / staging" className="input w-full" />
          </fieldset>

          <label className="label cursor-pointer justify-start gap-3 sm:col-span-2 lg:col-span-3">
            <input name="isMilestone" type="checkbox" className="checkbox checkbox-primary" />
            <span>Milestone (zero duration for CPM)</span>
          </label>

          {labels.length > 0 && (
            <fieldset className="fieldset sm:col-span-2 lg:col-span-3">
              <legend className="fieldset-legend">Labels</legend>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => {
                  const on = labelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`btn btn-xs ${on ? "btn-primary" : "btn-outline"}`}
                      onClick={() =>
                        setLabelIds((prev) =>
                          on ? prev.filter((id) => id !== l.id) : [...prev, l.id],
                        )
                      }
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {components.length > 0 && (
            <fieldset className="fieldset sm:col-span-2 lg:col-span-3">
              <legend className="fieldset-legend">Components</legend>
              <div className="flex flex-wrap gap-2">
                {components.map((c) => {
                  const on = componentIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`btn btn-xs ${on ? "btn-secondary" : "btn-outline"}`}
                      onClick={() =>
                        setComponentIds((prev) =>
                          on ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                        )
                      }
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {tasks.length > 0 && (
            <fieldset className="fieldset sm:col-span-2 lg:col-span-3">
              <legend className="fieldset-legend">Depends on (CPM predecessors)</legend>
              <div className="flex flex-wrap gap-2">
                {tasks
                  .filter((t) => t.issueType !== "EPIC")
                  .map((t) => {
                    const on = preds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setPreds((prev) =>
                            on ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                          )
                        }
                        className={`btn btn-xs ${on ? "btn-primary" : "btn-outline"}`}
                      >
                        {t.issueKey ?? t.title}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          )}

          {error && (
            <div role="alert" className="callout callout-error sm:col-span-2 lg:col-span-3">
              <span>{error}</span>
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? <span className="loading loading-spinner loading-sm" /> : null}
              {pending ? "Creating…" : "Create issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
