import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency
} from "@/lib/market-analysis/formatting";
import type { WhatIfResponse } from "@/lib/market-analysis/types";
import { PropertyRecordTable } from "./property-record-table";

type WhatIfResultProps = {
  result: WhatIfResponse | null;
};

export function WhatIfResult({ result }: WhatIfResultProps) {
  if (!result) {
    return (
      <section className="empty-state">
        <h3 className="font-semibold text-slate-900">Prediction result</h3>
        <p className="mt-1">
          Submit a property scenario to see predicted price and market position.
        </p>
      </section>
    );
  }

  const position = result.market_position;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Predicted price
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">
          {formatCurrency(result.predicted_price)}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          {position.above_market_average ? "Above" : "Below"} market average by{" "}
          {formatSignedCurrency(position.difference_from_average)} ·{" "}
          {formatPercent(position.percentile)} percentile
        </p>
      </section>
      <PropertyRecordTable
        emptyMessage="No nearest records returned."
        records={result.nearest_records}
        title="Nearest market records"
      />
    </div>
  );
}
