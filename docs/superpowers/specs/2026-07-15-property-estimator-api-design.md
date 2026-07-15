# Property Estimator API Design

Date: 2026-07-15

## 1. Purpose

Build the second project module: a Python FastAPI backend for App 1, the Property Value Estimator.

This service receives property estimate requests, validates property fields, calls the existing `ml-api` prediction endpoint, stores estimate history in memory, and exposes history/comparison APIs for the future Next.js portal.

> 中文注解：这一阶段做的是 App 1 的后端，不做前端页面。它夹在 Next.js 和 `ml-api` 中间：前端把表单交给它，它再去调用模型服务。

## 2. Scope

Included in this phase:

- Standalone FastAPI service under `apps/property-estimator-api`.
- Request and response schemas for property estimates.
- HTTP client for calling `ml-api`.
- In-memory estimate history repository.
- Service layer for estimate creation and comparison.
- API endpoints for health, estimate creation, estimate history, estimate detail, and comparisons.
- Dockerfile for local containerized demo.
- README with local run, test, and integration instructions.
- Unit and API tests using fake clients or mock transports.

Excluded from this phase:

- Next.js portal UI.
- Java market analysis backend.
- SQLite or persistent database storage.
- Cross-service `docker-compose`.
- Authentication or authorization.
- Production-grade distributed history storage.

> 中文注解：这里继续控制范围，只做 Python backend。历史记录先用内存，目的是支撑后续前端的 history/comparison 演示，而不是提前引入数据库复杂度。

## 3. Repository Layout

The service will live under `apps/property-estimator-api`.

```text
apps/
  property-estimator-api/
    app/
      __init__.py
      main.py
      config.py
      schemas.py
      ml_client.py
      repository.py
      service.py
    tests/
      test_api.py
      test_service.py
      test_repository.py
      test_ml_client.py
    Dockerfile
    pyproject.toml
    README.md
```

### File responsibilities

- `app/main.py`: FastAPI app creation and route definitions.
- `app/config.py`: Environment-based settings such as `ML_API_BASE_URL`, request timeout, and service name.
- `app/schemas.py`: Pydantic schemas for estimate requests, estimate records, and comparison responses.
- `app/ml_client.py`: HTTP client for `ml-api POST /predict`, including timeout and error handling.
- `app/repository.py`: In-memory estimate record store.
- `app/service.py`: Business orchestration for estimate creation, history listing, detail lookup, and comparison.
- `tests/`: Unit and API tests that do not require a live `ml-api`.
- `Dockerfile`: Container build for interview demo.
- `pyproject.toml`: Python package metadata and dependencies.
- `README.md`: Setup, run, test, integration, and demo notes.

> 中文注解：这里把 client、repository、service 拆开，是为了让每个文件职责清楚：HTTP 调用、内存存储、业务编排互不混在一起，后续如果改成 SQLite 也不需要重写路由层。

## 4. Service Relationship

`property-estimator-api` does not train models and does not read the Excel workbook.

It consumes the already-built `ml-api` over HTTP:

```text
POST {ML_API_BASE_URL}/predict
```

Local default:

```text
ML_API_BASE_URL=http://localhost:8000
```

Future Docker Compose value:

```text
ML_API_BASE_URL=http://ml-api:8000
```

The estimator API itself should run locally on port `8001`.

> 中文注解：这保持了服务边界：`ml-api` 专心做模型，`property-estimator-api` 专心做 App 1 的业务 API。不要从这个服务里 import `ml-api` 的 Python 代码，否则就变成进程内耦合了。

## 5. Data Model

The estimate request uses the same property feature fields as `ml-api`:

```text
square_footage
bedrooms
bathrooms
year_built
lot_size
distance_to_city_center
school_rating
```

Estimate records are stored in memory with:

- `id`: UUID string.
- `features`: original validated property fields.
- `predicted_price`: predicted price returned by `ml-api`.
- `created_at`: UTC timestamp.

History is process-local and non-persistent.

> 中文注解：历史记录故意不持久化。面试时可以明确说明：这是 demo MVP，真实生产环境会替换成数据库或缓存服务。

## 6. API Design

Base URL for local demo:

```text
http://localhost:8001
```

Swagger/OpenAPI:

```text
http://localhost:8001/docs
```

### `GET /health`

Reports service status and configured ML API base URL.

Example response:

```json
{
  "status": "ok",
  "service": "property-estimator-api",
  "ml_api_base_url": "http://localhost:8000"
}
```

### `POST /estimates`

Creates a new property estimate.

Example request:

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

Processing:

1. Validate fields with Pydantic.
2. Call `ml-api POST /predict` with the property features.
3. Read the first returned predicted price.
4. Create an estimate record with UUID and UTC timestamp.
5. Store the record in memory.
6. Return the stored record.

Example response:

```json
{
  "id": "d3ce39c2-30af-4326-ad7f-e1993e5b251e",
  "features": {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  },
  "predicted_price": 250829.56,
  "created_at": "2026-07-15T12:00:00Z"
}
```

### `GET /estimates`

Returns estimate history in reverse chronological order.

Supported query parameter:

```text
limit=20
```

`limit` must be between 1 and 100.

Example response:

```json
{
  "items": [
    {
      "id": "d3ce39c2-30af-4326-ad7f-e1993e5b251e",
      "features": {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
      },
      "predicted_price": 250829.56,
      "created_at": "2026-07-15T12:00:00Z"
    }
  ]
}
```

### `GET /estimates/{id}`

Returns one estimate record.

If the id is not found, return `404`.

### `POST /comparisons`

Compares two or more existing estimate records by id.

Example request:

```json
{
  "estimate_ids": [
    "d3ce39c2-30af-4326-ad7f-e1993e5b251e",
    "64d724dd-caa4-4627-8d7b-0784d8656e2c"
  ]
}
```

Example response:

```json
{
  "items": [
    {
      "id": "d3ce39c2-30af-4326-ad7f-e1993e5b251e",
      "features": {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
      },
      "predicted_price": 250829.56,
      "created_at": "2026-07-15T12:00:00Z"
    }
  ],
  "highest_price": 250829.56,
  "lowest_price": 210000.0,
  "price_difference": 40829.56
}
```

> 中文注解：`/comparisons` 不重新调用模型，只比较已有历史记录。这样前端可以先创建多个估价，再选择若干条做 side-by-side comparison。

## 7. Error Handling

Expected API errors:

- Invalid property fields: `422`.
- `ml-api` connection failure: `502`.
- `ml-api` timeout: `504`.
- `ml-api` non-2xx response: `502`.
- `ml-api` malformed response: `502`.
- Estimate id not found: `404`.
- Comparison with fewer than 2 ids: `422`.
- Comparison containing unknown id: `404`.

`ml-api` implementation details and stack traces must not leak through this service.

> 中文注解：对前端来说，最重要的是错误语义稳定。模型服务挂了就是 502/504，用户输入错了就是 422，历史记录找不到就是 404。

## 8. Testing Strategy

Tests should not require a live `ml-api`.

Test groups:

- Repository tests:
  - add estimate record.
  - list records in reverse chronological order.
  - apply limit.
  - return `None` for missing id.

- ML client tests:
  - parse successful prediction response.
  - map connection failure to service-level error.
  - map timeout to service-level error.
  - map non-2xx response to service-level error.
  - reject malformed prediction response.

- Service tests:
  - create estimate record.
  - persist record in repository.
  - return estimate history.
  - return one estimate by id.
  - create comparison for two or more records.
  - reject comparisons with fewer than two ids.
  - reject comparisons containing unknown ids.

- API tests:
  - `GET /health`.
  - `POST /estimates`.
  - `GET /estimates`.
  - `GET /estimates/{id}`.
  - `POST /comparisons`.
  - relevant error status codes.

Use fake clients or mock transports for predictable tests.

> 中文注解：测试不要依赖真实 `ml-api`，否则两个服务联动会让测试变慢且脆。真实联调留给 smoke test 或后续 docker-compose。

## 9. Local Development Flow

Expected local commands:

```bash
cd apps/property-estimator-api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8001
```

For real integration, run `ml-api` in another terminal:

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Then open:

```text
http://localhost:8001/docs
```

## 10. Docker Demo Flow

Expected Docker commands:

```bash
cd apps/property-estimator-api
docker build -t property-estimator-api .
docker run --rm -p 8001:8001 -e ML_API_BASE_URL=http://host.docker.internal:8000 property-estimator-api
```

The Docker command assumes `ml-api` is running on the host at port `8000`.

## 11. Interview Demo Script

Recommended demo flow after both `ml-api` and `property-estimator-api` are running:

1. Open `ml-api` Swagger at `http://localhost:8000/docs`.
2. Show `GET /health` and `POST /predict`.
3. Open `property-estimator-api` Swagger at `http://localhost:8001/docs`.
4. Call `GET /health` and explain `ML_API_BASE_URL`.
5. Call `POST /estimates`.
6. Call `GET /estimates` to show history.
7. Create another estimate.
8. Call `POST /comparisons` with the two estimate ids.

## 12. Risks and Trade-offs

- In-memory history is lost on service restart.
- Multi-process deployment would not share history across workers.
- This service depends on `ml-api` availability for new estimates.
- Tests use fakes/mocks for `ml-api`; full service integration still needs manual or later docker-compose verification.
- CORS may be needed when the Next.js portal is added, but it can be added in the web integration phase.

> 中文注解：这个模块的价值是把 App 1 的业务后端边界先做出来。后续前端只需要调它，不需要直接知道模型服务细节。

## 13. Next Modules After This Phase

After `property-estimator-api` is complete and tested:

1. Build the Next.js portal shell and App 1 estimator UI against this API.
2. Add App 2 Java Spring Boot market analysis backend.
3. Add cross-service `docker-compose` for `ml-api`, `property-estimator-api`, Java backend, and Next.js portal.

