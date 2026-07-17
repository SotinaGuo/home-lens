import Link from "next/link";

const appCards = [
  {
    title: "Property Value Estimator",
    status: "Prediction workflow",
    description:
      "Create estimates, review recent predictions, and compare selected properties.",
    href: "/property-estimator"
  },
  {
    title: "Property Market Analysis",
    status: "Market intelligence",
    description:
      "Review market statistics, filter comparable segments, and run what-if analysis.",
    href: "/market-analysis"
  }
];

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="page-header">
        <p className="eyebrow">HomeLens</p>
        <h1 className="page-title">
          Property intelligence for valuation and market analysis
        </h1>
        <p className="page-description">
          A focused workspace for estimating property value, reviewing market signals,
          and comparing scenarios across the housing dataset.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {appCards.map((card) => (
          <Link
            className="group surface-card p-5 transition hover:-translate-y-0.5 hover:border-slate-300 focus-visible:outline-brand-600"
            href={card.href}
            key={card.title}
          >
            <p className="status-pill">{card.status}</p>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 group-hover:text-brand-700">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            <p className="mt-5 text-sm font-semibold text-slate-900">Open workspace →</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
