# HomeLens Market Analysis API

Java Spring Boot backend for HomeLens App 2: Property Market Analysis.

## What this service does

- Loads market records from the existing housing Excel workbook.
- Generates aggregate market statistics.
- Supports filtered market segment analysis.
- Calls `ml-api /predict` for what-if analysis.
- Uses Spring Cache for summary and segment calculations.

## What is intentionally not included yet

- Next.js App 2 dashboard.
- CSV export.
- PDF export.
- Authentication or authorization.
- Persistent database storage.
- Cross-service Docker Compose.

## Local setup

```bash
cd apps/market-analysis-api
mvn test
```

## Run with ml-api

Terminal 1: start `ml-api`.

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2: start this service.

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run
```

Open:

```text
http://localhost:8002/health
```

## Environment variables

```text
ML_API_BASE_URL=http://localhost:8000
MARKET_DATA_WORKBOOK_PATH=../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx
```

## API endpoints

- `GET /health`
- `GET /market/summary`
- `GET /market/segments`
- `POST /market/what-if`

## Example what-if request

```bash
curl -X POST http://localhost:8002/market/what-if \
  -H 'content-type: application/json' \
  -d '{
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }'
```

## Test

```bash
mvn test
```

## Notes for interview demo

The dataset is small, so statistics are demonstration analytics rather than production real-estate market intelligence. The main purpose of this service is to show clean Java backend engineering: Excel ingestion, aggregate calculations, filters, caching, ML API integration, validation, and tests.
