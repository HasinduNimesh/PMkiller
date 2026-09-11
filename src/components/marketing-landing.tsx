import Link from "next/link";
import {
  GitMerge,
  LayoutDashboard,
  Route,
  Shield,
  Sparkles,
} from "lucide-react";

function ProductStage() {
  return (
    <div
      className="marketing-stage relative mx-auto w-full max-w-5xl overflow-hidden rounded-t-2xl border border-base-300/80 border-b-0 bg-base-100 shadow-2xl"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-200/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-[11px] opacity-50">WEB · Sprint 1 board</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        {[
          {
            title: "To do",
            tint: "bg-base-200",
            items: [
              { key: "WEB-12", label: "Auth session reload", pri: "badge-error" },
              { key: "WEB-18", label: "Invite flow polish", pri: "badge-warning" },
            ],
          },
          {
            title: "In progress",
            tint: "bg-info/10",
            items: [{ key: "WEB-9", label: "CPM Gantt polish", pri: "badge-primary" }],
          },
          {
            title: "In review",
            tint: "bg-secondary/10",
            items: [{ key: "WEB-7", label: "GitHub PR auto-close", pri: "badge-secondary" }],
          },
          {
            title: "Done",
            tint: "bg-success/10",
            items: [{ key: "WEB-3", label: "Org RBAC roles", pri: "badge-success" }],
          },
        ].map((col) => (
          <div key={col.title} className={`rounded-box ${col.tint} p-2 sm:p-3`}>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide opacity-50">
              {col.title}
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item.key}
                  className="marketing-card rounded-box border border-base-300/60 bg-base-100 p-2 shadow-sm sm:p-2.5"
                >
                  <div className="font-mono text-[10px] opacity-50">{item.key}</div>
                  <div className="text-xs font-medium leading-snug sm:text-sm">{item.label}</div>
                  <span className={`badge badge-xs mt-1.5 ${item.pri}`}>priority</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[42rem] w-[42rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-20 top-40 h-[36rem] w-[36rem] rounded-full bg-secondary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-base-content) 12%, transparent) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <header className="navbar sticky top-0 z-30 border-b border-base-300/60 bg-base-100/80 px-4 backdrop-blur-md sm:px-8">
        <div className="flex-1">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Proj<span className="text-primary">Manager</span>
          </Link>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-between gap-10 px-4 pb-0 pt-14 sm:px-8 lg:pt-20">
          <div className="marketing-fade-up mx-auto max-w-3xl text-center">
            <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Proj<span className="text-primary">Manager</span>
            </p>
            <h1 className="mt-5 text-balance text-xl font-medium text-base-content/80 sm:text-2xl">
              Deadlines, severity, and critical path — in one place.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-base-content/60 sm:text-lg">
              Run company projects with RBAC, Jira-style boards, CPM schedules, and GitHub merge
              automation.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn btn-primary btn-lg">
                Start free
              </Link>
              <Link href="/login" className="btn btn-outline btn-lg">
                Sign in
              </Link>
            </div>
          </div>

          <div className="marketing-rise relative mt-auto">
            <div className="pointer-events-none absolute inset-x-8 -top-10 h-24 rounded-full bg-primary/20 blur-2xl" />
            <ProductStage />
          </div>
        </div>
      </section>

      <section className="border-t border-base-300 bg-base-200/50 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for how teams actually ship
            </h2>
            <p className="mt-3 text-base-content/60">
              Familiar issue workflows, real schedule math, and org-level access control.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: LayoutDashboard,
                title: "Boards & backlog",
                body: "Epics, stories, bugs, sprints, and drag-and-drop kanban.",
              },
              {
                icon: Route,
                title: "Critical path",
                body: "Finish-to-start CPM with slack, Gantt, and deadline health.",
              },
              {
                icon: Shield,
                title: "Org RBAC",
                body: "Admin, PM, member, and viewer roles across projects.",
              },
              {
                icon: GitMerge,
                title: "GitHub close",
                body: "Mention WEB-12 in a PR — merge marks the issue done.",
              },
            ].map((f) => (
              <div key={f.title} className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-box bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-base-content/60">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 sm:px-8 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Same UI as the product
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              daisyUI themes your team already recognizes
            </h2>
            <p className="mt-4 max-w-lg text-base-content/60">
              Corporate by default, with Business, Emerald, and Nord — so the marketing page and
              the app feel like one product, not two skins.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["corporate", "business", "emerald", "nord"].map((t) => (
                <span key={t} className="badge badge-outline badge-lg capitalize">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="stats stats-vertical w-full max-w-sm bg-base-200 shadow sm:stats-horizontal sm:max-w-none">
              <div className="stat">
                <div className="stat-title">Issue keys</div>
                <div className="stat-value text-primary">WEB-12</div>
                <div className="stat-desc">Project-scoped counters</div>
              </div>
              <div className="stat">
                <div className="stat-title">Roles</div>
                <div className="stat-value">4</div>
                <div className="stat-desc">ADMIN · PM · MEMBER · VIEWER</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-base-300 bg-base-200/60 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Ready when your next sprint is
          </h2>
          <p className="mt-3 text-base-content/60">
            Create an org, invite your team, connect GitHub, and plan the critical path.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg mt-8">
            Create your workspace
          </Link>
        </div>
      </section>

      <footer className="border-t border-base-300 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-base-content/50 sm:flex-row sm:px-8">
          <span className="font-display font-semibold text-base-content/70">
            Proj<span className="text-primary">Manager</span>
          </span>
          <span>Open source company project management</span>
        </div>
      </footer>
    </div>
  );
}
