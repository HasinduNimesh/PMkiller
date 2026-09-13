import { prisma } from "@/lib/db";

const ASSIGNEE_UNAVAILABLE = "Assignee is not available." as const;

/**
 * Resolve assignee email to a user id within the actor's org / project.
 * Uses a generic error to avoid cross-tenant email enumeration.
 */
export async function resolveAssigneeId(input: {
  email: string;
  organizationId: string;
  projectId: string;
}): Promise<{ assigneeId: string } | { error: typeof ASSIGNEE_UNAVAILABLE }> {
  const email = input.email.toLowerCase().trim();
  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!u) return { error: ASSIGNEE_UNAVAILABLE };

  const onProject = await prisma.projectMember.count({ where: { projectId: input.projectId } });
  if (onProject > 0) {
    const pm = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: input.projectId, userId: u.id } },
    });
    if (!pm) return { error: ASSIGNEE_UNAVAILABLE };
  } else {
    const om = await prisma.orgMember.findUnique({
      where: {
        organizationId_userId: { organizationId: input.organizationId, userId: u.id },
      },
    });
    if (!om) return { error: ASSIGNEE_UNAVAILABLE };
  }

  return { assigneeId: u.id };
}
