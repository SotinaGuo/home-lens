import Link from "next/link";

const appCards = [
  {
    title: "Property Value Estimator",
    status: "Live in this phase",
    description:
      "Submit property details, call the Python estimator backend, review estimate history, and compare multiple properties.",
    href: "/property-estimator"
  },
  {
    title: "Property Market Analysis",
    status: "Live Java module",
    description:
      "Explore market statistics, filter comparable property segments, and run what-if analysis through the Java backend.",
    href: "/market-analysis"
  }
];

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          HomeLens
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950">
          See property value and market signals through one clear lens.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          HomeLens demonstrates a fullstack housing analytics workflow. App 1 estimates
          individual property values through the Python backend; App 2 explores market
          segments through the Java Spring Boot backend.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {appCards.map((card) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md"
            href={card.href}
            key={card.title}
          >
            <p className="text-sm font-semibold text-brand-600">{card.status}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{card.title}</h2>
            <p className="mt-3 text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
