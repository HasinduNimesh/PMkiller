"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import {
  appUrl,
  isEmailConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { consumeEmailToken, createEmailToken } from "@/lib/email-tokens";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validators";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "org"
  );
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (user && !user.emailVerified) {
    return {
      error: "Please verify your email before signing in. Check your inbox for the link.",
      needsVerification: true as const,
      email,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return { error: "Please fill all fields correctly (password min 6 chars)." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hash(parsed.data.password, 10);
  let slug = slugify(parsed.data.organizationName);
  const slugTaken = await prisma.organization.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

  // Without Resend configured (local), auto-verify so signup still works.
  const autoVerify = !isEmailConfigured();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        emailVerified: autoVerify ? new Date() : null,
      },
    });

    const org = await tx.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug,
      },
    });

    await tx.orgMember.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });
  });

  if (!autoVerify) {
    const { rawToken } = await createEmailToken("email-verify", email);
    const verifyUrl = appUrl(
      `/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`,
    );
    await sendVerificationEmail(email, parsed.data.name, verifyUrl);
    redirect(`/check-email?email=${encodeURIComponent(email)}`);
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign-in failed. Try logging in." };
    }
    throw error;
  }
}

export async function resendVerificationAction(formData: FormData) {
  const emailRaw = String(formData.get("email") || "").toLowerCase().trim();
  if (!emailRaw.includes("@")) {
    return { error: "Enter a valid email." };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailRaw },
    select: { name: true, emailVerified: true },
  });

  // Always succeed to avoid email enumeration
  if (!user || user.emailVerified) {
    return { ok: true as const, message: "If that account needs verification, we sent a new link." };
  }

  if (!isEmailConfigured()) {
    return { error: "Email delivery is not configured (missing RESEND_API_KEY)." };
  }

  const { rawToken } = await createEmailToken("email-verify", emailRaw);
  const verifyUrl = appUrl(
    `/verify-email?email=${encodeURIComponent(emailRaw)}&token=${encodeURIComponent(rawToken)}`,
  );
  await sendVerificationEmail(emailRaw, user.name, verifyUrl);
  return { ok: true as const, message: "If that account needs verification, we sent a new link." };
}

export async function verifyEmailAction(email: string, token: string) {
  const normalized = email.toLowerCase().trim();
  const consumed = await consumeEmailToken("email-verify", normalized, token);
  if (!consumed.ok) return consumed;

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return { ok: false as const, error: "Account not found." };

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  return { ok: true as const };
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email." };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true },
  });

  // Always same response (no enumeration)
  if (user) {
    const { rawToken } = await createEmailToken("password-reset", email);
    const resetUrl = appUrl(
      `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(rawToken)}`,
    );
    await sendPasswordResetEmail(email, user.name, resetUrl);
  }

  return {
    ok: true as const,
    message: "If an account exists for that email, we sent a reset link.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid reset form (password min 6 chars)." };
  }

  const email = parsed.data.email.toLowerCase();
  const consumed = await consumeEmailToken("password-reset", email, parsed.data.token);
  if (!consumed.ok) return { error: consumed.error };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Account not found." };

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Completing reset proves mailbox access
      emailVerified: user.emailVerified ?? new Date(),
    },
  });

  return { ok: true as const };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
