import { NextRequest } from "next/server";
import { requireApiActor, requireActorRole, jsonOk } from "@/lib/api-actor";
import { createSprint, listSprints } from "@/lib/scrum-api";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const { projectId } = await ctx.params;
  const result = await listSprints(actor, projectId);
  if ("error" in result) return Response.json(result, { status: 404 });
  return jsonOk(result);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const forbidden = requireActorRole(actor, "PM");
  if (forbidden) return forbidden;

  const { projectId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.name || typeof body.name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const result = await createSprint(actor, projectId, {
    name: body.name,
    goal: typeof body.goal === "string" ? body.goal : undefined,
    startDate: typeof body.startDate === "string" ? body.startDate : null,
    endDate: typeof body.endDate === "string" ? body.endDate : null,
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return jsonOk(result, 201);
}
