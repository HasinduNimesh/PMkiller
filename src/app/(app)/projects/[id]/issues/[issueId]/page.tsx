import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { canEditTasks } from "@/lib/rbac";
import { ProjectNav } from "@/components/project-nav";
import { IssueTypeBadge, SeverityBadge, StatusBadge } from "@/components/badges";
import { CommentForm } from "@/components/comment-form";
import { CopyIssueKey } from "@/components/copy-issue-key";
import {
  toggleWatchAction,
  updateTaskFieldsAction,
  updateTaskStatusAction,
} from "@/app/actions/tasks";
import { taskStatuses } from "@/lib/validators";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; issueId: string }>;
}) {
  const { id, issueId } = await params;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!project) notFound();

  const issue = await prisma.task.findFirst({
    where: { id: issueId, projectId: id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { name: true } },
      epic: { select: { id: true, issueKey: true, title: true } },
      parent: { select: { id: true, issueKey: true, title: true } },
      subtasks: { select: { id: true, issueKey: true, title: true, status: true } },
      epicChildren: { select: { id: true, issueKey: true, title: true, status: true } },
      sprint: { select: { id: true, name: true, status: true } },
      fixVersion: { select: { name: true } },
      labels: { include: { label: true } },
      components: { include: { component: true } },
      watchers: { include: { user: { select: { id: true, name: true } } } },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      predecessors: { include: { predecessor: { select: { id: true, issueKey: true, title: true } } } },
    },
  });
  if (!issue) notFound();

  const [assigneeOptions, sprints, epics] = await Promise.all([
    prisma.projectMember.count({ where: { projectId: id } }).then(async (count) => {
      if (count > 0) {
        const pm = await prisma.projectMember.findMany({
          where: { projectId: id },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
        return pm.map((m) => m.user);
      }
      const om = await prisma.orgMember.findMany({
        where: { organizationId: session.user.organizationId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return om.map((m) => m.user);
    }),
    prisma.sprint.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({
      where: { projectId: id, issueType: "EPIC" },
      select: { id: true, issueKey: true, title: true },
    }),
  ]);
  const members = assigneeOptions;

  const editable = canEditTasks(session.user.role);
  const watching = issue.watchers.some((w) => w.userId === session.user.id);

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="tasks"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm opacity-60">{issue.issueKey}</span>
            <CopyIssueKey issueKey={issue.issueKey} />
            <IssueTypeBadge type={issue.issueType} />
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{issue.title}</h1>
          <p className="mt-1 text-sm opacity-60">
            Reporter {issue.createdBy.name ?? "—"} · Created {formatDate(issue.createdAt)}
          </p>
        </div>
        {editable && (
          <form
            action={async () => {
              "use server";
              await toggleWatchAction(issue.id);
            }}
          >
            <button className={`btn btn-sm ${watching ? "btn-primary" : "btn-outline"}`}>
              {watching ? "Watching" : "Watch"}
            </button>
          </form>
        )}
      </div>

      {issue.githubPrUrl ? (
        <div className="card border border-success/30 bg-success/5 shadow-sm">
          <div className="card-body flex-row flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  className="h-5 w-5 fill-current"
                  aria-hidden
                >
                  <path d="M7.177 3.073 9.573.677A.25.25 0 0 1 10 .854v4.792a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25ZM11 2.5h-1V4h1a1 1 0 0 1 1 1v5.628a2.251 2.251 0 1 0 1.5 0V5A2.5 2.5 0 0 0 11 2.5Zm1.75 10.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM3.75 12a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">
                  Linked pull request #{issue.githubPrNumber ?? "PR"}
                </div>
                <p className="text-xs opacity-70">
                  {issue.status === "DONE"
                    ? "This issue was completed when the PR merged."
                    : "A GitHub PR is linked to this issue."}
                </p>
              </div>
            </div>
            <a
              href={issue.githubPrUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-success btn-sm"
            >
              Open on GitHub
            </a>
          </div>
        </div>
      ) : project.githubRepo ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-200/40 px-4 py-3 text-sm text-base-content/60">
          No linked PR yet. Mention{" "}
          <span className="font-mono text-base-content">{issue.issueKey}</span> in a PR title or
          body against{" "}
          <a
            href={`https://github.com/${project.githubRepo}`}
            className="link font-mono"
            target="_blank"
            rel="noreferrer"
          >
            {project.githubRepo}
          </a>{" "}
          to auto-close on merge.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-base">Description</h2>
              <p className="whitespace-pre-wrap text-sm opacity-80">
                {issue.description || "No description."}
              </p>
            </div>
          </div>

          {issue.issueType === "EPIC" && issue.epicChildren.length > 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-base">Issues in epic</h2>
                <ul className="space-y-2">
                  {issue.epicChildren.map((c) => (
                    <li key={c.id} className="flex justify-between gap-2 text-sm">
                      <Link href={`/projects/${id}/issues/${c.id}`} className="link link-hover">
                        <span className="font-mono text-xs opacity-60">{c.issueKey}</span> {c.title}
                      </Link>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {issue.subtasks.length > 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title text-base">Subtasks</h2>
                <ul className="space-y-2">
                  {issue.subtasks.map((c) => (
                    <li key={c.id} className="flex justify-between gap-2 text-sm">
                      <Link href={`/projects/${id}/issues/${c.id}`} className="link link-hover">
                        <span className="font-mono text-xs opacity-60">{c.issueKey}</span> {c.title}
                      </Link>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-base">Comments</h2>
              {issue.comments.length === 0 && (
                <p className="text-sm opacity-50">No comments yet.</p>
              )}
              {issue.comments.map((c) => (
                <div key={c.id} className="chat chat-start">
                  <div className="chat-header text-xs opacity-60">
                    {c.author.name ?? "User"} · {formatDate(c.createdAt)}
                  </div>
                  <div className="chat-bubble chat-bubble-secondary text-sm">{c.body}</div>
                </div>
              ))}
              {editable && <CommentForm taskId={issue.id} />}
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-base">Activity</h2>
              <ul className="timeline timeline-vertical timeline-compact">
                {issue.activities.map((a) => (
                  <li key={a.id}>
                    <div className="timeline-start text-xs opacity-50">{formatDate(a.createdAt)}</div>
                    <div className="timeline-middle">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="timeline-end timeline-box text-sm">
                      <span className="font-medium">{a.actor.name ?? "User"}</span>{" "}
                      {a.message ||
                        `${a.action.replaceAll("_", " ").toLowerCase()}${
                          a.field ? ` · ${a.field}` : ""
                        }`}
                      {a.fromValue && a.toValue && (
                        <span className="opacity-60">
                          {" "}
                          ({a.fromValue} → {a.toValue})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {editable && (
            <div className="card bg-base-100 shadow">
              <form
                className="card-body gap-2"
                action={async (fd) => {
                  "use server";
                  await updateTaskFieldsAction(issue.id, fd);
                }}
              >
                <h2 className="card-title text-base">Details</h2>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Assignee</legend>
                  <select
                    name="assigneeId"
                    defaultValue={issue.assigneeId ?? ""}
                    className="select select-sm w-full"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name ?? m.email}
                      </option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Priority</legend>
                  <select
                    name="severity"
                    defaultValue={issue.severity}
                    className="select select-sm w-full"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Sprint</legend>
                  <select
                    name="sprintId"
                    defaultValue={issue.sprintId ?? ""}
                    className="select select-sm w-full"
                  >
                    <option value="">None</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Epic</legend>
                  <select
                    name="epicId"
                    defaultValue={issue.epicId ?? ""}
                    className="select select-sm w-full"
                  >
                    <option value="">None</option>
                    {epics.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.issueKey} — {e.title}
                      </option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Story points</legend>
                  <input
                    name="storyPoints"
                    type="number"
                    min={0}
                    step={0.5}
                    defaultValue={issue.storyPoints ?? ""}
                    className="input input-sm w-full"
                  />
                </fieldset>
                <button className="btn btn-primary btn-sm">Save details</button>
              </form>
              <form
                className="card-body pt-0"
                action={async (fd) => {
                  "use server";
                  const status = String(fd.get("status"));
                  await updateTaskStatusAction(
                    issue.id,
                    status as (typeof taskStatuses)[number],
                  );
                }}
              >
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Move status</legend>
                  <div className="flex gap-2">
                    <select
                      name="status"
                      defaultValue={issue.status}
                      className="select select-sm w-full"
                    >
                      {taskStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-outline btn-sm">Move</button>
                  </div>
                </fieldset>
              </form>
            </div>
          )}

          <div className="card bg-base-100 shadow">
            <div className="card-body text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">Sprint</span>
                <span>{issue.sprint?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Epic</span>
                <span>
                  {issue.epic ? (
                    <Link href={`/projects/${id}/issues/${issue.epic.id}`} className="link">
                      {issue.epic.issueKey}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Parent</span>
                <span>
                  {issue.parent ? (
                    <Link href={`/projects/${id}/issues/${issue.parent.id}`} className="link">
                      {issue.parent.issueKey}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Story points</span>
                <span>{issue.storyPoints ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Estimate (h)</span>
                <span>{issue.originalEstimate ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Due</span>
                <span>{formatDate(issue.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Fix version</span>
                <span>{issue.fixVersion?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Environment</span>
                <span>{issue.environment ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="opacity-60">GitHub PR</span>
                <span className="text-right">
                  {issue.githubPrUrl ? (
                    <a
                      href={issue.githubPrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-primary"
                    >
                      #{issue.githubPrNumber ?? "PR"}
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div>
                <div className="mb-1 opacity-60">Labels</div>
                <div className="flex flex-wrap gap-1">
                  {issue.labels.length === 0 && <span>—</span>}
                  {issue.labels.map((l) => (
                    <span
                      key={l.labelId}
                      className="badge badge-sm"
                      style={{ backgroundColor: l.label.color, color: "#fff" }}
                    >
                      {l.label.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 opacity-60">Components</div>
                <div className="flex flex-wrap gap-1">
                  {issue.components.length === 0 && <span>—</span>}
                  {issue.components.map((c) => (
                    <span key={c.componentId} className="badge badge-outline badge-sm">
                      {c.component.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 opacity-60">Watchers</div>
                <div className="text-xs">
                  {issue.watchers.map((w) => w.user.name).filter(Boolean).join(", ") || "—"}
                </div>
              </div>
              {issue.predecessors.length > 0 && (
                <div>
                  <div className="mb-1 opacity-60">Depends on</div>
                  {issue.predecessors.map((p) => (
                    <div key={p.predecessorId}>
                      <Link
                        href={`/projects/${id}/issues/${p.predecessor.id}`}
                        className="link text-xs"
                      >
                        {p.predecessor.issueKey} {p.predecessor.title}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
