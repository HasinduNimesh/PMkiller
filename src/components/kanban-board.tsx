"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import { updateTaskStatusAction } from "@/app/actions/tasks";
import { IssueTypeBadge, SeverityBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { boardStatuses } from "@/lib/validators";
import { Columns3 } from "lucide-react";

type BoardIssue = {
  id: string;
  issueKey: string;
  title: string;
  issueType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: TaskStatus;
  storyPoints: number | null;
  assignee: { name: string | null } | null;
};

export function KanbanBoard({
  projectId,
  issues,
}: {
  projectId: string;
  issues: BoardIssue[];
}) {
  const [pending, startTransition] = useTransition();

  function onDrop(status: TaskStatus, taskId: string) {
    startTransition(async () => {
      await updateTaskStatusAction(taskId, status);
    });
  }

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={Columns3}
        title="Board is empty"
        description="Move issues out of Backlog, or create work and assign it to the active sprint."
        actionHref={`/projects/${projectId}/backlog`}
        actionLabel="Open backlog"
      />
    );
  }

  return (
    <div className={`relative grid gap-3 lg:grid-cols-5 ${pending ? "opacity-70" : ""}`}>
      {pending && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-base-300/60 bg-base-100 px-3 py-1.5 text-xs shadow-sm">
            <span className="loading loading-spinner loading-xs" />
            Updating…
          </span>
        </div>
      )}
      {boardStatuses.map((status) => {
        const column = issues.filter((i) => i.status === status);
        return (
          <div
            key={status}
            className="kanban-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              if (taskId) onDrop(status, taskId);
            }}
          >
            <div className="mb-2.5 flex items-center justify-between px-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-base-content/50">
                {status.replaceAll("_", " ")}
              </h3>
              <span className="rounded-full bg-base-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-base-content/55">
                {column.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col space-y-2">
              {column.length === 0 ? (
                <div className="flex min-h-36 flex-1 items-center justify-center rounded-xl border border-dashed border-base-300/70 px-2 text-center text-[11px] leading-snug text-base-content/35">
                  Drop cards here
                </div>
              ) : (
                column.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task-id", issue.id)}
                    className="kanban-card cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/projects/${projectId}/issues/${issue.id}`}
                        className="font-mono text-[11px] text-base-content/45 link link-hover"
                      >
                        {issue.issueKey}
                      </Link>
                      <IssueTypeBadge type={issue.issueType} />
                    </div>
                    <Link
                      href={`/projects/${projectId}/issues/${issue.id}`}
                      className="mt-2 block text-sm font-semibold leading-snug link link-hover"
                    >
                      {issue.title}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <div className="flex items-center gap-1.5 text-[11px] text-base-content/50">
                        {issue.storyPoints != null && (
                          <span className="rounded-md bg-base-200 px-1.5 py-0.5 font-medium tabular-nums">
                            {issue.storyPoints} sp
                          </span>
                        )}
                        <span>{issue.assignee?.name?.split(" ")[0] ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
