# Property Estimator API

FastAPI backend for App 1: Property Value Estimator.

## What this service does

- Accepts validated property feature inputs.
- Calls `ml-api` through `POST /predict`.
- Stores estimate history in memory.
- Exposes estimate history and comparison APIs for the future Next.js portal.

## API endpoints

- `GET /health`
- `POST /estimates`
- `GET /estimates`
- `GET /estimates/{id}`
- `POST /comparisons`

## Local setup

```bash
cd apps/property-estimator-api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Optional note: this service currently stores estimate history in memory, so records are cleared on restart. That is appropriate for the MVP/demo scenario.

## Run with local ml-api

Start `ml-api` first:

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Start this service in another terminal:

```bash
cd apps/property-estimator-api
source .venv/bin/activate
ML_API_BASE_URL=http://localhost:8000 uvicorn app.main:app --reload --port 8001
```

Open:

```text
http://localhost:8001/docs
```

## Test

```bash
pytest -v
```

Tests use fake clients or mock transports, so they do not require a live `ml-api`.

## Docker

```bash
docker build -t property-estimator-api .
docker run --rm -p 8001:8001 -e ML_API_BASE_URL=http://host.docker.internal:8000 property-estimator-api
```

The Docker command assumes `ml-api` is running on the host at port `8000`. `host.docker.internal` is available by default in Docker Desktop environments; on Linux, add `--add-host=host.docker.internal:host-gateway` to the `docker run` command.

## Example estimate request

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

History is stored in memory and is lost when the service restarts. This is intentional for the MVP demo; production storage can replace the repository later without changing the route contract.
