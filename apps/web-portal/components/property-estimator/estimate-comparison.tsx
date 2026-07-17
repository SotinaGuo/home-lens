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
    <section className="surface-card p-5 md:p-6">
      <div className="section-header">
        <div>
          <p className="eyebrow">
            Comparison
          </p>
          <h2 className="section-title">
            Compare selected properties
          </h2>
          <p className="section-copy">
            Select at least two estimates from history, then compare predicted prices and
            feature values side by side.
          </p>
        </div>
        <button
          className="btn-primary"
          disabled={!canCompare || isComparing}
          onClick={onCompare}
          type="button"
        >
          {isComparing ? "Comparing..." : "Compare selected"}
        </button>
      </div>

      {comparison ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
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
                <Bar dataKey="price" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {comparison.items.map((item, index) => (
                    <th key={item.id}>
                      Property {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="text-slate-600">Predicted price</th>
                  {comparison.items.map((item) => (
                    <td className="font-semibold text-slate-950" key={item.id}>
                      {formatCurrency(item.predicted_price)}
                    </td>
                  ))}
                </tr>
                {(Object.keys(featureLabels) as Array<keyof EstimateRecord["features"]>).map(
                  (featureKey) => (
                    <tr key={featureKey}>
                      <th className="text-slate-600">
                        {featureLabels[featureKey]}
                      </th>
                      {comparison.items.map((item) => (
                        <td className="text-slate-950" key={item.id}>
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
        <p className="empty-state mt-6">
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
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
