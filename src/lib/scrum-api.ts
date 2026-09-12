import type { IssueType, OrgRole, SprintStatus, TaskSeverity, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ApiActor } from "@/lib/api-actor";
import { hasMinRole } from "@/lib/rbac";

async function nextIssueKey(projectId: string) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { issueCounter: { increment: 1 } },
    select: { key: true, issueCounter: true },
  });
  return `${project.key}-${project.issueCounter}`;
}

export async function listProjects(actor: ApiActor) {
  return prisma.project.findMany({
    where: { organizationId: actor.organizationId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      key: true,
      status: true,
      deadline: true,
      _count: { select: { tasks: true, sprints: true } },
    },
  });
}

export async function getProjectForActor(actor: ApiActor, projectIdOrKey: string) {
  return prisma.project.findFirst({
    where: {
      organizationId: actor.organizationId,
      OR: [{ id: projectIdOrKey }, { key: projectIdOrKey.toUpperCase() }],
    },
  });
}

export async function listIssues(
  actor: ApiActor,
  projectIdOrKey: string,
  filters?: {
    status?: TaskStatus;
    sprintId?: string | null;
    assigneeEmail?: string;
    q?: string;
  },
) {
  const project = await getProjectForActor(actor, projectIdOrKey);
  if (!project) return { error: "Project not found." as const };

  let assigneeId: string | undefined;
  if (filters?.assigneeEmail) {
    const u = await prisma.user.findUnique({
      where: { email: filters.assigneeEmail.toLowerCase() },
    });
    if (!u) return { error: "Assignee email not found." as const };
    assigneeId = u.id;
  }

  const issues = await prisma.task.findMany({
    where: {
      projectId: project.id,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.sprintId === null
        ? { sprintId: null }
        : filters?.sprintId
          ? { sprintId: filters.sprintId }
          : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(filters?.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { issueKey: { contains: filters.q.toUpperCase() } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      issueKey: true,
      title: true,
      issueType: true,
      status: true,
      severity: true,
      storyPoints: true,
      sprintId: true,
      assignee: { select: { id: true, name: true, email: true } },
      dueDate: true,
    },
  });

  return { project: { id: project.id, key: project.key, name: project.name }, issues };
}

export async function createIssue(
  actor: ApiActor,
  projectIdOrKey: string,
  input: {
    title: string;
    description?: string;
    issueType?: IssueType;
    severity?: TaskSeverity;
    status?: TaskStatus;
    storyPoints?: number | null;
    assigneeEmail?: string | null;
    sprintId?: string | null;
  },
) {
  if (!hasMinRole(actor.role, "MEMBER")) {
    return { error: "Requires MEMBER or higher." as const };
  }

  const project = await getProjectForActor(actor, projectIdOrKey);
  if (!project) return { error: "Project not found." as const };

  let assigneeId: string | null = null;
  if (input.assigneeEmail) {
    const u = await prisma.user.findUnique({
      where: { email: input.assigneeEmail.toLowerCase() },
    });
    if (!u) return { error: "Assignee email not found." as const };
    const onProject = await prisma.projectMember.count({ where: { projectId: project.id } });
    if (onProject > 0) {
      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: u.id } },
      });
      if (!pm) return { error: "Assignee must be a project member." as const };
    } else {
      const om = await prisma.orgMember.findUnique({
        where: {
          organizationId_userId: { organizationId: actor.organizationId, userId: u.id },
        },
      });
      if (!om) return { error: "Assignee is not in your organization." as const };
    }
    assigneeId = u.id;
  }

  if (input.sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: input.sprintId, projectId: project.id },
    });
    if (!sprint) return { error: "Sprint not found on this project." as const };
  }

  const issueType = input.issueType ?? "TASK";
  const status =
    issueType === "EPIC" ? "BACKLOG" : (input.status ?? (input.sprintId ? "TODO" : "BACKLOG"));
  const count = await prisma.task.count({ where: { projectId: project.id } });
  const issueKey = await nextIssueKey(project.id);

  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      issueKey,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      issueType,
      severity: input.severity ?? "MEDIUM",
      status,
      durationDays: issueType === "EPIC" ? 0 : 1,
      storyPoints: input.storyPoints ?? null,
      assigneeId,
      sprintId: issueType === "EPIC" ? null : (input.sprintId ?? null),
      createdById: actor.userId,
      sortOrder: count,
      boardOrder: count,
      activities: {
        create: {
          actorId: actor.userId,
          action: "CREATED",
          message: `Created ${issueKey} via MCP/API`,
        },
      },
    },
    select: {
      id: true,
      issueKey: true,
      title: true,
      issueType: true,
      status: true,
      severity: true,
      storyPoints: true,
      sprintId: true,
      assigneeId: true,
    },
  });

  return { issue: task };
}

export async function updateIssue(
  actor: ApiActor,
  issueKeyOrId: string,
  input: {
    status?: TaskStatus;
    severity?: TaskSeverity;
    title?: string;
    storyPoints?: number | null;
    assigneeEmail?: string | null;
    sprintId?: string | null;
  },
) {
  if (!hasMinRole(actor.role, "MEMBER")) {
    return { error: "Requires MEMBER or higher." as const };
  }

  const existing = await prisma.task.findFirst({
    where: {
      OR: [{ id: issueKeyOrId }, { issueKey: issueKeyOrId.toUpperCase() }],
      project: { organizationId: actor.organizationId },
    },
    include: { project: { select: { id: true, key: true } } },
  });
  if (!existing) return { error: "Issue not found." as const };

  let assigneeId: string | null | undefined = undefined;
  if (input.assigneeEmail === null) {
    assigneeId = null;
  } else if (input.assigneeEmail) {
    const u = await prisma.user.findUnique({
      where: { email: input.assigneeEmail.toLowerCase() },
    });
    if (!u) return { error: "Assignee email not found." as const };
    assigneeId = u.id;
  }

  if (input.sprintId !== undefined && input.sprintId !== null) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: input.sprintId, projectId: existing.projectId },
    });
    if (!sprint) return { error: "Sprint not found on this project." as const };
  }

  const nextStatus =
    input.sprintId && existing.status === "BACKLOG" ? ("TODO" as TaskStatus) : input.status;

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(input.storyPoints !== undefined ? { storyPoints: input.storyPoints } : {}),
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      ...(input.sprintId !== undefined ? { sprintId: input.sprintId } : {}),
      activities: {
        create: {
          actorId: actor.userId,
          action: nextStatus ? "STATUS_CHANGED" : "UPDATED",
          message: `Updated ${existing.issueKey} via MCP/API`,
        },
      },
    },
    select: {
      id: true,
      issueKey: true,
      title: true,
      status: true,
      severity: true,
      storyPoints: true,
      sprintId: true,
      assignee: { select: { email: true, name: true } },
    },
  });

  return { issue: task };
}

export async function listSprints(actor: ApiActor, projectIdOrKey: string) {
  const project = await getProjectForActor(actor, projectIdOrKey);
  if (!project) return { error: "Project not found." as const };

  const sprints = await prisma.sprint.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      goal: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: { select: { tasks: true } },
    },
  });

  return { project: { id: project.id, key: project.key, name: project.name }, sprints };
}

export async function createSprint(
  actor: ApiActor,
  projectIdOrKey: string,
  input: { name: string; goal?: string; startDate?: string | null; endDate?: string | null },
) {
  if (!hasMinRole(actor.role, "PM")) {
    return { error: "Requires PM or higher." as const };
  }
  const project = await getProjectForActor(actor, projectIdOrKey);
  if (!project) return { error: "Project not found." as const };

  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: input.name.trim(),
      goal: input.goal?.trim() || null,
      status: "PLANNED",
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
    select: {
      id: true,
      name: true,
      goal: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  return { sprint };
}

export async function setSprintStatus(
  actor: ApiActor,
  sprintId: string,
  status: Extract<SprintStatus, "ACTIVE" | "CLOSED">,
) {
  if (!hasMinRole(actor.role, "PM")) {
    return { error: "Requires PM or higher." as const };
  }

  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, project: { organizationId: actor.organizationId } },
  });
  if (!sprint) return { error: "Sprint not found." as const };

  if (status === "ACTIVE") {
    await prisma.sprint.updateMany({
      where: { projectId: sprint.projectId, status: "ACTIVE" },
      data: { status: "CLOSED" },
    });
  }

  const updated = await prisma.sprint.update({
    where: { id: sprint.id },
    data: { status },
    select: { id: true, name: true, status: true, projectId: true },
  });

  return { sprint: updated };
}

export async function myWork(actor: ApiActor) {
  const assigned = await prisma.task.findMany({
    where: {
      assigneeId: actor.userId,
      project: { organizationId: actor.organizationId },
      status: { not: "DONE" },
    },
    orderBy: [{ severity: "asc" }, { dueDate: "asc" }],
    take: 50,
    select: {
      issueKey: true,
      title: true,
      status: true,
      severity: true,
      storyPoints: true,
      project: { select: { key: true, name: true } },
      sprint: { select: { name: true, status: true } },
    },
  });
  return { actor: { email: actor.email, role: actor.role }, assigned };
}

export function assertMinRole(actor: ApiActor, min: OrgRole) {
  return hasMinRole(actor.role, min);
}
