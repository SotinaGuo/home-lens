# Web Portal Design: Next.js Property Estimator Frontend

Date: 2026-07-16

## 1. Purpose

Build the third project module: a unified Next.js portal under `apps/web-portal`.

This module creates the user-facing portal shell and implements App 1, the Property Value Estimator frontend. It connects to the already-built `property-estimator-api`, which in turn calls `ml-api`.

> 中文注解：这一阶段开始做用户能直接操作的页面。重点不是一次性完成整个 Task 2，而是先把 App 1 从表单到预测、历史、对比完整跑通。

## 2. Scope

Included in this phase:

- Next.js App Router project under `apps/web-portal`.
- Shared portal layout and navigation.
- Dashboard-style home page with links to both applications.
- App 1 Property Value Estimator page.
- Client-side property form validation.
- Estimate creation through a Next.js API proxy.
- Prediction result display with cards, table-style summary, and chart.
- Estimate history display.
- Multi-property comparison view.
- App 2 Property Market Analysis placeholder route.
- Local developer README and verification commands.

Excluded from this phase:

- Java Spring Boot backend for App 2.
- Full App 2 market analysis dashboard.
- CSV/PDF export.
- Authentication and authorization.
- Cross-service Docker Compose.
- Persistent browser-side or database-backed history.
- Deployment configuration.

> 中文注解：App 2 在这个模块只放入口占位。这样 portal 的整体结构先成型，但不会把 Java backend 和市场分析 dashboard 混进这一步，避免范围失控。

## 3. User Experience

The portal uses a simple professional dashboard style suitable for an interview demo:

- Clean navigation and consistent spacing.
- Responsive card/grid layout.
- Clear loading and error states.
- Accessible labels, buttons, and form validation messages.
- Minimal visual polish without introducing a heavy UI component framework.

The main portal routes are:

```text
/
/property-estimator
/market-analysis
```

### Home page

The home page introduces the two applications:

- Property Value Estimator: active application with a call-to-action.
- Property Market Analysis: placeholder explaining that Java backend work comes later.

### Property Estimator page

The `/property-estimator` page has four areas:

1. Property input form.
2. Current prediction result.
3. Estimate history.
4. Comparison view.

The page should remain useful even when the backend is unavailable. It must show a clear error message instead of blanking or crashing.

## 4. App 1 Form Design

The form fields match the ML model and Python backend exactly:

```text
square_footage
bedrooms
bathrooms
year_built
lot_size
distance_to_city_center
school_rating
```

Validation uses React Hook Form with Zod:

- `square_footage`: number, greater than 0.
- `bedrooms`: integer, greater than or equal to 0.
- `bathrooms`: number, greater than or equal to 0.
- `year_built`: integer, between 1800 and 2100.
- `lot_size`: number, greater than 0.
- `distance_to_city_center`: number, greater than or equal to 0.
- `school_rating`: number, between 0 and 10.

Validation messages should be field-specific and visible near the relevant input.

> 中文注解：字段名必须和后端完全一致，避免出现“前端看起来提交成功，但后端 422”的隐性问题。

## 5. API Proxy Design

The browser calls the Next.js application only:

```text
POST /api/property-estimator/estimates
GET /api/property-estimator/estimates
GET /api/property-estimator/estimates/{id}
POST /api/property-estimator/comparisons
GET /api/property-estimator/health
```

The Next.js route handlers proxy requests to:

```text
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001
```

The default local backend URL is:

```text
http://localhost:8001
```

This avoids CORS problems and keeps backend service URLs out of client-side browser code.

Proxy behavior:

- Forward request JSON to the matching Python backend endpoint.
- Preserve successful response JSON.
- Convert backend connection failures into a clear 502 response.
- Preserve meaningful backend status codes such as 404, 422, 502, and 504.
- Avoid caching mutable estimate/history/comparison responses.

## 6. Data Flow

Estimate creation:

```text
User form
  -> React Hook Form + Zod validation
  -> POST /api/property-estimator/estimates
  -> Next.js proxy
  -> property-estimator-api POST /estimates
  -> ml-api POST /predict
  -> response shown in current result and history
```

History loading:

```text
Property Estimator page
  -> GET /api/property-estimator/estimates
  -> Next.js proxy
  -> property-estimator-api GET /estimates
  -> history table/cards
```

Comparison:

```text
User selects 2+ history records
  -> POST /api/property-estimator/comparisons
  -> Next.js proxy
  -> property-estimator-api POST /comparisons
  -> side-by-side table and chart
```

History is still stored in the Python backend process memory. The UI must mention that history clears when the backend restarts.

## 7. Visual Presentation

Prediction result:

- Large card with formatted predicted price.
- Secondary details for property size, bedrooms, bathrooms, year built, lot size, city distance, and school rating.
- Feature chart for quick visual interpretation.

History:

- Recent estimates list.
- Each item shows predicted price and key features.
- Each item can be selected for comparison.

Comparison:

- Requires at least two selected records.
- Displays highest price, lowest price, and price difference.
- Shows side-by-side property feature rows.
- Uses a Recharts bar chart for predicted price comparison.

## 8. App 2 Placeholder

The `/market-analysis` route is a scoped placeholder for App 2.

It should:

- Explain that the Java Spring Boot market analysis backend is not implemented yet.
- List future capabilities from the task brief: visualizations, filters, what-if analysis, export, and sortable/filterable data tables.
- Link back to the active Property Estimator app.

It must not fake working App 2 functionality.

## 9. Planned Repository Layout

```text
apps/
  web-portal/
    package.json
    next.config.ts
    tsconfig.json
    postcss.config.mjs
    tailwind.config.ts
    README.md
    app/
      layout.tsx
      page.tsx
      globals.css
      property-estimator/
        page.tsx
      market-analysis/
        page.tsx
      api/
        property-estimator/
          health/
            route.ts
          estimates/
            route.ts
          estimates/
            [id]/
              route.ts
          comparisons/
            route.ts
    components/
      app-shell.tsx
      nav-link.tsx
      property-estimator/
        estimator-dashboard.tsx
        estimate-form.tsx
        estimate-result-card.tsx
        estimate-history.tsx
        estimate-comparison.tsx
        feature-chart.tsx
    lib/
      property-estimator/
        api.ts
        schemas.ts
        types.ts
        formatting.ts
```

## 10. File Responsibilities

- `app/layout.tsx`: root HTML shell, metadata, global app shell.
- `app/page.tsx`: portal overview page.
- `app/globals.css`: Tailwind base styles and dashboard theme tokens.
- `app/property-estimator/page.tsx`: route-level page for App 1.
- `app/market-analysis/page.tsx`: route-level placeholder for App 2.
- `app/api/property-estimator/*/route.ts`: server-side proxy route handlers.
- `components/app-shell.tsx`: shared layout frame with navigation.
- `components/nav-link.tsx`: active-route navigation link.
- `components/property-estimator/estimator-dashboard.tsx`: client-side state coordinator for form submission, history refresh, selection, and comparison.
- `components/property-estimator/estimate-form.tsx`: validated form UI.
- `components/property-estimator/estimate-result-card.tsx`: latest prediction result UI.
- `components/property-estimator/estimate-history.tsx`: history list and comparison selection UI.
- `components/property-estimator/estimate-comparison.tsx`: comparison summary, table, and chart.
- `components/property-estimator/feature-chart.tsx`: small Recharts visualization for feature/result context.
- `lib/property-estimator/api.ts`: client helper functions that call the Next.js proxy.
- `lib/property-estimator/schemas.ts`: Zod schemas for form validation and request payloads.
- `lib/property-estimator/types.ts`: TypeScript types aligned with Python API response shapes.
- `lib/property-estimator/formatting.ts`: currency, number, and label formatting helpers.

## 11. Technology Choices

- Next.js App Router.
- React and TypeScript.
- Tailwind CSS.
- React Hook Form.
- Zod.
- Recharts.
- Vitest for small unit tests around schemas, formatting, and proxy helpers.

No full UI component framework is added in this phase. This keeps the dependency footprint moderate while still delivering a polished dashboard.

## 12. Error Handling

Client UI:

- Field validation errors render beside fields.
- Submit button shows loading while estimate creation is pending.
- History area shows loading while fetching.
- Backend/proxy failures show a visible alert.
- Comparison button is disabled until at least two history items are selected.

Proxy route handlers:

- Missing or invalid backend responses return JSON error payloads.
- Backend connection failures return 502.
- Backend timeouts, if detected by fetch abort handling, return 504.
- Backend 404 and 422 responses are preserved.

## 13. Testing Strategy

Automated checks:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Unit tests should cover:

- Zod schema accepts valid payloads and rejects invalid values.
- Formatting helpers produce expected currency and labels.
- Proxy helper/error mapping handles success and failure cases without requiring a live Python backend.

Manual smoke test:

1. Start `ml-api` on port `8000`.
2. Start `property-estimator-api` on port `8001`.
3. Start `web-portal` on port `3000`.
4. Open `http://localhost:3000`.
5. Navigate to Property Estimator.
6. Submit a valid property.
7. Confirm prediction result appears.
8. Confirm history updates.
9. Create a second estimate.
10. Select both estimates and run comparison.

## 14. Risks and Mitigations

- Backend services must be running for a live demo.
  - Mitigation: proxy and UI show clear service-unavailable errors.
- Python backend history is in memory.
  - Mitigation: UI and README state that history resets on backend restart.
- App 2 is not implemented yet.
  - Mitigation: App 2 route is explicitly marked as a placeholder, not a fake dashboard.
- Charting can overgrow the first implementation.
  - Mitigation: use only simple Recharts bar charts in this phase.
- Docker Compose is not included.
  - Mitigation: README documents the three-terminal local demo flow.

## 15. Acceptance Criteria

- `apps/web-portal` exists and runs locally.
- The portal uses Next.js App Router.
- Shared navigation links to Home, Property Estimator, and Market Analysis.
- `/property-estimator` can create an estimate through the proxy when backend services are running.
- The page displays validation errors before invalid submissions.
- The page displays predicted price after a successful submission.
- The page displays history from `property-estimator-api`.
- The page can compare at least two estimates.
- `/market-analysis` exists as a truthful placeholder.
- Frontend checks pass: lint, typecheck, tests, and build.

