import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getGithubOAuthAuthorizeUrl, isGithubOAuthConfigured } from "@/lib/github-api";
import { hasMinRole } from "@/lib/rbac";

export async function GET(req: Request) {
  if (!isGithubOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      },
      { status: 400 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", "/projects");
    return NextResponse.redirect(login);
  }
  if (!hasMinRole(session.user.role, "PM")) {
    return NextResponse.json({ error: "Only PM/Admin can connect GitHub." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const nonce = randomBytes(16).toString("hex");
  const state = `${projectId}.${nonce}`;
  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(getGithubOAuthAuthorizeUrl(state));
}
