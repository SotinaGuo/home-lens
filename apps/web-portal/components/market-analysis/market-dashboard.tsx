"use client";

import { useMarketDashboard } from "@/features/market-analysis/hooks/use-market-dashboard";
import { MarketHealthCard } from "./market-health-card";
import { MarketSummaryCards } from "./market-summary-cards";
import { PriceBucketChart } from "./price-bucket-chart";
import { SegmentFilterForm } from "./segment-filter-form";
import { SegmentResults } from "./segment-results";
import { WhatIfForm } from "./what-if-form";
import { WhatIfResult } from "./what-if-result";

export function MarketDashboard() {
  const dashboard = useMarketDashboard();

  return (
    <div className="space-y-5 md:space-y-6">
      {dashboard.errorMessage ? (
        <div className="error-state">
          {dashboard.errorMessage}
        </div>
      ) : null}

      <MarketHealthCard
        health={dashboard.health}
        isLoading={dashboard.isInitialLoading}
      />
      <MarketSummaryCards summary={dashboard.summary} />
      <PriceBucketChart buckets={dashboard.summary?.price_buckets ?? []} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <SegmentFilterForm
          isLoading={dashboard.isSegmentLoading}
          onSubmit={dashboard.submitSegmentFilters}
        />
        <SegmentResults
          isLoading={dashboard.isSegmentLoading}
          segment={dashboard.segment}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <WhatIfForm
          isSubmitting={dashboard.isWhatIfSubmitting}
          onSubmit={dashboard.submitWhatIf}
        />
        <WhatIfResult result={dashboard.whatIfResult} />
      </div>
    </div>
  );
}
