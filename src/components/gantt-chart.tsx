"use client";

import { useMemo } from "react";
import { formatDate } from "@/lib/utils";

type GanttTask = {
  id: string;
  title: string;
  isCritical: boolean;
  isMilestone: boolean;
  severity: string;
  earlyStart: Date | string | null;
  earlyFinish: Date | string | null;
  slackDays: number | null;
};

export function GanttChart({
  projectStart,
  deadline,
  tasks,
  durationDays,
}: {
  projectStart: Date | string;
  deadline: Date | string;
  tasks: GanttTask[];
  durationDays: number;
}) {
  const start = useMemo(() => {
    const d = new Date(projectStart);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [projectStart]);

  const totalDays = Math.max(durationDays, 7);

  const deadlineOffset = useMemo(() => {
    const d = new Date(deadline);
    return Math.round((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [deadline, start]);

  function toOffset(date: Date | string | null) {
    if (!date) return 0;
    const d = new Date(date);
    return Math.max(0, (d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  function toWidth(from: Date | string | null, to: Date | string | null) {
    const a = toOffset(from);
    const b = toOffset(to);
    return Math.max(b - a, 0.35);
  }

  return (
    <div className="panel">
      <div className="panel-body overflow-x-auto p-4">
        <div className="mb-3 flex min-w-[720px] items-center justify-between text-xs text-base-content/50">
          <span>Start {formatDate(start)}</span>
          <span>Horizon {totalDays} days</span>
          <span>Deadline {formatDate(deadline)}</span>
        </div>

        <div className="relative mb-3 h-8 min-w-[720px] rounded-box bg-base-200">
          {deadlineOffset >= 0 && deadlineOffset <= totalDays && (
            <div
              className="tooltip tooltip-bottom absolute bottom-0 top-0 z-10 w-0.5 bg-error"
              data-tip="Deadline"
              style={{ left: `${(deadlineOffset / totalDays) * 100}%` }}
            />
          )}
          <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide opacity-40">
            Timeline — critical path in error color
          </div>
        </div>

        <ul className="min-w-[720px] space-y-2">
          {tasks.map((task) => {
            const left = (toOffset(task.earlyStart) / totalDays) * 100;
            const width = (toWidth(task.earlyStart, task.earlyFinish) / totalDays) * 100;
            return (
              <li key={task.id} className="grid grid-cols-[200px_1fr] items-center gap-3">
                <div className="truncate text-sm">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="text-[11px] opacity-50">
                    {task.isMilestone ? "Milestone" : task.severity}
                    {task.slackDays != null ? ` · slack ${task.slackDays}d` : ""}
                  </div>
                </div>
                <div className="relative h-9 rounded-box bg-base-200">
                  {task.isMilestone ? (
                    <div
                      className="tooltip absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent"
                      data-tip={task.title}
                      style={{ left: `${left}%` }}
                    />
                  ) : (
                    <div
                      className={`tooltip absolute top-2 h-5 rounded-md ${
                        task.isCritical ? "bg-error" : "bg-primary"
                      }`}
                      data-tip={`${task.title}: ${formatDate(task.earlyStart)} → ${formatDate(task.earlyFinish)}`}
                      style={{ left: `${left}%`, width: `${Math.max(width, 1.2)}%` }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
