import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { burndownProgress } from "@/lib/burndown";
import { Flame } from "lucide-react";

export type SprintBurndownData = {
  projectId: string;
  projectName: string;
  projectKey: string;
  sprintId: string;
  sprintName: string;
  startDate: Date | null;
  endDate: Date | null;
  totalPoints: number;
  donePoints: number;
  remainingPoints: number;
  totalIssues: number;
  doneIssues: number;
};

function BurndownChart({ sprint }: { sprint: SprintBurndownData }) {
  const progress = burndownProgress(sprint);
  if (!progress) return null;

  const w = 240;
  const h = 72;
  const pad = 6;
  const x0 = pad;
  const y0 = pad;
  const x1 = w - pad;
  const y1 = h - pad;
  const toX = (t: number) => x0 + t * (x1 - x0);
  const toY = (r: number) => y0 + r * (y1 - y0);
  const cx = toX(progress.progressX);
  const cy = toY(progress.remainingY);

  return (
    <div className="rounded-box bg-base-200/60 px-2 py-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-16 w-full"
        role="img"
        aria-label="Sprint burndown: ideal line versus remaining story points"
      >
        <line
          x1={toX(0)}
          y1={toY(1)}
          x2={toX(1)}
          y2={toY(0)}
          className="stroke-base-content/25"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <line
          x1={toX(0)}
          y1={toY(1)}
          x2={cx}
          y2={cy}
          className={progress.ahead ? "stroke-success" : "stroke-warning"}
          strokeWidth="2"
        />
        <circle
          cx={cx}
          cy={cy}
          r="3.5"
          className={progress.ahead ? "fill-success" : "fill-warning"}
        />
      </svg>
      <p className="px-1 text-[10px] opacity-50">
        Ideal (dashed) · remaining now ({progress.ahead ? "on/ahead" : "behind"})
      </p>
    </div>
  );
}

export function SprintBurndownCard({ sprint }: { sprint: SprintBurndownData }) {
  const pct =
    sprint.totalPoints > 0
      ? Math.min(100, Math.round((sprint.donePoints / sprint.totalPoints) * 100))
      : sprint.totalIssues > 0
        ? Math.round((sprint.doneIssues / sprint.totalIssues) * 100)
        : 0;

  const daysLeft =
    sprint.endDate != null
      ? Math.ceil((sprint.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  return (
    <div className="card border border-primary/20 bg-base-100 shadow">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <h2 className="card-title text-base">Active sprint</h2>
            </div>
            <p className="mt-1 text-sm">
              <Link
                href={`/projects/${sprint.projectId}/board`}
                className="link link-hover font-medium"
              >
                {sprint.sprintName}
              </Link>
              <span className="opacity-60"> · {sprint.projectName}</span>
            </p>
            <p className="text-xs opacity-50">
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
              {daysLeft != null && (
                <>
                  {" · "}
                  {daysLeft < 0
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                      ? "ends today"
                      : `${daysLeft}d left`}
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold tabular-nums">{pct}%</div>
            <div className="text-[11px] opacity-50">complete</div>
          </div>
        </div>

        <BurndownChart sprint={sprint} />

        <progress className="progress progress-primary w-full" value={pct} max={100} />

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-box bg-base-200/80 px-2 py-2">
            <div className="font-semibold tabular-nums">{sprint.donePoints}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-50">Done SP</div>
          </div>
          <div className="rounded-box bg-base-200/80 px-2 py-2">
            <div className="font-semibold tabular-nums">{sprint.remainingPoints}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-50">Remaining</div>
          </div>
          <div className="rounded-box bg-base-200/80 px-2 py-2">
            <div className="font-semibold tabular-nums">{sprint.totalPoints || "—"}</div>
            <div className="text-[10px] uppercase tracking-wide opacity-50">Committed</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs opacity-60">
          <span>
            {sprint.doneIssues}/{sprint.totalIssues} issues done
          </span>
          <Link href={`/projects/${sprint.projectId}/backlog`} className="link link-hover">
            Open backlog
          </Link>
        </div>
      </div>
    </div>
  );
}
