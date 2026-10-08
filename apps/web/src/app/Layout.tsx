import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router";

const LINKS = [
  { to: "/", label: "Library" },
  { to: "/pools", label: "Pools" },
] as const;

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  // A path rather than a "first render" flag: StrictMode runs effects twice in
  // dev, and a flag would already be spent on the second run.
  const previousPathname = useRef(pathname);

  // A client-side navigation does not reset focus like a page load does: without
  // this, focus stays on the clicked link and screen readers announce nothing.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const main = mainRef.current;
    (main?.querySelector<HTMLElement>("h1[tabindex]") ?? main)?.focus();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* Skip link: visible once focused, first thing Tab reaches. */}
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
      <main
        ref={mainRef}
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-3xl px-4 py-6 outline-none"
      >
        <Outlet />
      </main>
    </div>
  );
}
