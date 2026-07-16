import Link from "next/link";

const plannedCapabilities = [
  "Interactive market visualizations",
  "Filters for property segments",
  "What-if analysis backed by the ML model",
  "CSV and PDF export options",
  "Responsive sortable and filterable data tables"
];

export default function MarketAnalysisPage() {
  return (
    <main className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Planned application
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">
        Property Market Analysis
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600">
        This route is intentionally a placeholder. The Java Spring Boot backend
        for market analysis will be implemented in a later module, so this page
        does not fake dashboard data.
      </p>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {plannedCapabilities.map((item) => (
          <li className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700" key={item}>
            {item}
          </li>
        ))}
      </ul>
      <Link
        className="mt-8 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        href="/property-estimator"
      >
        Open active Property Estimator
      </Link>
    </main>
  );
}
