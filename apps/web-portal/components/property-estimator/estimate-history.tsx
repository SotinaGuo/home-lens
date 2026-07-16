import { formatCurrency, formatDateTime, formatNumber } from "@/lib/property-estimator/formatting";
import type { EstimateRecord } from "@/lib/property-estimator/types";

type EstimateHistoryProps = {
  estimates: EstimateRecord[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelected: (estimateId: string) => void;
};

export function EstimateHistory({
  estimates,
  isLoading,
  onToggleSelected,
  selectedIds
}: EstimateHistoryProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            History
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Recent estimates</h2>
        </div>
        {isLoading ? <span className="text-sm text-slate-500">Loading...</span> : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">
        History is stored in the Python backend memory and clears when that service restarts.
      </p>

      <div className="mt-6 space-y-3">
        {estimates.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            No estimates yet. Submit the form to create the first record.
          </p>
        ) : (
          estimates.map((estimate) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-brand-100 hover:bg-brand-50"
              key={estimate.id}
            >
              <input
                checked={selectedIds.includes(estimate.id)}
                className="mt-1"
                onChange={() => onToggleSelected(estimate.id)}
                type="checkbox"
              />
              <span className="flex-1">
                <span className="block font-semibold text-slate-950">
                  {formatCurrency(estimate.predicted_price)}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {formatNumber(estimate.features.square_footage)} sq ft ·{" "}
                  {estimate.features.bedrooms} beds · {estimate.features.bathrooms} baths
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {formatDateTime(estimate.created_at)}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
