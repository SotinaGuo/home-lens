# Web Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/web-portal`, a Next.js App Router portal with shared navigation, App 1 Property Value Estimator frontend, Next.js API proxy, and an App 2 placeholder route.

**Architecture:** The portal is a standalone Next.js app under `apps/web-portal`. Browser components call same-origin `/api/property-estimator/*` routes; those server route handlers proxy to `property-estimator-api` through `PROPERTY_ESTIMATOR_API_BASE_URL`, defaulting to `http://localhost:8001`. Domain types, Zod schemas, formatting helpers, proxy helpers, and UI components stay separated so each part can be tested independently.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts, Vitest.

## Global Constraints

- Build only the `web-portal` module in this phase.
- Service path must be `apps/web-portal`.
- Implement App 1 Property Value Estimator frontend.
- Add App 2 Property Market Analysis as a truthful placeholder route only.
- Do not build the Java Spring Boot backend for App 2 in this phase.
- Do not build the full App 2 market analysis dashboard in this phase.
- Do not add CSV or PDF export in this phase.
- Do not add authentication or authorization in this phase.
- Do not add cross-service Docker Compose in this phase.
- Do not add persistent browser-side or database-backed history in this phase.
- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS.
- Use React Hook Form and Zod for the property form.
- Use Recharts for simple charts.
- Browser code must call the Next.js proxy, not `property-estimator-api` directly.
- The proxy default backend URL must be `http://localhost:8001`.
- The proxy backend environment variable must be `PROPERTY_ESTIMATOR_API_BASE_URL`.
- The portal should run locally on port `3000`.
- The live demo requires `ml-api` on port `8000`, `property-estimator-api` on port `8001`, and `web-portal` on port `3000`.
- History is owned by `property-estimator-api` process memory and clears when that backend restarts.

---

## Planned File Structure

```text
apps/
  web-portal/
    .gitignore
    README.md
    eslint.config.mjs
    next-env.d.ts
    next.config.ts
    package.json
    postcss.config.mjs
    tailwind.config.ts
    tsconfig.json
    vitest.config.ts
    app/
      globals.css
      layout.tsx
      page.tsx
      market-analysis/
        page.tsx
      property-estimator/
        page.tsx
      api/
        property-estimator/
          comparisons/
            route.ts
          estimates/
            route.ts
            [id]/
              route.ts
          health/
            route.ts
    components/
      app-shell.tsx
      nav-link.tsx
      property-estimator/
        estimate-comparison.tsx
        estimate-form.tsx
        estimate-history.tsx
        estimate-result-card.tsx
        estimator-dashboard.tsx
        feature-chart.tsx
    lib/
      property-estimator/
        api.ts
        formatting.test.ts
        formatting.ts
        schemas.test.ts
        schemas.ts
        server-api.test.ts
        server-api.ts
        types.ts
```

## File Responsibility Map

- `apps/web-portal/package.json`: dependencies, scripts, and package metadata.
- `apps/web-portal/tsconfig.json`: strict TypeScript and `@/*` path alias.
- `apps/web-portal/eslint.config.mjs`: Next.js lint rules through ESLint flat config.
- `apps/web-portal/vitest.config.ts`: Vitest setup for library tests.
- `apps/web-portal/tailwind.config.ts`: Tailwind content paths and design tokens.
- `apps/web-portal/app/layout.tsx`: root HTML shell, metadata, and shared app shell.
- `apps/web-portal/app/page.tsx`: home/overview page.
- `apps/web-portal/app/globals.css`: Tailwind directives and dashboard base styles.
- `apps/web-portal/app/property-estimator/page.tsx`: App 1 route-level page.
- `apps/web-portal/app/market-analysis/page.tsx`: App 2 placeholder route.
- `apps/web-portal/app/api/property-estimator/*/route.ts`: Next.js API proxy routes.
- `apps/web-portal/components/app-shell.tsx`: top-level visual frame and navigation.
- `apps/web-portal/components/nav-link.tsx`: active navigation link.
- `apps/web-portal/components/property-estimator/*.tsx`: App 1 UI components.
- `apps/web-portal/lib/property-estimator/types.ts`: API-aligned TypeScript types.
- `apps/web-portal/lib/property-estimator/schemas.ts`: Zod form/request schemas.
- `apps/web-portal/lib/property-estimator/formatting.ts`: display labels and formatters.
- `apps/web-portal/lib/property-estimator/api.ts`: browser-side same-origin API helpers.
- `apps/web-portal/lib/property-estimator/server-api.ts`: server-side proxy helper used by route handlers.
- `apps/web-portal/lib/property-estimator/*.test.ts`: Vitest unit tests.

---

### Task 1: Scaffold the Next.js web portal

**Files:**
- Create: `apps/web-portal/.gitignore`
- Create: `apps/web-portal/package.json`
- Create: `apps/web-portal/tsconfig.json`
- Create: `apps/web-portal/next.config.ts`
- Create: `apps/web-portal/next-env.d.ts`
- Create: `apps/web-portal/postcss.config.mjs`
- Create: `apps/web-portal/tailwind.config.ts`
- Create: `apps/web-portal/eslint.config.mjs`
- Create: `apps/web-portal/vitest.config.ts`
- Create: `apps/web-portal/app/globals.css`
- Create: `apps/web-portal/app/layout.tsx`
- Create: `apps/web-portal/app/page.tsx`

**Interfaces:**
- Consumes: repository `apps/` monorepo structure.
- Produces: installable Next.js app with `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` scripts.

- [ ] **Step 1: Create directories**

Run:

```bash
mkdir -p apps/web-portal/app apps/web-portal/components apps/web-portal/lib/property-estimator
```

Expected: `apps/web-portal` directory exists.

- [ ] **Step 2: Create `.gitignore`**

Create `apps/web-portal/.gitignore`:

```gitignore
.next/
node_modules/
coverage/
dist/
.env.local
.env*.local
*.tsbuildinfo
```

- [ ] **Step 3: Create `package.json`**

Create `apps/web-portal/package.json`:

```json
{
  "name": "web-portal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.0.1",
    "next": "^15.5.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.60.0",
    "recharts": "^2.15.4",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.16.5",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.31.0",
    "eslint-config-next": "^15.5.0",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 4: Create TypeScript and framework config files**

Create `apps/web-portal/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `apps/web-portal/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
```

Create `apps/web-portal/next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is generated conventionally for Next.js TypeScript projects.
// Keep it committed so typecheck works before the first local dev run.
```

Create `apps/web-portal/postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `apps/web-portal/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          600: "#2563eb",
          700: "#1d4ed8"
        }
      }
    }
  },
  plugins: []
};

export default config;
```

Create `apps/web-portal/eslint.config.mjs`:

```js
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"]
  }
];

export default eslintConfig;
```

Create `apps/web-portal/vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["lib/**/*.test.ts", "lib/**/*.test.tsx"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 5: Create base app files**

Create `apps/web-portal/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  background: #f8fafc;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}
```

Create `apps/web-portal/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing Intelligence Portal",
  description: "Unified portal for property valuation and market analysis demos"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/web-portal/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Housing Intelligence Portal
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        A unified portal for property valuation demos.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        App 1 connects to the Python property estimator backend. App 2 is kept as
        a scoped placeholder until the Java market analysis backend is built.
      </p>
    </main>
  );
}
```

- [ ] **Step 6: Install dependencies**

Run:

```bash
cd apps/web-portal
npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 7: Run baseline checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test -- --passWithNoTests
npm run build
```

Expected:

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test -- --passWithNoTests` passes during the scaffold phase where no tests exist yet.
- `npm run build` succeeds and creates `.next/`.

- [ ] **Step 8: Commit scaffold**

```bash
git add apps/web-portal
git commit -m "chore: scaffold web portal"
```

---

### Task 2: Add property estimator domain types, schemas, formatting, and tests

**Files:**
- Create: `apps/web-portal/lib/property-estimator/types.ts`
- Create: `apps/web-portal/lib/property-estimator/schemas.ts`
- Create: `apps/web-portal/lib/property-estimator/formatting.ts`
- Create: `apps/web-portal/lib/property-estimator/schemas.test.ts`
- Create: `apps/web-portal/lib/property-estimator/formatting.test.ts`

**Interfaces:**
- Consumes: no app-specific runtime code from Task 1.
- Produces:
  - `PropertyFeatures`
  - `EstimateRecord`
  - `EstimateListResponse`
  - `ComparisonResponse`
  - `propertyFeatureSchema`
  - `defaultPropertyValues`
  - `formatCurrency(value: number) -> string`
  - `formatNumber(value: number) -> string`
  - `featureLabels`

- [ ] **Step 1: Write failing schema and formatting tests**

Create `apps/web-portal/lib/property-estimator/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { propertyFeatureSchema } from "./schemas";

const validPayload = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};

describe("propertyFeatureSchema", () => {
  it("accepts valid property features", () => {
    const result = propertyFeatureSchema.parse(validPayload);

    expect(result.square_footage).toBe(1550);
    expect(result.school_rating).toBe(7.6);
  });

  it("coerces numeric form input strings", () => {
    const result = propertyFeatureSchema.parse({
      ...validPayload,
      square_footage: "1550",
      bedrooms: "3",
      bathrooms: "2"
    });

    expect(result.square_footage).toBe(1550);
    expect(result.bedrooms).toBe(3);
    expect(result.bathrooms).toBe(2);
  });

  it("rejects invalid school rating", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      school_rating: 11
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive square footage", () => {
    const result = propertyFeatureSchema.safeParse({
      ...validPayload,
      square_footage: 0
    });

    expect(result.success).toBe(false);
  });
});
```

Create `apps/web-portal/lib/property-estimator/formatting.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { featureLabels, formatCurrency, formatNumber } from "./formatting";

describe("formatting helpers", () => {
  it("formats currency for predicted prices", () => {
    expect(formatCurrency(250829.56)).toBe("$250,829.56");
  });

  it("formats compact feature numbers", () => {
    expect(formatNumber(6800)).toBe("6,800");
  });

  it("exposes human-readable labels for all model fields", () => {
    expect(featureLabels.square_footage).toBe("Square footage");
    expect(featureLabels.distance_to_city_center).toBe("Distance to city center");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd apps/web-portal
npm run test -- lib/property-estimator/schemas.test.ts lib/property-estimator/formatting.test.ts
```

Expected: FAIL because `schemas.ts` and `formatting.ts` do not exist yet.

- [ ] **Step 3: Add TypeScript API types**

Create `apps/web-portal/lib/property-estimator/types.ts`:

```ts
export type PropertyFeatures = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type EstimateRecord = {
  id: string;
  features: PropertyFeatures;
  predicted_price: number;
  created_at: string;
};

export type EstimateListResponse = {
  items: EstimateRecord[];
};

export type ComparisonRequest = {
  estimate_ids: string[];
};

export type ComparisonResponse = {
  items: EstimateRecord[];
  highest_price: number;
  lowest_price: number;
  price_difference: number;
};

export type HealthResponse = {
  status: string;
  service: string;
  ml_api_base_url: string;
};

export type ApiErrorResponse = {
  detail: string;
};
```

- [ ] **Step 4: Add Zod schemas**

Create `apps/web-portal/lib/property-estimator/schemas.ts`:

```ts
import { z } from "zod";

export const propertyFeatureSchema = z.object({
  square_footage: z.coerce
    .number({ invalid_type_error: "Square footage is required" })
    .positive("Square footage must be greater than 0"),
  bedrooms: z.coerce
    .number({ invalid_type_error: "Bedrooms is required" })
    .int("Bedrooms must be a whole number")
    .min(0, "Bedrooms cannot be negative"),
  bathrooms: z.coerce
    .number({ invalid_type_error: "Bathrooms is required" })
    .min(0, "Bathrooms cannot be negative"),
  year_built: z.coerce
    .number({ invalid_type_error: "Year built is required" })
    .int("Year built must be a whole number")
    .min(1800, "Year built must be 1800 or later")
    .max(2100, "Year built must be 2100 or earlier"),
  lot_size: z.coerce
    .number({ invalid_type_error: "Lot size is required" })
    .positive("Lot size must be greater than 0"),
  distance_to_city_center: z.coerce
    .number({ invalid_type_error: "Distance to city center is required" })
    .min(0, "Distance cannot be negative"),
  school_rating: z.coerce
    .number({ invalid_type_error: "School rating is required" })
    .min(0, "School rating must be at least 0")
    .max(10, "School rating must be at most 10")
});

export type PropertyFeatureFormValues = z.infer<typeof propertyFeatureSchema>;

export const defaultPropertyValues: PropertyFeatureFormValues = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6
};
```

- [ ] **Step 5: Add formatting helpers**

Create `apps/web-portal/lib/property-estimator/formatting.ts`:

```ts
import type { PropertyFeatures } from "./types";

export const featureLabels: Record<keyof PropertyFeatures, string> = {
  square_footage: "Square footage",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  year_built: "Year built",
  lot_size: "Lot size",
  distance_to_city_center: "Distance to city center",
  school_rating: "School rating"
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
```

- [ ] **Step 6: Run focused and full checks**

Run:

```bash
cd apps/web-portal
npm run test -- lib/property-estimator/schemas.test.ts lib/property-estimator/formatting.test.ts
npm run typecheck
```

Expected: tests and typecheck PASS.

- [ ] **Step 7: Commit domain helpers**

```bash
git add apps/web-portal/lib/property-estimator
git commit -m "feat: add web portal property estimator domain helpers"
```

---

### Task 3: Add Next.js API proxy route handlers

**Files:**
- Create: `apps/web-portal/lib/property-estimator/server-api.ts`
- Create: `apps/web-portal/lib/property-estimator/server-api.test.ts`
- Create: `apps/web-portal/app/api/property-estimator/health/route.ts`
- Create: `apps/web-portal/app/api/property-estimator/estimates/route.ts`
- Create: `apps/web-portal/app/api/property-estimator/estimates/[id]/route.ts`
- Create: `apps/web-portal/app/api/property-estimator/comparisons/route.ts`

**Interfaces:**
- Consumes:
  - `PROPERTY_ESTIMATOR_API_BASE_URL`, defaulting to `http://localhost:8001`
- Produces:
  - `proxyBackendRequest(path: string, init?: ProxyBackendInit) -> Promise<Response>`
  - same-origin API routes under `/api/property-estimator/*`

- [ ] **Step 1: Write failing proxy helper tests**

Create `apps/web-portal/lib/property-estimator/server-api.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyBackendRequest } from "./server-api";

describe("proxyBackendRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies success responses to the configured backend", async () => {
    vi.stubEnv("PROPERTY_ESTIMATOR_API_BASE_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyBackendRequest("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("preserves backend validation status and json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Invalid payload" }), {
          status: 422,
          headers: { "content-type": "application/json" }
        })
      )
    );

    const response = await proxyBackendRequest("/estimates", {
      method: "POST",
      body: JSON.stringify({ school_rating: 11 })
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ detail: "Invalid payload" });
  });

  it("maps backend connection failures to 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await proxyBackendRequest("/estimates");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: "Property estimator backend is unavailable"
    });
  });
});
```

- [ ] **Step 2: Run proxy tests to verify they fail**

Run:

```bash
cd apps/web-portal
npm run test -- lib/property-estimator/server-api.test.ts
```

Expected: FAIL because `server-api.ts` does not exist yet.

- [ ] **Step 3: Implement proxy helper**

Create `apps/web-portal/lib/property-estimator/server-api.ts`:

```ts
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
```

- [ ] **Step 4: Add route handlers**

Create `apps/web-portal/app/api/property-estimator/health/route.ts`:

```ts
import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyBackendRequest("/health");
}
```

Create `apps/web-portal/app/api/property-estimator/estimates/route.ts`:

```ts
import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyBackendRequest("/estimates");
}

export async function POST(request: Request) {
  return proxyBackendRequest("/estimates", {
    method: "POST",
    body: await request.text()
  });
}
```

Create `apps/web-portal/app/api/property-estimator/estimates/[id]/route.ts`:

```ts
import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackendRequest(`/estimates/${encodeURIComponent(id)}`);
}
```

Create `apps/web-portal/app/api/property-estimator/comparisons/route.ts`:

```ts
import { proxyBackendRequest } from "@/lib/property-estimator/server-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyBackendRequest("/comparisons", {
    method: "POST",
    body: await request.text()
  });
}
```

- [ ] **Step 5: Run focused and full checks**

Run:

```bash
cd apps/web-portal
npm run test -- lib/property-estimator/server-api.test.ts
npm run lint
npm run typecheck
```

Expected: all commands PASS.

- [ ] **Step 6: Commit proxy routes**

```bash
git add apps/web-portal/lib/property-estimator/server-api.ts apps/web-portal/lib/property-estimator/server-api.test.ts apps/web-portal/app/api/property-estimator
git commit -m "feat: add property estimator api proxy"
```

---

### Task 4: Add shared portal shell, home page, and App 2 placeholder

**Files:**
- Modify: `apps/web-portal/app/layout.tsx`
- Modify: `apps/web-portal/app/page.tsx`
- Create: `apps/web-portal/app/market-analysis/page.tsx`
- Create: `apps/web-portal/components/app-shell.tsx`
- Create: `apps/web-portal/components/nav-link.tsx`

**Interfaces:**
- Consumes: base Next.js app from Task 1.
- Produces:
  - shared top navigation
  - home route `/`
  - placeholder route `/market-analysis`

- [ ] **Step 1: Create shared app shell**

Create `apps/web-portal/components/nav-link.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={
        isActive
          ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          : "rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }
      href={href}
    >
      {children}
    </Link>
  );
}
```

Create `apps/web-portal/components/app-shell.tsx`:

```tsx
import Link from "next/link";
import { NavLink } from "./nav-link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="group">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Housing Intelligence
            </p>
            <p className="text-lg font-bold text-slate-950 group-hover:text-brand-700">
              Fullstack Interview Portal
            </p>
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/property-estimator">Property Estimator</NavLink>
            <NavLink href="/market-analysis">Market Analysis</NavLink>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Wrap root layout**

Modify `apps/web-portal/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Housing Intelligence Portal",
  description: "Unified portal for property valuation and market analysis demos"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace home page**

Modify `apps/web-portal/app/page.tsx`:

```tsx
import Link from "next/link";

const appCards = [
  {
    title: "Property Value Estimator",
    status: "Live in this phase",
    description:
      "Submit property details, call the Python estimator backend, review estimate history, and compare multiple properties.",
    href: "/property-estimator"
  },
  {
    title: "Property Market Analysis",
    status: "Planned Java module",
    description:
      "A future dashboard for aggregate market statistics, filters, what-if analysis, and export workflows.",
    href: "/market-analysis"
  }
];

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Housing Intelligence Portal
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950">
          A unified dashboard for housing price prediction workflows.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          This portal demonstrates the frontend layer for the fullstack interview
          task. App 1 is connected to the Python backend; App 2 is intentionally
          scoped as a placeholder until the Java backend is built.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {appCards.map((card) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md"
            href={card.href}
            key={card.title}
          >
            <p className="text-sm font-semibold text-brand-600">{card.status}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{card.title}</h2>
            <p className="mt-3 text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add App 2 placeholder page**

Create `apps/web-portal/app/market-analysis/page.tsx`:

```tsx
import Link from "next/link";

const plannedCapabilities = [
  "Interactive market visualizations",
  "Filters for property segments",
  "What-if analysis backed by the ML model",
  "CSV and PDF export options",
  "Responsive sortable and filterable data tables"
];

export default function MarketAnalysisPage() {
  return (
    <main className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Planned application
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">
        Property Market Analysis
      </h1>
      <p className="mt-4 max-w-3xl text-slate-600">
        This route is intentionally a placeholder. The Java Spring Boot backend
        for market analysis will be implemented in a later module, so this page
        does not fake dashboard data.
      </p>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {plannedCapabilities.map((item) => (
          <li className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700" key={item}>
            {item}
          </li>
        ))}
      </ul>
      <Link
        className="mt-8 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        href="/property-estimator"
      >
        Open active Property Estimator
      </Link>
    </main>
  );
}
```

- [ ] **Step 5: Run checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 6: Commit shared shell**

```bash
git add apps/web-portal/app apps/web-portal/components
git commit -m "feat: add web portal shell and routes"
```

---

### Task 5: Add property estimator client API and dashboard components

**Files:**
- Create: `apps/web-portal/lib/property-estimator/api.ts`
- Create: `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`
- Create: `apps/web-portal/components/property-estimator/estimate-form.tsx`
- Create: `apps/web-portal/components/property-estimator/estimate-result-card.tsx`
- Create: `apps/web-portal/components/property-estimator/estimate-history.tsx`
- Create: `apps/web-portal/components/property-estimator/feature-chart.tsx`
- Modify: `apps/web-portal/app/property-estimator/page.tsx`

**Interfaces:**
- Consumes:
  - `PropertyFeatures`, `EstimateRecord`, `EstimateListResponse`, `ComparisonResponse`
  - `propertyFeatureSchema`, `defaultPropertyValues`
  - `formatCurrency`, `formatNumber`, `formatDateTime`, `featureLabels`
- Produces:
  - `createEstimate(features: PropertyFeatures) -> Promise<EstimateRecord>`
  - `listEstimates() -> Promise<EstimateListResponse>`
  - interactive `/property-estimator` page without comparison details yet

- [ ] **Step 1: Add browser API helpers**

Create `apps/web-portal/lib/property-estimator/api.ts`:

```ts
import type {
  ApiErrorResponse,
  ComparisonRequest,
  ComparisonResponse,
  EstimateListResponse,
  EstimateRecord,
  PropertyFeatures
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

export async function createEstimate(features: PropertyFeatures): Promise<EstimateRecord> {
  const response = await fetch("/api/property-estimator/estimates", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(features)
  });

  return readJsonOrThrow<EstimateRecord>(response);
}

export async function listEstimates(): Promise<EstimateListResponse> {
  const response = await fetch("/api/property-estimator/estimates", {
    cache: "no-store"
  });

  return readJsonOrThrow<EstimateListResponse>(response);
}

export async function compareEstimates(
  request: ComparisonRequest
): Promise<ComparisonResponse> {
  const response = await fetch("/api/property-estimator/comparisons", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(request)
  });

  return readJsonOrThrow<ComparisonResponse>(response);
}
```

- [ ] **Step 2: Add form component**

Create `apps/web-portal/components/property-estimator/estimate-form.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  defaultPropertyValues,
  propertyFeatureSchema,
  type PropertyFeatureFormValues
} from "@/lib/property-estimator/schemas";

type EstimateFormProps = {
  isSubmitting: boolean;
  onSubmit: (values: PropertyFeatureFormValues) => void;
};

const fields: Array<{
  name: keyof PropertyFeatureFormValues;
  label: string;
  step?: string;
}> = [
  { name: "square_footage", label: "Square footage" },
  { name: "bedrooms", label: "Bedrooms" },
  { name: "bathrooms", label: "Bathrooms", step: "0.5" },
  { name: "year_built", label: "Year built" },
  { name: "lot_size", label: "Lot size" },
  { name: "distance_to_city_center", label: "Distance to city center", step: "0.1" },
  { name: "school_rating", label: "School rating", step: "0.1" }
];

export function EstimateForm({ isSubmitting, onSubmit }: EstimateFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<PropertyFeatureFormValues>({
    resolver: zodResolver(propertyFeatureSchema),
    defaultValues: defaultPropertyValues
  });

  return (
    <form
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Property input
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Estimate a property value
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Fill in the same features used by the ML model.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label className="block" key={field.name}>
            <span className="text-sm font-medium text-slate-700">{field.label}</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              step={field.step ?? "1"}
              type="number"
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors[field.name]?.message}
              </span>
            ) : null}
          </label>
        ))}
      </div>

      <button
        className="mt-6 inline-flex w-full justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating estimate..." : "Create estimate"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Add result and chart components**

Create `apps/web-portal/components/property-estimator/feature-chart.tsx`:

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PropertyFeatures } from "@/lib/property-estimator/types";

type FeatureChartProps = {
  features: PropertyFeatures;
};

export function FeatureChart({ features }: FeatureChartProps) {
  const data = [
    { label: "Sq ft", value: features.square_footage },
    { label: "Lot", value: features.lot_size },
    { label: "Distance", value: features.distance_to_city_center },
    { label: "School", value: features.school_rating }
  ];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Create `apps/web-portal/components/property-estimator/estimate-result-card.tsx`:

```tsx
import { featureLabels, formatCurrency, formatNumber } from "@/lib/property-estimator/formatting";
import type { EstimateRecord } from "@/lib/property-estimator/types";
import { FeatureChart } from "./feature-chart";

type EstimateResultCardProps = {
  estimate: EstimateRecord | null;
};

export function EstimateResultCard({ estimate }: EstimateResultCardProps) {
  if (estimate === null) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        Submit a property to see the predicted price and feature chart.
      </section>
    );
  }

  const featureEntries = Object.entries(estimate.features) as Array<
    [keyof EstimateRecord["features"], number]
  >;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Latest estimate
      </p>
      <p className="mt-3 text-4xl font-bold text-slate-950">
        {formatCurrency(estimate.predicted_price)}
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <tbody>
            {featureEntries.map(([key, value]) => (
              <tr className="border-b border-slate-100 last:border-0" key={key}>
                <th className="bg-slate-50 px-4 py-3 font-medium text-slate-600">
                  {featureLabels[key]}
                </th>
                <td className="px-4 py-3 text-slate-950">{formatNumber(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <FeatureChart features={estimate.features} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add history component**

Create `apps/web-portal/components/property-estimator/estimate-history.tsx`:

```tsx
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/property-estimator/formatting";
import type { EstimateRecord } from "@/lib/property-estimator/types";

type EstimateHistoryProps = {
  estimates: EstimateRecord[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelected: (estimateId: string) => void;
};

export function EstimateHistory({
  estimates,
  isLoading,
  onToggleSelected,
  selectedIds
}: EstimateHistoryProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            History
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Recent estimates</h2>
        </div>
        {isLoading ? <span className="text-sm text-slate-500">Loading...</span> : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">
        History is stored in the Python backend memory and clears when that service restarts.
      </p>

      <div className="mt-6 space-y-3">
        {estimates.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            No estimates yet. Submit the form to create the first record.
          </p>
        ) : (
          estimates.map((estimate) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-brand-100 hover:bg-brand-50"
              key={estimate.id}
            >
              <input
                checked={selectedIds.includes(estimate.id)}
                className="mt-1"
                onChange={() => onToggleSelected(estimate.id)}
                type="checkbox"
              />
              <span className="flex-1">
                <span className="block font-semibold text-slate-950">
                  {formatCurrency(estimate.predicted_price)}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {formatNumber(estimate.features.square_footage)} sq ft ·{" "}
                  {estimate.features.bedrooms} beds · {estimate.features.bathrooms} baths
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {formatDateTime(estimate.created_at)}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add dashboard coordinator**

Create `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createEstimate, listEstimates } from "@/lib/property-estimator/api";
import type { PropertyFeatureFormValues } from "@/lib/property-estimator/schemas";
import type { EstimateRecord } from "@/lib/property-estimator/types";
import { EstimateForm } from "./estimate-form";
import { EstimateHistory } from "./estimate-history";
import { EstimateResultCard } from "./estimate-result-card";

export function EstimatorDashboard() {
  const [currentEstimate, setCurrentEstimate] = useState<EstimateRecord | null>(null);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const selectedEstimates = useMemo(
    () => estimates.filter((estimate) => selectedIds.includes(estimate.id)),
    [estimates, selectedIds]
  );

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await listEstimates();
      setEstimates(response.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  async function handleSubmit(values: PropertyFeatureFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const estimate = await createEstimate(values);
      setCurrentEstimate(estimate);
      await refreshHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Prediction service unavailable"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleSelected(estimateId: string) {
    setSelectedIds((current) =>
      current.includes(estimateId)
        ? current.filter((id) => id !== estimateId)
        : [...current, estimateId]
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <EstimateForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        <EstimateResultCard estimate={currentEstimate} />
      </div>

      <EstimateHistory
        estimates={estimates}
        isLoading={isHistoryLoading}
        onToggleSelected={toggleSelected}
        selectedIds={selectedIds}
      />

      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        Select at least two history records to compare them. Comparison details are added in the
        next task.
        <p className="mt-2 text-sm">Selected records: {selectedEstimates.length}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Add route page**

Create `apps/web-portal/app/property-estimator/page.tsx`:

```tsx
import { EstimatorDashboard } from "@/components/property-estimator/estimator-dashboard";

export default function PropertyEstimatorPage() {
  return (
    <main className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          App 1 · Python Backend
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Property Value Estimator
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Submit property details, call the Python backend through the Next.js proxy,
          and review estimates returned by the ML model pipeline.
        </p>
      </section>

      <EstimatorDashboard />
    </main>
  );
}
```

- [ ] **Step 7: Run checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 8: Commit App 1 estimate UI**

```bash
git add apps/web-portal/app/property-estimator apps/web-portal/components/property-estimator apps/web-portal/lib/property-estimator/api.ts
git commit -m "feat: add property estimator dashboard"
```

---

### Task 6: Add comparison view and chart integration

**Files:**
- Create: `apps/web-portal/components/property-estimator/estimate-comparison.tsx`
- Modify: `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`

**Interfaces:**
- Consumes:
  - `compareEstimates(request: ComparisonRequest) -> Promise<ComparisonResponse>`
  - `EstimateRecord`
- Produces:
  - comparison summary and chart
  - disabled/enabled comparison flow based on selected history ids

- [ ] **Step 1: Add comparison component**

Create `apps/web-portal/components/property-estimator/estimate-comparison.tsx`:

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { featureLabels, formatCurrency, formatNumber } from "@/lib/property-estimator/formatting";
import type { ComparisonResponse, EstimateRecord } from "@/lib/property-estimator/types";

type EstimateComparisonProps = {
  comparison: ComparisonResponse | null;
  isComparing: boolean;
  selectedEstimates: EstimateRecord[];
  onCompare: () => void;
};

export function EstimateComparison({
  comparison,
  isComparing,
  onCompare,
  selectedEstimates
}: EstimateComparisonProps) {
  const canCompare = selectedEstimates.length >= 2;
  const chartData =
    comparison?.items.map((item, index) => ({
      label: `Property ${index + 1}`,
      price: item.predicted_price
    })) ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Comparison
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Compare selected properties
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Select at least two estimates from history, then compare predicted prices
            and feature values side by side.
          </p>
        </div>
        <button
          className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!canCompare || isComparing}
          onClick={onCompare}
          type="button"
        >
          {isComparing ? "Comparing..." : "Compare selected"}
        </button>
      </div>

      {comparison ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Highest price" value={formatCurrency(comparison.highest_price)} />
            <Metric label="Lowest price" value={formatCurrency(comparison.lowest_price)} />
            <Metric label="Difference" value={formatCurrency(comparison.price_difference)} />
          </div>

          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="price" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  {comparison.items.map((item, index) => (
                    <th className="px-4 py-3" key={item.id}>
                      Property {index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <th className="px-4 py-3 text-slate-600">Predicted price</th>
                  {comparison.items.map((item) => (
                    <td className="px-4 py-3 font-semibold text-slate-950" key={item.id}>
                      {formatCurrency(item.predicted_price)}
                    </td>
                  ))}
                </tr>
                {(Object.keys(featureLabels) as Array<keyof EstimateRecord["features"]>).map(
                  (featureKey) => (
                    <tr className="border-t border-slate-100" key={featureKey}>
                      <th className="px-4 py-3 text-slate-600">{featureLabels[featureKey]}</th>
                      {comparison.items.map((item) => (
                        <td className="px-4 py-3 text-slate-950" key={item.id}>
                          {formatNumber(item.features[featureKey])}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {canCompare
            ? "Ready to compare the selected estimates."
            : "Select at least two history records to enable comparison."}
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Wire comparison into dashboard**

Modify `apps/web-portal/components/property-estimator/estimator-dashboard.tsx` to this final version:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { compareEstimates, createEstimate, listEstimates } from "@/lib/property-estimator/api";
import type { PropertyFeatureFormValues } from "@/lib/property-estimator/schemas";
import type { ComparisonResponse, EstimateRecord } from "@/lib/property-estimator/types";
import { EstimateComparison } from "./estimate-comparison";
import { EstimateForm } from "./estimate-form";
import { EstimateHistory } from "./estimate-history";
import { EstimateResultCard } from "./estimate-result-card";

export function EstimatorDashboard() {
  const [currentEstimate, setCurrentEstimate] = useState<EstimateRecord | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const selectedEstimates = useMemo(
    () => estimates.filter((estimate) => selectedIds.includes(estimate.id)),
    [estimates, selectedIds]
  );

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await listEstimates();
      setEstimates(response.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  async function handleSubmit(values: PropertyFeatureFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const estimate = await createEstimate(values);
      setCurrentEstimate(estimate);
      setComparison(null);
      await refreshHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Prediction service unavailable"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompare() {
    if (selectedIds.length < 2) {
      return;
    }

    setIsComparing(true);
    setErrorMessage(null);

    try {
      const response = await compareEstimates({ estimate_ids: selectedIds });
      setComparison(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to compare estimates");
    } finally {
      setIsComparing(false);
    }
  }

  function toggleSelected(estimateId: string) {
    setSelectedIds((current) =>
      current.includes(estimateId)
        ? current.filter((id) => id !== estimateId)
        : [...current, estimateId]
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <EstimateForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        <EstimateResultCard estimate={currentEstimate} />
      </div>

      <EstimateHistory
        estimates={estimates}
        isLoading={isHistoryLoading}
        onToggleSelected={toggleSelected}
        selectedIds={selectedIds}
      />

      <EstimateComparison
        comparison={comparison}
        isComparing={isComparing}
        onCompare={handleCompare}
        selectedEstimates={selectedEstimates}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 4: Commit comparison view**

```bash
git add apps/web-portal/components/property-estimator/estimate-comparison.tsx apps/web-portal/components/property-estimator/estimator-dashboard.tsx
git commit -m "feat: add property estimate comparison view"
```

---

### Task 7: Add README and final verification

**Files:**
- Create: `apps/web-portal/README.md`

**Interfaces:**
- Consumes: completed `apps/web-portal`.
- Produces: local setup, test, run, and demo instructions.

- [ ] **Step 1: Create README**

Create `apps/web-portal/README.md`:

````markdown
# Web Portal

Next.js App Router portal for the fullstack housing interview project.

## What this module includes

- Shared portal layout and navigation.
- App 1 Property Value Estimator frontend.
- Next.js API proxy to `property-estimator-api`.
- Prediction result, estimate history, and comparison view.
- App 2 Property Market Analysis placeholder.

## Local setup

```bash
cd apps/web-portal
npm install
```

## Run the full local demo

Terminal 1: start `ml-api`.

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2: start `property-estimator-api`.

```bash
cd apps/property-estimator-api
source .venv/bin/activate
ML_API_BASE_URL=http://localhost:8000 uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Terminal 3: start this portal.

```bash
cd apps/web-portal
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

```text
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001
```

The browser calls the Next.js proxy under `/api/property-estimator/*`; the proxy calls the Python backend.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Demo flow

1. Open the portal home page.
2. Navigate to Property Estimator.
3. Submit a valid property payload.
4. Confirm the predicted price card appears.
5. Confirm history contains the new estimate.
6. Create a second estimate.
7. Select two estimates and run comparison.

## Notes

- App 2 is intentionally a placeholder in this phase.
- Estimate history is stored in the Python backend process memory and clears when that backend restarts.
- Cross-service Docker Compose is not included in this phase.
````

- [ ] **Step 2: Run frontend checks**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all commands PASS.

- [ ] **Step 3: Run backend checks needed for smoke readiness**

Run:

```bash
cd apps/ml-api
.venv/bin/pytest -q
cd ../property-estimator-api
.venv/bin/pytest -q
```

Expected:

- `ml-api` tests PASS. Existing dependency warnings may appear.
- `property-estimator-api` tests PASS.

- [ ] **Step 4: Manual smoke test with three services**

Start services:

```bash
cd apps/ml-api
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
cd apps/property-estimator-api
ML_API_BASE_URL=http://localhost:8000 .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
```

```bash
cd apps/web-portal
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 npm run dev
```

Open `http://localhost:3000/property-estimator`.

Expected:

- Page loads without console-blocking errors.
- Form accepts valid sample values.
- Prediction card shows a price.
- History updates after submission.
- Two selected history records can be compared.

- [ ] **Step 5: Commit README and any verification-only doc corrections**

```bash
git add apps/web-portal/README.md
git commit -m "docs: add web portal usage instructions"
```

---

### Task 8: Whole-branch review and integration decision

**Files:**
- No planned source changes unless final review finds defects.

**Interfaces:**
- Consumes: complete `apps/web-portal` module.
- Produces: reviewed branch ready for local merge or PR.

- [ ] **Step 1: Run final frontend verification**

Run:

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test
npm run build
```

Expected: all commands PASS.

- [ ] **Step 2: Run backend regression checks**

Run:

```bash
cd apps/ml-api
.venv/bin/pytest -q
cd ../property-estimator-api
.venv/bin/pytest -q
```

Expected: both backend suites PASS.

- [ ] **Step 3: Request final code review**

Use `superpowers:requesting-code-review` with a branch diff from merge base to `HEAD`.

Reviewer focus:

- Scope control: no Java backend, no full App 2 dashboard, no Docker Compose.
- Next.js App Router structure.
- Proxy error handling.
- Form validation.
- UI accessibility basics.
- TypeScript quality.
- Test quality.
- README demo accuracy.

- [ ] **Step 4: Fix Critical or Important findings**

If final review finds Critical or Important issues, fix them with focused tests and re-review the fixes.

- [ ] **Step 5: Finish branch**

Use `superpowers:finishing-a-development-branch`.

Offer:

```text
1. Merge back to master locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work
```
