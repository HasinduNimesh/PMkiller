"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/session";
import { projectKeyFromName, projectSchema } from "@/lib/validators";
import { canManageProjects } from "@/lib/rbac";
import { wouldRemoveLastAdmin } from "@/lib/org-guards";

export async function createProjectAction(formData: FormData) {
  const session = await requireRole("PM");
  const rawKey = String(formData.get("key") || "").toUpperCase().trim();
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    key: rawKey || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || "PLANNING",
    startDate: formData.get("startDate"),
    deadline: formData.get("deadline"),
  });

  if (!parsed.success) return { error: "Invalid project data (check name/key/dates)." };

  let key = parsed.data.key || projectKeyFromName(parsed.data.name);
  const existing = await prisma.project.findFirst({
    where: { organizationId: session.user.organizationId, key },
  });
  if (existing) key = `${key}${Date.now().toString(36).slice(-2).toUpperCase()}`.slice(0, 10);

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      key,
      description: parsed.data.description,
      status: parsed.data.status,
      startDate: new Date(parsed.data.startDate),
      deadline: new Date(parsed.data.deadline),
      organizationId: session.user.organizationId,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
      labels: {
        create: [
          { name: "frontend", color: "#06b6d4" },
          { name: "backend", color: "#8b5cf6" },
          { name: "urgent", color: "#ef4444" },
        ],
      },
      components: {
        create: [
          { name: "Web App", description: "Main product UI" },
          { name: "API", description: "Backend services" },
        ],
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { id: project.id };
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || project.status,
    startDate: formData.get("startDate"),
    deadline: formData.get("deadline"),
  });
  if (!parsed.success) return { error: "Invalid project data." };

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      startDate: new Date(parsed.data.startDate),
      deadline: new Date(parsed.data.deadline),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteProjectAction(projectId: string) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function listOrgMembersAction() {
  const session = await requireSession();
  return prisma.orgMember.findMany({
    where: { organizationId: session.user.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateMemberRoleAction(userId: string, role: string) {
  const session = await requireRole("ADMIN");
  if (!["ADMIN", "PM", "MEMBER", "VIEWER"].includes(role)) {
    return { error: "Invalid role." };
  }
  if (userId === session.user.id && role !== "ADMIN") {
    return { error: "You cannot demote yourself." };
  }

  const member = await prisma.orgMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId,
      },
    },
  });
  if (!member) return { error: "Member not found." };

  const nextRole = role as "ADMIN" | "PM" | "MEMBER" | "VIEWER";
  if (member.role === "ADMIN" && nextRole !== "ADMIN") {
    const adminCount = await prisma.orgMember.count({
      where: { organizationId: session.user.organizationId, role: "ADMIN" },
    });
    if (wouldRemoveLastAdmin({ memberRole: member.role, adminCount, nextRole })) {
      return { error: "Cannot demote the last admin." };
    }
  }

  await prisma.orgMember.update({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId,
      },
    },
    data: { role: nextRole },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function addProjectMemberAction(projectId: string, formData: FormData) {
  const session = await requireRole("PM");
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) return { error: "Select a user to add." };

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const orgMember = await prisma.orgMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId,
      },
    },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!orgMember) {
    return { error: "User must belong to your organization first." };
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) return { error: "Already a project member." };

  await prisma.projectMember.create({
    data: { projectId, userId },
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
  return {
    ok: true,
    message: `Added ${orgMember.user.name ?? orgMember.user.email} to the project.`,
  };
}

export async function removeProjectMemberAction(projectId: string, userId: string) {
  const session = await requireRole("PM");
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.user.organizationId },
  });
  if (!project) return { error: "Project not found." };

  if (userId === project.ownerId) {
    return { error: "Cannot remove the project owner." };
  }

  await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export { canManageProjects };
