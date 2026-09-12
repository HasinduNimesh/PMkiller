import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ProjectNav } from "@/components/project-nav";

export default async function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!project) notFound();

  const [epics, versions] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: id, issueType: "EPIC" },
      include: {
        epicChildren: {
          select: {
            id: true,
            status: true,
            plannedStart: true,
            plannedEnd: true,
            dueDate: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.version.findMany({ where: { projectId: id }, orderBy: { releaseDate: "asc" } }),
  ]);

  const start = project.startDate.getTime();
  const end = Math.max(
    project.deadline.getTime(),
    ...epics.flatMap((e) =>
      e.epicChildren.map((c) => (c.plannedEnd ?? c.dueDate ?? project.deadline).getTime()),
    ),
    start + 1,
  );
  const span = Math.max(end - start, 1);

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="roadmap"
      />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Roadmap</h1>
        <p className="text-sm opacity-60">
          Epic timeline {formatDate(project.startDate)} → {formatDate(project.deadline)}
        </p>
      </div>

      {versions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => (
            <div key={v.id} className="badge badge-lg badge-outline gap-2">
              {v.name}
              {v.releaseDate && <span className="opacity-60">{formatDate(v.releaseDate)}</span>}
              {v.released && <span className="badge badge-success badge-xs">released</span>}
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-body gap-4">
          {epics.length === 0 && (
            <p className="text-sm opacity-50">Create epics to populate the roadmap.</p>
          )}
          {epics.map((epic) => {
            const childDates = epic.epicChildren
              .flatMap((c) => [c.plannedStart, c.plannedEnd, c.dueDate])
              .filter((d): d is Date => !!d);
            const leftDate = childDates.length
              ? new Date(Math.min(...childDates.map((d) => d.getTime())))
              : project.startDate;
            const rightDate = childDates.length
              ? new Date(Math.max(...childDates.map((d) => d.getTime())))
              : project.deadline;
            const left = ((leftDate.getTime() - start) / span) * 100;
            const width = Math.max(((rightDate.getTime() - leftDate.getTime()) / span) * 100, 4);
            const done = epic.epicChildren.filter((c) => c.status === "DONE").length;
            const total = epic.epicChildren.length;
            return (
              <div key={epic.id} className="grid grid-cols-[180px_1fr] items-center gap-3">
                <Link href={`/projects/${id}/issues/${epic.id}`} className="truncate text-sm link link-hover">
                  <div className="font-mono text-[10px] opacity-50">{epic.issueKey}</div>
                  {epic.title}
                  <div className="text-[10px] opacity-50">
                    {done}/{total} done
                  </div>
                </Link>
                <div className="relative h-10 rounded-box bg-base-200">
                  <div
                    className="absolute top-2 h-6 rounded-md bg-secondary/80"
                    style={{ left: `${Math.max(left, 0)}%`, width: `${Math.min(width, 100 - left)}%` }}
                    title={`${formatDate(leftDate)} → ${formatDate(rightDate)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
