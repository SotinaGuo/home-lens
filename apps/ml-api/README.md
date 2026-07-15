# Housing Price Prediction Model API

FastAPI service for training and serving a Ridge Regression housing price prediction model.

## What this service does

- Reads the provided Excel workbook.
- Trains a `StandardScaler -> Ridge Regression` model.
- Saves generated model artifacts under `models/`.
- Auto-trains on startup if model artifacts are missing.
- Exposes Swagger/OpenAPI at `/docs`.

## API endpoints

- `GET /health`: service and model status.
- `POST /predict`: single or batch housing price predictions.
- `GET /model-info`: model features, coefficients, intercept, metrics, and sample count.

## Local setup

```bash
cd apps/ml-api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Train explicitly

```bash
python -m app.training
```

Generated artifacts:

```text
models/ridge_model.joblib
models/metrics.json
```

`/model-info` reports Ridge coefficients from the trained pipeline after
`StandardScaler` transforms the input features. Treat those coefficients as
standardized-feature coefficients, not raw-feature coefficients.

## Run locally

```bash
uvicorn app.main:app --reload
```

Open:

```text
http://localhost:8000/docs
```

## Test

```bash
pytest -v
```

## Docker

```bash
docker build -t house-price-ml-api .
docker run --rm -p 8000:8000 house-price-ml-api
```

Open:

```text
http://localhost:8000/docs
```

## Example single prediction request

```json
{
  "square_footage": 1550,
  "bedrooms": 3,
  "bathrooms": 2,
  "year_built": 1997,
  "lot_size": 6800,
  "distance_to_city_center": 4.1,
  "school_rating": 7.6
}
```

## Notes for interview demo

The dataset is small, so model metrics are demonstration indicators rather than production-quality evidence. The main purpose of this module is to show clean engineering: data loading, training, artifact persistence, API serving, validation, tests, and Docker packaging.
