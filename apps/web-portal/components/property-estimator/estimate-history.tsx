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
    <section className="surface-card p-5 md:p-6">
      <div className="section-header">
        <div>
          <p className="eyebrow">
            History
          </p>
          <h2 className="section-title">Recent estimates</h2>
        </div>
        {isLoading ? <span className="status-pill">Loading...</span> : null}
      </div>
      <p className="section-copy">
        History is stored in the Python backend memory and clears when that service restarts.
      </p>

      <div className="mt-5 space-y-2.5">
        {estimates.length === 0 ? (
          <p className="empty-state">
            No estimates yet. Submit the form to create the first record.
          </p>
        ) : (
          estimates.map((estimate) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
              key={estimate.id}
            >
              <input
                checked={selectedIds.includes(estimate.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
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
