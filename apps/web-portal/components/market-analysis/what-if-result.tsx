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
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">Prediction result</h3>
        <p className="mt-2 text-sm text-slate-600">
          Submit a property scenario to see predicted price and market position.
        </p>
      </section>
    );
  }

  const position = result.market_position;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Predicted price
        </p>
        <p className="mt-2 text-4xl font-bold text-brand-950">
          {formatCurrency(result.predicted_price)}
        </p>
        <p className="mt-3 text-sm text-brand-900">
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
