import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProjectNav } from "@/components/project-nav";
import { KanbanBoard } from "@/components/kanban-board";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sprint?: string }>;
}) {
  const { id } = await params;
  const { sprint } = await searchParams;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { sprints: { orderBy: { createdAt: "desc" } } },
  });
  if (!project) notFound();

  const activeSprint = project.sprints.find((s) => s.status === "ACTIVE");
  const sprintId = sprint === "all" ? undefined : sprint || activeSprint?.id;

  const issues = await prisma.task.findMany({
    where: {
      projectId: id,
      issueType: { notIn: ["EPIC"] },
      status: { not: "BACKLOG" },
      ...(sprintId ? { sprintId } : {}),
    },
    include: { assignee: { select: { name: true } } },
    orderBy: [{ boardOrder: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="board"
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Kanban board</h1>
          <p className="text-sm opacity-60">Drag cards across columns · Jira-style workflow</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/projects/${id}/board?sprint=all`}
            className={`btn btn-sm ${!sprintId ? "btn-primary" : "btn-outline"}`}
          >
            All sprints
          </a>
          {activeSprint && (
            <a
              href={`/projects/${id}/board`}
              className={`btn btn-sm ${sprintId === activeSprint.id ? "btn-primary" : "btn-outline"}`}
            >
              {activeSprint.name}
            </a>
          )}
        </div>
      </div>
      <KanbanBoard projectId={id} issues={issues} />
    </div>
  );
}
