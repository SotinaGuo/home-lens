import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { MarketSegmentResponse } from "@/lib/market-analysis/types";
import { PropertyRecordTable } from "./property-record-table";

type SegmentResultsProps = {
  isLoading: boolean;
  segment: MarketSegmentResponse | null;
};

export function SegmentResults({ isLoading, segment }: SegmentResultsProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Loading filtered market segment...</p>
      </section>
    );
  }

  if (!segment) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Apply filters to inspect a focused market segment.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-4">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
