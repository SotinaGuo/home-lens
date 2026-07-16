# Market Analysis Dashboard Design

Date: 2026-07-16

## 1. Purpose

Build the App 2 frontend for HomeLens: a real Property Market Analysis dashboard inside `apps/web-portal`.

The Java Spring Boot `market-analysis-api` is now implemented, so the existing `/market-analysis` placeholder should become a working dashboard that calls the Java backend through Next.js API proxy routes.

> 中文注解：这一阶段的目标是把 App 2 从“占位入口”变成“可以演示的完整闭环”。重点是页面能真实调用 Java 后端，而不是堆很多暂时用不上的复杂功能。

## 2. Scope

Included in this phase:

- Replace the App 2 placeholder route with a working dashboard.
- Add Next.js proxy routes for `market-analysis-api`.
- Add market summary display.
- Add price bucket visualization.
- Add segment filters and filtered result display.
- Add what-if analysis form.
- Display prediction, market position, and nearest market records.
- Add loading, empty, and error states.
- Add unit tests for schemas, formatting, browser API helpers, proxy helpers, and core dashboard behavior.
- Update `apps/web-portal/README.md` with App 2 local run instructions.

Excluded from this phase:

- CSV export.
- PDF export.
- Authentication or authorization.
- Database persistence.
- Server-side rendering of live market data.
- Full sortable/filterable enterprise data table.
- Cross-service Docker Compose.

> 中文注解：导出、权限、Docker Compose 都很有价值，但它们不是这一模块的核心路径。先把 App 2 的主体验示链路跑通，之后再逐个补增强功能。

## 3. User Experience

The `/market-analysis` page should feel like the sibling of `/property-estimator`: professional, clear, and demo-friendly.

The page has five visible areas:

1. Service status and dataset health.
2. Market summary cards.
3. Price distribution chart.
4. Segment analysis filters and results.
5. What-if analysis form and prediction result.

The dashboard should remain usable when the Java backend is offline. Instead of crashing or rendering blank data, it should show a clear message such as “Market analysis backend is unavailable.”

## 4. API Proxy Design

Browser code must call same-origin Next.js routes only:

```text
GET  /api/market-analysis/health
GET  /api/market-analysis/summary
GET  /api/market-analysis/segments
POST /api/market-analysis/what-if
```

The Next.js route handlers proxy to:

```text
MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002
```

Default local backend URL:

```text
http://localhost:8002
```

Proxy behavior:

- Forward query strings for segment filters.
- Forward JSON request bodies for what-if analysis.
- Preserve successful backend JSON.
- Preserve meaningful backend status codes.
- Convert connection failures into a clear `502` response.
- Apply an 8-second proxy timeout and convert request timeouts into a clear `504` response.
- Disable caching for all market analysis proxy responses.

> 中文注解：前端不直接访问 `localhost:8002`，而是访问自己的 `/api/market-analysis/*`。这样可以避免 CORS 问题，也让后端服务地址只存在于服务端环境变量里。

## 5. Backend Contract

The dashboard consumes the current Java API contract.

### Health

```text
GET /health
```

Expected fields:

```text
status
service
records_loaded
ml_api_base_url
```

### Summary

```text
GET /market/summary
```

Expected fields:

```text
record_count
price
square_footage
bedrooms
bathrooms
school_rating
distance_to_city_center
price_buckets
```

Each statistic contains:

```text
average
median
minimum
maximum
```

### Segments

```text
GET /market/segments
```

Supported query parameters:

```text
minPrice
maxPrice
minBedrooms
maxBedrooms
minSchoolRating
maxDistanceToCityCenter
```

Expected response:

```text
filters
record_count
statistics
records
```

### What-if

```text
POST /market/what-if
```

Request fields:

```text
square_footage
bedrooms
bathrooms
year_built
lot_size
distance_to_city_center
school_rating
```

Expected response:

```text
predicted_price
market_position
nearest_records
```

## 6. Data Flow

Initial dashboard load:

```text
MarketAnalysisDashboard
  -> GET /api/market-analysis/health
  -> GET /api/market-analysis/summary
  -> render status cards, summary cards, price bucket chart
```

Segment filtering:

```text
User filter form
  -> client-side validation
  -> GET /api/market-analysis/segments?<filters>
  -> render filtered statistics and matching records
```

What-if analysis:

```text
User feature form
  -> client-side validation
  -> POST /api/market-analysis/what-if
  -> market-analysis-api
  -> ml-api /predict
  -> render predicted price, percentile, market comparison, nearest records
```

## 7. Component Design

Planned components:

```text
components/market-analysis/
  market-dashboard.tsx
  market-health-card.tsx
  market-summary-cards.tsx
  price-bucket-chart.tsx
  segment-filter-form.tsx
  segment-results.tsx
  what-if-form.tsx
  what-if-result.tsx
  property-record-table.tsx
```

Responsibilities:

- `market-dashboard.tsx`: owns page state, data loading, and orchestration.
- `market-health-card.tsx`: displays service health and loaded record count.
- `market-summary-cards.tsx`: displays high-level market metrics.
- `price-bucket-chart.tsx`: displays price bucket distribution with Recharts.
- `segment-filter-form.tsx`: validates and submits market filter values.
- `segment-results.tsx`: displays filtered statistics and matching records.
- `what-if-form.tsx`: validates and submits property feature inputs.
- `what-if-result.tsx`: displays predicted price and market position.
- `property-record-table.tsx`: reusable compact table for nearest or filtered records.

> 中文注解：组件按“页面状态、表单、展示、表格”拆开，避免一个大文件塞满所有逻辑。这样后面加导出或排序时也更容易扩展。

## 8. Library Design

Planned library files:

```text
lib/market-analysis/
  api.ts
  formatting.ts
  schemas.ts
  server-api.ts
  types.ts
```

Responsibilities:

- `types.ts`: TypeScript types aligned with Java API JSON.
- `schemas.ts`: Zod schemas for segment filters and what-if form inputs.
- `formatting.ts`: currency, number, percentage, and field label helpers.
- `api.ts`: browser-side same-origin API helpers.
- `server-api.ts`: server-side Next.js proxy helper.

This mirrors the existing `lib/property-estimator` structure, so the codebase stays predictable.

## 9. Validation Rules

Segment filters:

- `minPrice`: optional number, greater than or equal to 0.
- `maxPrice`: optional number, greater than or equal to 0.
- `minBedrooms`: optional integer, greater than or equal to 0.
- `maxBedrooms`: optional integer, greater than or equal to 0.
- `minSchoolRating`: optional number between 0 and 10.
- `maxDistanceToCityCenter`: optional number, greater than or equal to 0.
- If both min and max are present, min must be less than or equal to max.

What-if fields:

- `square_footage`: number, greater than 0.
- `bedrooms`: integer, greater than or equal to 0.
- `bathrooms`: number, greater than or equal to 0.
- `year_built`: integer, between 1800 and 2100.
- `lot_size`: number, greater than 0.
- `distance_to_city_center`: number, greater than or equal to 0.
- `school_rating`: number between 0 and 10.

Validation messages should be field-specific and visible near the input.

## 10. Error Handling

The UI should handle these states:

- Java backend unavailable: show page-level backend error.
- ML backend unavailable during what-if: show what-if-specific error if returned by Java API.
- Invalid filters: show form-level validation before calling the backend.
- Empty segment results: show “No matching records” instead of an empty table.
- Malformed backend response: show a generic “Unable to load market data” message.

The proxy should return JSON errors shaped like:

```json
{
  "detail": "Market analysis backend is unavailable"
}
```

## 11. Testing Strategy

Run from `apps/web-portal`:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Unit tests should cover:

- Market schemas accept valid values and reject invalid values.
- Formatting helpers produce stable user-facing strings.
- Browser API helpers call the expected Next.js routes.
- Server proxy helper maps backend success and connection failure correctly.
- Dashboard can render summary data and submit what-if requests with mocked API helpers.

Manual smoke test:

1. Start `ml-api` on port `8000`.
2. Start `market-analysis-api` on port `8002`.
3. Start `web-portal` on port `3000`.
4. Open `http://localhost:3000/market-analysis`.
5. Confirm summary cards and price chart render.
6. Apply a segment filter.
7. Submit a what-if scenario.
8. Confirm predicted price and nearest records render.

## 12. Planned File Changes

```text
apps/web-portal/app/market-analysis/page.tsx
apps/web-portal/app/page.tsx
apps/web-portal/app/api/market-analysis/health/route.ts
apps/web-portal/app/api/market-analysis/summary/route.ts
apps/web-portal/app/api/market-analysis/segments/route.ts
apps/web-portal/app/api/market-analysis/what-if/route.ts
apps/web-portal/components/market-analysis/market-dashboard.tsx
apps/web-portal/components/market-analysis/market-health-card.tsx
apps/web-portal/components/market-analysis/market-summary-cards.tsx
apps/web-portal/components/market-analysis/price-bucket-chart.tsx
apps/web-portal/components/market-analysis/segment-filter-form.tsx
apps/web-portal/components/market-analysis/segment-results.tsx
apps/web-portal/components/market-analysis/what-if-form.tsx
apps/web-portal/components/market-analysis/what-if-result.tsx
apps/web-portal/components/market-analysis/property-record-table.tsx
apps/web-portal/lib/market-analysis/api.ts
apps/web-portal/lib/market-analysis/api.test.ts
apps/web-portal/lib/market-analysis/formatting.ts
apps/web-portal/lib/market-analysis/formatting.test.ts
apps/web-portal/lib/market-analysis/schemas.ts
apps/web-portal/lib/market-analysis/schemas.test.ts
apps/web-portal/lib/market-analysis/server-api.ts
apps/web-portal/lib/market-analysis/server-api.test.ts
apps/web-portal/lib/market-analysis/types.ts
apps/web-portal/lib/market-analysis/market-dashboard.test.tsx
apps/web-portal/README.md
```

## 13. Risks and Follow-ups

Risks:

- The Java API depends on `ml-api` for what-if analysis, so the dashboard needs clear partial failure messaging.
- The dataset has only 50 records, so charts should be presented as demo analytics rather than production market intelligence.
- App 1 and App 2 will have similar forms; duplication should be kept controlled but not over-abstracted prematurely.
- Recharts can cause test friction in JSDOM, so chart tests should focus on data transformation or render presence rather than pixel-level behavior.

Follow-up modules:

- Add CSV export for segment records.
- Add PDF report export.
- Add sortable/filterable record table.
- Add unified local orchestration docs or Docker Compose.
- Add deployment configuration.
