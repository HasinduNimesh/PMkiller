import { requireApiActor, requireActorRole, jsonOk } from "@/lib/api-actor";
import { resetProjectPlanning } from "@/lib/scrum-api";

type Ctx = { params: Promise<{ projectId: string }> };

/** Remove all issues and sprints for a project (keeps the project shell). PM+ only. */
export async function POST(_req: Request, ctx: Ctx) {
  const actor = await requireApiActor(_req);
  if (actor instanceof Response) return actor;
  const forbidden = requireActorRole(actor, "PM");
  if (forbidden) return forbidden;

  const { projectId } = await ctx.params;
  const result = await resetProjectPlanning(actor, projectId);
  if ("error" in result) return Response.json(result, { status: 400 });
  return jsonOk(result);
}
