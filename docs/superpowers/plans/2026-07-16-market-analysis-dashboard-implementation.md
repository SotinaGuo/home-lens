# Market Analysis Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the App 2 Property Market Analysis dashboard in `apps/web-portal` and connect it to the Java `market-analysis-api` through Next.js proxy routes.

**Architecture:** The browser calls same-origin `/api/market-analysis/*` helpers only. Next.js route handlers proxy those calls to `MARKET_ANALYSIS_API_BASE_URL`, defaulting to `http://localhost:8002`. UI state lives in a client dashboard component; typed library modules own schemas, formatting, browser API calls, and server proxy behavior.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts, Vitest.

## Global Constraints

- Service path must remain `apps/web-portal`.
- Build the App 2 frontend inside the existing Next.js App Router project.
- Browser code must call `/api/market-analysis/*`, not `market-analysis-api` directly.
- Java backend default URL must be `http://localhost:8002`.
- Java backend environment variable must be `MARKET_ANALYSIS_API_BASE_URL`.
- Do not add CSV export in this phase.
- Do not add PDF export in this phase.
- Do not add authentication or authorization.
- Do not add database persistence.
- Do not add cross-service Docker Compose.
- Use the current Java API contract: `/health`, `/market/summary`, `/market/segments`, `/market/what-if`.
- Add clear loading, empty, and error states.
- Run verification from `apps/web-portal`: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

---

## Planned File Structure

```text
apps/web-portal/
  app/
    market-analysis/
      page.tsx
    api/
      market-analysis/
        health/
          route.ts
        summary/
          route.ts
        segments/
          route.ts
        what-if/
          route.ts
    page.tsx
  components/
    market-analysis/
      market-dashboard.tsx
      market-health-card.tsx
      market-summary-cards.tsx
      price-bucket-chart.tsx
      property-record-table.tsx
      segment-filter-form.tsx
      segment-results.tsx
      what-if-form.tsx
      what-if-result.tsx
  lib/
    market-analysis/
      api.ts
      api.test.ts
      formatting.ts
      formatting.test.ts
      market-dashboard.test.tsx
      schemas.ts
      schemas.test.ts
      server-api.ts
      server-api.test.ts
      types.ts
  README.md
```

## File Responsibility Map

- `types.ts`: TypeScript types matching Java JSON response/request shapes.
- `schemas.ts`: Zod schemas and default values for segment filters and what-if form.
- `formatting.ts`: user-facing labels and number/currency/percent helpers.
- `api.ts`: browser-side same-origin fetch helpers.
- `server-api.ts`: Next.js server-side proxy helper with `MARKET_ANALYSIS_API_BASE_URL`.
- `app/api/market-analysis/*/route.ts`: thin route handlers forwarding to Java endpoints.
- `market-dashboard.tsx`: client component owning load/submit/filter state.
- Display components: focused presentation components for health, summary, chart, segment results, what-if result, and compact record tables.
- `app/market-analysis/page.tsx`: route page that renders the dashboard.
- `app/page.tsx`: updates home page copy from planned App 2 to active App 2.
- `README.md`: adds App 2 run instructions and environment variable.

---

### Task 1: Add market-analysis domain types, schemas, and formatting helpers

**Files:**
- Create: `apps/web-portal/lib/market-analysis/types.ts`
- Create: `apps/web-portal/lib/market-analysis/schemas.ts`
- Create: `apps/web-portal/lib/market-analysis/schemas.test.ts`
- Create: `apps/web-portal/lib/market-analysis/formatting.ts`
- Create: `apps/web-portal/lib/market-analysis/formatting.test.ts`

**Interfaces:**
- Produces type `PropertyFeatures`, shared with what-if API and forms.
- Produces type `MarketSummaryResponse`, consumed by summary cards and price chart.
- Produces type `MarketSegmentResponse`, consumed by segment results.
- Produces type `WhatIfResponse`, consumed by what-if result.
- Produces `segmentFilterSchema`, `whatIfSchema`, `defaultSegmentFilters`, `defaultWhatIfValues`.
- Produces formatting helpers `formatCurrency`, `formatNumber`, `formatPercent`, `formatSignedCurrency`, `marketFieldLabels`.

- [ ] **Step 1: Create the directory**

Run:

```bash
mkdir -p apps/web-portal/lib/market-analysis
```

Expected: directory exists.

- [ ] **Step 2: Write failing schema and formatting tests**

Create `apps/web-portal/lib/market-analysis/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  defaultSegmentFilters,
  defaultWhatIfValues,
  segmentFilterSchema,
  whatIfSchema
} from "./schemas";

describe("market analysis schemas", () => {
  it("accepts the default what-if values", () => {
    expect(whatIfSchema.parse(defaultWhatIfValues)).toEqual(defaultWhatIfValues);
  });

  it("rejects invalid what-if values with field-specific errors", () => {
    const result = whatIfSchema.safeParse({
      square_footage: 0,
      bedrooms: -1,
      bathrooms: -1,
      year_built: 1700,
      lot_size: 0,
      distance_to_city_center: -0.5,
      school_rating: 11
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.square_footage).toContain(
        "Square footage must be greater than 0"
      );
      expect(result.error.flatten().fieldErrors.school_rating).toContain(
        "School rating must be at most 10"
      );
    }
  });

  it("accepts empty segment filters", () => {
    expect(segmentFilterSchema.parse(defaultSegmentFilters)).toEqual(defaultSegmentFilters);
  });

  it("rejects segment ranges where minimum is greater than maximum", () => {
    const result = segmentFilterSchema.safeParse({
      minPrice: 500000,
      maxPrice: 250000,
      minBedrooms: 4,
      maxBedrooms: 2,
      minSchoolRating: 7,
      maxDistanceToCityCenter: 5
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.maxPrice).toContain("Maximum price must be greater than or equal to minimum price");
      expect(errors.maxBedrooms).toContain("Maximum bedrooms must be greater than or equal to minimum bedrooms");
    }
  });

  it("coerces string form values into numbers", () => {
    expect(
      whatIfSchema.parse({
        square_footage: "1550",
        bedrooms: "3",
        bathrooms: "2",
        year_built: "1997",
        lot_size: "6800",
        distance_to_city_center: "4.1",
        school_rating: "7.6"
      })
    ).toEqual(defaultWhatIfValues);
  });
});
```

Create `apps/web-portal/lib/market-analysis/formatting.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedCurrency,
  marketFieldLabels
} from "./formatting";

describe("market analysis formatting", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(250829.56)).toBe("$250,830");
  });

  it("formats signed currency differences", () => {
    expect(formatSignedCurrency(12345.4)).toBe("+$12,345");
    expect(formatSignedCurrency(-12345.4)).toBe("-$12,345");
  });

  it("formats compact numbers and percentages", () => {
    expect(formatNumber(1550.42)).toBe("1,550.4");
    expect(formatPercent(64.3)).toBe("64.3%");
  });

  it("exposes labels for Java API feature names", () => {
    expect(marketFieldLabels.square_footage).toBe("Square footage");
    expect(marketFieldLabels.distance_to_city_center).toBe("Distance to city center");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/schemas.test.ts lib/market-analysis/formatting.test.ts
```

Expected: FAIL because `schemas.ts` and `formatting.ts` do not exist yet.

- [ ] **Step 4: Implement types**

Create `apps/web-portal/lib/market-analysis/types.ts`:

```ts
export type StatisticSummary = {
  average: number;
  median: number;
  minimum: number;
  maximum: number;
};

export type PriceBucket = {
  label: string;
  count: number;
};

export type MarketSummaryResponse = {
  record_count: number;
  price: StatisticSummary;
  square_footage: StatisticSummary;
  bedrooms: StatisticSummary;
  bathrooms: StatisticSummary;
  school_rating: StatisticSummary;
  distance_to_city_center: StatisticSummary;
  price_buckets: PriceBucket[];
};

export type MarketFilters = {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minSchoolRating?: number;
  maxDistanceToCityCenter?: number;
};

export type PropertyFeatures = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type PropertyRecord = PropertyFeatures & {
  id: number;
  price: number;
};

export type MarketSegmentResponse = {
  filters: MarketFilters;
  record_count: number;
  statistics: MarketSummaryResponse;
  records: PropertyRecord[];
};

export type MarketHealthResponse = {
  status: string;
  service: string;
  records_loaded: number;
  ml_api_base_url: string;
};

export type MarketPosition = {
  percentile: number;
  above_market_average: boolean;
  difference_from_average: number;
};

export type WhatIfResponse = {
  predicted_price: number;
  market_position: MarketPosition;
  nearest_records: PropertyRecord[];
};

export type ApiErrorResponse = {
  detail: string;
};
```

- [ ] **Step 5: Implement schemas**

Create `apps/web-portal/lib/market-analysis/schemas.ts`:

```ts
import { z } from "zod";

const preprocessEmptyString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const optionalNumber = (schema: z.ZodNumber) =>
  preprocessEmptyString(schema.optional());

export const whatIfSchema = z.object({
  square_footage: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Square footage is required" })
      .positive("Square footage must be greater than 0")
  ),
  bedrooms: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Bedrooms is required" })
      .int("Bedrooms must be a whole number")
      .min(0, "Bedrooms cannot be negative")
  ),
  bathrooms: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Bathrooms is required" })
      .min(0, "Bathrooms cannot be negative")
  ),
  year_built: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Year built is required" })
      .int("Year built must be a whole number")
      .min(1800, "Year built must be 1800 or later")
      .max(2100, "Year built must be 2100 or earlier")
  ),
  lot_size: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Lot size is required" })
      .positive("Lot size must be greater than 0")
  ),
  distance_to_city_center: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "Distance to city center is required" })
      .min(0, "Distance cannot be negative")
  ),
  school_rating: preprocessEmptyString(
    z.coerce
      .number({ invalid_type_error: "School rating is required" })
      .min(0, "School rating must be at least 0")
      .max(10, "School rating must be at most 10")
  )
});

export const segmentFilterSchema = z
  .object({
    minPrice: optionalNumber(
      z.coerce.number().min(0, "Minimum price cannot be negative")
    ),
    maxPrice: optionalNumber(
      z.coerce.number().min(0, "Maximum price cannot be negative")
    ),
    minBedrooms: optionalNumber(
      z.coerce
        .number()
        .int("Minimum bedrooms must be a whole number")
        .min(0, "Minimum bedrooms cannot be negative")
    ),
    maxBedrooms: optionalNumber(
      z.coerce
        .number()
        .int("Maximum bedrooms must be a whole number")
        .min(0, "Maximum bedrooms cannot be negative")
    ),
    minSchoolRating: optionalNumber(
      z.coerce
        .number()
        .min(0, "Minimum school rating must be at least 0")
        .max(10, "Minimum school rating must be at most 10")
    ),
    maxDistanceToCityCenter: optionalNumber(
      z.coerce
        .number()
        .min(0, "Maximum distance cannot be negative")
    )
  })
  .superRefine((values, context) => {
    if (
      values.minPrice !== undefined &&
      values.maxPrice !== undefined &&
      values.minPrice > values.maxPrice
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "Maximum price must be greater than or equal to minimum price"
      });
    }

    if (
      values.minBedrooms !== undefined &&
      values.maxBedrooms !== undefined &&
      values.minBedrooms > values.maxBedrooms
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxBedrooms"],
        message: "Maximum bedrooms must be greater than or equal to minimum bedrooms"
      });
    }
  });

export type WhatIfFormValues = z.infer<typeof whatIfSchema>;
export type SegmentFilterFormValues = z.infer<typeof segmentFilterSchema>;

export const defaultWhatIfValues: WhatIfFormValues = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

export const defaultSegmentFilters: SegmentFilterFormValues = {
  minPrice: undefined,
  maxPrice: undefined,
  minBedrooms: undefined,
  maxBedrooms: undefined,
  minSchoolRating: undefined,
  maxDistanceToCityCenter: undefined
};
```

- [ ] **Step 6: Implement formatting helpers**

Create `apps/web-portal/lib/market-analysis/formatting.ts`:

```ts
export const marketFieldLabels = {
  square_footage: "Square footage",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  year_built: "Year built",
  lot_size: "Lot size",
  distance_to_city_center: "Distance to city center",
  school_rating: "School rating",
  price: "Price"
} as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/schemas.test.ts lib/market-analysis/formatting.test.ts
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/lib/market-analysis
git commit -m "feat: add market analysis domain helpers"
```

---

### Task 2: Add browser API helpers, server proxy, and Next.js API routes

**Files:**
- Create: `apps/web-portal/lib/market-analysis/api.ts`
- Create: `apps/web-portal/lib/market-analysis/api.test.ts`
- Create: `apps/web-portal/lib/market-analysis/server-api.ts`
- Create: `apps/web-portal/lib/market-analysis/server-api.test.ts`
- Create: `apps/web-portal/app/api/market-analysis/health/route.ts`
- Create: `apps/web-portal/app/api/market-analysis/summary/route.ts`
- Create: `apps/web-portal/app/api/market-analysis/segments/route.ts`
- Create: `apps/web-portal/app/api/market-analysis/what-if/route.ts`

**Interfaces:**
- Consumes Task 1 types.
- Produces browser helpers:
  - `getMarketHealth(): Promise<MarketHealthResponse>`
  - `getMarketSummary(): Promise<MarketSummaryResponse>`
  - `getMarketSegments(filters: MarketFilters): Promise<MarketSegmentResponse>`
  - `runWhatIf(features: PropertyFeatures): Promise<WhatIfResponse>`
- Produces server helper:
  - `proxyMarketBackendRequest(path: string, init?: ProxyMarketBackendInit): Promise<Response>`

- [ ] **Step 1: Write failing browser API tests**

Create `apps/web-portal/lib/market-analysis/api.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMarketHealth,
  getMarketSegments,
  getMarketSummary,
  runWhatIf
} from "./api";
import type { PropertyFeatures } from "./types";

const features: PropertyFeatures = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

describe("market analysis browser API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads health through the same-origin proxy", async () => {
    const payload = {
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMarketHealth()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/health", {
      cache: "no-store"
    });
  });

  it("loads summary through the same-origin proxy", async () => {
    const payload = { record_count: 50, price_buckets: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMarketSummary()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/summary", {
      cache: "no-store"
    });
  });

  it("omits empty segment filters and preserves filled filters", async () => {
    const payload = { record_count: 4, records: [] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getMarketSegments({
        minPrice: 200000,
        maxPrice: undefined,
        minBedrooms: 3,
        maxBedrooms: undefined,
        minSchoolRating: 7,
        maxDistanceToCityCenter: undefined
      })
    ).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-analysis/segments?minPrice=200000&minBedrooms=3&minSchoolRating=7",
      { cache: "no-store" }
    );
  });

  it("submits what-if features through the same-origin proxy", async () => {
    const payload = {
      predicted_price: 250829.56,
      market_position: {
        percentile: 64.3,
        above_market_average: true,
        difference_from_average: 12345.67
      },
      nearest_records: []
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(runWhatIf(features)).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/api/market-analysis/what-if", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(features)
    });
  });

  it("throws backend error details from proxy responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "Market analysis backend is unavailable" }, { status: 502 })
      )
    );

    await expect(getMarketHealth()).rejects.toThrow(
      "Market analysis backend is unavailable"
    );
  });
});
```

- [ ] **Step 2: Write failing server proxy and route tests**

Create `apps/web-portal/lib/market-analysis/server-api.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getSegmentsRoute } from "@/app/api/market-analysis/segments/route";
import { POST as postWhatIfRoute } from "@/app/api/market-analysis/what-if/route";
import { proxyMarketBackendRequest } from "./server-api";

describe("proxyMarketBackendRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies success responses to the configured market backend", async () => {
    vi.stubEnv("MARKET_ANALYSIS_API_BASE_URL", "http://market.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyMarketBackendRequest("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://market.test/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("uses localhost 8002 when env is unset", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await proxyMarketBackendRequest("/health");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8002/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("preserves backend validation status and json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ detail: "Invalid market filters" }, { status: 400 })
      )
    );

    const response = await proxyMarketBackendRequest("/market/segments?minBedrooms=-1");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ detail: "Invalid market filters" });
  });

  it("maps backend connection failures to 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await proxyMarketBackendRequest("/market/summary");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: "Market analysis backend is unavailable"
    });
  });

  it("maps abort errors to 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"))
    );

    const response = await proxyMarketBackendRequest("/market/summary");

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      detail: "Market analysis backend timed out"
    });
  });
});

describe("market analysis route handlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards segment query parameters to the Java endpoint", async () => {
    const proxySpy = vi
      .spyOn(await import("./server-api"), "proxyMarketBackendRequest")
      .mockResolvedValue(Response.json({ records: [] }));

    await getSegmentsRoute(
      new Request(
        "http://localhost:3000/api/market-analysis/segments?minBedrooms=3&minSchoolRating=7"
      )
    );

    expect(proxySpy).toHaveBeenCalledWith(
      "/market/segments?minBedrooms=3&minSchoolRating=7"
    );
  });

  it("forwards what-if JSON body to the Java endpoint", async () => {
    const proxySpy = vi
      .spyOn(await import("./server-api"), "proxyMarketBackendRequest")
      .mockResolvedValue(Response.json({ predicted_price: 250000 }));

    await postWhatIfRoute(
      new Request("http://localhost:3000/api/market-analysis/what-if", {
        method: "POST",
        body: JSON.stringify({ square_footage: 1550 })
      })
    );

    expect(proxySpy).toHaveBeenCalledWith("/market/what-if", {
      method: "POST",
      body: JSON.stringify({ square_footage: 1550 })
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/api.test.ts lib/market-analysis/server-api.test.ts
```

Expected: FAIL because API helpers and route files do not exist yet.

- [ ] **Step 4: Implement browser API helpers**

Create `apps/web-portal/lib/market-analysis/api.ts`:

```ts
import type {
  ApiErrorResponse,
  MarketFilters,
  MarketHealthResponse,
  MarketSegmentResponse,
  MarketSummaryResponse,
  PropertyFeatures,
  WhatIfResponse
} from "./types";

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    const detail =
      typeof (payload as ApiErrorResponse).detail === "string"
        ? (payload as ApiErrorResponse).detail
        : "Request failed";
    throw new Error(detail);
  }

  return payload as T;
}

function buildSegmentQuery(filters: MarketFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getMarketHealth(): Promise<MarketHealthResponse> {
  const response = await fetch("/api/market-analysis/health", {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketHealthResponse>(response);
}

export async function getMarketSummary(): Promise<MarketSummaryResponse> {
  const response = await fetch("/api/market-analysis/summary", {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketSummaryResponse>(response);
}

export async function getMarketSegments(
  filters: MarketFilters
): Promise<MarketSegmentResponse> {
  const response = await fetch(`/api/market-analysis/segments${buildSegmentQuery(filters)}`, {
    cache: "no-store"
  });

  return readJsonOrThrow<MarketSegmentResponse>(response);
}

export async function runWhatIf(features: PropertyFeatures): Promise<WhatIfResponse> {
  const response = await fetch("/api/market-analysis/what-if", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(features)
  });

  return readJsonOrThrow<WhatIfResponse>(response);
}
```

- [ ] **Step 5: Implement server proxy helper**

Create `apps/web-portal/lib/market-analysis/server-api.ts`:

```ts
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
```

- [ ] **Step 6: Implement Next.js route handlers**

Create `apps/web-portal/app/api/market-analysis/health/route.ts`:

```ts
import { proxyMarketBackendRequest } from "@/lib/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyMarketBackendRequest("/health");
}
```

Create `apps/web-portal/app/api/market-analysis/summary/route.ts`:

```ts
import { proxyMarketBackendRequest } from "@/lib/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyMarketBackendRequest("/market/summary");
}
```

Create `apps/web-portal/app/api/market-analysis/segments/route.ts`:

```ts
import { proxyMarketBackendRequest } from "@/lib/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { search } = new URL(request.url);

  return proxyMarketBackendRequest(`/market/segments${search}`);
}
```

Create `apps/web-portal/app/api/market-analysis/what-if/route.ts`:

```ts
import { proxyMarketBackendRequest } from "@/lib/market-analysis/server-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyMarketBackendRequest("/market/what-if", {
    method: "POST",
    body: await request.text()
  });
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/api.test.ts lib/market-analysis/server-api.test.ts
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/lib/market-analysis apps/web-portal/app/api/market-analysis
git commit -m "feat: add market analysis api proxy"
```

---

### Task 3: Add reusable market display components

**Files:**
- Create: `apps/web-portal/components/market-analysis/market-health-card.tsx`
- Create: `apps/web-portal/components/market-analysis/market-summary-cards.tsx`
- Create: `apps/web-portal/components/market-analysis/price-bucket-chart.tsx`
- Create: `apps/web-portal/components/market-analysis/property-record-table.tsx`

**Interfaces:**
- Consumes Task 1 types and formatting helpers.
- Produces pure display components:
  - `MarketHealthCard({ health, isLoading })`
  - `MarketSummaryCards({ summary })`
  - `PriceBucketChart({ buckets })`
  - `PropertyRecordTable({ records, title, emptyMessage })`

- [ ] **Step 1: Create component directory**

Run:

```bash
mkdir -p apps/web-portal/components/market-analysis
```

Expected: directory exists.

- [ ] **Step 2: Implement `MarketHealthCard`**

Create `apps/web-portal/components/market-analysis/market-health-card.tsx`:

```tsx
import type { MarketHealthResponse } from "@/lib/market-analysis/types";

type MarketHealthCardProps = {
  health: MarketHealthResponse | null;
  isLoading: boolean;
};

export function MarketHealthCard({ health, isLoading }: MarketHealthCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Market backend
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        {isLoading ? "Checking service..." : health?.status === "ok" ? "Online" : "Unavailable"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {health
          ? `${health.records_loaded} market records loaded · ML API ${health.ml_api_base_url}`
          : "Start market-analysis-api on port 8002 to load live market data."}
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Implement `MarketSummaryCards`**

Create `apps/web-portal/components/market-analysis/market-summary-cards.tsx`:

```tsx
import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { MarketSummaryResponse } from "@/lib/market-analysis/types";

type MarketSummaryCardsProps = {
  summary: MarketSummaryResponse | null;
};

export function MarketSummaryCards({ summary }: MarketSummaryCardsProps) {
  const cards = summary
    ? [
        ["Records", formatNumber(summary.record_count)],
        ["Average price", formatCurrency(summary.price.average)],
        ["Median price", formatCurrency(summary.price.median)],
        ["Lowest price", formatCurrency(summary.price.minimum)],
        ["Highest price", formatCurrency(summary.price.maximum)],
        ["Avg. school rating", formatNumber(summary.school_rating.average)]
      ]
    : [
        ["Records", "—"],
        ["Average price", "—"],
        ["Median price", "—"],
        ["Lowest price", "—"],
        ["Highest price", "—"],
        ["Avg. school rating", "—"]
      ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value]) => (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Implement `PriceBucketChart`**

Create `apps/web-portal/components/market-analysis/price-bucket-chart.tsx`:

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PriceBucket } from "@/lib/market-analysis/types";

type PriceBucketChartProps = {
  buckets: PriceBucket[];
};

export function PriceBucketChart({ buckets }: PriceBucketChartProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Price distribution
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Market price buckets</h2>
      </div>
      {buckets.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">No price bucket data available.</p>
      ) : (
        <div className="mt-6 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Implement `PropertyRecordTable`**

Create `apps/web-portal/components/market-analysis/property-record-table.tsx`:

```tsx
import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { PropertyRecord } from "@/lib/market-analysis/types";

type PropertyRecordTableProps = {
  records: PropertyRecord[];
  title: string;
  emptyMessage: string;
};

export function PropertyRecordTable({
  records,
  title,
  emptyMessage
}: PropertyRecordTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {records.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4 font-semibold">ID</th>
                <th className="py-2 pr-4 font-semibold">Price</th>
                <th className="py-2 pr-4 font-semibold">Sq ft</th>
                <th className="py-2 pr-4 font-semibold">Beds</th>
                <th className="py-2 pr-4 font-semibold">Baths</th>
                <th className="py-2 pr-4 font-semibold">School</th>
                <th className="py-2 pr-4 font-semibold">City distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 pr-4">{record.id}</td>
                  <td className="py-2 pr-4 font-semibold text-slate-950">
                    {formatCurrency(record.price)}
                  </td>
                  <td className="py-2 pr-4">{formatNumber(record.square_footage)}</td>
                  <td className="py-2 pr-4">{record.bedrooms}</td>
                  <td className="py-2 pr-4">{record.bathrooms}</td>
                  <td className="py-2 pr-4">{formatNumber(record.school_rating)}</td>
                  <td className="py-2 pr-4">
                    {formatNumber(record.distance_to_city_center)} mi
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Run typecheck and commit**

Run:

```bash
cd apps/web-portal
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/components/market-analysis
git commit -m "feat: add market display components"
```

---

### Task 4: Add segment filter form and segment results

**Files:**
- Create: `apps/web-portal/components/market-analysis/segment-filter-form.tsx`
- Create: `apps/web-portal/components/market-analysis/segment-results.tsx`

**Interfaces:**
- Consumes `segmentFilterSchema`, `defaultSegmentFilters`, `SegmentFilterFormValues`.
- Consumes `MarketSegmentResponse`.
- Produces `SegmentFilterForm({ isLoading, onSubmit })`.
- Produces `SegmentResults({ segment, isLoading })`.

- [ ] **Step 1: Implement `SegmentFilterForm`**

Create `apps/web-portal/components/market-analysis/segment-filter-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  defaultSegmentFilters,
  segmentFilterSchema,
  type SegmentFilterFormValues
} from "@/lib/market-analysis/schemas";

type SegmentFilterFormProps = {
  isLoading: boolean;
  onSubmit: (values: SegmentFilterFormValues) => Promise<void> | void;
};

export function SegmentFilterForm({ isLoading, onSubmit }: SegmentFilterFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<SegmentFilterFormValues>({
    resolver: zodResolver(segmentFilterSchema),
    defaultValues: defaultSegmentFilters
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Segment analysis
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Filter market records</h2>
        </div>
        <button
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => reset(defaultSegmentFilters)}
          type="button"
        >
          Reset
        </button>
      </div>
      <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Min price" error={errors.minPrice?.message}>
          <input className="input" inputMode="decimal" {...register("minPrice")} />
        </Field>
        <Field label="Max price" error={errors.maxPrice?.message}>
          <input className="input" inputMode="decimal" {...register("maxPrice")} />
        </Field>
        <Field label="Min bedrooms" error={errors.minBedrooms?.message}>
          <input className="input" inputMode="numeric" {...register("minBedrooms")} />
        </Field>
        <Field label="Max bedrooms" error={errors.maxBedrooms?.message}>
          <input className="input" inputMode="numeric" {...register("maxBedrooms")} />
        </Field>
        <Field label="Min school rating" error={errors.minSchoolRating?.message}>
          <input className="input" inputMode="decimal" {...register("minSchoolRating")} />
        </Field>
        <Field label="Max distance to city center" error={errors.maxDistanceToCityCenter?.message}>
          <input className="input" inputMode="decimal" {...register("maxDistanceToCityCenter")} />
        </Field>
        <div className="md:col-span-3">
          <button
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Filtering..." : "Apply filters"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  children,
  error,
  label
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
```

- [ ] **Step 2: Implement `SegmentResults`**

Create `apps/web-portal/components/market-analysis/segment-results.tsx`:

```tsx
import { formatCurrency, formatNumber } from "@/lib/market-analysis/formatting";
import type { MarketSegmentResponse } from "@/lib/market-analysis/types";
import { PropertyRecordTable } from "./property-record-table";

type SegmentResultsProps = {
  isLoading: boolean;
  segment: MarketSegmentResponse | null;
};

export function SegmentResults({ isLoading, segment }: SegmentResultsProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Loading filtered market segment...</p>
      </section>
    );
  }

  if (!segment) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Apply filters to inspect a focused market segment.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Matching records" value={formatNumber(segment.record_count)} />
        <Metric label="Average price" value={formatCurrency(segment.statistics.price.average)} />
        <Metric label="Median price" value={formatCurrency(segment.statistics.price.median)} />
        <Metric
          label="Avg. square footage"
          value={formatNumber(segment.statistics.square_footage.average)}
        />
      </section>
      <PropertyRecordTable
        emptyMessage="No matching records for these filters."
        records={segment.records}
        title="Matching market records"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck and commit**

Run:

```bash
cd apps/web-portal
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/components/market-analysis/segment-filter-form.tsx apps/web-portal/components/market-analysis/segment-results.tsx
git commit -m "feat: add market segment UI"
```

---

### Task 5: Add what-if form and result components

**Files:**
- Create: `apps/web-portal/components/market-analysis/what-if-form.tsx`
- Create: `apps/web-portal/components/market-analysis/what-if-result.tsx`

**Interfaces:**
- Consumes `whatIfSchema`, `defaultWhatIfValues`, `WhatIfFormValues`.
- Consumes `WhatIfResponse`.
- Produces `WhatIfForm({ isSubmitting, onSubmit })`.
- Produces `WhatIfResult({ result })`.

- [ ] **Step 1: Implement `WhatIfForm`**

Create `apps/web-portal/components/market-analysis/what-if-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  defaultWhatIfValues,
  whatIfSchema,
  type WhatIfFormValues
} from "@/lib/market-analysis/schemas";

type WhatIfFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: WhatIfFormValues) => Promise<void> | void;
};

const fields: Array<{
  name: keyof WhatIfFormValues;
  label: string;
  inputMode: "numeric" | "decimal";
}> = [
  { name: "square_footage", label: "Square footage", inputMode: "numeric" },
  { name: "bedrooms", label: "Bedrooms", inputMode: "numeric" },
  { name: "bathrooms", label: "Bathrooms", inputMode: "decimal" },
  { name: "year_built", label: "Year built", inputMode: "numeric" },
  { name: "lot_size", label: "Lot size", inputMode: "numeric" },
  { name: "distance_to_city_center", label: "Distance to city center", inputMode: "decimal" },
  { name: "school_rating", label: "School rating", inputMode: "decimal" }
];

export function WhatIfForm({ isSubmitting, onSubmit }: WhatIfFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<WhatIfFormValues>({
    resolver: zodResolver(whatIfSchema),
    defaultValues: defaultWhatIfValues
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        What-if analysis
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        Test a property against the market
      </h2>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        {fields.map((field) => (
          <label className="block" key={field.name}>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              className="input mt-1"
              inputMode={field.inputMode}
              {...register(field.name)}
            />
            {errors[field.name]?.message ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors[field.name]?.message}
              </span>
            ) : null}
          </label>
        ))}
        <div className="md:col-span-2">
          <button
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Running analysis..." : "Run what-if analysis"}
          </button>
        </div>
      </form>
    </section>
  );
}
```

- [ ] **Step 2: Implement `WhatIfResult`**

Create `apps/web-portal/components/market-analysis/what-if-result.tsx`:

```tsx
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency
} from "@/lib/market-analysis/formatting";
import type { WhatIfResponse } from "@/lib/market-analysis/types";
import { PropertyRecordTable } from "./property-record-table";

type WhatIfResultProps = {
  result: WhatIfResponse | null;
};

export function WhatIfResult({ result }: WhatIfResultProps) {
  if (!result) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">Prediction result</h3>
        <p className="mt-2 text-sm text-slate-600">
          Submit a property scenario to see predicted price and market position.
        </p>
      </section>
    );
  }

  const position = result.market_position;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Predicted price
        </p>
        <p className="mt-2 text-4xl font-bold text-brand-950">
          {formatCurrency(result.predicted_price)}
        </p>
        <p className="mt-3 text-sm text-brand-900">
          {position.above_market_average ? "Above" : "Below"} market average by{" "}
          {formatSignedCurrency(position.difference_from_average)} ·{" "}
          {formatPercent(position.percentile)} percentile
        </p>
      </section>
      <PropertyRecordTable
        emptyMessage="No nearest records returned."
        records={result.nearest_records}
        title="Nearest market records"
      />
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck and commit**

Run:

```bash
cd apps/web-portal
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/components/market-analysis/what-if-form.tsx apps/web-portal/components/market-analysis/what-if-result.tsx
git commit -m "feat: add market what-if UI"
```

---

### Task 6: Add market dashboard orchestration and tests

**Files:**
- Create: `apps/web-portal/components/market-analysis/market-dashboard.tsx`
- Create: `apps/web-portal/lib/market-analysis/market-dashboard.test.tsx`

**Interfaces:**
- Consumes Task 2 browser API helpers.
- Consumes Tasks 3–5 components.
- Produces `MarketDashboard()` client component.

- [ ] **Step 1: Write failing dashboard behavior test**

Create `apps/web-portal/lib/market-analysis/market-dashboard.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketDashboard } from "@/components/market-analysis/market-dashboard";
import * as api from "./api";

const statistic = {
  average: 250000,
  median: 245000,
  minimum: 150000,
  maximum: 400000
};

const summary = {
  record_count: 50,
  price: statistic,
  square_footage: statistic,
  bedrooms: statistic,
  bathrooms: statistic,
  school_rating: statistic,
  distance_to_city_center: statistic,
  price_buckets: [{ label: "$200k-$300k", count: 12 }]
};

describe("MarketDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads health and summary on initial render", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);

    render(<MarketDashboard />);

    await expect(screen.findByText("Online")).resolves.toBeInTheDocument();
    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });

  it("shows a clear error when initial market data cannot load", async () => {
    vi.spyOn(api, "getMarketHealth").mockRejectedValue(new Error("Market analysis backend is unavailable"));
    vi.spyOn(api, "getMarketSummary").mockRejectedValue(new Error("Market analysis backend is unavailable"));

    render(<MarketDashboard />);

    await expect(
      screen.findByText("Market analysis backend is unavailable")
    ).resolves.toBeInTheDocument();
  });

  it("submits segment filters and renders matching record count", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);
    vi.spyOn(api, "getMarketSegments").mockResolvedValue({
      filters: { minBedrooms: 3 },
      record_count: 8,
      statistics: summary,
      records: []
    });

    render(<MarketDashboard />);

    await screen.findByText("Online");
    await userEvent.type(screen.getByLabelText("Min bedrooms"), "3");
    await userEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await expect(screen.findByText("8")).resolves.toBeInTheDocument();
  });

  it("submits what-if values and renders predicted price", async () => {
    vi.spyOn(api, "getMarketHealth").mockResolvedValue({
      status: "ok",
      service: "market-analysis-api",
      records_loaded: 50,
      ml_api_base_url: "http://localhost:8000"
    });
    vi.spyOn(api, "getMarketSummary").mockResolvedValue(summary);
    vi.spyOn(api, "runWhatIf").mockResolvedValue({
      predicted_price: 275000,
      market_position: {
        percentile: 64.3,
        above_market_average: true,
        difference_from_average: 25000
      },
      nearest_records: []
    });

    render(<MarketDashboard />);

    await screen.findByText("Online");
    await userEvent.click(screen.getByRole("button", { name: "Run what-if analysis" }));

    await expect(screen.findByText("$275,000")).resolves.toBeInTheDocument();
  });
});
```

If `toBeInTheDocument` is unavailable, add this import at the top of the test file:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/market-dashboard.test.tsx
```

Expected: FAIL because `MarketDashboard` does not exist yet.

- [ ] **Step 3: Implement `MarketDashboard`**

Create `apps/web-portal/components/market-analysis/market-dashboard.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMarketHealth,
  getMarketSegments,
  getMarketSummary,
  runWhatIf
} from "@/lib/market-analysis/api";
import type {
  MarketHealthResponse,
  MarketSegmentResponse,
  MarketSummaryResponse,
  WhatIfResponse
} from "@/lib/market-analysis/types";
import type {
  SegmentFilterFormValues,
  WhatIfFormValues
} from "@/lib/market-analysis/schemas";
import { MarketHealthCard } from "./market-health-card";
import { MarketSummaryCards } from "./market-summary-cards";
import { PriceBucketChart } from "./price-bucket-chart";
import { SegmentFilterForm } from "./segment-filter-form";
import { SegmentResults } from "./segment-results";
import { WhatIfForm } from "./what-if-form";
import { WhatIfResult } from "./what-if-result";

export function MarketDashboard() {
  const [health, setHealth] = useState<MarketHealthResponse | null>(null);
  const [summary, setSummary] = useState<MarketSummaryResponse | null>(null);
  const [segment, setSegment] = useState<MarketSegmentResponse | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSegmentLoading, setIsSegmentLoading] = useState(false);
  const [isWhatIfSubmitting, setIsWhatIfSubmitting] = useState(false);

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setErrorMessage(null);

    try {
      const [healthResponse, summaryResponse] = await Promise.all([
        getMarketHealth(),
        getMarketSummary()
      ]);
      setHealth(healthResponse);
      setSummary(summaryResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load market data"
      );
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  async function handleSegmentSubmit(values: SegmentFilterFormValues) {
    setIsSegmentLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMarketSegments(values);
      setSegment(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load market segment"
      );
    } finally {
      setIsSegmentLoading(false);
    }
  }

  async function handleWhatIfSubmit(values: WhatIfFormValues) {
    setIsWhatIfSubmitting(true);
    setErrorMessage(null);
    setWhatIfResult(null);

    try {
      const response = await runWhatIf(values);
      setWhatIfResult(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to run what-if analysis"
      );
    } finally {
      setIsWhatIfSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <MarketHealthCard health={health} isLoading={isInitialLoading} />
      <MarketSummaryCards summary={summary} />
      <PriceBucketChart buckets={summary?.price_buckets ?? []} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SegmentFilterForm isLoading={isSegmentLoading} onSubmit={handleSegmentSubmit} />
        <SegmentResults isLoading={isSegmentLoading} segment={segment} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <WhatIfForm isSubmitting={isWhatIfSubmitting} onSubmit={handleWhatIfSubmit} />
        <WhatIfResult result={whatIfResult} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run dashboard test and fix expected JSDOM issues**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/market-dashboard.test.tsx
```

Expected: PASS.

If Recharts `ResponsiveContainer` warns about zero width in JSDOM but tests pass, leave it. If it breaks rendering, mock Recharts at the top of `market-dashboard.test.tsx`:

```tsx
vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null
}));
```

- [ ] **Step 5: Run focused verification and commit**

Run:

```bash
cd apps/web-portal
npm run test -- lib/market-analysis/market-dashboard.test.tsx
npm run typecheck
```

Expected: PASS.

Commit:

```bash
git add apps/web-portal/components/market-analysis/market-dashboard.tsx apps/web-portal/lib/market-analysis/market-dashboard.test.tsx
git commit -m "feat: orchestrate market dashboard"
```

---

### Task 7: Integrate dashboard route, update copy and README, run full verification

**Files:**
- Modify: `apps/web-portal/app/market-analysis/page.tsx`
- Modify: `apps/web-portal/app/page.tsx`
- Modify: `apps/web-portal/README.md`

**Interfaces:**
- Consumes `MarketDashboard`.
- Produces active `/market-analysis` route.
- Produces README instructions for four-service local demo.

- [ ] **Step 1: Replace `/market-analysis` route content**

Modify `apps/web-portal/app/market-analysis/page.tsx`:

```tsx
import { MarketDashboard } from "@/components/market-analysis/market-dashboard";

export default function MarketAnalysisPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          App 2
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Property Market Analysis
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Explore aggregate market statistics, filter comparable property
          segments, and test what-if scenarios through the Java Spring Boot
          market analysis backend.
        </p>
      </section>
      <MarketDashboard />
    </main>
  );
}
```

- [ ] **Step 2: Update home page App 2 copy**

Modify the second item in `apps/web-portal/app/page.tsx`:

```ts
{
  title: "Property Market Analysis",
  status: "Live Java module",
  description:
    "Explore market statistics, filter comparable property segments, and run what-if analysis through the Java backend.",
  href: "/market-analysis"
}
```

Also update the hero paragraph to remove the old “App 2 is not active yet” wording:

```tsx
HomeLens demonstrates a fullstack housing analytics workflow. App 1 estimates
individual property values through the Python backend; App 2 explores market
segments through the Java Spring Boot backend.
```

- [ ] **Step 3: Update README environment variables and demo instructions**

Modify `apps/web-portal/README.md`.

Change “What this module includes” App 2 bullet to:

```markdown
- App 2 Property Market Analysis dashboard connected through a Next.js proxy.
```

Add Terminal 3 before starting the portal:

```markdown
Terminal 3: start `market-analysis-api`.

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run
```

Terminal 4: start this portal.

```bash
cd apps/web-portal
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002 npm run dev
```
```

Update environment variables:

```text
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001
MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002
```

Add App 2 demo flow:

```markdown
## App 2 demo flow

1. Open the portal home page.
2. Navigate to Property Market Analysis.
3. Confirm the service status card reports loaded records.
4. Confirm market summary cards and the price bucket chart render.
5. Apply a segment filter such as minimum bedrooms `3` and minimum school rating `7`.
6. Submit the default what-if form.
7. Confirm the predicted price, market position, and nearest records render.
```

Remove the old note saying App 2 is not active yet.

- [ ] **Step 4: Run all web checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all PASS.

- [ ] **Step 5: Commit integration**

Commit:

```bash
git add apps/web-portal/app/market-analysis/page.tsx apps/web-portal/app/page.tsx apps/web-portal/README.md
git commit -m "feat: connect market dashboard route"
```

- [ ] **Step 6: Manual smoke test**

Start services:

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run
```

```bash
cd apps/web-portal
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002 npm run dev
```

Open:

```text
http://localhost:3000/market-analysis
```

Verify:

- Service status card shows Java API online.
- Summary cards show 50 records.
- Price bucket chart renders.
- Segment filter with `minBedrooms=3` and `minSchoolRating=7` returns records or a clear empty state.
- What-if default form returns predicted price and nearest records.

Commit only if any smoke-test-specific docs or fixes are needed.

---

## Final Verification

Before reporting completion, run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test
npm run build
```

Also run:

```bash
cd apps/market-analysis-api
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home mvn test
```

Expected:

- Web lint passes with zero warnings.
- Web typecheck passes.
- Web tests pass.
- Web production build succeeds.
- Java market analysis API tests pass.

## Handoff Notes

- Do not stage `.DS_Store` or `.idea/`.
- Keep commits small and task-aligned.
- If a task exposes a real bug in existing property-estimator code, stop and report the bug before broad refactoring.
- If GitHub push is needed after completion, push the current feature branch first and decide whether to merge locally or open a PR.
