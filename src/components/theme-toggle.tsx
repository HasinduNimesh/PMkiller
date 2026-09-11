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
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        Theme
        <svg width="12" height="12" className="opacity-60" viewBox="0 0 12 12" aria-hidden>
          <path fill="currentColor" d="M6 8L1 3h10z" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-50 mt-2 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      >
        {themes.map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
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
