import { afterEach, describe, expect, it, vi } from "vitest";
import { compareEstimates, createEstimate, listEstimates } from "./api";
import type { PropertyFeatures } from "./types";

const propertyFeatures: PropertyFeatures = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

describe("property estimator browser API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates estimates through the same-origin Next.js proxy", async () => {
    const estimate = {
      id: "estimate-1",
      features: propertyFeatures,
      predicted_price: 250829.56,
      created_at: "2026-07-16T01:30:00.000Z"
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(estimate));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createEstimate(propertyFeatures)).resolves.toEqual(estimate);
    expect(fetchMock).toHaveBeenCalledWith("/api/property-estimator/estimates", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(propertyFeatures)
    });
  });

  it("lists estimates through the same-origin Next.js proxy without caching", async () => {
    const response = {
      items: [
        {
          id: "estimate-1",
          features: propertyFeatures,
          predicted_price: 250829.56,
          created_at: "2026-07-16T01:30:00.000Z"
        }
      ]
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(response));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listEstimates()).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/property-estimator/estimates", {
      cache: "no-store"
    });
  });

  it("compares estimates through the same-origin Next.js proxy with selected ids", async () => {
    const comparison = {
      items: [
        {
          id: "estimate-1",
          features: propertyFeatures,
          predicted_price: 250829.56,
          created_at: "2026-07-16T01:30:00.000Z"
        },
        {
          id: "estimate-2",
          features: {
            ...propertyFeatures,
            bedrooms: 4,
            square_footage: 2200
          },
          predicted_price: 325100.12,
          created_at: "2026-07-16T01:45:00.000Z"
        }
      ],
      highest_price: 325100.12,
      lowest_price: 250829.56,
      price_difference: 74270.56
    };
    const request = { estimate_ids: ["estimate-1", "estimate-2"] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(comparison));
    vi.stubGlobal("fetch", fetchMock);

    await expect(compareEstimates(request)).resolves.toEqual(comparison);
    expect(fetchMock).toHaveBeenCalledWith("/api/property-estimator/comparisons", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(request)
    });
  });

  it("propagates comparison error details from the proxy response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "At least two estimates are required" }, { status: 400 })
      )
    );

    await expect(
      compareEstimates({ estimate_ids: ["estimate-1"] })
    ).rejects.toThrow("At least two estimates are required");
  });

  it("throws backend error details when the proxy response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "Invalid property features" }, { status: 422 })
      )
    );

    await expect(createEstimate(propertyFeatures)).rejects.toThrow(
      "Invalid property features"
    );
  });

  it("throws a fallback message when an error response has no detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "No detail" }, { status: 500 }))
    );

    await expect(listEstimates()).rejects.toThrow("Request failed");
  });
});
