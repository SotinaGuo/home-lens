"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMarketHealth,
  getMarketSegments,
  getMarketSummary,
  runWhatIf
} from "../api";
import type {
  SegmentFilterFormValues,
  WhatIfFormValues
} from "../schemas";
import type {
  MarketHealthResponse,
  MarketSegmentResponse,
  MarketSummaryResponse,
  WhatIfResponse
} from "../types";

export function useMarketDashboard() {
  const [health, setHealth] = useState<MarketHealthResponse | null>(null);
  const [summary, setSummary] = useState<MarketSummaryResponse | null>(null);
  const [segment, setSegment] = useState<MarketSegmentResponse | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSegmentLoading, setIsSegmentLoading] = useState(false);
  const [isWhatIfSubmitting, setIsWhatIfSubmitting] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setErrorMessage(null);

    try {
      const [healthResponse, summaryResponse] = await Promise.all([
        getMarketHealth(),
        getMarketSummary()
      ]);
      setHealth(healthResponse);
      setSummary(summaryResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load market data"
      );
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  async function submitSegmentFilters(values: SegmentFilterFormValues) {
    setIsSegmentLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMarketSegments(values);
      setSegment(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load market segment"
      );
    } finally {
      setIsSegmentLoading(false);
    }
  }

  async function submitWhatIf(values: WhatIfFormValues) {
    setIsWhatIfSubmitting(true);
    setErrorMessage(null);
    setWhatIfResult(null);

    try {
      const response = await runWhatIf(values);
      setWhatIfResult(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to run what-if analysis"
      );
    } finally {
      setIsWhatIfSubmitting(false);
    }
  }

  return {
    errorMessage,
    health,
    isInitialLoading,
    isSegmentLoading,
    isWhatIfSubmitting,
    segment,
    summary,
    whatIfResult,
    submitSegmentFilters,
    submitWhatIf
  };
}
