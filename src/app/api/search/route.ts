import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rankIssueSearchHits } from "@/lib/search";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const orgId = session.user.organizationId;

  const results = await prisma.task.findMany({
    where: {
      project: { organizationId: orgId },
      OR: [
        { issueKey: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      issueKey: true,
      title: true,
      status: true,
      issueType: true,
      project: { select: { id: true, name: true, key: true } },
    },
    take: 24,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ results: rankIssueSearchHits(results, q).slice(0, 12) });
}
