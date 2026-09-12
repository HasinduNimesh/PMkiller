"use server";

import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { wouldRemoveLastAdmin } from "@/lib/org-guards";
import { appUrl, sendInviteEmail } from "@/lib/email";
import { createEmailToken } from "@/lib/email-tokens";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "PM", "MEMBER", "VIEWER"]).default("MEMBER"),
  password: z.string().optional(),
});

export async function inviteUserAction(formData: FormData) {
  const session = await requireRole("ADMIN");
  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
    password: formData.get("password") || "",
  });

  if (!parsed.success) {
    return { error: "Fill name, valid email, and role." };
  }

  const email = parsed.data.email.toLowerCase();
  const orgId = session.user.organizationId;
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const already = await prisma.orgMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: existing.id },
      },
    });
    if (already) {
      return { error: "This user is already in your organization." };
    }

    // JWT/session only carries one org (oldest membership). Adding a second org
    // would create a membership the user cannot access after login.
    const otherOrg = await prisma.orgMember.findFirst({
      where: { userId: existing.id },
    });
    if (otherOrg) {
      return {
        error:
          "This email already belongs to another organization. Multi-org accounts are not supported yet.",
      };
    }

    await prisma.orgMember.create({
      data: {
        organizationId: orgId,
        userId: existing.id,
        role: parsed.data.role,
      },
    });

    const { rawToken } = await createEmailToken("password-reset", email);
    const setupUrl = appUrl(
      `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`,
    );
    await sendInviteEmail({
      to: email,
      name: existing.name ?? parsed.data.name,
      orgName: org?.name ?? "your organization",
      role: parsed.data.role,
      invitedBy: session.user.name || session.user.email || "An admin",
      setupUrl,
    });

    revalidatePath("/admin/users");
    return {
      ok: true,
      message: `Added ${email} as ${parsed.data.role} and emailed an invite.`,
    };
  }

  const provided = parsed.data.password?.trim();
  const tempPassword = provided && provided.length >= 6 ? provided : randomBytes(9).toString("base64url");
  const passwordHash = await hash(tempPassword, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        // Admin-trusted invite — mailbox is confirmed via the setup link email.
        emailVerified: new Date(),
      },
    });
    await tx.orgMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: parsed.data.role,
      },
    });
  });

  const { rawToken } = await createEmailToken("password-reset", email);
  const setupUrl = appUrl(
    `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`,
  );
  await sendInviteEmail({
    to: email,
    name: parsed.data.name,
    orgName: org?.name ?? "your organization",
    role: parsed.data.role,
    invitedBy: session.user.name || session.user.email || "An admin",
    setupUrl,
  });

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: `Created ${email} as ${parsed.data.role} and emailed a set-password link.`,
  };
}

export async function removeMemberAction(userId: string) {
  const session = await requireRole("ADMIN");
  if (userId === session.user.id) {
    return { error: "You cannot remove yourself." };
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

  if (member.role === "ADMIN") {
    const adminCount = await prisma.orgMember.count({
      where: { organizationId: session.user.organizationId, role: "ADMIN" },
    });
    if (wouldRemoveLastAdmin({ memberRole: member.role, adminCount, nextRole: null })) {
      return { error: "Cannot remove the last admin." };
    }
  }

  await prisma.orgMember.delete({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId,
      },
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
