# HomeLens Web Portal

Next.js App Router portal for the HomeLens fullstack housing interview project.

## What this module includes

- Shared HomeLens portal layout and navigation.
- App 1 Property Value Estimator frontend.
- Next.js API proxy to `property-estimator-api`.
- Prediction result, estimate history, and comparison view.
- App 2 Property Market Analysis dashboard connected through a Next.js proxy.

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

If dev mode fails with `EMFILE` watcher errors, raise the local file descriptor
limit or run a production smoke instead:

```bash
npm run build
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002 npm run start
```

Open:

```text
http://localhost:3000
```

## Environment variables

```text
PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001
MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002
```

The browser calls the Next.js proxies under `/api/property-estimator/*` and
`/api/market-analysis/*`; the proxies call the Python and Java backends.

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

## App 2 demo flow

1. Open the portal home page.
2. Navigate to Property Market Analysis.
3. Confirm the service status card reports loaded records.
4. Confirm market summary cards and the price bucket chart render.
5. Apply a segment filter such as minimum bedrooms `3` and minimum school rating `7`.
6. Submit the default what-if form.
7. Confirm the predicted price, market position, and nearest records render.

## Notes

- Estimate history is stored in the Python backend process memory and clears when that backend restarts.
- Cross-service Docker Compose is not included in this phase.
