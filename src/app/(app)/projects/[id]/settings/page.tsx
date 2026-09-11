import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageProjects } from "@/lib/rbac";
import { ProjectNav } from "@/components/project-nav";
import { GithubSettingsForm } from "@/components/github-settings-form";
import { ProjectMembersPanel } from "@/components/project-members-panel";
import { isGithubOAuthConfigured } from "@/lib/github-api";
import {
  createComponentAction,
  createLabelAction,
  createVersionAction,
} from "@/app/actions/agile";

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ linked?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session) return null;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      labels: { orderBy: { name: "asc" } },
      components: { orderBy: { name: "asc" } },
      versions: { orderBy: { name: "asc" } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const [connection, orgMembers] = await Promise.all([
    prisma.githubConnection.findUnique({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.orgMember.findMany({
      where: { organizationId: session.user.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const canManage = canManageProjects(session.user.role);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = process.env.AUTH_URL ?? `${proto}://${host}`;
  const webhookUrl = `${base.replace(/\/$/, "")}/api/github/webhook`;

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="settings"
      />
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Project settings</h1>
        <p className="text-sm opacity-60">
          Labels, components, versions, and GitHub integration. Key:{" "}
          <span className="font-mono">{project.key}</span>
        </p>
      </div>

      {sp.linked && (
        <div className="alert alert-success text-sm">
          <span>GitHub repository connected and webhook created.</span>
        </div>
      )}
      {sp.error && (
        <div className="alert alert-error text-sm">
          <span>GitHub connection failed ({sp.error}). Try again.</span>
        </div>
      )}

      {canManage && (
        <GithubSettingsForm
          projectId={project.id}
          projectKey={project.key}
          githubRepo={project.githubRepo}
          autoCloseOnPrMerge={project.autoCloseOnPrMerge}
          hasSecret={Boolean(project.githubWebhookSecret)}
          webhookUrl={webhookUrl}
          oauthConfigured={isGithubOAuthConfigured()}
          githubLogin={connection?.githubLogin ?? null}
        />
      )}

      <ProjectMembersPanel
        projectId={project.id}
        members={project.members}
        orgUsers={orgMembers.map((m) => m.user)}
        canManage={canManage}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">Labels</h2>
            <ul className="space-y-1">
              {project.labels.map((l) => (
                <li key={l.id}>
                  <span
                    className="badge badge-sm"
                    style={{ backgroundColor: l.color, color: "#fff" }}
                  >
                    {l.name}
                  </span>
                </li>
              ))}
            </ul>
            {canManage && (
              <form
                className="mt-3 flex gap-2"
                action={async (fd) => {
                  "use server";
                  await createLabelAction(id, fd);
                }}
              >
                <input name="name" required placeholder="Label" className="input input-sm w-full" />
                <input name="color" type="color" defaultValue="#6366f1" className="h-8 w-10" />
                <button className="btn btn-sm">Add</button>
              </form>
            )}
          </div>
        </section>

        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">Components</h2>
            <ul className="space-y-1 text-sm">
              {project.components.map((c) => (
                <li key={c.id}>
                  <span className="font-medium">{c.name}</span>
                  {c.description && <span className="opacity-50"> — {c.description}</span>}
                </li>
              ))}
            </ul>
            {canManage && (
              <form
                className="mt-3 space-y-2"
                action={async (fd) => {
                  "use server";
                  await createComponentAction(id, fd);
                }}
              >
                <input
                  name="name"
                  required
                  placeholder="Component"
                  className="input input-sm w-full"
                />
                <input
                  name="description"
                  placeholder="Description"
                  className="input input-sm w-full"
                />
                <button className="btn btn-sm">Add</button>
              </form>
            )}
          </div>
        </section>

        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base">Versions / releases</h2>
            <ul className="space-y-1 text-sm">
              {project.versions.map((v) => (
                <li key={v.id} className="flex items-center gap-2">
                  <span className="font-medium">{v.name}</span>
                  {v.released && <span className="badge badge-success badge-xs">released</span>}
                </li>
              ))}
            </ul>
            {canManage && (
              <form
                className="mt-3 space-y-2"
                action={async (fd) => {
                  "use server";
                  await createVersionAction(id, fd);
                }}
              >
                <input name="name" required placeholder="v1.0" className="input input-sm w-full" />
                <input name="releaseDate" type="date" className="input input-sm w-full" />
                <button className="btn btn-sm">Add</button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
