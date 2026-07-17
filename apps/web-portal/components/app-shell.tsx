import Link from "next/link";
import { NavLink } from "./nav-link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="group flex w-fit items-center gap-3 rounded-md outline-none"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white shadow-sm">
              HL
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950 group-hover:text-brand-700">
                HomeLens
              </span>
              <span className="block text-xs font-medium text-slate-500">
                Analytics workspace
              </span>
            </span>
          </Link>
          <nav
            aria-label="Primary navigation"
            className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1"
          >
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/property-estimator">Property Estimator</NavLink>
            <NavLink href="/market-analysis">Market Analysis</NavLink>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
    </div>
  );
}
