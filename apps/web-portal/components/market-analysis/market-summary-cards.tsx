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
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value]) => (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}
