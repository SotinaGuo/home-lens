import { proxyBackendRequest } from "@/features/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyBackendRequest("/health");
}
