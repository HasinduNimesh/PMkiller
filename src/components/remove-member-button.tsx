"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeMemberAction } from "@/app/actions/users";

export function RemoveMemberButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-ghost btn-xs text-error"
      onClick={() => {
        if (!confirm("Remove this user from the organization?")) return;
        startTransition(async () => {
          const result = await removeMemberAction(userId);
          if (result.error) {
            window.alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      Remove
    </button>
  );
}
