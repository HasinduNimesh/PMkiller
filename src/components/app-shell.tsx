import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { canManageUsers } from "@/lib/rbac";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogOut } from "lucide-react";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex min-h-screen flex-col">
        <div className="navbar sticky top-0 z-30 border-b border-primary/15 bg-base-100/55 px-4 backdrop-blur-xl lg:hidden">
          <div className="flex-none">
            <label htmlFor="app-drawer" className="btn btn-square btn-ghost" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div className="flex-1 px-2">
            {session ? (
              <GlobalSearch />
            ) : (
              <Link href="/dashboard" className="font-display text-lg font-semibold tracking-tight">
                Proj<span className="text-primary">Manager</span>
              </Link>
            )}
          </div>
          <ThemeToggle />
        </div>
        {session && (
          <div className="border-b border-base-300/60 bg-base-100/70 px-4 py-2 backdrop-blur lg:hidden">
            <GlobalSearch compact />
          </div>
        )}

        <div className="sticky top-0 z-20 hidden border-b border-primary/15 bg-base-100/55 px-6 py-3 backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_16px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]">
              {session?.user.organizationName}
            </div>
            {session && <GlobalSearch />}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-base-100/60 py-1.5 pl-3 pr-1.5 backdrop-blur-md shadow-[0_0_20px_color-mix(in_oklab,var(--color-primary)_12%,transparent)]">
                <div className="text-right">
                  <div className="text-sm font-semibold leading-tight">{session.user.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-base-content/45">
                    {session.user.role}
                  </div>
                </div>
                <div className="avatar placeholder">
                  <div className="w-9 rounded-xl bg-primary text-primary-content shadow-[0_0_16px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]">
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
        <aside className="flex min-h-full w-[17.5rem] flex-col border-r border-primary/15 bg-base-100/70 text-base-content backdrop-blur-2xl">
          <div className="px-5 pb-4 pt-6">
            <Link href="/dashboard" className="font-display text-2xl font-semibold tracking-tight neon-text">
              Proj<span className="text-primary">Manager</span>
            </Link>
            <p className="mt-1.5 text-xs text-base-content/45">Plan · ship · critical path</p>
          </div>

          {session && (
            <SidebarNav canManageUsers={canManageUsers(session.user.role)} />
          )}

          {session && (
            <div className="mt-auto border-t border-base-300/60 p-3">
              <div className="mb-2 rounded-2xl bg-base-200/70 px-3 py-2.5 text-xs lg:hidden">
                <div className="font-semibold">{session.user.name}</div>
                <div className="mt-0.5 text-base-content/50">
                  {session.user.organizationName} · {session.user.role}
                </div>
              </div>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-block justify-start gap-2 rounded-xl">
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
