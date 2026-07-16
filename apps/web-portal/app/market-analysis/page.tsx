import { MarketDashboard } from "@/components/market-analysis/market-dashboard";

export default function MarketAnalysisPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          App 2
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Property Market Analysis
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Explore aggregate market statistics, filter comparable property
          segments, and test what-if scenarios through the Java Spring Boot
          market analysis backend.
        </p>
      </section>
      <MarketDashboard />
    </main>
  );
}
