"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addCommentAction } from "@/app/actions/tasks";

export function CommentForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 flex w-full gap-2 border-t border-base-200 pt-3"
      action={(fd) => {
        startTransition(async () => {
          await addCommentAction(taskId, fd);
          router.refresh();
        });
      }}
    >
      <input
        name="body"
        required
        placeholder="Add a comment…"
        className="input input-sm w-full"
      />
      <button type="submit" disabled={pending} className="btn btn-sm">
        {pending ? <span className="loading loading-spinner loading-xs" /> : "Post"}
      </button>
    </form>
  );
}
