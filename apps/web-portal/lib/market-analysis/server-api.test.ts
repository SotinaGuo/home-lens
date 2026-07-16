import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getSegmentsRoute } from "@/app/api/market-analysis/segments/route";
import { POST as postWhatIfRoute } from "@/app/api/market-analysis/what-if/route";
import { proxyMarketBackendRequest } from "./server-api";

describe("proxyMarketBackendRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies success responses to the configured market backend", async () => {
    vi.stubEnv("MARKET_ANALYSIS_API_BASE_URL", "http://market.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyMarketBackendRequest("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://market.test/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("uses localhost 8002 when env is unset", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await proxyMarketBackendRequest("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8002/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("preserves backend validation status and json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "Invalid market filters" }, { status: 400 })
      )
    );

    const response = await proxyMarketBackendRequest("/market/segments?minBedrooms=-1");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ detail: "Invalid market filters" });
  });

  it("maps backend connection failures to 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await proxyMarketBackendRequest("/market/summary");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: "Market analysis backend is unavailable"
    });
  });

  it("maps abort errors to 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"))
    );

    const response = await proxyMarketBackendRequest("/market/summary");

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      detail: "Market analysis backend timed out"
    });
  });
});

describe("market analysis route handlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards segment query parameters to the Java endpoint", async () => {
    const proxySpy = vi
      .spyOn(await import("./server-api"), "proxyMarketBackendRequest")
      .mockResolvedValue(Response.json({ records: [] }));

    await getSegmentsRoute(
      new Request(
        "http://localhost:3000/api/market-analysis/segments?minBedrooms=3&minSchoolRating=7"
      )
    );

    expect(proxySpy).toHaveBeenCalledWith(
      "/market/segments?minBedrooms=3&minSchoolRating=7"
    );
  });

  it("forwards what-if JSON body to the Java endpoint", async () => {
    const proxySpy = vi
      .spyOn(await import("./server-api"), "proxyMarketBackendRequest")
      .mockResolvedValue(Response.json({ predicted_price: 250000 }));

    await postWhatIfRoute(
      new Request("http://localhost:3000/api/market-analysis/what-if", {
        method: "POST",
        body: JSON.stringify({ square_footage: 1550 })
      })
    );

    expect(proxySpy).toHaveBeenCalledWith("/market/what-if", {
      method: "POST",
      body: JSON.stringify({ square_footage: 1550 })
    });
  });
});
