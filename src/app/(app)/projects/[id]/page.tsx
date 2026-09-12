import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { StatusBadge, SeverityBadge, IssueTypeBadge } from "@/components/badges";
import { RecalculateButton } from "@/components/recalculate-button";
import { ProjectNav } from "@/components/project-nav";
import { SprintBurndownCard } from "@/components/sprint-burndown";
import { Columns3, ListTodo } from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      owner: { select: { name: true, email: true } },
      sprints: { where: { status: "ACTIVE" }, take: 1 },
      tasks: {
        include: { assignee: { select: { name: true } } },
        orderBy: [{ severity: "asc" }, { sortOrder: "asc" }],
        take: 12,
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) notFound();

  const [allTasks, activeSprintTasks] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: id, issueType: { not: "EPIC" } },
      select: { status: true, isCritical: true, earlyFinish: true, severity: true, issueType: true },
    }),
    project.sprints[0]
      ? prisma.task.findMany({
          where: {
            projectId: id,
            sprintId: project.sprints[0].id,
            issueType: { not: "EPIC" },
          },
          select: { status: true, storyPoints: true },
        })
      : Promise.resolve([]),
  ]);

  const finishes = allTasks
    .map((t) => t.earlyFinish)
    .filter((d): d is Date => !!d);
  const cpmEnd = finishes.length ? finishes.reduce((a, b) => (a > b ? a : b)) : null;
  const atRisk = cpmEnd ? cpmEnd > project.deadline : false;
  const done = allTasks.filter((t) => t.status === "DONE").length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bySeverity = {
    CRITICAL: allTasks.filter((t) => t.severity === "CRITICAL").length,
    HIGH: allTasks.filter((t) => t.severity === "HIGH").length,
    MEDIUM: allTasks.filter((t) => t.severity === "MEDIUM").length,
    LOW: allTasks.filter((t) => t.severity === "LOW").length,
  };

  const activeSprint = project.sprints[0];
  const totalPoints = activeSprintTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
  const donePoints = activeSprintTasks
    .filter((t) => t.status === "DONE")
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
  const doneIssues = activeSprintTasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="overview"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-2 text-sm text-base-content/70">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            {activeSprint && (
              <span className="badge badge-primary badge-outline">
                Sprint: {activeSprint.name}
              </span>
            )}
            <span className="text-sm text-base-content/60">
              {formatDate(project.startDate)} → {formatDate(project.deadline)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RecalculateButton projectId={project.id} />
          <Link href={`/projects/${project.id}/board`} className="btn btn-primary btn-sm gap-1">
            <Columns3 className="h-4 w-4" />
            Board
          </Link>
          <Link href={`/projects/${project.id}/backlog`} className="btn btn-outline btn-sm gap-1">
            <ListTodo className="h-4 w-4" />
            Backlog
          </Link>
        </div>
      </div>

      {atRisk ? (
        <div role="alert" className="callout callout-error">
          <span>
            CPM finish {formatDate(cpmEnd)} is past the deadline {formatDate(project.deadline)}.
          </span>
        </div>
      ) : cpmEnd ? (
        <div role="alert" className="callout callout-ok">
          <span>CPM finish {formatDate(cpmEnd)} — on track vs deadline.</span>
        </div>
      ) : null}

      {activeSprint && (
        <SprintBurndownCard
          sprint={{
            projectId: project.id,
            projectName: project.name,
            projectKey: project.key,
            sprintId: activeSprint.id,
            sprintName: activeSprint.name,
            startDate: activeSprint.startDate,
            endDate: activeSprint.endDate,
            totalPoints,
            donePoints,
            remainingPoints: Math.max(0, totalPoints - donePoints),
            totalIssues: activeSprintTasks.length,
            doneIssues,
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="panel md:col-span-2 xl:col-span-1">
          <div className="panel-body items-center text-center">
            <div
              className="radial-progress text-primary"
              style={{ "--value": pct, "--size": "5rem" } as React.CSSProperties}
              role="progressbar"
            >
              {pct}%
            </div>
            <p className="text-sm text-base-content/60">
              {done}/{total} issues done
            </p>
          </div>
        </div>
        {(Object.keys(bySeverity) as Array<keyof typeof bySeverity>).map((key) => (
          <div key={key} className="panel">
            <div className="panel-body py-4">
              <SeverityBadge severity={key} />
              <div className="font-display text-3xl font-semibold">{bySeverity[key]}</div>
              <div className="text-xs opacity-50">by priority</div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight">Recent issues</h2>
            <Link href={`/projects/${project.id}/tasks`} className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-base-200">
            {project.tasks.length === 0 && (
              <li className="py-6 text-sm opacity-50">No issues yet.</li>
            )}
            {project.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/projects/${id}/issues/${t.id}`} className="link link-hover font-medium">
                    <span className="font-mono text-xs opacity-50">{t.issueKey}</span> {t.title}
                  </Link>
                  <div className="text-xs opacity-50">
                    {t.assignee?.name ?? "Unassigned"}
                    {t.isCritical ? " · critical path" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IssueTypeBadge type={t.issueType} />
                  <SeverityBadge severity={t.severity} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
