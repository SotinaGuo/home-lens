export type ProxyBackendInit = {
  method?: "GET" | "POST";
  body?: string;
};

const DEFAULT_BACKEND_URL = "http://localhost:8001";

function getBackendBaseUrl(): string {
  return (process.env.PROPERTY_ESTIMATOR_API_BASE_URL ?? DEFAULT_BACKEND_URL).replace(
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

export async function proxyBackendRequest(
  path: string,
  init: ProxyBackendInit = {}
): Promise<Response> {
  const method = init.method ?? "GET";
  const targetUrl = `${getBackendBaseUrl()}${path}`;

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
      cache: "no-store"
    });

    const text = await backendResponse.text();
    const payload = text.length > 0 ? JSON.parse(text) : null;

    return jsonResponse(payload, backendResponse.status);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonResponse({ detail: "Property estimator backend timed out" }, 504);
    }

    return jsonResponse({ detail: "Property estimator backend is unavailable" }, 502);
  }
}
