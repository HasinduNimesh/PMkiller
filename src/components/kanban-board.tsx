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
          <span className="badge badge-ghost gap-2 bg-base-100 shadow">
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
            className="rounded-box bg-base-200/70 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              if (taskId) onDrop(status, taskId);
            }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide opacity-70">
                {status.replaceAll("_", " ")}
              </h3>
              <span className="badge badge-sm">{column.length}</span>
            </div>
            <div className="min-h-40 space-y-2">
              {column.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center rounded-box border border-dashed border-base-300 px-2 text-center text-[11px] leading-snug text-base-content/40">
                  Drop cards here
                </div>
              ) : (
                column.map((issue) => (
                  <div
                    key={issue.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task-id", issue.id)}
                    className="card cursor-grab bg-base-100 shadow-sm active:cursor-grabbing"
                  >
                    <div className="card-body gap-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/projects/${projectId}/issues/${issue.id}`}
                          className="font-mono text-xs link link-hover opacity-60"
                        >
                          {issue.issueKey}
                        </Link>
                        <IssueTypeBadge type={issue.issueType} />
                      </div>
                      <Link
                        href={`/projects/${projectId}/issues/${issue.id}`}
                        className="text-sm font-medium leading-snug link link-hover"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={issue.severity} />
                        <div className="flex items-center gap-1 text-xs opacity-60">
                          {issue.storyPoints != null && <span>{issue.storyPoints} sp</span>}
                          <span>{issue.assignee?.name?.split(" ")[0] ?? "—"}</span>
                        </div>
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
