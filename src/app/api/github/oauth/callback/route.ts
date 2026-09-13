import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  exchangeGithubCode,
  fetchGithubUser,
  isGithubOAuthConfigured,
} from "@/lib/github-api";
import { encryptSecret } from "@/lib/secret-crypto";
import { hasMinRole } from "@/lib/rbac";

export async function GET(req: Request) {
  const base = (process.env.AUTH_URL ?? new URL(req.url).origin).replace(/\/$/, "");

  if (!isGithubOAuthConfigured()) {
    return NextResponse.redirect(`${base}/projects?error=github_oauth_not_configured`);
  }

  const session = await auth();
  if (!session?.user?.id || !hasMinRole(session.user.role, "PM")) {
    return NextResponse.redirect(`${base}/login`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(`${base}/projects?error=github_denied`);
  }

  const cookieStore = await cookies();
  const expected = cookieStore.get("github_oauth_state")?.value;
  cookieStore.delete("github_oauth_state");

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${base}/projects?error=github_state_mismatch`);
  }

  const projectId = state.split(".")[0];
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) {
    return NextResponse.redirect(`${base}/projects?error=github_project_missing`);
  }

  try {
    const token = await exchangeGithubCode(code);
    const ghUser = await fetchGithubUser(token.access_token!);
    const accessToken = encryptSecret(token.access_token!);

    await prisma.githubConnection.upsert({
      where: { organizationId: session.user.organizationId },
      create: {
        organizationId: session.user.organizationId,
        accessToken,
        tokenType: token.token_type ?? "bearer",
        scope: token.scope,
        githubUserId: String(ghUser.id),
        githubLogin: ghUser.login,
        connectedById: session.user.id,
      },
      update: {
        accessToken,
        tokenType: token.token_type ?? "bearer",
        scope: token.scope,
        githubUserId: String(ghUser.id),
        githubLogin: ghUser.login,
        connectedById: session.user.id,
      },
    });

    return NextResponse.redirect(`${base}/projects/${projectId}/settings/github`);
  } catch {
    return NextResponse.redirect(
      `${base}/projects/${projectId}/settings?error=github_oauth_failed`,
    );
  }
}
