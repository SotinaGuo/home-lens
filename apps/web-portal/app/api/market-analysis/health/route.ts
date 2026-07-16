import { proxyMarketBackendRequest } from "@/lib/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyMarketBackendRequest("/health");
}
