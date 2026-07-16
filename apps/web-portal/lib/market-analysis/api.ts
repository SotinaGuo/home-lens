import type {
  ApiErrorResponse,
  MarketFilters,
  MarketHealthResponse,
  MarketSegmentResponse,
  MarketSummaryResponse,
  PropertyFeatures,
  WhatIfResponse
} from "./types";

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    const detail =
      typeof (payload as ApiErrorResponse).detail === "string"
        ? (payload as ApiErrorResponse).detail
        : "Request failed";
    throw new Error(detail);
  }

  return payload as T;
}

function buildSegmentQuery(filters: MarketFilters): string {
  const params = new URLSearchParams();
  (Object.entries(filters) as [string, unknown][]).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getMarketHealth(): Promise<MarketHealthResponse> {
  const response = await fetch("/api/market-analysis/health", {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketHealthResponse>(response);
}

export async function getMarketSummary(): Promise<MarketSummaryResponse> {
  const response = await fetch("/api/market-analysis/summary", {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketSummaryResponse>(response);
}

export async function getMarketSegments(
  filters: MarketFilters
): Promise<MarketSegmentResponse> {
  const response = await fetch(`/api/market-analysis/segments${buildSegmentQuery(filters)}`, {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketSegmentResponse>(response);
}

export async function runWhatIf(features: PropertyFeatures): Promise<WhatIfResponse> {
  const response = await fetch("/api/market-analysis/what-if", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(features)
  });

  return readJsonOrThrow<WhatIfResponse>(response);
}
