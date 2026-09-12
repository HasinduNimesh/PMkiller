import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(20),
  password: z.string().min(6),
});

export const projectSchema = z.object({
  name: z.string().min(2),
  key: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z][A-Z0-9]+$/, "Key must be uppercase letters/numbers")
    .optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "DONE"]).default("PLANNING"),
  startDate: z.string(),
  deadline: z.string(),
});

export const issueTypes = ["EPIC", "STORY", "TASK", "BUG", "SUBTASK"] as const;
export const taskStatuses = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
] as const;
export const boardStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"] as const;

export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  issueType: z.enum(issueTypes).default("TASK"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(taskStatuses).default("BACKLOG"),
  durationDays: z.coerce.number().min(0).default(1),
  storyPoints: z.coerce.number().min(0).optional().nullable(),
  originalEstimate: z.coerce.number().min(0).optional().nullable(),
  isMilestone: z.coerce.boolean().optional().default(false),
  environment: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  fixVersionId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional().default([]),
  componentIds: z.array(z.string()).optional().default([]),
  predecessorIds: z.array(z.string()).optional().default([]),
});

export const sprintSchema = z.object({
  name: z.string().min(2),
  goal: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const commentSchema = z.object({
  body: z.string().min(1),
});

export const memberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "PM", "MEMBER", "VIEWER"]),
});

export function projectKeyFromName(name: string) {
  const letters = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("");
  const fallback = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return (letters || fallback || "PRJ").slice(0, 6);
}
