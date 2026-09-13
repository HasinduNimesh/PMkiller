"use client";

import Link from "next/link";
import { Settings, UserRound } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

type Props = {
  name: string | null | undefined;
  email: string | null | undefined;
  role: string;
  image?: string | null;
};

export function UserMenu({ name, email, role, image }: Props) {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-base-100/60 py-1.5 pl-3 pr-1.5 backdrop-blur-md shadow-[0_0_20px_color-mix(in_oklab,var(--color-primary)_12%,transparent)]"
      >
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold leading-tight">{name}</div>
          <div className="text-[11px] uppercase tracking-wide text-base-content/45">{role}</div>
        </div>
        <UserAvatar name={name} image={image} size={36} />
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content z-50 mt-2 w-56 rounded-2xl border border-primary/15 bg-base-100/95 p-2 shadow-xl backdrop-blur-xl"
      >
        <li className="menu-title px-3 py-1">
          <span className="truncate text-xs font-normal normal-case text-base-content/55">
            {email}
          </span>
        </li>
        <li>
          <Link href="/settings/profile" className="rounded-xl">
            <UserRound className="h-4 w-4 opacity-70" />
            Edit profile
          </Link>
        </li>
        <li>
          <Link href="/settings/profile" className="rounded-xl">
            <Settings className="h-4 w-4 opacity-70" />
            Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}
