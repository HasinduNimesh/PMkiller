"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ListTodo,
  Puzzle,
  Settings,
} from "lucide-react";

export function SidebarNav({ canManageUsers }: { canManageUsers: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/my-work", label: "My work", icon: ListTodo },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/integrations", label: "Integrations", icon: Puzzle },
    { href: "/settings/profile", label: "Settings", icon: Settings },
    ...(canManageUsers
      ? [{ href: "/admin/users", label: "Users & roles", icon: Users }]
      : []),
  ];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
          >
            <Icon className="h-4 w-4 opacity-70" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
