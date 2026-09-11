import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getScheduleData } from "@/app/actions/tasks";
import { formatDate } from "@/lib/utils";
import { GanttChart } from "@/components/gantt-chart";
import { RecalculateButton } from "@/components/recalculate-button";
import { SeverityBadge } from "@/components/badges";
import { ProjectNav } from "@/components/project-nav";
import { prisma } from "@/lib/db";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const projectMeta = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, name: true, key: true },
  });
  if (!projectMeta) notFound();

  let data;
  try {
    data = await getScheduleData(id);
  } catch {
    notFound();
  }

  const { project, tasks, durationDays } = data;
  const finishes = tasks.map((t) => t.earlyFinish).filter((d): d is Date => !!d);
  const cpmEnd = finishes.length ? finishes.reduce((a, b) => (a > b ? a : b)) : null;
  const atRisk = cpmEnd ? cpmEnd > project.deadline : false;
  const critical = tasks.filter((t) => t.isCritical);

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={projectMeta.id}
        projectName={projectMeta.name}
        projectKey={projectMeta.key}
        active="schedule"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Critical path schedule
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Finish-to-start CPM. Error-colored bars have zero slack.
          </p>
        </div>
        <RecalculateButton projectId={id} />
      </div>

      {atRisk ? (
        <div role="alert" className="alert alert-error">
          <span>
            Deadline {formatDate(project.deadline)} · CPM end {formatDate(cpmEnd)} (past deadline)
          </span>
        </div>
      ) : (
        <div role="alert" className="alert alert-info">
          <span>
            Deadline {formatDate(project.deadline)}
            {cpmEnd ? ` · CPM end ${formatDate(cpmEnd)}` : ""}
          </span>
        </div>
      )}

      <GanttChart
        projectStart={project.startDate}
        deadline={project.deadline}
        durationDays={Math.max(
          durationDays,
          Math.ceil(
            (project.deadline.getTime() - project.startDate.getTime()) / 86400000,
          ) + 2,
        )}
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          isCritical: t.isCritical,
          isMilestone: t.isMilestone,
          severity: t.severity,
          earlyStart: t.earlyStart,
          earlyFinish: t.earlyFinish,
          slackDays: t.slackDays,
        }))}
      />

      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          <div className="border-b border-base-200 px-4 py-3 font-semibold">
            CPM table
            <span className="badge badge-error badge-sm ml-2">{critical.length} critical</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Severity</th>
                  <th>Dur</th>
                  <th>ES</th>
                  <th>EF</th>
                  <th>LS</th>
                  <th>LF</th>
                  <th>Slack</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className={t.isCritical ? "bg-error/10" : undefined}>
                    <td className="font-medium">
                      <Link href={`/projects/${id}/issues/${t.id}`} className="link link-hover">
                        {t.issueKey} {t.title}
                      </Link>
                    </td>
                    <td>
                      <SeverityBadge severity={t.severity} />
                    </td>
                    <td>{t.durationDays}</td>
                    <td>{formatDate(t.earlyStart)}</td>
                    <td>{formatDate(t.earlyFinish)}</td>
                    <td>{formatDate(t.lateStart)}</td>
                    <td>{formatDate(t.lateFinish)}</td>
                    <td>{t.slackDays ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
