"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compareEstimates, createEstimate, listEstimates } from "../api";
import type { PropertyFeatureFormValues } from "../schemas";
import type { ComparisonResponse, EstimateRecord } from "../types";

export function useEstimatorDashboard() {
  const [currentEstimate, setCurrentEstimate] = useState<EstimateRecord | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const selectedIdsRef = useRef(selectedIds);
  const historyRequestIdRef = useRef(0);

  const selectedEstimates = useMemo(
    () => estimates.filter((estimate) => selectedIds.includes(estimate.id)),
    [estimates, selectedIds]
  );

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const refreshHistory = useCallback(async () => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    setIsHistoryLoading(true);

    try {
      const response = await listEstimates();
      if (historyRequestIdRef.current === requestId) {
        setEstimates(response.items);
      }
    } catch (error) {
      if (historyRequestIdRef.current === requestId) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load history");
      }
    } finally {
      if (historyRequestIdRef.current === requestId) {
        setIsHistoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  async function submitEstimate(values: PropertyFeatureFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const estimate = await createEstimate(values);
      setCurrentEstimate(estimate);
      setComparison(null);
      await refreshHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Prediction service unavailable"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function compareSelectedEstimates() {
    if (selectedIds.length < 2) {
      return;
    }

    setIsComparing(true);
    setErrorMessage(null);
    setComparison(null);

    const requestedSelectedIds = [...selectedIds];

    try {
      const response = await compareEstimates({ estimate_ids: requestedSelectedIds });
      if (selectedIdsMatch(selectedIdsRef.current, requestedSelectedIds)) {
        setComparison(response);
      }
    } catch (error) {
      setComparison(null);
      setErrorMessage(error instanceof Error ? error.message : "Unable to compare estimates");
    } finally {
      setIsComparing(false);
    }
  }

  function toggleSelectedEstimate(estimateId: string) {
    setComparison(null);
    setSelectedIds((current) => {
      const nextSelectedIds = current.includes(estimateId)
        ? current.filter((id) => id !== estimateId)
        : [...current, estimateId];
      selectedIdsRef.current = nextSelectedIds;
      return nextSelectedIds;
    });
  }

  return {
    comparison,
    currentEstimate,
    errorMessage,
    estimates,
    isComparing,
    isHistoryLoading,
    isSubmitting,
    selectedEstimates,
    selectedIds,
    compareSelectedEstimates,
    submitEstimate,
    toggleSelectedEstimate
  };
}

function selectedIdsMatch(currentSelectedIds: string[], requestedSelectedIds: string[]) {
  return (
    currentSelectedIds.length === requestedSelectedIds.length &&
    currentSelectedIds.every((id, index) => id === requestedSelectedIds[index])
  );
}
