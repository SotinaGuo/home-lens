import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { MarketSummaryResponse } from "@/lib/market-analysis/types";

type MarketSummaryCardsProps = {
  summary: MarketSummaryResponse | null;
};

export function MarketSummaryCards({ summary }: MarketSummaryCardsProps) {
  const cards = summary
    ? [
        ["Records", formatNumber(summary.record_count)],
        ["Average price", formatCurrency(summary.price.average)],
        ["Median price", formatCurrency(summary.price.median)],
        ["Lowest price", formatCurrency(summary.price.minimum)],
        ["Highest price", formatCurrency(summary.price.maximum)],
        ["Avg. school rating", formatNumber(summary.school_rating.average)]
      ]
    : [
        ["Records", "—"],
        ["Average price", "—"],
        ["Median price", "—"],
        ["Lowest price", "—"],
        ["Highest price", "—"],
        ["Avg. school rating", "—"]
      ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value]) => (
        <div className="metric-card" key={label}>
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
        </div>
      ))}
    </section>
  );
}
