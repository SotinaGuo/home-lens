import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyBackendRequest("/health");
}
