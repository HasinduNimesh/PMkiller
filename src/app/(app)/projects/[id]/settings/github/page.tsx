import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canManageProjects } from "@/lib/rbac";
import { ProjectNav } from "@/components/project-nav";
import { getGithubReposForOrg } from "@/app/actions/github";
import { RepoPicker } from "@/components/repo-picker";
import { isGithubOAuthConfigured } from "@/lib/github-api";
import { GitBranch, Settings2 } from "lucide-react";

export default async function GithubRepoPickerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;
  if (!canManageProjects(session.user.role)) redirect(`/projects/${id}/settings`);

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!project) notFound();

  if (!isGithubOAuthConfigured()) {
    return (
      <div className="space-y-6">
        <ProjectNav
          projectId={project.id}
          projectName={project.name}
          projectKey={project.key}
          active="settings"
        />
        <div className="panel border-warning/40">
          <div className="panel-body gap-3">
            <div className="flex items-start gap-3">
              <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  GitHub OAuth not configured
                </h1>
                <p className="mt-2 text-sm opacity-70">
                  The server is missing OAuth credentials, so the repository picker cannot run.
                  Set these env vars and restart:
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 font-mono text-xs">
                  <li>GITHUB_CLIENT_ID</li>
                  <li>GITHUB_CLIENT_SECRET</li>
                  <li>AUTH_URL</li>
                </ul>
                <p className="mt-3 text-sm opacity-70">
                  You can still wire a webhook manually from project settings.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/projects/${id}/settings`} className="btn btn-primary btn-sm">
                Back to settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const connection = await prisma.githubConnection.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  if (!connection) {
    return (
      <div className="space-y-6">
        <ProjectNav
          projectId={project.id}
          projectName={project.name}
          projectKey={project.key}
          active="settings"
        />
        <div className="panel">
          <div className="panel-body items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-base-200">
              <GitBranch className="h-5 w-5 opacity-50" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Authorize GitHub first
            </h1>
            <p className="max-w-md text-sm opacity-60">
              Connect a GitHub account with admin access to the repositories you want to link.
              We only store the OAuth token for your organization.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href={`/api/github/oauth/start?projectId=${id}`}
                className="btn btn-primary btn-sm"
              >
                Authorize GitHub
              </a>
              <Link href={`/projects/${id}/settings`} className="btn btn-ghost btn-sm">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const listed = await getGithubReposForOrg();

  return (
    <div className="space-y-6">
      <ProjectNav
        projectId={project.id}
        projectName={project.name}
        projectKey={project.key}
        active="settings"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Connect a GitHub repository
          </h1>
          <p className="text-sm opacity-60">
            Signed in as <span className="font-mono">{connection.githubLogin}</span>. Pick a repo
            you admin — we&apos;ll create the webhook automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/github/oauth/start?projectId=${id}`} className="btn btn-outline btn-sm">
            Re-authorize GitHub
          </a>
          <Link href={`/projects/${id}/settings`} className="btn btn-ghost btn-sm">
            Back
          </Link>
        </div>
      </div>

      {listed.error && (
        <div className="alert alert-error text-sm">
          <span>{listed.error}</span>
        </div>
      )}

      <RepoPicker
        projectId={id}
        currentRepo={project.githubRepo}
        repos={[...("repos" in listed ? listed.repos : [])]}
      />
    </div>
  );
}
