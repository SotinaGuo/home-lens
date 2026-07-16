# Market Analysis API Design

## 1. Goal

Build `apps/market-analysis-api`, a Java 21 Spring Boot 3.4.4 backend for HomeLens App 2: Property Market Analysis.

This service provides market-level statistics, filtered segment analysis, and a what-if prediction endpoint that integrates with the existing `ml-api`.

> 中文注解：这一阶段先把 App 2 的 Java 后端打稳。前端 `/market-analysis` 仍可以暂时保持占位或后续再接入，避免同时做 Java 后端、前端 dashboard、导出功能导致范围失控。

## 2. Scope

### In scope

- Create a new Java Spring Boot service under `apps/market-analysis-api`.
- Read the existing Excel workbook at startup.
- Generate aggregate market statistics from the housing dataset.
- Provide filterable market segment statistics.
- Provide a what-if endpoint that calls the existing `ml-api /predict`.
- Use Spring Cache for summary and segment computations.
- Add automated tests for loader, filters, statistics, API behavior, and ML API failure handling.
- Add a README with setup, run, and test instructions.

### Out of scope

- Next.js App 2 dashboard implementation.
- CSV export.
- PDF export.
- Authentication or authorization.
- Persistent database storage.
- Cross-service Docker Compose.
- Full deployment configuration.

> 中文注解：虽然原始 PDF 提到 CSV/PDF export，但本模块先不做。我们把它留到后续“App 2 dashboard/export”模块，这样 Java 后端先专注于数据分析和 ML 集成。

## 3. Data Source

The service reads:

```text
apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx
```

The primary sheet is:

```text
Test Data For Prediction
```

This sheet contains 50 rows and the columns:

- `id`
- `square_footage`
- `bedrooms`
- `bathrooms`
- `year_built`
- `lot_size`
- `distance_to_city_center`
- `school_rating`
- `price`

The `price` column makes this sheet the correct source for market statistics.

The secondary sheet:

```text
House Price Dataset
```

contains feature rows without `price`. It may be useful later as sample prediction input, but it is not the primary source for market aggregate statistics.

## 4. Service Architecture

```text
apps/market-analysis-api/
  pom.xml
  README.md
  src/
    main/
      java/com/homelens/marketanalysis/
        MarketAnalysisApplication.java
        config/
          CacheConfig.java
          MarketAnalysisProperties.java
        controller/
          HealthController.java
          MarketController.java
        model/
          MarketFilters.java
          MarketPropertyRecord.java
          PropertyFeatures.java
        service/
          DatasetLoader.java
          MarketAnalysisService.java
          MlApiClient.java
          StatisticsCalculator.java
        web/
          ApiExceptionHandler.java
          ErrorResponse.java
    test/
      java/com/homelens/marketanalysis/
        ...
```

### Responsibilities

- `DatasetLoader`: loads and validates Excel rows at startup.
- `MarketAnalysisService`: coordinates filtering, statistics, and what-if analysis.
- `StatisticsCalculator`: computes reusable aggregate metrics.
- `MlApiClient`: calls `ml-api /predict`.
- `MarketController`: exposes `/market/*` endpoints.
- `HealthController`: exposes `/health`.
- `ApiExceptionHandler`: maps validation and upstream errors to stable HTTP responses.

> 中文注解：这个拆分让每个类职责清楚。Excel 读取、统计计算、HTTP 调用、Controller 都分开，后面加 dashboard 或 export 时不会把业务逻辑塞进 Controller。

## 5. Configuration

Environment variables:

```text
ML_API_BASE_URL=http://localhost:8000
MARKET_DATA_WORKBOOK_PATH=../ml-api/data/House Price Dataset & Test Data For Prediction.xlsx
```

Defaults:

- `ML_API_BASE_URL`: `http://localhost:8000`
- `MARKET_DATA_WORKBOOK_PATH`: path to the existing workbook relative to `apps/market-analysis-api`

The service should run locally on:

```text
http://localhost:8002
```

## 6. API Design

### `GET /health`

Returns service status.

Example response:

```json
{
  "status": "ok",
  "service": "market-analysis-api",
  "records_loaded": 50,
  "ml_api_base_url": "http://localhost:8000"
}
```

If dataset loading fails, the service should fail startup where practical. If a recoverable loader state is used, health must report `status: "error"` and include a concise reason.

### `GET /market/summary`

Returns aggregate statistics across the full market dataset.

Response fields:

- `record_count`
- `price`
  - `average`
  - `median`
  - `minimum`
  - `maximum`
- `square_footage`
  - `average`
  - `minimum`
  - `maximum`
- `bedrooms`
  - `average`
- `bathrooms`
  - `average`
- `school_rating`
  - `average`
- `distance_to_city_center`
  - `average`
- `price_buckets`
  - array of bucket label/count pairs

Example:

```json
{
  "record_count": 50,
  "price": {
    "average": 315420.5,
    "median": 302500,
    "minimum": 185000,
    "maximum": 620000
  },
  "price_buckets": [
    { "label": "< $250k", "count": 12 },
    { "label": "$250k-$400k", "count": 25 },
    { "label": "> $400k", "count": 13 }
  ]
}
```

The exact numeric values come from the workbook at runtime.

### `GET /market/segments`

Returns filtered market records and aggregate statistics for a segment.

Supported query filters:

- `minPrice`
- `maxPrice`
- `minBedrooms`
- `maxBedrooms`
- `minSchoolRating`
- `maxDistanceToCityCenter`

Example:

```text
GET /market/segments?minBedrooms=3&minSchoolRating=7&maxDistanceToCityCenter=8
```

Response:

```json
{
  "filters": {
    "minBedrooms": 3,
    "minSchoolRating": 7,
    "maxDistanceToCityCenter": 8
  },
  "record_count": 18,
  "statistics": {
    "price": {
      "average": 341200,
      "median": 335000,
      "minimum": 250000,
      "maximum": 510000
    }
  },
  "records": [
    {
      "id": 1,
      "square_footage": 1250,
      "bedrooms": 2,
      "bathrooms": 1.0,
      "year_built": 1985,
      "lot_size": 5200,
      "distance_to_city_center": 3.2,
      "school_rating": 7.1,
      "price": 185000
    }
  ]
}
```

If filters match no records, return `200` with:

```json
{
  "record_count": 0,
  "statistics": null,
  "records": []
}
```

### `POST /market/what-if`

Accepts property features, calls `ml-api /predict`, and returns the predicted price plus market position.

Request:

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

Response:

```json
{
  "predicted_price": 250829.56,
  "market_position": {
    "percentile": 46.0,
    "above_market_average": false,
    "difference_from_average": -12450.44
  },
  "nearest_records": [
    {
      "id": 12,
      "price": 252000,
      "square_footage": 1500,
      "bedrooms": 3,
      "school_rating": 7.5
    }
  ]
}
```

The percentile is calculated against the `price` column in the market dataset. Nearest records can be selected by absolute price difference after prediction.

## 7. Caching

Use Spring Cache.

Cacheable operations:

- Full market summary.
- Segment statistics for identical filter combinations.

Non-cacheable operations:

- `POST /market/what-if`, because input combinations can be high-cardinality and predictions depend on an upstream service.

Cache names:

- `marketSummary`
- `marketSegments`

The first implementation can use Spring's in-memory `ConcurrentMapCacheManager`.

> 中文注解：这里的缓存是为了满足面试任务里的 performance optimization，同时保持简单。后续如果数据变大，再替换成 Caffeine/Redis 也很自然。

## 8. Validation and Error Handling

### Validation

Reject invalid filters with `400`.

Examples:

- `minPrice > maxPrice`
- `minBedrooms > maxBedrooms`
- negative price
- invalid school rating outside the supported feature range
- invalid distance below zero

Reject invalid what-if payloads with `400`.

The feature bounds should align with the existing ML API assumptions where possible:

- `square_footage` > 0
- `bedrooms` >= 0
- `bathrooms` >= 0
- `year_built` within a realistic range
- `lot_size` > 0
- `distance_to_city_center` >= 0
- `school_rating` between 0 and 10

### Upstream failures

If `ml-api` is unreachable or returns a non-success response, return `502`.

Example:

```json
{
  "detail": "Prediction service unavailable"
}
```

### Empty results

Empty segment results are not errors. Return `200` with empty records and `statistics: null`.

## 9. Testing Strategy

### Unit tests

- `DatasetLoaderTest`
  - loads workbook rows
  - validates expected sheet and required columns
  - rejects missing or malformed workbook input

- `StatisticsCalculatorTest`
  - average, median, min, max
  - bucket counts
  - empty list behavior

- `MarketAnalysisServiceTest`
  - filter combinations
  - empty filtered result
  - what-if market percentile
  - nearest records by predicted price

- `MlApiClientTest`
  - successful prediction response mapping
  - non-2xx upstream response maps to service exception
  - timeout/unreachable upstream maps to service exception

### API tests

- `GET /health`
- `GET /market/summary`
- `GET /market/segments` with and without filters
- invalid filter returns `400`
- `POST /market/what-if` success with mocked `ml-api`
- `POST /market/what-if` when `ml-api` fails returns `502`

## 10. Local Run

Terminal 1:

```bash
cd apps/ml-api
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
cd apps/market-analysis-api
ML_API_BASE_URL=http://localhost:8000 ./mvnw spring-boot:run
```

Open:

```text
http://localhost:8002/health
```

## 11. Risks and Mitigations

### Risk: Java Excel dependencies add setup complexity

Mitigation: use Apache POI through Maven and keep loader logic isolated behind `DatasetLoader`.

### Risk: Small dataset makes statistics look simplistic

Mitigation: present the service as an interview/demo analytics backend, not a production real-estate model.

### Risk: what-if endpoint depends on `ml-api`

Mitigation: expose clear `502` errors when upstream prediction is unavailable and test that path.

### Risk: App 2 frontend remains placeholder after this module

Mitigation: keep README and route copy honest. The next module can replace the placeholder with a dashboard that consumes this API.

### Risk: export requirements are deferred

Mitigation: explicitly record CSV/PDF export as out of scope for this backend foundation module and handle it in a later export/dashboard module.

## 12. Acceptance Criteria

- `apps/market-analysis-api` exists and runs with Java 21 / Spring Boot 3.4.4.
- `GET /health` returns service status and loaded record count.
- `GET /market/summary` returns aggregate statistics.
- `GET /market/segments` supports the agreed filters and returns filtered stats/records.
- `POST /market/what-if` calls `ml-api /predict` and returns market position.
- Summary and segment computations use Spring Cache.
- Invalid filters return `400`.
- ML API failures return `502`.
- Tests cover loader, statistics, filters, what-if, caching-relevant service paths, and API error behavior.
- README explains setup, run, test, and integration with `ml-api`.
- No CSV/PDF export, Next.js dashboard, auth, Docker Compose, or database is added in this module.
