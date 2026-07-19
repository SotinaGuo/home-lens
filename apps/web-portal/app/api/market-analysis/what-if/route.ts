import { proxyMarketBackendRequest } from "@/features/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyMarketBackendRequest("/market/what-if", {
    method: "POST",
    body: await request.text()
  });
}
