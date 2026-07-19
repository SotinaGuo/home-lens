import type {
  ApiErrorResponse,
  ComparisonRequest,
  ComparisonResponse,
  EstimateListResponse,
  EstimateRecord,
  PropertyFeatures
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

export async function createEstimate(features: PropertyFeatures): Promise<EstimateRecord> {
  const response = await fetch("/api/property-estimator/estimates", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(features)
  });

  return readJsonOrThrow<EstimateRecord>(response);
}

export async function listEstimates(): Promise<EstimateListResponse> {
  const response = await fetch("/api/property-estimator/estimates", {
    cache: "no-store"
  });

  return readJsonOrThrow<EstimateListResponse>(response);
}

export async function compareEstimates(
  request: ComparisonRequest
): Promise<ComparisonResponse> {
  const response = await fetch("/api/property-estimator/comparisons", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return readJsonOrThrow<ComparisonResponse>(response);
}
