# HomeLens Web Portal

Next.js App Router portal for the HomeLens fullstack housing interview project.

## What this module includes

- Shared HomeLens portal layout and navigation.
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
