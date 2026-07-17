import { MarketDashboard } from "@/components/market-analysis/market-dashboard";

export default function MarketAnalysisPage() {
  return (
    <main className="page-stack">
      <section className="page-header">
        <p className="eyebrow">
          App 2
        </p>
        <h1 className="page-title">
          Property Market Analysis
        </h1>
        <p className="page-description">
          Inspect market-level statistics, narrow comparable segments, and test
          property scenarios against the current dataset.
        </p>
      </section>
      <MarketDashboard />
    </main>
  );
}
