import { featureLabels, formatCurrency, formatNumber } from "@/lib/property-estimator/formatting";
import type { EstimateRecord } from "@/lib/property-estimator/types";
import { FeatureChart } from "./feature-chart";

type EstimateResultCardProps = {
  estimate: EstimateRecord | null;
};

export function EstimateResultCard({ estimate }: EstimateResultCardProps) {
  if (estimate === null) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        Submit a property to see the predicted price and feature chart.
      </section>
    );
  }

  const featureEntries = Object.entries(estimate.features) as Array<
    [keyof EstimateRecord["features"], number]
  >;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Latest estimate
      </p>
      <p className="mt-3 text-4xl font-bold text-slate-950">
        {formatCurrency(estimate.predicted_price)}
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <tbody>
            {featureEntries.map(([key, value]) => (
              <tr className="border-b border-slate-100 last:border-0" key={key}>
                <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600">
                  {featureLabels[key]}
                </th>
                <td className="px-4 py-3 text-slate-950">{formatNumber(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <FeatureChart features={estimate.features} />
      </div>
    </section>
  );
}
