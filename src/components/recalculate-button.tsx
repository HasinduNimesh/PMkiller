"use client";

import { useState, useTransition } from "react";
import { recalculateCpmAction } from "@/app/actions/tasks";
import { RefreshCw } from "lucide-react";

export function RecalculateButton({ projectId }: { projectId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        className="btn btn-outline btn-sm gap-1"
        onClick={() => {
          startTransition(async () => {
            const result = await recalculateCpmAction(projectId);
            if (result.error) setMsg(result.error);
            else
              setMsg(
                `CPM updated · ${result.criticalCount} critical · ${result.projectDuration}d`,
              );
          });
        }}
      >
        {pending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Recalculate CPM
      </button>
      {msg && <span className="max-w-[240px] text-right text-xs text-base-content/50">{msg}</span>}
    </div>
  );
}
