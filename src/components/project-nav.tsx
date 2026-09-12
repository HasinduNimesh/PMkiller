import Link from "next/link";

const links = [
  { suffix: "", label: "Overview" },
  { suffix: "/board", label: "Board" },
  { suffix: "/backlog", label: "Backlog" },
  { suffix: "/tasks", label: "Issues" },
  { suffix: "/epics", label: "Epics" },
  { suffix: "/roadmap", label: "Roadmap" },
  { suffix: "/schedule", label: "CPM" },
  { suffix: "/settings", label: "Settings" },
] as const;

export function ProjectNav({
  projectId,
  projectName,
  projectKey,
  active,
}: {
  projectId: string;
  projectName: string;
  projectKey: string;
  active:
    | "overview"
    | "board"
    | "backlog"
    | "tasks"
    | "epics"
    | "roadmap"
    | "schedule"
    | "settings";
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/50">
        <Link href="/projects" className="link link-hover">
          Projects
        </Link>
        <span className="opacity-40">/</span>
        <span className="inline-flex items-center gap-2 font-medium text-base-content">
          <span className="rounded-md bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-base-content/60">
            {projectKey}
          </span>
          {projectName}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 rounded-2xl border border-base-300/50 bg-base-100/70 p-1.5 backdrop-blur-sm">
        {links.map((link) => {
          const key = link.suffix.slice(1) || "overview";
          const href = `/projects/${projectId}${link.suffix}`;
          const isActive = active === key;
          return (
            <Link
              key={link.label}
              href={href}
              className={`nav-pill ${isActive ? "nav-pill-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
