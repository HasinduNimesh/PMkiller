"use server";

import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const MAX_AVATAR_CHARS = 350_000; // ~260KB base64

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional().or(z.literal("")),
  clearImage: z.boolean().optional(),
});

function isAllowedDataUrl(value: string) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(value);
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    currentPassword: String(formData.get("currentPassword") || "") || undefined,
    newPassword: String(formData.get("newPassword") || ""),
    clearImage: formData.get("clearImage") === "1",
  });

  if (!parsed.success) {
    return { error: "Check your name (min 2 chars) and password fields." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found." };

  const data: {
    name: string;
    passwordHash?: string;
    passwordChangedAt?: Date;
    image?: string | null;
  } = {
    name: parsed.data.name.trim(),
  };

  const newPassword = parsed.data.newPassword?.trim();
  if (newPassword) {
    if (!parsed.data.currentPassword) {
      return { error: "Enter your current password to set a new one." };
    }
    const ok = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect." };
    data.passwordHash = await hash(newPassword, 10);
    data.passwordChangedAt = new Date();
  }

  const imageRaw = formData.get("imageData");
  if (parsed.data.clearImage) {
    data.image = null;
  } else if (typeof imageRaw === "string" && imageRaw.trim()) {
    const image = imageRaw.trim();
    if (!isAllowedDataUrl(image)) {
      return { error: "Avatar must be a PNG, JPEG, WebP, or GIF image." };
    }
    if (image.length > MAX_AVATAR_CHARS) {
      return { error: "Avatar is too large. Use a smaller image (under ~200KB)." };
    }
    data.image = image;
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  revalidatePath("/settings/profile");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    message: data.passwordChangedAt
      ? "Profile updated. Sign in again with your new password."
      : "Profile updated.",
    requireReauth: Boolean(data.passwordChangedAt),
  };
}
