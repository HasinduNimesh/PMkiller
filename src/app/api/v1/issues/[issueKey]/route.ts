import { NextRequest } from "next/server";
import { requireApiActor, requireActorRole, jsonOk } from "@/lib/api-actor";
import { updateIssue } from "@/lib/scrum-api";

type Ctx = { params: Promise<{ issueKey: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const forbidden = requireActorRole(actor, "MEMBER");
  if (forbidden) return forbidden;

  const { issueKey } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "JSON body required" }, { status: 400 });

  const result = await updateIssue(actor, decodeURIComponent(issueKey), {
    status: body.status as never,
    severity: body.severity as never,
    title: typeof body.title === "string" ? body.title : undefined,
    storyPoints: typeof body.storyPoints === "number" ? body.storyPoints : body.storyPoints === null ? null : undefined,
    assigneeEmail:
      body.assigneeEmail === null
        ? null
        : typeof body.assigneeEmail === "string"
          ? body.assigneeEmail
          : undefined,
    sprintId:
      body.sprintId === null
        ? null
        : typeof body.sprintId === "string"
          ? body.sprintId
          : undefined,
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return jsonOk(result);
}
