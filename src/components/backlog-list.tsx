"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moveIssueToSprintAction } from "@/app/actions/tasks";
import { IssueTypeBadge, SeverityBadge, StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { ListTodo } from "lucide-react";

type IssueRow = {
  id: string;
  issueKey: string;
  title: string;
  issueType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  storyPoints: number | null;
  sprintId: string | null;
  assignee: { name: string | null } | null;
};

export function BacklogList({
  projectId,
  issues,
  sprints,
}: {
  projectId: string;
  issues: IssueRow[];
  sprints: { id: string; name: string; status: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = sprints.find((s) => s.status === "ACTIVE");

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No issues in the backlog"
        description="Create stories, tasks, or bugs to start planning sprints."
        actionHref={`/projects/${projectId}/tasks`}
        actionLabel="Create an issue"
      />
    );
  }

  return (
    <div className={`relative overflow-x-auto ${pending ? "opacity-70" : ""}`}>
      {pending && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
          <span className="badge badge-ghost gap-2 bg-base-100 shadow">
            <span className="loading loading-spinner loading-xs" />
            Updating sprint…
          </span>
        </div>
      )}
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Summary</th>
            <th>Priority</th>
            <th>Status</th>
            <th>SP</th>
            <th>Assignee</th>
            <th>Sprint</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="hover">
              <td>
                <Link
                  href={`/projects/${projectId}/issues/${issue.id}`}
                  className="font-mono text-xs link link-hover"
                >
                  {issue.issueKey}
                </Link>
              </td>
              <td>
                <IssueTypeBadge type={issue.issueType} />
              </td>
              <td>
                <Link
                  href={`/projects/${projectId}/issues/${issue.id}`}
                  className="link link-hover font-medium"
                >
                  {issue.title}
                </Link>
              </td>
              <td>
                <SeverityBadge severity={issue.severity} />
              </td>
              <td>
                <StatusBadge status={issue.status} />
              </td>
              <td>{issue.storyPoints ?? "—"}</td>
              <td className="text-xs">{issue.assignee?.name ?? "Unassigned"}</td>
              <td>
                <select
                  className="select select-xs select-bordered"
                  value={issue.sprintId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    startTransition(async () => {
                      await moveIssueToSprintAction(issue.id, value);
                      router.refresh();
                    });
                  }}
                >
                  <option value="">Backlog</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.status === "ACTIVE" ? " (active)" : ""}
                    </option>
                  ))}
                </select>
                {active && !issue.sprintId && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs ml-1"
                    onClick={() => {
                      startTransition(async () => {
                        await moveIssueToSprintAction(issue.id, active.id);
                        router.refresh();
                      });
                    }}
                  >
                    + Active
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
