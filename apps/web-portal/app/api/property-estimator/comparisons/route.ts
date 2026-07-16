import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyBackendRequest("/comparisons", {
    method: "POST",
    body: await request.text()
  });
}
