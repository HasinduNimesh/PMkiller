import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { canManageUsers } from "@/lib/rbac";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  ListTodo,
} from "lucide-react";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col">
        <div className="navbar border-b border-base-300 bg-base-100 px-4 shadow-sm lg:hidden">
          <div className="flex-none">
            <label htmlFor="app-drawer" className="btn btn-square btn-ghost" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div className="flex-1 px-2">
            {session ? <GlobalSearch /> : (
              <Link href="/dashboard" className="font-display text-lg font-semibold">
                Proj<span className="text-primary">Manager</span>
              </Link>
            )}
          </div>
          <ThemeToggle />
        </div>
        {session && (
          <div className="border-b border-base-300 bg-base-100 px-4 py-2 lg:hidden">
            <GlobalSearch compact />
          </div>
        )}

        <div className="hidden border-b border-base-300 bg-base-100 px-6 py-3 lg:flex lg:items-center lg:justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="shrink-0 text-sm text-base-content/60">
              {session?.user.organizationName}
            </div>
            {session && <GlobalSearch />}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{session.user.name}</div>
                  <div className="badge badge-outline badge-sm">{session.user.role}</div>
                </div>
                <div className="avatar placeholder">
                  <div className="w-10 rounded-full bg-primary text-primary-content">
                    <span className="text-sm font-semibold">
                      {(session.user.name ?? "U").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" aria-label="Close menu" className="drawer-overlay" />
        <aside className="flex min-h-full w-72 flex-col bg-base-100 text-base-content">
          <div className="border-b border-base-300 px-5 py-5">
            <Link href="/dashboard" className="font-display text-2xl font-semibold tracking-tight">
              Proj<span className="text-primary">Manager</span>
            </Link>
            <p className="mt-1 text-xs text-base-content/50">Jira-style · CPM · RBAC</p>
          </div>

          {session && (
            <ul className="menu w-full flex-1 gap-1 p-3 text-base">
              <li>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my-work">
                  <ListTodo className="h-4 w-4" />
                  My work
                </Link>
              </li>
              <li>
                <Link href="/projects">
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </Link>
              </li>
              {canManageUsers(session.user.role) && (
                <li>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4" />
                    Users & roles
                  </Link>
                </li>
              )}
            </ul>
          )}

          {session && (
            <div className="border-t border-base-300 p-3">
              <div className="mb-2 rounded-box bg-base-200 px-3 py-2 text-xs lg:hidden">
                <div className="font-medium">{session.user.name}</div>
                <div className="opacity-60">
                  {session.user.organizationName} · {session.user.role}
                </div>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-block justify-start gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
