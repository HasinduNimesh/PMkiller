"use client";

const themes = [
  { id: "corporate", label: "Corporate" },
  { id: "business", label: "Business" },
  { id: "emerald", label: "Emerald" },
  { id: "nord", label: "Nord" },
] as const;

export function ThemeToggle() {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm rounded-xl border border-primary/15 bg-base-100/40 backdrop-blur"
      >
        Theme
        <svg width="12" height="12" className="opacity-60" viewBox="0 0 12 12" aria-hidden>
          <path fill="currentColor" d="M6 8L1 3h10z" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-50 mt-2 w-44 rounded-2xl border border-primary/20 bg-base-100/90 p-2 shadow-[0_0_28px_color-mix(in_oklab,var(--color-primary)_15%,transparent)] backdrop-blur-xl"
      >
        {themes.map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
              className="rounded-xl"
              onClick={() => {
                document.documentElement.setAttribute("data-theme", theme.id);
                localStorage.setItem("projmanager-theme", theme.id);
              }}
            >
              {theme.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
