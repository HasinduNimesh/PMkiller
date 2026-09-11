"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateMemberRoleAction } from "@/app/actions/projects";

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={disabled || pending}
      className="select select-bordered select-sm"
      onChange={(e) => {
        const next = e.target.value;
        const previous = role;
        startTransition(async () => {
          const result = await updateMemberRoleAction(userId, next);
          if (result.error) {
            e.target.value = previous;
            window.alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <option value="ADMIN">Admin</option>
      <option value="PM">PM</option>
      <option value="MEMBER">Member</option>
      <option value="VIEWER">Viewer</option>
    </select>
  );
}
