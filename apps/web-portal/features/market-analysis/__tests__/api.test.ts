import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMarketHealth,
  getMarketSegments,
  getMarketSummary,
  runWhatIf
} from "../api";
import type { PropertyFeatures } from "../types";

const features: PropertyFeatures = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

describe("market analysis browser API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads health through the same-origin proxy", async () => {
    const payload = {
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMarketHealth()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/health", {
      cache: "no-store"
    });
  });

  it("loads summary through the same-origin proxy", async () => {
    const payload = { record_count: 50, price_buckets: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMarketSummary()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/summary", {
      cache: "no-store"
    });
  });

  it("omits empty segment filters and preserves filled filters", async () => {
    const payload = { record_count: 4, records: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getMarketSegments({
        minPrice: 200000,
        maxPrice: undefined,
        minBedrooms: 3,
        maxBedrooms: undefined,
        minSchoolRating: 7,
        maxDistanceToCityCenter: undefined
      })
    ).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-analysis/segments?minPrice=200000&minBedrooms=3&minSchoolRating=7",
      { cache: "no-store" }
    );
  });

  it("submits what-if features through the same-origin proxy", async () => {
    const payload = {
      predicted_price: 250829.56,
      market_position: {
        percentile: 64.3,
        above_market_average: true,
        difference_from_average: 12345.67
      },
      nearest_records: []
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(runWhatIf(features)).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/what-if", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(features)
    });
  });

  it("throws backend error details from proxy responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "Market analysis backend is unavailable" }, { status: 502 })
      )
    );

    await expect(getMarketHealth()).rejects.toThrow(
      "Market analysis backend is unavailable"
    );
  });
});
