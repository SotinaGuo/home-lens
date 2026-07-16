"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  featureLabels,
  formatCurrency,
  formatNumber
} from "@/lib/property-estimator/formatting";
import type {
  ComparisonResponse,
  EstimateRecord
} from "@/lib/property-estimator/types";

type EstimateComparisonProps = {
  comparison: ComparisonResponse | null;
  isComparing: boolean;
  selectedEstimates: EstimateRecord[];
  onCompare: () => void;
};

export function EstimateComparison({
  comparison,
  isComparing,
  onCompare,
  selectedEstimates
}: EstimateComparisonProps) {
  const canCompare = selectedEstimates.length >= 2;
  const chartData =
    comparison?.items.map((item, index) => ({
      label: `Property ${index + 1}`,
      price: item.predicted_price
    })) ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Comparison
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Compare selected properties
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Select at least two estimates from history, then compare predicted prices and
            feature values side by side.
          </p>
        </div>
        <button
          className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!canCompare || isComparing}
          onClick={onCompare}
          type="button"
        >
          {isComparing ? "Comparing..." : "Compare selected"}
        </button>
      </div>

      {comparison ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Highest price" value={formatCurrency(comparison.highest_price)} />
            <Metric label="Lowest price" value={formatCurrency(comparison.lowest_price)} />
            <Metric
              label="Difference"
              value={formatCurrency(comparison.price_difference)}
            />
          </div>

          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="price" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  {comparison.items.map((item, index) => (
                    <th className="px-4 py-3" key={item.id}>
                      Property {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <th className="px-4 py-3 text-slate-600">Predicted price</th>
                  {comparison.items.map((item) => (
                    <td className="px-4 py-3 font-semibold text-slate-950" key={item.id}>
                      {formatCurrency(item.predicted_price)}
                    </td>
                  ))}
                </tr>
                {(Object.keys(featureLabels) as Array<keyof EstimateRecord["features"]>).map(
                  (featureKey) => (
                    <tr className="border-t border-slate-100" key={featureKey}>
                      <th className="px-4 py-3 text-slate-600">
                        {featureLabels[featureKey]}
                      </th>
                      {comparison.items.map((item) => (
                        <td className="px-4 py-3 text-slate-950" key={item.id}>
                          {formatNumber(item.features[featureKey])}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {canCompare
            ? "Ready to compare the selected estimates."
            : "Select at least two history records to enable comparison."}
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
