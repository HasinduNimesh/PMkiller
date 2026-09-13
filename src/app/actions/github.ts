"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { generateWebhookSecret, normalizeGithubRepo } from "@/lib/github";
import {
  createRepoWebhook,
  deleteRepoWebhook,
  listGithubRepos,
  newWebhookSecret,
} from "@/lib/github-api";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/secret-crypto";

function webhookPublicUrl() {
  return `${(process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/github/webhook`;
}

async function githubAccessTokenForOrg(organizationId: string) {
  const connection = await prisma.githubConnection.findUnique({
    where: { organizationId },
  });
  if (!connection) return null;

  const plaintext = decryptSecret(connection.accessToken);
  // Lazily upgrade legacy plaintext rows
  if (!isEncryptedSecret(connection.accessToken)) {
    void prisma.githubConnection
      .update({
        where: { id: connection.id },
        data: { accessToken: encryptSecret(plaintext) },
      })
      .catch(() => undefined);
  }

  return { connection, token: plaintext };
}

export async function updateGithubSettingsAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const repoRaw = String(formData.get("githubRepo") || "").trim();
  const repo = repoRaw ? normalizeGithubRepo(repoRaw) : null;
  if (repoRaw && !repo) {
    return { error: "GitHub repo must look like owner/repo (or a github.com URL)." };
  }

  const rotate = formData.get("rotateSecret") === "on" || formData.get("rotateSecret") === "true";
  const autoClose =
    formData.get("autoCloseOnPrMerge") === "on" || formData.get("autoCloseOnPrMerge") === "true";

  const data: {
    githubRepo: string | null;
    autoCloseOnPrMerge: boolean;
    githubWebhookSecret?: string;
  } = {
    githubRepo: repo,
    autoCloseOnPrMerge: autoClose,
  };

  if (rotate || (repo && !project.githubWebhookSecret)) {
    data.githubWebhookSecret = generateWebhookSecret();
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/settings/github`);
  return {
    ok: true,
    webhookSecret: updated.githubWebhookSecret,
    rotated: Boolean(data.githubWebhookSecret),
  };
}

export async function setAutoCloseAction(projectId: string, enabled: boolean) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  await prisma.project.update({
    where: { id: projectId },
    data: { autoCloseOnPrMerge: enabled },
  });
  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/settings/github`);
  return { ok: true };
}

export async function linkGithubRepoAction(projectId: string, fullName: string) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const gh = await githubAccessTokenForOrg(session.user.organizationId);
  if (!gh) {
    return { error: "Connect GitHub first, then pick a repository." };
  }
  const { token } = gh;

  const repo = normalizeGithubRepo(fullName);
  if (!repo) return { error: "Invalid repository name." };
  const [owner, name] = repo.split("/");

  const secret = newWebhookSecret();
  const hookUrl = webhookPublicUrl();

  // Remove previous hook if we created one
  if (project.githubRepo && project.githubWebhookId) {
    const [prevOwner, prevName] = project.githubRepo.split("/");
    try {
      await deleteRepoWebhook({
        token,
        owner: prevOwner,
        repo: prevName,
        hookId: project.githubWebhookId,
      });
    } catch {
      // ignore cleanup failures
    }
  }

  let hookId: number;
  try {
    hookId = await createRepoWebhook({
      token,
      owner,
      repo: name,
      webhookUrl: hookUrl,
      secret,
    });
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Failed to create GitHub webhook. Ensure you have admin access on the repo.",
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      githubRepo: repo,
      githubWebhookSecret: secret,
      githubWebhookId: hookId,
      autoCloseOnPrMerge: true,
    },
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/settings/github`);
  return { ok: true, repo, webhookId: hookId };
}

export async function disconnectGithubRepoAction(projectId: string) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const gh = await githubAccessTokenForOrg(session.user.organizationId);

  if (gh && project.githubRepo && project.githubWebhookId) {
    const [owner, name] = project.githubRepo.split("/");
    try {
      await deleteRepoWebhook({
        token: gh.token,
        owner,
        repo: name,
        hookId: project.githubWebhookId,
      });
    } catch {
      // continue clearing local link
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      githubRepo: null,
      githubWebhookSecret: null,
      githubWebhookId: null,
    },
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}/settings/github`);
  return { ok: true };
}

export async function disconnectGithubAccountAction() {
  const session = await requireRole("PM");
  await prisma.githubConnection.deleteMany({
    where: { organizationId: session.user.organizationId },
  });
  revalidatePath("/projects");
  return { ok: true };
}

export async function getGithubReposForOrg() {
  const session = await requireRole("PM");
  const gh = await githubAccessTokenForOrg(session.user.organizationId);
  if (!gh) return { error: "Not connected", repos: [] as const };

  try {
    const repos = await listGithubRepos(gh.token);
    return {
      ok: true as const,
      login: gh.connection.githubLogin,
      repos: repos.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        private: r.private,
        description: r.description,
        htmlUrl: r.html_url,
      })),
    };
  } catch {
    return {
      error: "GitHub token expired or invalid. Reconnect GitHub.",
      repos: [] as const,
    };
  }
}

export async function getRequestWebhookUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (process.env.AUTH_URL) return `${process.env.AUTH_URL.replace(/\/$/, "")}/api/github/webhook`;
  if (host) return `${proto}://${host}/api/github/webhook`;
  return webhookPublicUrl();
}
