import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { canManageUsers } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { UserAvatar } from "@/components/user-avatar";
import { LogOut } from "lucide-react";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const avatarImage = session?.user.id
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { image: true },
        })
      )?.image ?? null
    : null;

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
              <UserMenu
                name={session.user.name}
                email={session.user.email}
                role={session.user.role}
                image={avatarImage}
              />
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
                <div className="flex items-center gap-2">
                  <UserAvatar
                    name={session.user.name}
                    image={avatarImage}
                    size={28}
                    rounded="full"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{session.user.name}</div>
                    <div className="mt-0.5 text-base-content/50">
                      {session.user.organizationName} · {session.user.role}
                    </div>
                  </div>
                </div>
                <Link href="/settings/profile" className="link link-primary mt-2 inline-block text-xs">
                  Edit profile
                </Link>
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
