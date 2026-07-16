export type ProxyMarketBackendInit = {
  method?: "GET" | "POST";
  body?: string;
};

const DEFAULT_BACKEND_URL = "http://localhost:8002";
const MARKET_PROXY_TIMEOUT_MS = 8000;

function getBackendBaseUrl(): string {
  return (process.env.MARKET_ANALYSIS_API_BASE_URL ?? DEFAULT_BACKEND_URL).replace(
    /\/$/,
    ""
  );
}

function jsonResponse(payload: unknown, status: number): Response {
  return Response.json(payload, {
    status,
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function proxyMarketBackendRequest(
  path: string,
  init: ProxyMarketBackendInit = {}
): Promise<Response> {
  const method = init.method ?? "GET";
  const targetUrl = `${getBackendBaseUrl()}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MARKET_PROXY_TIMEOUT_MS);

  try {
    const backendResponse = await fetch(targetUrl, {
      method,
      body: init.body,
      headers:
        init.body === undefined
          ? undefined
          : {
              "content-type": "application/json"
            },
      cache: "no-store",
      signal: controller.signal
    });

    const text = await backendResponse.text();
    const payload = text.length > 0 ? JSON.parse(text) : null;

    return jsonResponse(payload, backendResponse.status);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonResponse({ detail: "Market analysis backend timed out" }, 504);
    }

    return jsonResponse({ detail: "Market analysis backend is unavailable" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
