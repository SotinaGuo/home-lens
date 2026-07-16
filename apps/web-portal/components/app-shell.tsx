import Link from "next/link";
import { NavLink } from "./nav-link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="group">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              HomeLens
            </p>
            <p className="text-lg font-bold text-slate-950 group-hover:text-brand-700">
              Property Intelligence Portal
            </p>
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/property-estimator">Property Estimator</NavLink>
            <NavLink href="/market-analysis">Market Analysis</NavLink>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
