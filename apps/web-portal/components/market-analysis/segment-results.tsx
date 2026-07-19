import { formatCurrency, formatNumber } from "@/features/market-analysis/formatting";
import type { MarketSegmentResponse } from "@/features/market-analysis/types";
import { PropertyRecordTable } from "./property-record-table";

type SegmentResultsProps = {
  isLoading: boolean;
  segment: MarketSegmentResponse | null;
};

export function SegmentResults({ isLoading, segment }: SegmentResultsProps) {
  if (isLoading) {
    return (
      <section className="surface-card p-5">
        <p className="text-sm text-slate-600">Loading filtered market segment...</p>
      </section>
    );
  }

  if (!segment) {
    return (
      <section className="surface-card p-5">
        <p className="text-sm text-slate-600">
          Apply filters to inspect a focused market segment.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Matching records" value={formatNumber(segment.record_count)} />
        {segment.statistics ? (
          <>
            <Metric label="Average price" value={formatCurrency(segment.statistics.price.average)} />
            <Metric label="Median price" value={formatCurrency(segment.statistics.price.median)} />
            <Metric
              label="Avg. square footage"
              value={formatNumber(segment.statistics.square_footage.average)}
            />
          </>
        ) : null}
      </section>
      <PropertyRecordTable
        emptyMessage="No matching records for these filters."
        records={segment.records}
        title="Matching market records"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
