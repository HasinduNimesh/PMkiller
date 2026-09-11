import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageProjects } from "@/lib/rbac";
import { ProjectNav } from "@/components/project-nav";
import { BacklogList } from "@/components/backlog-list";
import { createSprintAction, startSprintAction, completeSprintAction } from "@/app/actions/agile";

export default async function BacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!project) notFound();

  const [sprints, issues] = await Promise.all([
    prisma.sprint.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({
      where: { projectId: id, issueType: { not: "EPIC" } },
      include: { assignee: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const active = sprints.find((s) => s.status === "ACTIVE");
  const planned = sprints.filter((s) => s.status === "PLANNED");
  const canManage = canManageProjects(session.user.role);

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="backlog"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Backlog & sprints</h1>
          <p className="text-sm opacity-60">Plan work into sprints like Jira Scrum.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card bg-base-100 shadow lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg">Issue backlog</h2>
            <BacklogList projectId={id} issues={issues} sprints={sprints} />
          </div>
        </div>

        <div className="space-y-4">
          {active && (
            <div className="card border border-primary/30 bg-base-100 shadow">
              <div className="card-body gap-2">
                <div className="badge badge-primary">Active sprint</div>
                <h3 className="font-semibold">{active.name}</h3>
                {active.goal && <p className="text-sm opacity-70">{active.goal}</p>}
                {canManage && (
                  <form
                    action={async () => {
                      "use server";
                      await completeSprintAction(active.id);
                    }}
                  >
                    <button className="btn btn-outline btn-sm">Complete sprint</button>
                  </form>
                )}
              </div>
            </div>
          )}

          {!active && planned.length === 0 && (
            <div className="rounded-box border border-dashed border-base-300 bg-base-200/40 p-5 text-center text-sm text-base-content/60">
              <p className="font-medium text-base-content/80">No sprints yet</p>
              <p className="mt-1">
                Create a sprint to pull issues from the backlog and track story points.
              </p>
            </div>
          )}

          {planned.map((s) => (
            <div key={s.id} className="card bg-base-100 shadow">
              <div className="card-body gap-2">
                <div className="badge badge-ghost">Planned</div>
                <h3 className="font-semibold">{s.name}</h3>
                {s.goal && <p className="text-sm opacity-70">{s.goal}</p>}
                {canManage && (
                  <form
                    action={async () => {
                      "use server";
                      await startSprintAction(s.id);
                    }}
                  >
                    <button className="btn btn-primary btn-sm">Start sprint</button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {canManage && (
            <div className="card bg-base-100 shadow">
              <form
                className="card-body gap-2"
                action={async (fd) => {
                  "use server";
                  await createSprintAction(id, fd);
                }}
              >
                <h3 className="font-semibold">Create sprint</h3>
                <input name="name" required placeholder="Sprint name" className="input input-sm w-full" />
                <input name="goal" placeholder="Sprint goal" className="input input-sm w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="startDate" type="date" className="input input-sm w-full" />
                  <input name="endDate" type="date" className="input input-sm w-full" />
                </div>
                <button className="btn btn-primary btn-sm">Add sprint</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
