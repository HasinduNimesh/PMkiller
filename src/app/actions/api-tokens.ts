"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { mintApiToken } from "@/lib/api-tokens";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80).default("Cursor MCP"),
});

export async function createApiTokenAction(formData: FormData) {
  const session = await requireSession();
  const parsed = createSchema.safeParse({
    name: formData.get("name") || "Cursor MCP",
  });
  if (!parsed.success) {
    return { error: "Give the token a short name." };
  }

  const { token, prefix, tokenHash } = mintApiToken();
  await prisma.apiToken.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      prefix,
      tokenHash,
    },
  });

  revalidatePath("/integrations");
  return { ok: true as const, token, prefix, name: parsed.data.name };
}

export async function revokeApiTokenAction(tokenId: string) {
  const session = await requireSession();
  const row = await prisma.apiToken.findFirst({
    where: { id: tokenId, userId: session.user.id },
  });
  if (!row) {
    return { error: "Token not found." };
  }
  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/integrations");
  return { ok: true as const };
}
