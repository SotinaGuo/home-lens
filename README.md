# HomeLens

HomeLens is a full-stack housing price estimation and market analysis project built for the interview tasks.

It contains a machine-learning prediction service, a Python business API, a Java market analysis API, and a unified Next.js portal that hosts two applications.

## What is included

| Task area | Implementation |
|---|---|
| Housing price prediction model API | FastAPI + scikit-learn Ridge regression |
| Unified web portal | Next.js App Router + React + TypeScript |
| Property Value Estimator | Form validation, prediction result, history, comparison chart |
| Property Market Analysis | Dashboard, segment filters, what-if analysis, sortable/filterable table |
| Export options | CSV download and browser print/save-as-PDF |
| Frontend architecture | Feature-based structure, custom hooks, route-level loading/error states |

## Architecture

```text
Browser
  │
  ▼
Web Portal - Next.js, port 3000
  ├─ /property-estimator
  ├─ /market-analysis
  └─ /api/* proxy routes
      │
      ├────────► Property Estimator API - FastAPI, port 8001
      │              │
      │              ▼
      │         ML API - FastAPI, port 8000
      │
      └────────► Market Analysis API - Spring Boot, port 8002
                     │
                     ▼
                ML API - FastAPI, port 8000
```

## Tech stack

| Layer | Tech |
|---|---|
| Web Portal | Next.js 15, React 19, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts |
| ML API | Python 3.12, FastAPI, scikit-learn, pandas, joblib |
| Property Estimator API | Python 3.12, FastAPI, Pydantic, httpx |
| Market Analysis API | Java 21, Spring Boot 3.4.4, Apache POI, Spring Cache |

## Frontend structure

```text
apps/web-portal/
├── app/                         # App Router pages, API routes, loading/error boundaries
├── components/                  # UI presentation components
└── features/
    ├── property-estimator/      # API, schemas, hooks, types, tests
    └── market-analysis/         # API, schemas, export tools, hooks, types, tests
```

The portal uses a feature-based architecture: each business area owns its API client, schemas, types, hooks, and tests. Shared UI stays in `components`, and route-level concerns stay in `app`.

## Local setup

Install dependencies once for each service.

```bash
cd apps/ml-api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cd ../property-estimator-api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cd ../web-portal
npm install
```

The Java service uses Maven:

```bash
cd apps/market-analysis-api
mvn test
```

## Run locally

Recommended for interview demos:

```bash
./scripts/start-local.sh
```

This starts:

- ML API on `http://localhost:8000`
- Property Estimator API on `http://localhost:8001`
- Market Analysis API on `http://localhost:8002`
- Web Portal on `http://localhost:3000`

Open:

```text
http://localhost:3000
```

If you prefer manual startup, see [PROJECT_DOCS.md](./PROJECT_DOCS.md).

## Smoke check

After services are running:

```bash
./scripts/smoke-check.sh
```

## Verification

```bash
cd apps/web-portal
npm run lint
npm run typecheck
npm run test
npm run build
```

Backend checks:

```bash
cd apps/ml-api && pytest -q
cd apps/property-estimator-api && pytest -q
cd apps/market-analysis-api && mvn test
```

## Demo flow

1. Open the portal home page.
2. Go to Property Estimator.
3. Submit a valid property payload.
4. Review predicted price, feature table, and chart.
5. Create another estimate and compare records.
6. Go to Market Analysis.
7. Apply segment filters and review market records.
8. Try what-if analysis.
9. Use table sorting/filtering and export CSV/PDF.

## Documentation

Full project details are in [PROJECT_DOCS.md](./PROJECT_DOCS.md).
