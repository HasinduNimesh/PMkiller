import { requireApiActor, jsonOk } from "@/lib/api-actor";
import { myWork } from "@/lib/scrum-api";

export async function GET(req: Request) {
  const actor = await requireApiActor(req);
  if (actor instanceof Response) return actor;
  return jsonOk(await myWork(actor));
}
