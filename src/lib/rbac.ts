import type { OrgRole } from "@prisma/client";

const ROLE_RANK: Record<OrgRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  PM: 3,
  ADMIN: 4,
};

export function hasMinRole(role: OrgRole, min: OrgRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function canManageProjects(role: OrgRole) {
  return hasMinRole(role, "PM");
}

export function canManageUsers(role: OrgRole) {
  return hasMinRole(role, "ADMIN");
}

export function canEditTasks(role: OrgRole) {
  return hasMinRole(role, "MEMBER");
}

export function canView(role: OrgRole) {
  return hasMinRole(role, "VIEWER");
}
