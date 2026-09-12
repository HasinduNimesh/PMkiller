import Link from "next/link";
import {
  Code2,
  GitMerge,
  LayoutDashboard,
  Route,
  Shield,
  Sparkles,
  Terminal,
} from "lucide-react";

function ProductStage() {
  return (
    <div
      className="marketing-stage relative mx-auto w-full max-w-5xl overflow-hidden rounded-t-2xl border border-primary/25 bg-base-100/70 shadow-[0_0_60px_color-mix(in_oklab,var(--color-primary)_20%,transparent)] backdrop-blur-xl"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-primary/15 bg-base-200/50 px-4 py-2.5 backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full bg-error/70 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-[11px] text-base-content/45">WEB · Sprint 1 board</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
        {[
          {
            title: "To do",
            tint: "bg-base-200/60",
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
          <div
            key={col.title}
            className={`rounded-xl border border-base-300/40 ${col.tint} p-2 backdrop-blur-sm sm:p-3`}
          >
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-base-content/45">
              {col.title}
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item.key}
                  className="marketing-card rounded-xl border border-primary/15 bg-base-100/80 p-2 shadow-[0_0_18px_color-mix(in_oklab,var(--color-primary)_8%,transparent)] backdrop-blur sm:p-2.5"
                >
                  <div className="font-mono text-[10px] text-base-content/45">{item.key}</div>
                  <div className="text-xs font-semibold leading-snug sm:text-sm">{item.label}</div>
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

const mcpMethods = [
  {
    icon: Code2,
    name: "Cursor",
    blurb: "Paste into Cursor Settings → MCP or `.cursor/mcp.json`.",
    where: "IDE · Agent Mode",
  },
  {
    icon: Terminal,
    name: "Claude Code",
    blurb: "Add via CLI or project `.mcp.json` / `~/.claude.json`.",
    where: "CLI · terminal agents",
  },
  {
    icon: Sparkles,
    name: "Claude Desktop",
    blurb: "Merge into `claude_desktop_config.json`, then restart the app.",
    where: "Desktop connectors",
  },
] as const;

export function MarketingLanding() {
  return (
    <div className="app-canvas min-h-screen text-base-content">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="neon-orb absolute -left-24 top-0 h-[42rem] w-[42rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="neon-orb absolute -right-20 top-40 h-[36rem] w-[36rem] rounded-full bg-secondary/20 blur-3xl [animation-delay:1.2s]" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-primary) 28%, transparent) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <header className="navbar sticky top-0 z-30 border-b border-primary/15 bg-base-100/55 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex-1">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight neon-text sm:text-2xl"
          >
            Proj<span className="text-primary">Manager</span>
          </Link>
        </div>
        <div className="flex flex-none items-center gap-2">
          <a href="#connect" className="btn btn-ghost btn-sm rounded-xl hidden sm:inline-flex">
            Connect MCP
          </a>
          <Link href="/login" className="btn btn-ghost btn-sm rounded-xl">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm rounded-xl">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-between gap-10 px-4 pb-0 pt-14 sm:px-8 lg:pt-20">
          <div className="marketing-fade-up mx-auto max-w-3xl text-center">
            <p className="font-display text-5xl font-semibold tracking-tight neon-text sm:text-6xl lg:text-7xl">
              Proj<span className="text-primary">Manager</span>
            </p>
            <h1 className="mt-5 text-balance text-xl font-medium text-base-content/80 sm:text-2xl">
              Deadlines, severity, and critical path — in one place.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-base-content/60 sm:text-lg">
              Run company projects with RBAC, Jira-style boards, CPM schedules, GitHub merge
              automation, and MCP for Cursor & Claude.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn btn-primary btn-lg rounded-xl">
                Start free
              </Link>
              <a href="#connect" className="btn btn-outline btn-lg rounded-xl border-primary/40">
                Connect agents
              </a>
            </div>
          </div>

          <div className="marketing-rise relative mt-auto">
            <div className="pointer-events-none absolute inset-x-8 -top-10 h-24 rounded-full bg-primary/30 blur-2xl" />
            <ProductStage />
          </div>
        </div>
      </section>

      <section id="connect" className="scroll-mt-24 border-t border-primary/15 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              MCP connection methods
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Connect Cursor & Claude in minutes
            </h2>
            <p className="mt-3 text-base-content/60">
              Agents plan sprints, create issues, and assign work through the same API — pick your
              client and paste the config from Integrations after you sign in.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {mcpMethods.map((m) => (
              <div
                key={m.name}
                className="glass neon-ring rounded-2xl p-5 transition hover:shadow-[0_0_36px_color-mix(in_oklab,var(--color-primary)_28%,transparent)]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_18px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{m.name}</h3>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                  {m.where}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-base-content/60">{m.blurb}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn btn-primary rounded-xl">
              Create workspace
            </Link>
            <Link href="/login" className="btn btn-ghost rounded-xl">
              Sign in → Integrations
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-primary/10 bg-base-200/30 py-20 backdrop-blur-sm sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for how teams actually ship
            </h2>
            <p className="mt-3 text-base-content/60">
              Familiar issue workflows, real schedule math, and org-level access control.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div key={f.title} className="glass rounded-2xl p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-base-content/60">{f.body}</p>
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
              Glass · neon · daisyUI
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One look from landing to board
            </h2>
            <p className="mt-4 max-w-lg text-base-content/60">
              Corporate by default, with Business, Emerald, and Nord — frosted panels and primary
              glow that carry through the product.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["corporate", "business", "emerald", "nord"].map((t) => (
                <span
                  key={t}
                  className="badge badge-outline badge-lg capitalize border-primary/30 bg-base-100/50 backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="stats stats-vertical w-full max-w-sm glass neon-ring sm:stats-horizontal sm:max-w-none">
              <div className="stat">
                <div className="stat-title">Issue keys</div>
                <div className="stat-value text-primary neon-text">WEB-12</div>
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

      <section className="border-t border-primary/15 bg-base-200/40 py-16 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Ready when your next sprint is
          </h2>
          <p className="mt-3 text-base-content/60">
            Create an org, invite your team, connect GitHub or MCP, and plan the critical path.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg mt-8 rounded-xl">
            Create your workspace
          </Link>
        </div>
      </section>

      <footer className="border-t border-primary/10 py-8">
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
