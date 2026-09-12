import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/badges";
import { canManageProjects } from "@/lib/rbac";
import { Plus } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      owner: { select: { name: true } },
      _count: { select: { tasks: true } },
      tasks: { select: { status: true, isCritical: true, earlyFinish: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title neon-text">Projects</h1>
          <p className="page-subtitle">Manage delivery and deadlines across the org.</p>
        </div>
        {canManageProjects(session.user.role) && (
          <Link href="/projects/new" className="btn btn-primary gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New project
          </Link>
        )}
      </div>

      <div className="panel neon-ring">
        <div className="overflow-x-auto p-2 sm:p-3">
          <table className="table table-modern">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Tasks</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-base-content/50">
                    No projects yet.
                  </td>
                </tr>
              )}
              {projects.map((p) => {
                const finishes = p.tasks
                  .map((t) => t.earlyFinish)
                  .filter((d): d is Date => !!d);
                const cpmEnd = finishes.length
                  ? finishes.reduce((a, b) => (a > b ? a : b))
                  : null;
                const atRisk = cpmEnd ? cpmEnd > p.deadline : false;
                const done = p.tasks.filter((t) => t.status === "DONE").length;

                return (
                  <tr key={p.id} className="hover">
                    <td>
                      <Link href={`/projects/${p.id}`} className="link link-hover font-medium">
                        {p.name}
                      </Link>
                      <div className="text-xs opacity-50">Owner {p.owner.name ?? "—"}</div>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{formatDate(p.deadline)}</td>
                    <td>
                      {done}/{p._count.tasks}
                    </td>
                    <td>
                      {atRisk ? (
                        <span className="badge badge-error badge-outline">At risk</span>
                      ) : (
                        <span className="badge badge-success badge-outline">On track</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
