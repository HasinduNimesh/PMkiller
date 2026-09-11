"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { sprintSchema } from "@/lib/validators";

function revalidateAgile(projectId: string) {
  revalidatePath(`/projects/${projectId}/backlog`);
  revalidatePath(`/projects/${projectId}/board`);
  revalidatePath(`/projects/${projectId}`);
}

export async function createSprintAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const parsed = sprintSchema.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal") || undefined,
    startDate: formData.get("startDate") || null,
    endDate: formData.get("endDate") || null,
  });
  if (!parsed.success) return { error: "Invalid sprint data." };

  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name: parsed.data.name,
      goal: parsed.data.goal,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  revalidateAgile(projectId);
  return { id: sprint.id };
}

export async function startSprintAction(sprintId: string) {
  const session = await requireRole("PM");
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, project: { organizationId: session.user.organizationId } },
    include: { project: true },
  });
  if (!sprint) return { error: "Sprint not found." };

  const previousActive = await prisma.sprint.findMany({
    where: {
      projectId: sprint.projectId,
      status: "ACTIVE",
      id: { not: sprintId },
    },
    select: { id: true },
  });
  const previousIds = previousActive.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    if (previousIds.length) {
      await tx.task.updateMany({
        where: {
          sprintId: { in: previousIds },
          status: { not: "DONE" },
        },
        data: { sprintId: null, status: "BACKLOG" },
      });
      await tx.sprint.updateMany({
        where: { id: { in: previousIds } },
        data: { status: "CLOSED", endDate: new Date() },
      });
    }
    await tx.sprint.update({
      where: { id: sprintId },
      data: {
        status: "ACTIVE",
        startDate: sprint.startDate ?? new Date(),
      },
    });
    await tx.task.updateMany({
      where: { sprintId, status: "BACKLOG" },
      data: { status: "TODO" },
    });
  });

  revalidateAgile(sprint.projectId);
  return { ok: true };
}

export async function completeSprintAction(sprintId: string) {
  const session = await requireRole("PM");
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, project: { organizationId: session.user.organizationId } },
  });
  if (!sprint) return { error: "Sprint not found." };

  await prisma.$transaction([
    prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "CLOSED", endDate: sprint.endDate ?? new Date() },
    }),
    prisma.task.updateMany({
      where: { sprintId, status: { not: "DONE" } },
      data: { sprintId: null, status: "BACKLOG" },
    }),
  ]);

  revalidateAgile(sprint.projectId);
  return { ok: true };
}

export async function createLabelAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  if (!name) return { error: "Label name required." };

  await prisma.label.create({ data: { projectId, name, color } });
  revalidatePath(`/projects/${projectId}/settings`);
  revalidateAgile(projectId);
  return { ok: true };
}

export async function createComponentAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Component name required." };

  await prisma.component.create({
    data: {
      projectId,
      name,
      description: String(formData.get("description") || "") || null,
    },
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}

export async function createVersionAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Version name required." };
  const releaseDate = formData.get("releaseDate");

  await prisma.version.create({
    data: {
      projectId,
      name,
      description: String(formData.get("description") || "") || null,
      releaseDate: releaseDate ? new Date(String(releaseDate)) : null,
    },
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true };
}
