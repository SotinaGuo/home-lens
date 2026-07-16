import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyBackendRequest(`/estimates${search}`);
}

export async function POST(request: Request) {
  return proxyBackendRequest("/estimates", {
    method: "POST",
    body: await request.text()
  });
}
