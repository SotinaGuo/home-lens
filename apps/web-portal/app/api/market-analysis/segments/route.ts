import { proxyMarketBackendRequest } from "@/features/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyMarketBackendRequest(`/market/segments${search}`);
}
