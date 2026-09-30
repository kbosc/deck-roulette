import { NavLink, Outlet } from "react-router";

const LINKS = [
  { to: "/", label: "Library" },
  { to: "/pools", label: "Pools" },
] as const;

/**
 * The frame every screen sits in.
 *
 * Landmarks — `nav`, `main` — are what let someone using a screen reader jump
 * straight to the content instead of hearing the navigation on every page.
 */
export function Layout() {
  return (
    <div className="min-h-screen bg-surface text-text">
      {/*
        Visible only once focused, and the first thing the Tab key reaches.
        Without it, a keyboard user walks through every navigation link on every
        single page before reaching what they came for.
      */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-2 focus:rounded-md focus:bg-action focus:px-4 focus:py-2 focus:text-text-on-action"
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <nav aria-label="Main" className="mx-auto flex max-w-3xl gap-1 px-4 py-3">
          {LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-2 text-sm font-medium",
                  "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-surface outline-none",
                  isActive
                    ? "bg-surface-sunken text-text"
                    : "text-text-muted hover:bg-surface-hover",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* tabIndex -1 makes the skip link able to move focus here, not just scroll. */}
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
