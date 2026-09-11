import { cn } from "@/lib/utils";

const severityClass = {
  CRITICAL: "badge-error",
  HIGH: "badge-warning",
  MEDIUM: "badge-info",
  LOW: "badge-ghost",
} as const;

const statusClass: Record<string, string> = {
  BACKLOG: "badge-ghost",
  TODO: "badge-neutral",
  IN_PROGRESS: "badge-primary",
  IN_REVIEW: "badge-secondary",
  BLOCKED: "badge-error",
  DONE: "badge-success",
  PLANNING: "badge-secondary",
  ACTIVE: "badge-primary",
  ON_HOLD: "badge-warning",
};

const typeClass: Record<string, string> = {
  EPIC: "badge-secondary",
  STORY: "badge-success",
  TASK: "badge-primary",
  BUG: "badge-error",
  SUBTASK: "badge-ghost",
};

export function SeverityBadge({ severity }: { severity: keyof typeof severityClass }) {
  return (
    <span className={cn("badge badge-sm font-medium", severityClass[severity])}>{severity}</span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge badge-sm", statusClass[status] ?? "badge-ghost")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function IssueTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("badge badge-sm badge-outline", typeClass[type] ?? "badge-ghost")}>
      {type}
    </span>
  );
}
