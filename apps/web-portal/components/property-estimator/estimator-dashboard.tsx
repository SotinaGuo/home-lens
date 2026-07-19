"use client";

import { useEstimatorDashboard } from "@/features/property-estimator/hooks/use-estimator-dashboard";
import { EstimateComparison } from "./estimate-comparison";
import { EstimateForm } from "./estimate-form";
import { EstimateHistory } from "./estimate-history";
import { EstimateResultCard } from "./estimate-result-card";

export function EstimatorDashboard() {
  const dashboard = useEstimatorDashboard();

  return (
    <div className="space-y-6">
      {dashboard.errorMessage ? (
        <div className="error-state">
          {dashboard.errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <EstimateForm
          isSubmitting={dashboard.isSubmitting}
          onSubmit={dashboard.submitEstimate}
        />
        <EstimateResultCard estimate={dashboard.currentEstimate} />
      </div>

      <EstimateHistory
        estimates={dashboard.estimates}
        isLoading={dashboard.isHistoryLoading}
        onToggleSelected={dashboard.toggleSelectedEstimate}
        selectedIds={dashboard.selectedIds}
      />

      <EstimateComparison
        comparison={dashboard.comparison}
        isComparing={dashboard.isComparing}
        onCompare={dashboard.compareSelectedEstimates}
        selectedEstimates={dashboard.selectedEstimates}
      />
    </div>
  );
}
