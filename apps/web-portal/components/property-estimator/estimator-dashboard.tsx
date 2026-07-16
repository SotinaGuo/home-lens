"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createEstimate, listEstimates } from "@/lib/property-estimator/api";
import type { PropertyFeatureFormValues } from "@/lib/property-estimator/schemas";
import type { EstimateRecord } from "@/lib/property-estimator/types";
import { EstimateForm } from "./estimate-form";
import { EstimateHistory } from "./estimate-history";
import { EstimateResultCard } from "./estimate-result-card";

export function EstimatorDashboard() {
  const [currentEstimate, setCurrentEstimate] = useState<EstimateRecord | null>(null);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const selectedEstimates = useMemo(
    () => estimates.filter((estimate) => selectedIds.includes(estimate.id)),
    [estimates, selectedIds]
  );

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await listEstimates();
      setEstimates(response.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  async function handleSubmit(values: PropertyFeatureFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const estimate = await createEstimate(values);
      setCurrentEstimate(estimate);
      await refreshHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Prediction service unavailable"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleSelected(estimateId: string) {
    setSelectedIds((current) =>
      current.includes(estimateId)
        ? current.filter((id) => id !== estimateId)
        : [...current, estimateId]
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <EstimateForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        <EstimateResultCard estimate={currentEstimate} />
      </div>

      <EstimateHistory
        estimates={estimates}
        isLoading={isHistoryLoading}
        onToggleSelected={toggleSelected}
        selectedIds={selectedIds}
      />

      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        Select at least two history records to compare them. Comparison details are added in the
        next task.
        <p className="mt-2 text-sm">Selected records: {selectedEstimates.length}</p>
      </section>
    </div>
  );
}
