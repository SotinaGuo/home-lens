import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyBackendRequest } from "./server-api";

describe("proxyBackendRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies success responses to the configured backend", async () => {
    vi.stubEnv("PROPERTY_ESTIMATOR_API_BASE_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyBackendRequest("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("preserves backend validation status and json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Invalid payload" }), {
          status: 422,
          headers: { "content-type": "application/json" }
        })
      )
    );

    const response = await proxyBackendRequest("/estimates", {
      method: "POST",
      body: JSON.stringify({ school_rating: 11 })
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ detail: "Invalid payload" });
  });

  it("maps backend connection failures to 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await proxyBackendRequest("/estimates");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: "Property estimator backend is unavailable"
    });
  });
});
