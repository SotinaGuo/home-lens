import { featureLabels, formatCurrency, formatNumber } from "@/lib/property-estimator/formatting";
import type { EstimateRecord } from "@/lib/property-estimator/types";
import { FeatureChart } from "./feature-chart";

type EstimateResultCardProps = {
  estimate: EstimateRecord | null;
};

export function EstimateResultCard({ estimate }: EstimateResultCardProps) {
  if (estimate === null) {
    return (
      <section className="empty-state">
        Submit a property to see the predicted price and feature chart.
      </section>
    );
  }

  const featureEntries = Object.entries(estimate.features) as Array<
    [keyof EstimateRecord["features"], number]
  >;

  return (
    <section className="surface-card p-5 md:p-6">
      <p className="eyebrow">
        Latest estimate
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        {formatCurrency(estimate.predicted_price)}
      </p>
      <div className="table-wrap mt-6">
        <table className="w-full text-left text-sm">
          <tbody>
            {featureEntries.map(([key, value]) => (
              <tr className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50" key={key}>
                <th className="w-1/2 bg-slate-50 px-4 py-3 font-medium text-slate-600">
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
