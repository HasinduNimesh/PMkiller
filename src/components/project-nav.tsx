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
    <div className="space-y-3">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link href="/projects">Projects</Link>
          </li>
          <li>
            <span className="font-mono text-xs opacity-60">{projectKey}</span> {projectName}
          </li>
        </ul>
      </div>
      <div role="tablist" className="tabs tabs-box flex-wrap bg-base-100 shadow-sm">
        {links.map((link) => {
          const key = link.suffix.slice(1) || "overview";
          const href = `/projects/${projectId}${link.suffix}`;
          return (
            <Link
              key={link.label}
              role="tab"
              href={href}
              className={`tab ${active === key ? "tab-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
