import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { StatusBadge, SeverityBadge } from "@/components/badges";
import { SprintBurndownCard, type SprintBurndownData } from "@/components/sprint-burndown";
import { canManageProjects } from "@/lib/rbac";
import { AlertTriangle, FolderKanban, ListTodo, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const orgId = session.user.organizationId;

  const [projects, myTasks, criticalTasks, activeSprints] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        tasks: { select: { id: true, status: true, isCritical: true, earlyFinish: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: {
        assigneeId: session.user.id,
        project: { organizationId: orgId },
        status: { not: "DONE" },
      },
      include: { project: { select: { id: true, name: true, deadline: true } } },
      orderBy: [{ severity: "asc" }, { plannedEnd: "asc" }],
      take: 10,
    }),
    prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        isCritical: true,
        status: { not: "DONE" },
      },
      include: { project: { select: { name: true, deadline: true } } },
      take: 6,
    }),
    prisma.sprint.findMany({
      where: {
        status: "ACTIVE",
        project: { organizationId: orgId },
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        tasks: {
          where: { issueType: { not: "EPIC" } },
          select: { status: true, storyPoints: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ]);

  const burndowns: SprintBurndownData[] = activeSprints.map((s) => {
    const totalPoints = s.tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    const donePoints = s.tasks
      .filter((t) => t.status === "DONE")
      .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    const doneIssues = s.tasks.filter((t) => t.status === "DONE").length;
    return {
      projectId: s.project.id,
      projectName: s.project.name,
      projectKey: s.project.key,
      sprintId: s.id,
      sprintName: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      totalPoints,
      donePoints,
      remainingPoints: Math.max(0, totalPoints - donePoints),
      totalIssues: s.tasks.length,
      doneIssues,
    };
  });

  const atRisk = projects.filter((p) => {
    const finishes = p.tasks
      .map((t) => t.earlyFinish)
      .filter((d): d is Date => !!d);
    if (!finishes.length) return false;
    const cpmEnd = finishes.reduce((a, b) => (a > b ? a : b));
    return cpmEnd > p.deadline;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}.
          </p>
        </div>
        {canManageProjects(session.user.role) && (
          <Link href="/projects/new" className="btn btn-primary gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        )}
      </div>

      <div className="stats stats-vertical w-full shadow lg:stats-horizontal">
        <div className="stat">
          <div className="stat-figure text-primary">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div className="stat-title">Projects</div>
          <div className="stat-value text-primary">{projects.length}</div>
          <div className="stat-desc">Recently updated</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">
            <ListTodo className="h-8 w-8" />
          </div>
          <div className="stat-title">My open tasks</div>
          <div className="stat-value text-secondary">{myTasks.length}</div>
          <div className="stat-desc">Assigned to you</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-error">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="stat-title">Deadline at risk</div>
          <div className={`stat-value ${atRisk.length ? "text-error" : ""}`}>{atRisk.length}</div>
          <div className="stat-desc">CPM finish past deadline</div>
        </div>
      </div>

      {burndowns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Sprint progress</h2>
            <span className="text-xs opacity-50">Story points done vs remaining</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {burndowns.map((b) => (
              <SprintBurndownCard key={b.sprintId} sprint={b} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="card bg-base-100 shadow xl:col-span-3">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-lg">Projects</h2>
              <Link href="/projects" className="btn btn-ghost btn-sm">
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="rounded-box border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50">
                No projects yet. Create one to start CPM planning.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Deadline</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const done = p.tasks.filter((t) => t.status === "DONE").length;
                      const total = p.tasks.length;
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      const risk = atRisk.some((r) => r.id === p.id);
                      return (
                        <tr key={p.id} className="hover">
                          <td>
                            <Link href={`/projects/${p.id}`} className="link link-hover font-medium">
                              {p.name}
                            </Link>
                            {risk && <div className="badge badge-error badge-xs mt-1">At risk</div>}
                          </td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="whitespace-nowrap text-xs">{formatDate(p.deadline)}</td>
                          <td className="min-w-28">
                            <progress
                              className="progress progress-primary w-full"
                              value={pct}
                              max={100}
                            />
                            <div className="text-[10px] opacity-60">
                              {done}/{total}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-lg">My tasks</h2>
              {myTasks.length === 0 ? (
                <p className="text-sm text-base-content/50">Nothing assigned right now.</p>
              ) : (
                <ul className="space-y-3">
                  {myTasks.map((t) => (
                    <li key={t.id} className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/projects/${t.project.id}/issues/${t.id}`}
                          className="link link-hover text-sm font-medium"
                        >
                          {t.title}
                        </Link>
                        <div className="text-xs text-base-content/50">{t.project.name}</div>
                      </div>
                      <SeverityBadge severity={t.severity} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="alert alert-warning shadow-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-bold">Critical path</h3>
              {criticalTasks.length === 0 ? (
                <div className="text-sm">No open critical tasks.</div>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {criticalTasks.map((t) => (
                    <li key={t.id}>
                      <span className="font-medium">{t.title}</span>
                      <span className="opacity-70"> · {t.project.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
