import { requireApiActor, jsonOk } from "@/lib/api-actor";
import { listProjects } from "@/lib/scrum-api";

export async function GET(req: Request) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  const projects = await listProjects(actor);
  return jsonOk({ organization: actor.organizationName, projects });
}
