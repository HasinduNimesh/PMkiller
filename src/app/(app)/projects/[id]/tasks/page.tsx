import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { canEditTasks } from "@/lib/rbac";
import { SeverityBadge, StatusBadge, IssueTypeBadge } from "@/components/badges";
import { TaskCreateForm } from "@/components/task-create-form";
import { ProjectNav } from "@/components/project-nav";
import { issueTypes, taskStatuses } from "@/lib/validators";

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    severity?: string;
    type?: string;
    status?: string;
    q?: string;
  }>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      labels: true,
      components: true,
      versions: true,
      sprints: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const orgMembers = await prisma.orgMember.findMany({
    where: { organizationId: session.user.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const members =
    projectMembers.length > 0
      ? projectMembers.map((m) => m.user)
      : orgMembers.map((m) => m.user);

  const tasks = await prisma.task.findMany({
    where: {
      projectId: id,
      ...(filters.severity ? { severity: filters.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } : {}),
      ...(filters.type ? { issueType: filters.type as (typeof issueTypes)[number] } : {}),
      ...(filters.status ? { status: filters.status as (typeof taskStatuses)[number] } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { issueKey: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      labels: { include: { label: true } },
      sprint: { select: { name: true } },
    },
    orderBy: [{ severity: "asc" }, { sortOrder: "asc" }],
  });

  const allTasks = await prisma.task.findMany({
    where: { projectId: id },
    select: { id: true, title: true, issueKey: true, issueType: true },
    orderBy: { sortOrder: "asc" },
  });

  const editable = canEditTasks(session.user.role);

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="tasks"
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Issues</h1>
          <p className="text-sm opacity-60">Filter by type, status, priority — Jira-style issue list.</p>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2 rounded-box bg-base-100 p-3 shadow-sm">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Search key or summary"
          className="input input-sm w-48"
        />
        <select name="type" defaultValue={filters.type ?? ""} className="select select-sm">
          <option value="">All types</option>
          {issueTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className="select select-sm">
          <option value="">All statuses</option>
          {taskStatuses.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select name="severity" defaultValue={filters.severity ?? ""} className="select select-sm">
          <option value="">All priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="btn btn-sm btn-primary">Filter</button>
        <Link href={`/projects/${id}/tasks`} className="btn btn-sm btn-ghost">
          Reset
        </Link>
      </form>

      {editable && (
        <TaskCreateForm
          projectId={id}
          members={members}
          tasks={allTasks}
          labels={project.labels}
          components={project.components}
          sprints={project.sprints}
          versions={project.versions}
        />
      )}

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Key</th>
                <th>Type</th>
                <th>Summary</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Sprint</th>
                <th>Assignee</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center opacity-50">
                    No issues match filters.
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task.id} className="hover">
                  <td>
                    <Link
                      href={`/projects/${id}/issues/${task.id}`}
                      className="font-mono text-xs link"
                    >
                      {task.issueKey}
                    </Link>
                  </td>
                  <td>
                    <IssueTypeBadge type={task.issueType} />
                  </td>
                  <td>
                    <Link
                      href={`/projects/${id}/issues/${task.id}`}
                      className="link link-hover font-medium"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {task.labels.map((l) => (
                        <span
                          key={l.labelId}
                          className="badge badge-xs"
                          style={{ backgroundColor: l.label.color, color: "#fff" }}
                        >
                          {l.label.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <SeverityBadge severity={task.severity} />
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="text-xs">{task.sprint?.name ?? "—"}</td>
                  <td className="text-xs">{task.assignee?.name ?? "—"}</td>
                  <td className="text-xs">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
