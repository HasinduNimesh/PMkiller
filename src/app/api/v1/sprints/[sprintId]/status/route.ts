import { NextRequest } from "next/server";
import { requireApiActor, requireActorRole, jsonOk } from "@/lib/api-actor";
import { setSprintStatus } from "@/lib/scrum-api";

type Ctx = { params: Promise<{ sprintId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const forbidden = requireActorRole(actor, "PM");
  if (forbidden) return forbidden;

  const { sprintId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  const status = body.status === "CLOSED" ? "CLOSED" : body.status === "ACTIVE" ? "ACTIVE" : null;
  if (!status) {
    return Response.json({ error: 'status must be "ACTIVE" or "CLOSED"' }, { status: 400 });
  }

  const result = await setSprintStatus(actor, sprintId, status);
  if ("error" in result) return Response.json(result, { status: 400 });
  return jsonOk(result);
}
