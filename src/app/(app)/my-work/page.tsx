import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { IssueTypeBadge, SeverityBadge, StatusBadge } from "@/components/badges";
import { formatDate } from "@/lib/utils";

export default async function MyWorkPage() {
  const session = await auth();
  if (!session) return null;

  const issues = await prisma.task.findMany({
    where: {
      assigneeId: session.user.id,
      project: { organizationId: session.user.organizationId },
      status: { not: "DONE" },
    },
    include: {
      project: { select: { id: true, name: true, key: true } },
      sprint: { select: { name: true } },
    },
    orderBy: [{ severity: "asc" }, { dueDate: "asc" }],
  });

  const watching = await prisma.taskWatcher.findMany({
    where: {
      userId: session.user.id,
      task: {
        project: { organizationId: session.user.organizationId },
        status: { not: "DONE" },
        assigneeId: { not: session.user.id },
      },
    },
    include: {
      task: {
        include: { project: { select: { id: true, name: true, key: true } } },
      },
    },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">My work</h1>
        <p className="text-sm opacity-60">Assigned issues and watches across projects.</p>
      </div>

      <div className="panel">
        <div className="panel-body">
          <h2 className="font-display text-lg font-semibold tracking-tight">Assigned to me</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Summary</th>
                  <th>Project</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center opacity-50">
                      No open assignments.
                    </td>
                  </tr>
                )}
                {issues.map((i) => (
                  <tr key={i.id} className="hover">
                    <td>
                      <Link
                        href={`/projects/${i.project.id}/issues/${i.id}`}
                        className="font-mono text-xs link"
                      >
                        {i.issueKey}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/projects/${i.project.id}/issues/${i.id}`}
                        className="link link-hover font-medium"
                      >
                        {i.title}
                      </Link>
                    </td>
                    <td>{i.project.name}</td>
                    <td>
                      <IssueTypeBadge type={i.issueType} />
                    </td>
                    <td>
                      <SeverityBadge severity={i.severity} />
                    </td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td>{formatDate(i.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <h2 className="font-display text-lg font-semibold tracking-tight">Watching</h2>
          <ul className="space-y-2">
            {watching.length === 0 && (
              <li className="text-sm opacity-50">You are not watching other open issues.</li>
            )}
            {watching.map((w) => (
              <li key={w.taskId} className="flex justify-between gap-3 text-sm">
                <Link
                  href={`/projects/${w.task.project.id}/issues/${w.task.id}`}
                  className="link link-hover"
                >
                  <span className="font-mono text-xs opacity-60">{w.task.issueKey}</span>{" "}
                  {w.task.title}
                </Link>
                <StatusBadge status={w.task.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
