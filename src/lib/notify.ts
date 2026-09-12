"use server";

import { prisma } from "@/lib/db";
import { appUrl, sendAssignmentEmail } from "@/lib/email";

/**
 * Notify assignee when work is assigned (or reassigned) to them.
 * Never throws — assignment UX must not fail if email delivery fails.
 */
export async function notifyIssueAssigned(input: {
  taskId: string;
  assigneeId: string;
  actorId: string;
  previousAssigneeId?: string | null;
}) {
  try {
    if (input.assigneeId === input.actorId) return;
    if (input.previousAssigneeId && input.previousAssigneeId === input.assigneeId) return;

    const [task, assignee, actor] = await Promise.all([
      prisma.task.findUnique({
        where: { id: input.taskId },
        select: {
          issueKey: true,
          title: true,
          projectId: true,
          project: { select: { name: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: input.assigneeId },
        select: { email: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: input.actorId },
        select: { name: true, email: true },
      }),
    ]);

    if (!task || !assignee || !actor) return;

    const issueUrl = appUrl(`/projects/${task.projectId}/issues/${input.taskId}`);
    await sendAssignmentEmail({
      to: assignee.email,
      assigneeName: assignee.name,
      assignerName: actor.name || actor.email,
      issueKey: task.issueKey,
      title: task.title,
      projectName: task.project.name,
      issueUrl,
    });

    await prisma.activity.create({
      data: {
        taskId: input.taskId,
        actorId: input.actorId,
        action: "ASSIGNED",
        field: "assignee",
        toValue: assignee.email,
        message: `Assigned to ${assignee.name || assignee.email}`,
      },
    });
  } catch (err) {
    console.error("[notifyIssueAssigned]", err);
  }
}
