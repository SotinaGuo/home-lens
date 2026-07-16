import type { MarketHealthResponse } from "@/lib/market-analysis/types";

type MarketHealthCardProps = {
  health: MarketHealthResponse | null;
  isLoading: boolean;
};

export function MarketHealthCard({ health, isLoading }: MarketHealthCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Market backend
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        {isLoading ? "Checking service..." : health?.status === "ok" ? "Online" : "Unavailable"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {health
          ? `${health.records_loaded} market records loaded · ML API ${health.ml_api_base_url}`
          : "Start market-analysis-api on port 8002 to load live market data."}
      </p>
    </section>
  );
}
