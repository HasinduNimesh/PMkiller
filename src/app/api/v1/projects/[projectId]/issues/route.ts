import { NextRequest } from "next/server";
import { requireApiActor, requireActorRole, jsonOk } from "@/lib/api-actor";
import { createIssue, listIssues } from "@/lib/scrum-api";
import type { TaskStatus } from "@prisma/client";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const { projectId } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") as TaskStatus | null;
  const result = await listIssues(actor, projectId, {
    status: status ?? undefined,
    sprintId: sp.has("sprintId") ? sp.get("sprintId") : undefined,
    assigneeEmail: sp.get("assigneeEmail") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  if ("error" in result) return Response.json(result, { status: 404 });
  return jsonOk(result);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const forbidden = requireActorRole(actor, "MEMBER");
  if (forbidden) return forbidden;

  const { projectId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.title || typeof body.title !== "string") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const result = await createIssue(actor, projectId, {
    title: body.title,
    description: typeof body.description === "string" ? body.description : undefined,
    issueType: body.issueType as never,
    severity: body.severity as never,
    status: body.status as never,
    storyPoints: typeof body.storyPoints === "number" ? body.storyPoints : null,
    assigneeEmail: typeof body.assigneeEmail === "string" ? body.assigneeEmail : null,
    sprintId: typeof body.sprintId === "string" ? body.sprintId : null,
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return jsonOk(result, 201);
}
