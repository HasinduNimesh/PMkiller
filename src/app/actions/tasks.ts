"use server";

import type { ActivityAction, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/session";
import { commentSchema, taskSchema } from "@/lib/validators";
import { computeCpm, offsetToDate } from "@/lib/cpm";
import { isTaskSeverity, isTaskStatus } from "@/lib/org-guards";

async function getProjectOrThrow(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
  });
  if (!project) throw new Error("NOT_FOUND");
  return project;
}

/** Ensure FKs used on create/update belong to this project / org. */
async function validateTaskRelations(
  projectId: string,
  organizationId: string,
  refs: {
    assigneeId?: string | null;
    sprintId?: string | null;
    epicId?: string | null;
    parentId?: string | null;
    fixVersionId?: string | null;
    predecessorIds?: string[];
    labelIds?: string[];
    componentIds?: string[];
  },
): Promise<string | null> {
  if (refs.assigneeId) {
    const member = await prisma.orgMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: refs.assigneeId },
      },
    });
    if (!member) return "Assignee is not in your organization.";

    const projectMemberCount = await prisma.projectMember.count({ where: { projectId } });
    if (projectMemberCount > 0) {
      const onProject = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: refs.assigneeId },
        },
      });
      if (!onProject) return "Assignee must be a member of this project.";
    }
  }

  if (refs.sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: refs.sprintId, projectId },
    });
    if (!sprint) return "Sprint not found in this project.";
  }

  if (refs.epicId) {
    const epic = await prisma.task.findFirst({
      where: { id: refs.epicId, projectId, issueType: "EPIC" },
    });
    if (!epic) return "Epic not found in this project.";
  }

  if (refs.parentId) {
    const parent = await prisma.task.findFirst({
      where: { id: refs.parentId, projectId, issueType: { not: "EPIC" } },
    });
    if (!parent) return "Parent issue not found in this project.";
  }

  if (refs.fixVersionId) {
    const version = await prisma.version.findFirst({
      where: { id: refs.fixVersionId, projectId },
    });
    if (!version) return "Fix version not found in this project.";
  }

  if (refs.predecessorIds?.length) {
    const count = await prisma.task.count({
      where: {
        projectId,
        id: { in: refs.predecessorIds },
        issueType: { not: "EPIC" },
      },
    });
    if (count !== refs.predecessorIds.length) {
      return "One or more dependencies are not in this project.";
    }
  }

  if (refs.labelIds?.length) {
    const count = await prisma.label.count({
      where: { projectId, id: { in: refs.labelIds } },
    });
    if (count !== refs.labelIds.length) return "One or more labels are invalid.";
  }

  if (refs.componentIds?.length) {
    const count = await prisma.component.count({
      where: { projectId, id: { in: refs.componentIds } },
    });
    if (count !== refs.componentIds.length) return "One or more components are invalid.";
  }

  return null;
}

async function nextIssueKey(projectId: string) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { issueCounter: { increment: 1 } },
  });
  return `${project.key}-${project.issueCounter}`;
}

async function logActivity(input: {
  taskId: string;
  actorId: string;
  action: ActivityAction;
  field?: string;
  fromValue?: string | null;
  toValue?: string | null;
  message?: string;
}) {
  await prisma.activity.create({
    data: {
      taskId: input.taskId,
      actorId: input.actorId,
      action: input.action,
      field: input.field,
      fromValue: input.fromValue ?? undefined,
      toValue: input.toValue ?? undefined,
      message: input.message,
    },
  });
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath(`/projects/${projectId}/backlog`);
  revalidatePath(`/projects/${projectId}/schedule`);
  revalidatePath(`/projects/${projectId}/epics`);
  revalidatePath(`/projects/${projectId}/roadmap`);
  revalidatePath("/dashboard");
  revalidatePath("/my-work");
}

export async function recalculateCpmAction(projectId: string) {
  const session = await requireRole("MEMBER");
  const project = await getProjectOrThrow(projectId, session.user.organizationId);

  const tasks = await prisma.task.findMany({
    where: { projectId, issueType: { not: "EPIC" } },
    include: {
      predecessors: { select: { predecessorId: true } },
    },
  });

  const cpm = computeCpm(
    tasks.map((t) => ({
      id: t.id,
      durationDays: t.isMilestone ? 0 : t.durationDays,
      predecessorIds: t.predecessors.map((p) => p.predecessorId),
    })),
  );

  if (cpm.hasCycle) {
    return { error: "Circular dependency detected. Fix task links and retry." };
  }

  await prisma.$transaction(
    cpm.tasks.map((result) =>
      prisma.task.update({
        where: { id: result.id },
        data: {
          earlyStart: offsetToDate(project.startDate, result.earlyStart),
          earlyFinish: offsetToDate(project.startDate, result.earlyFinish),
          lateStart: offsetToDate(project.startDate, result.lateStart),
          lateFinish: offsetToDate(project.startDate, result.lateFinish),
          slackDays: result.slack,
          isCritical: result.isCritical,
          plannedStart: offsetToDate(project.startDate, result.earlyStart),
          plannedEnd: offsetToDate(project.startDate, result.earlyFinish),
        },
      }),
    ),
  );

  revalidateProject(projectId);
  return {
    ok: true,
    projectDuration: cpm.projectDuration,
    criticalCount: cpm.criticalPathIds.length,
  };
}

export async function createTaskAction(projectId: string, formData: FormData) {
  const session = await requireRole("MEMBER");
  await getProjectOrThrow(projectId, session.user.organizationId);

  const predecessorRaw = formData.get("predecessorIds");
  const predecessorIds =
    typeof predecessorRaw === "string" && predecessorRaw.length
      ? predecessorRaw.split(",").filter(Boolean)
      : [];
  const labelRaw = formData.get("labelIds");
  const labelIds =
    typeof labelRaw === "string" && labelRaw.length ? labelRaw.split(",").filter(Boolean) : [];
  const componentRaw = formData.get("componentIds");
  const componentIds =
    typeof componentRaw === "string" && componentRaw.length
      ? componentRaw.split(",").filter(Boolean)
      : [];

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    issueType: formData.get("issueType") || "TASK",
    severity: formData.get("severity") || "MEDIUM",
    status: formData.get("status") || "BACKLOG",
    durationDays: formData.get("durationDays") || 1,
    storyPoints: formData.get("storyPoints") || null,
    originalEstimate: formData.get("originalEstimate") || null,
    isMilestone: formData.get("isMilestone") === "on" || formData.get("isMilestone") === "true",
    environment: formData.get("environment") || null,
    dueDate: formData.get("dueDate") || null,
    assigneeId: formData.get("assigneeId") || null,
    epicId: formData.get("epicId") || null,
    parentId: formData.get("parentId") || null,
    sprintId: formData.get("sprintId") || null,
    fixVersionId: formData.get("fixVersionId") || null,
    labelIds,
    componentIds,
    predecessorIds,
  });

  if (!parsed.success) return { error: "Invalid issue data." };

  const assigneeId = parsed.data.assigneeId || null;
  const sprintId = parsed.data.sprintId || null;
  const epicId = parsed.data.epicId || null;
  const parentId = parsed.data.parentId || null;
  const fixVersionId = parsed.data.fixVersionId || null;

  const relationError = await validateTaskRelations(projectId, session.user.organizationId, {
    assigneeId,
    sprintId,
    epicId,
    parentId,
    fixVersionId,
    predecessorIds: parsed.data.predecessorIds,
    labelIds: parsed.data.labelIds,
    componentIds: parsed.data.componentIds,
  });
  if (relationError) return { error: relationError };

  const count = await prisma.task.count({ where: { projectId } });
  const issueKey = await nextIssueKey(projectId);
  const issueType = parsed.data.issueType;
  const status =
    issueType === "EPIC"
      ? "BACKLOG"
      : parsed.data.status === "BACKLOG" && formData.get("toBoard") === "true"
        ? "TODO"
        : parsed.data.status;

  const task = await prisma.task.create({
    data: {
      projectId,
      issueKey,
      title: parsed.data.title,
      description: parsed.data.description,
      issueType,
      severity: parsed.data.severity,
      status,
      durationDays: parsed.data.isMilestone || issueType === "EPIC" ? 0 : parsed.data.durationDays,
      storyPoints: parsed.data.storyPoints,
      originalEstimate: parsed.data.originalEstimate,
      isMilestone: parsed.data.isMilestone,
      environment: parsed.data.environment,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId,
      epicId: issueType === "EPIC" ? null : epicId,
      parentId: issueType === "SUBTASK" ? parentId : null,
      sprintId: issueType === "EPIC" ? null : sprintId,
      fixVersionId,
      createdById: session.user.id,
      sortOrder: count,
      boardOrder: count,
      predecessors: {
        create: parsed.data.predecessorIds.map((predecessorId) => ({ predecessorId })),
      },
      labels: {
        create: parsed.data.labelIds.map((labelId) => ({ labelId })),
      },
      components: {
        create: parsed.data.componentIds.map((componentId) => ({ componentId })),
      },
      watchers: {
        create: { userId: session.user.id },
      },
    },
  });

  await logActivity({
    taskId: task.id,
    actorId: session.user.id,
    action: "CREATED",
    message: `Created ${issueKey}`,
  });

  if (assigneeId) {
    const { notifyIssueAssigned } = await import("@/lib/notify");
    await notifyIssueAssigned({
      taskId: task.id,
      assigneeId,
      actorId: session.user.id,
    });
  }

  if (issueType !== "EPIC") await recalculateCpmAction(projectId);
  revalidateProject(projectId);
  return { id: task.id, issueKey };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await requireRole("MEMBER");
  if (!isTaskStatus(status)) return { error: "Invalid status." };

  const existing = await prisma.task.findFirst({
    where: { id: taskId, project: { organizationId: session.user.organizationId } },
  });
  if (!existing) return { error: "Issue not found." };

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
  await logActivity({
    taskId,
    actorId: session.user.id,
    action: "STATUS_CHANGED",
    field: "status",
    fromValue: existing.status,
    toValue: status,
  });
  revalidateProject(existing.projectId);
  revalidatePath(`/projects/${existing.projectId}/issues/${taskId}`);
  return { ok: true };
}

export async function updateTaskFieldsAction(taskId: string, formData: FormData) {
  const session = await requireRole("MEMBER");
  const existing = await prisma.task.findFirst({
    where: { id: taskId, project: { organizationId: session.user.organizationId } },
  });
  if (!existing) return { error: "Issue not found." };

  const assigneeId = formData.get("assigneeId");
  const sprintId = formData.get("sprintId");
  const epicId = formData.get("epicId");
  const severity = formData.get("severity");
  const storyPoints = formData.get("storyPoints");
  const title = formData.get("title");
  const description = formData.get("description");

  const data: Record<string, unknown> = {};
  if (typeof title === "string" && title.trim()) data.title = title.trim();
  if (typeof description === "string") data.description = description;
  if (typeof severity === "string") {
    if (!isTaskSeverity(severity)) return { error: "Invalid priority." };
    data.severity = severity;
  }
  if (assigneeId !== null) data.assigneeId = assigneeId === "" ? null : String(assigneeId);
  if (sprintId !== null) data.sprintId = sprintId === "" ? null : String(sprintId);
  if (epicId !== null) data.epicId = epicId === "" ? null : String(epicId);
  if (storyPoints !== null && storyPoints !== "") {
    const sp = Number(storyPoints);
    if (Number.isNaN(sp) || sp < 0) return { error: "Invalid story points." };
    data.storyPoints = sp;
  }

  const relationError = await validateTaskRelations(
    existing.projectId,
    session.user.organizationId,
    {
      assigneeId: (data.assigneeId as string | null | undefined) ?? undefined,
      sprintId: (data.sprintId as string | null | undefined) ?? undefined,
      epicId: (data.epicId as string | null | undefined) ?? undefined,
    },
  );
  if (relationError) return { error: relationError };

  await prisma.task.update({ where: { id: taskId }, data });
  await logActivity({
    taskId,
    actorId: session.user.id,
    action: "UPDATED",
    message: "Updated issue fields",
  });

  const nextAssigneeId =
    data.assigneeId === undefined ? undefined : (data.assigneeId as string | null);
  if (typeof nextAssigneeId === "string" && nextAssigneeId !== existing.assigneeId) {
    const { notifyIssueAssigned } = await import("@/lib/notify");
    await notifyIssueAssigned({
      taskId,
      assigneeId: nextAssigneeId,
      actorId: session.user.id,
      previousAssigneeId: existing.assigneeId,
    });
  }

  revalidateProject(existing.projectId);
  revalidatePath(`/projects/${existing.projectId}/issues/${taskId}`);
  return { ok: true };
}

export async function moveIssueToSprintAction(taskId: string, sprintId: string | null) {
  const session = await requireRole("MEMBER");
  const existing = await prisma.task.findFirst({
    where: { id: taskId, project: { organizationId: session.user.organizationId } },
  });
  if (!existing) return { error: "Issue not found." };

  if (sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId: existing.projectId },
    });
    if (!sprint) return { error: "Sprint not found in this project." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      sprintId,
      status: sprintId && existing.status === "BACKLOG" ? "TODO" : existing.status,
    },
  });
  await logActivity({
    taskId,
    actorId: session.user.id,
    action: "SPRINT_CHANGED",
    field: "sprintId",
    fromValue: existing.sprintId,
    toValue: sprintId,
  });
  revalidateProject(existing.projectId);
  return { ok: true };
}

export async function deleteTaskAction(taskId: string) {
  const session = await requireRole("PM");
  const existing = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { organizationId: session.user.organizationId },
    },
  });
  if (!existing) return { error: "Task not found." };

  await prisma.task.delete({ where: { id: taskId } });
  await recalculateCpmAction(existing.projectId);
  return { ok: true };
}

export async function addCommentAction(taskId: string, formData: FormData) {
  const session = await requireRole("MEMBER");
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { organizationId: session.user.organizationId },
    },
  });
  if (!task) return { error: "Task not found." };

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: "Comment cannot be empty." };

  await prisma.comment.create({
    data: {
      taskId,
      authorId: session.user.id,
      body: parsed.data.body,
    },
  });
  await logActivity({
    taskId,
    actorId: session.user.id,
    action: "COMMENTED",
    message: parsed.data.body.slice(0, 120),
  });

  revalidateProject(task.projectId);
  revalidatePath(`/projects/${task.projectId}/issues/${taskId}`);
  return { ok: true };
}

export async function toggleWatchAction(taskId: string) {
  const session = await requireRole("MEMBER");
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { organizationId: session.user.organizationId } },
  });
  if (!task) return { error: "Issue not found." };

  const existing = await prisma.taskWatcher.findUnique({
    where: { taskId_userId: { taskId, userId: session.user.id } },
  });
  if (existing) {
    await prisma.taskWatcher.delete({
      where: { taskId_userId: { taskId, userId: session.user.id } },
    });
  } else {
    await prisma.taskWatcher.create({ data: { taskId, userId: session.user.id } });
  }
  revalidatePath(`/projects/${task.projectId}/issues/${taskId}`);
  return { ok: true, watching: !existing };
}

export async function getScheduleData(projectId: string) {
  const session = await requireSession();
  const project = await getProjectOrThrow(projectId, session.user.organizationId);
  const tasks = await prisma.task.findMany({
    where: { projectId, issueType: { not: "EPIC" } },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      predecessors: true,
    },
    orderBy: [{ earlyStart: "asc" }, { sortOrder: "asc" }],
  });

  const maxEnd = tasks.reduce((acc, t) => {
    const end = t.earlyFinish ?? t.plannedEnd;
    if (!end) return acc;
    return end > acc ? end : acc;
  }, project.startDate);

  const durationDays = Math.max(
    1,
    Math.ceil((maxEnd.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  return { project, tasks, durationDays };
}
