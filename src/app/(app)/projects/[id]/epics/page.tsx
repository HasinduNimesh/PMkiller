import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProjectNav } from "@/components/project-nav";
import { StatusBadge } from "@/components/badges";

export default async function EpicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!project) notFound();

  const epics = await prisma.task.findMany({
    where: { projectId: id, issueType: "EPIC" },
    include: {
      epicChildren: { select: { id: true, status: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="epics"
      />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Epics</h1>
        <p className="text-sm opacity-60">Group stories and tasks under large deliverables.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {epics.length === 0 && (
          <div className="rounded-box border border-dashed border-base-300 p-10 text-center text-sm opacity-50 md:col-span-2">
            No epics yet. Create an issue with type EPIC from the Issues page.
          </div>
        )}
        {epics.map((epic) => {
          const total = epic.epicChildren.length;
          const done = epic.epicChildren.filter((c) => c.status === "DONE").length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={epic.id} className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/projects/${id}/issues/${epic.id}`}
                      className="font-mono text-xs link link-hover opacity-60"
                    >
                      {epic.issueKey}
                    </Link>
                    <h2 className="card-title text-lg">
                      <Link href={`/projects/${id}/issues/${epic.id}`} className="link link-hover">
                        {epic.title}
                      </Link>
                    </h2>
                  </div>
                  <StatusBadge status={epic.status} />
                </div>
                <progress className="progress progress-secondary w-full" value={pct} max={100} />
                <p className="text-xs opacity-60">
                  {done}/{total} child issues done ({pct}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
