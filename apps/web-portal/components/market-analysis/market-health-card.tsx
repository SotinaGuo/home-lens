import type { MarketHealthResponse } from "@/features/market-analysis/types";

type MarketHealthCardProps = {
  health: MarketHealthResponse | null;
  isLoading: boolean;
};

export function MarketHealthCard({ health, isLoading }: MarketHealthCardProps) {
  return (
    <section className="surface-card p-5">
      <p className="eyebrow">
        Market backend
      </p>
      <h2 className="section-title">
        {isLoading ? "Checking service..." : health?.status === "ok" ? "Online" : "Unavailable"}
      </h2>
      <p className="section-copy">
        {health
          ? `${health.records_loaded} market records loaded · ML API ${health.ml_api_base_url}`
          : "Start market-analysis-api on port 8002 to load live market data."}
      </p>
    </section>
  );
}
