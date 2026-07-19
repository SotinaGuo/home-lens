import { proxyMarketBackendRequest } from "@/features/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyMarketBackendRequest("/market/summary");
}
