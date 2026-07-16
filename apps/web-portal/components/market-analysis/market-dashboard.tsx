"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMarketHealth,
  getMarketSegments,
  getMarketSummary,
  runWhatIf
} from "@/lib/market-analysis/api";
import type {
  MarketHealthResponse,
  MarketSegmentResponse,
  MarketSummaryResponse,
  WhatIfResponse
} from "@/lib/market-analysis/types";
import type {
  SegmentFilterFormValues,
  WhatIfFormValues
} from "@/lib/market-analysis/schemas";
import { MarketHealthCard } from "./market-health-card";
import { MarketSummaryCards } from "./market-summary-cards";
import { PriceBucketChart } from "./price-bucket-chart";
import { SegmentFilterForm } from "./segment-filter-form";
import { SegmentResults } from "./segment-results";
import { WhatIfForm } from "./what-if-form";
import { WhatIfResult } from "./what-if-result";

export function MarketDashboard() {
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

  async function handleSegmentSubmit(values: SegmentFilterFormValues) {
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

  async function handleWhatIfSubmit(values: WhatIfFormValues) {
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

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <MarketHealthCard health={health} isLoading={isInitialLoading} />
      <MarketSummaryCards summary={summary} />
      <PriceBucketChart buckets={summary?.price_buckets ?? []} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SegmentFilterForm isLoading={isSegmentLoading} onSubmit={handleSegmentSubmit} />
        <SegmentResults isLoading={isSegmentLoading} segment={segment} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <WhatIfForm isSubmitting={isWhatIfSubmitting} onSubmit={handleWhatIfSubmit} />
        <WhatIfResult result={whatIfResult} />
      </div>
    </div>
  );
}
