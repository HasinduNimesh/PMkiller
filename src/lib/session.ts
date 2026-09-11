import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { OrgRole } from "@prisma/client";
import { hasMinRole } from "@/lib/rbac";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(min: OrgRole) {
  const session = await requireSession();
  if (!hasMinRole(session.user.role, min)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function getOrgMembership(userId: string, organizationId: string) {
  return prisma.orgMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });
}

export async function assertProjectAccess(
  projectId: string,
  minRole: OrgRole = "VIEWER",
) {
  const session = await requireSession();

  if (!hasMinRole(session.user.role, minRole)) {
    throw new Error("FORBIDDEN");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });

  if (!project) throw new Error("NOT_FOUND");
  return { session, project };
}
