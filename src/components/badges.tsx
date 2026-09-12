import { cn } from "@/lib/utils";

const severityClass = {
  CRITICAL: "bg-error/15 text-error",
  HIGH: "bg-warning/15 text-warning",
  MEDIUM: "bg-info/15 text-info",
  LOW: "bg-base-200 text-base-content/60",
} as const;

const statusClass: Record<string, string> = {
  BACKLOG: "bg-base-200 text-base-content/60",
  TODO: "bg-base-300/70 text-base-content/70",
  IN_PROGRESS: "bg-primary/15 text-primary",
  IN_REVIEW: "bg-secondary/15 text-secondary",
  BLOCKED: "bg-error/15 text-error",
  DONE: "bg-success/15 text-success",
  PLANNING: "bg-secondary/15 text-secondary",
  ACTIVE: "bg-primary/15 text-primary",
  ON_HOLD: "bg-warning/15 text-warning",
};

const typeClass: Record<string, string> = {
  EPIC: "bg-secondary/10 text-secondary ring-1 ring-secondary/20",
  STORY: "bg-success/10 text-success ring-1 ring-success/20",
  TASK: "bg-primary/10 text-primary ring-1 ring-primary/20",
  BUG: "bg-error/10 text-error ring-1 ring-error/20",
  SUBTASK: "bg-base-200 text-base-content/60 ring-1 ring-base-300",
};

export function SeverityBadge({ severity }: { severity: keyof typeof severityClass }) {
  return (
    <span className={cn("badge-soft rounded-full px-2", severityClass[severity])}>{severity}</span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("badge-soft rounded-full px-2", statusClass[status] ?? "bg-base-200")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function IssueTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("badge-soft rounded-full px-2", typeClass[type] ?? "bg-base-200")}>
      {type}
    </span>
  );
}
