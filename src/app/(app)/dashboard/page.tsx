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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}.
          </p>
        </div>
        {canManageProjects(session.user.role) && (
          <Link href="/projects/new" className="btn btn-primary gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="metric">
          <div className="flex items-center justify-between">
            <p className="metric-label">Projects</p>
            <FolderKanban className="h-4 w-4 text-primary/70" />
          </div>
          <p className="metric-value text-primary">{projects.length}</p>
          <p className="mt-1 text-xs text-base-content/45">Recently updated</p>
        </div>
        <div className="metric">
          <div className="flex items-center justify-between">
            <p className="metric-label">My open tasks</p>
            <ListTodo className="h-4 w-4 text-secondary/70" />
          </div>
          <p className="metric-value text-secondary">{myTasks.length}</p>
          <p className="mt-1 text-xs text-base-content/45">Assigned to you</p>
        </div>
        <div className="metric">
          <div className="flex items-center justify-between">
            <p className="metric-label">Deadline at risk</p>
            <AlertTriangle className="h-4 w-4 text-error/70" />
          </div>
          <p className={`metric-value ${atRisk.length ? "text-error" : ""}`}>{atRisk.length}</p>
          <p className="mt-1 text-xs text-base-content/45">CPM finish past deadline</p>
        </div>
      </div>

      {burndowns.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">Sprint progress</h2>
            <span className="text-xs text-base-content/45">Story points done vs remaining</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {burndowns.map((b) => (
              <SprintBurndownCard key={b.sprintId} sprint={b} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="panel xl:col-span-3">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">Projects</h2>
              <Link href="/projects" className="btn btn-ghost btn-sm rounded-xl">
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50">
                No projects yet. Create one to start CPM planning.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="table table-sm table-modern">
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
                            {risk && (
                              <div className="mt-1 inline-flex rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-semibold text-error">
                                At risk
                              </div>
                            )}
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
                            <div className="text-[10px] text-base-content/50">
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
          <div className="panel">
            <div className="panel-body">
              <h2 className="font-display text-lg font-semibold tracking-tight">My tasks</h2>
              {myTasks.length === 0 ? (
                <p className="mt-3 text-sm text-base-content/50">Nothing assigned right now.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {myTasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-base-300/40 bg-base-200/30 px-3 py-2.5"
                    >
                      <div>
                        <Link
                          href={`/projects/${t.project.id}/issues/${t.id}`}
                          className="link link-hover text-sm font-semibold"
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

          <div className="rounded-2xl border border-warning/25 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h3 className="font-display font-semibold tracking-tight">Critical path</h3>
                {criticalTasks.length === 0 ? (
                  <div className="mt-1 text-sm text-base-content/60">No open critical tasks.</div>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {criticalTasks.map((t) => (
                      <li key={t.id}>
                        <span className="font-medium">{t.title}</span>
                        <span className="text-base-content/50"> · {t.project.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
