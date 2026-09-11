import type { OrgRole } from "@prisma/client";
import { taskStatuses } from "@/lib/validators";

/** Block removing/demoting the last remaining ADMIN in an org. */
export function wouldRemoveLastAdmin(params: {
  memberRole: OrgRole;
  adminCount: number;
  nextRole?: OrgRole | null;
}): boolean {
  if (params.memberRole !== "ADMIN") return false;
  if (params.adminCount > 1) return false;
  // demote away from ADMIN, or remove entirely
  if (params.nextRole == null || params.nextRole !== "ADMIN") return true;
  return false;
}

export function isTaskStatus(value: string): value is (typeof taskStatuses)[number] {
  return (taskStatuses as readonly string[]).includes(value);
}

const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export function isTaskSeverity(value: string): value is (typeof severities)[number] {
  return (severities as readonly string[]).includes(value);
}
