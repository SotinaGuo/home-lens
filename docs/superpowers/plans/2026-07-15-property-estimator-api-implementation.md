# Property Estimator API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/property-estimator-api`, a FastAPI backend for App 1 that validates property estimate requests, calls `ml-api`, stores in-memory history, and exposes estimate/comparison APIs.

**Architecture:** The service is a standalone FastAPI module that communicates with `ml-api` only over HTTP. It separates configuration, schemas, ML API client, in-memory repository, business service, and route layer so tests can use fakes and future persistence can replace the repository cleanly.

**Tech Stack:** Python 3.12+, FastAPI, Pydantic v2, httpx, pytest, Docker.

## Global Constraints

- Build only the `property-estimator-api` module in this phase.
- Do not build the Next.js portal UI in this phase.
- Do not build the Java market analysis backend in this phase.
- Do not add SQLite or persistent database storage in this phase.
- Do not add cross-service `docker-compose` in this phase.
- Service path must be `apps/property-estimator-api`.
- Use `ML_API_BASE_URL=http://localhost:8000` as the local default.
- The estimator API should run locally on port `8001`.
- The service must not train models and must not read the Excel workbook.
- The service must consume `ml-api` over HTTP with `POST {ML_API_BASE_URL}/predict`.
- History storage is in-memory, process-local, and non-persistent.
- Tests must not require a live `ml-api`; use fake clients or mock transports.
- Expose `GET /health`, `POST /estimates`, `GET /estimates`, `GET /estimates/{id}`, and `POST /comparisons`.

---

## Planned File Structure

```text
apps/
  property-estimator-api/
    .dockerignore
    .gitignore
    Dockerfile
    README.md
    pyproject.toml
    app/
      __init__.py
      config.py
      main.py
      ml_client.py
      repository.py
      schemas.py
      service.py
    tests/
      test_api.py
      test_ml_client.py
      test_repository.py
      test_service.py
```

## File Responsibility Map

- `apps/property-estimator-api/pyproject.toml`: Python package metadata, runtime dependencies, dev dependencies, pytest config.
- `apps/property-estimator-api/.gitignore`: Ignore virtualenvs, caches, bytecode, and local generated files.
- `apps/property-estimator-api/.dockerignore`: Keep local virtualenvs/caches out of Docker build context.
- `apps/property-estimator-api/app/config.py`: Environment-based settings.
- `apps/property-estimator-api/app/schemas.py`: Request/response schemas and validation.
- `apps/property-estimator-api/app/repository.py`: In-memory history repository.
- `apps/property-estimator-api/app/ml_client.py`: HTTP client and typed client exceptions for `ml-api`.
- `apps/property-estimator-api/app/service.py`: Business orchestration.
- `apps/property-estimator-api/app/main.py`: FastAPI app factory and endpoints.
- `apps/property-estimator-api/tests/*.py`: Unit and API tests using fakes/mock transports.
- `apps/property-estimator-api/Dockerfile`: Container image for local demo.
- `apps/property-estimator-api/README.md`: Setup, test, run, Docker, and demo instructions.

---

### Task 1: Scaffold the `property-estimator-api` Python module

**Files:**
- Create: `apps/property-estimator-api/.gitignore`
- Create: `apps/property-estimator-api/pyproject.toml`
- Create: `apps/property-estimator-api/app/__init__.py`

**Interfaces:**
- Consumes: Existing monorepo under `apps/`.
- Produces: Installable Python package rooted at `apps/property-estimator-api` with importable package `app`.

- [ ] **Step 1: Create module directories**

Run:

```bash
mkdir -p apps/property-estimator-api/app apps/property-estimator-api/tests
```

Expected: directories exist under `apps/property-estimator-api`.

- [ ] **Step 2: Create `.gitignore`**

Create `apps/property-estimator-api/.gitignore` with:

```gitignore
.venv/
__pycache__/
.pytest_cache/
*.pyc
```

- [ ] **Step 3: Create package marker**

Create `apps/property-estimator-api/app/__init__.py` with:

```python
"""Property estimator API package."""
```

- [ ] **Step 4: Create `pyproject.toml`**

Create `apps/property-estimator-api/pyproject.toml` with:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "property-estimator-api"
version = "0.1.0"
description = "FastAPI backend for property value estimates"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115,<1.0",
  "uvicorn[standard]>=0.30,<1.0",
  "pydantic>=2.8,<3.0",
  "pydantic-settings>=2.4,<3.0",
  "httpx>=0.27,<1.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2,<9.0"
]

[tool.hatch.build.targets.wheel]
packages = ["app"]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 5: Install package with dev dependencies**

Run:

```bash
cd apps/property-estimator-api
python3 -m venv .venv
.venv/bin/python -m pip install -e ".[dev]"
```

Expected: dependencies install successfully and local package `property-estimator-api` is installed in editable mode.

- [ ] **Step 6: Verify package imports**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/python -c "import app; print(app.__doc__)"
```

Expected output contains:

```text
Property estimator API package.
```

- [ ] **Step 7: Commit scaffold**

```bash
git add apps/property-estimator-api/.gitignore apps/property-estimator-api/pyproject.toml apps/property-estimator-api/app/__init__.py
git commit -m "chore: scaffold property estimator api"
```

---

### Task 2: Add configuration and Pydantic schemas

**Files:**
- Create: `apps/property-estimator-api/app/config.py`
- Create: `apps/property-estimator-api/app/schemas.py`
- Create: `apps/property-estimator-api/tests/test_schemas.py`

**Interfaces:**
- Consumes: package scaffold from Task 1.
- Produces:
  - `app.config.Settings`
  - `app.config.get_settings() -> Settings`
  - `app.schemas.PropertyFeatures`
  - `app.schemas.EstimateRecord`
  - `app.schemas.EstimateListResponse`
  - `app.schemas.ComparisonRequest`
  - `app.schemas.ComparisonResponse`
  - `app.schemas.HealthResponse`

- [ ] **Step 1: Write failing schema/config tests**

Create `apps/property-estimator-api/tests/test_schemas.py` with:

```python
import pytest
from pydantic import ValidationError

from app.config import Settings
from app.schemas import ComparisonRequest, PropertyFeatures


def valid_payload() -> dict[str, float | int]:
    return {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6,
    }


def test_settings_defaults() -> None:
    settings = Settings()
    assert settings.service_name == "property-estimator-api"
    assert settings.ml_api_base_url == "http://localhost:8000"
    assert settings.ml_api_timeout_seconds == 5.0


def test_property_features_accept_valid_payload() -> None:
    features = PropertyFeatures(**valid_payload())
    assert features.square_footage == 1550
    assert features.school_rating == 7.6


def test_property_features_reject_unknown_fields() -> None:
    payload = valid_payload()
    payload["garage_spaces"] = 2

    with pytest.raises(ValidationError):
        PropertyFeatures(**payload)


def test_property_features_reject_invalid_school_rating() -> None:
    payload = valid_payload()
    payload["school_rating"] = 10.5

    with pytest.raises(ValidationError):
        PropertyFeatures(**payload)


def test_comparison_request_requires_at_least_two_ids() -> None:
    with pytest.raises(ValidationError):
        ComparisonRequest(estimate_ids=["one"])
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_schemas.py -v
```

Expected: FAIL because `app.config` and `app.schemas` do not exist yet.

- [ ] **Step 3: Implement `config.py`**

Create `apps/property-estimator-api/app/config.py` with:

```python
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "property-estimator-api"
    ml_api_base_url: str = "http://localhost:8000"
    ml_api_timeout_seconds: float = Field(default=5.0, gt=0)


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 4: Implement `schemas.py`**

Create `apps/property-estimator-api/app/schemas.py` with:

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PropertyFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0)
    bedrooms: int = Field(ge=0)
    bathrooms: float = Field(ge=0)
    year_built: int = Field(ge=1800, le=2100)
    lot_size: float = Field(gt=0)
    distance_to_city_center: float = Field(ge=0)
    school_rating: float = Field(ge=0, le=10)


class EstimateRecord(BaseModel):
    id: str
    features: PropertyFeatures
    predicted_price: float
    created_at: datetime


class EstimateListResponse(BaseModel):
    items: list[EstimateRecord]


class ComparisonRequest(BaseModel):
    estimate_ids: list[str] = Field(min_length=2)


class ComparisonResponse(BaseModel):
    items: list[EstimateRecord]
    highest_price: float
    lowest_price: float
    price_difference: float


class HealthResponse(BaseModel):
    status: str
    service: str
    ml_api_base_url: str
```

- [ ] **Step 5: Run schema/config tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_schemas.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit config and schemas**

```bash
git add apps/property-estimator-api/app/config.py apps/property-estimator-api/app/schemas.py apps/property-estimator-api/tests/test_schemas.py
git commit -m "feat: add property estimator config and schemas"
```

---

### Task 3: Add in-memory estimate repository

**Files:**
- Create: `apps/property-estimator-api/app/repository.py`
- Create: `apps/property-estimator-api/tests/test_repository.py`

**Interfaces:**
- Consumes:
  - `app.schemas.EstimateRecord`
- Produces:
  - `class EstimateRepository`
  - `EstimateRepository.add(record: EstimateRecord) -> EstimateRecord`
  - `EstimateRepository.list(limit: int = 20) -> list[EstimateRecord]`
  - `EstimateRepository.get(record_id: str) -> EstimateRecord | None`
  - `EstimateRepository.clear() -> None`

- [ ] **Step 1: Write failing repository tests**

Create `apps/property-estimator-api/tests/test_repository.py` with:

```python
from datetime import UTC, datetime, timedelta

from app.repository import EstimateRepository
from app.schemas import EstimateRecord, PropertyFeatures


def make_record(record_id: str, minutes_ago: int, price: float) -> EstimateRecord:
    return EstimateRecord(
        id=record_id,
        features=PropertyFeatures(
            square_footage=1550,
            bedrooms=3,
            bathrooms=2,
            year_built=1997,
            lot_size=6800,
            distance_to_city_center=4.1,
            school_rating=7.6,
        ),
        predicted_price=price,
        created_at=datetime.now(UTC) - timedelta(minutes=minutes_ago),
    )


def test_add_and_get_record() -> None:
    repository = EstimateRepository()
    record = make_record("one", minutes_ago=0, price=250000)

    repository.add(record)

    assert repository.get("one") == record


def test_get_missing_record_returns_none() -> None:
    repository = EstimateRepository()

    assert repository.get("missing") is None


def test_list_returns_reverse_chronological_order() -> None:
    repository = EstimateRepository()
    older = make_record("older", minutes_ago=10, price=200000)
    newer = make_record("newer", minutes_ago=1, price=300000)

    repository.add(older)
    repository.add(newer)

    assert [item.id for item in repository.list()] == ["newer", "older"]


def test_list_applies_limit() -> None:
    repository = EstimateRepository()
    repository.add(make_record("one", minutes_ago=3, price=100000))
    repository.add(make_record("two", minutes_ago=2, price=200000))
    repository.add(make_record("three", minutes_ago=1, price=300000))

    assert [item.id for item in repository.list(limit=2)] == ["three", "two"]


def test_clear_removes_records() -> None:
    repository = EstimateRepository()
    repository.add(make_record("one", minutes_ago=0, price=250000))

    repository.clear()

    assert repository.list() == []
```

- [ ] **Step 2: Run repository tests to verify they fail**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_repository.py -v
```

Expected: FAIL because `app.repository` does not exist yet.

- [ ] **Step 3: Implement `repository.py`**

Create `apps/property-estimator-api/app/repository.py` with:

```python
from app.schemas import EstimateRecord


class EstimateRepository:
    def __init__(self) -> None:
        self._records: dict[str, EstimateRecord] = {}

    def add(self, record: EstimateRecord) -> EstimateRecord:
        self._records[record.id] = record
        return record

    def list(self, limit: int = 20) -> list[EstimateRecord]:
        records = sorted(
            self._records.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )
        return records[:limit]

    def get(self, record_id: str) -> EstimateRecord | None:
        return self._records.get(record_id)

    def clear(self) -> None:
        self._records.clear()
```

- [ ] **Step 4: Run repository tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_repository.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit repository**

```bash
git add apps/property-estimator-api/app/repository.py apps/property-estimator-api/tests/test_repository.py
git commit -m "feat: add in-memory estimate repository"
```

---

### Task 4: Add ML API HTTP client

**Files:**
- Create: `apps/property-estimator-api/app/ml_client.py`
- Create: `apps/property-estimator-api/tests/test_ml_client.py`

**Interfaces:**
- Consumes:
  - `app.schemas.PropertyFeatures`
- Produces:
  - `class MlApiError(Exception)`
  - `class MlApiConnectionError(MlApiError)`
  - `class MlApiTimeoutError(MlApiError)`
  - `class MlApiResponseError(MlApiError)`
  - `class MlApiClient`
  - `MlApiClient.predict(features: PropertyFeatures) -> float`

- [ ] **Step 1: Write failing ML client tests**

Create `apps/property-estimator-api/tests/test_ml_client.py` with:

```python
import httpx
import pytest

from app.ml_client import (
    MlApiClient,
    MlApiConnectionError,
    MlApiResponseError,
    MlApiTimeoutError,
)
from app.schemas import PropertyFeatures


def sample_features() -> PropertyFeatures:
    return PropertyFeatures(
        square_footage=1550,
        bedrooms=3,
        bathrooms=2,
        year_built=1997,
        lot_size=6800,
        distance_to_city_center=4.1,
        school_rating=7.6,
    )


def test_predict_parses_successful_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/predict"
        return httpx.Response(
            200,
            json={
                "count": 1,
                "predictions": [{"predicted_price": 250829.56}],
                "algorithm": "Ridge Regression",
            },
        )

    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(transport=httpx.MockTransport(handler)),
    )

    assert client.predict(sample_features()) == 250829.56


def test_predict_maps_timeout() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("too slow", request=request)

    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(MlApiTimeoutError):
        client.predict(sample_features())


def test_predict_maps_connection_failure() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection failed", request=request)

    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(MlApiConnectionError):
        client.predict(sample_features())


def test_predict_maps_non_success_status() -> None:
    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(
            transport=httpx.MockTransport(lambda request: httpx.Response(500))
        ),
    )

    with pytest.raises(MlApiResponseError):
        client.predict(sample_features())


def test_predict_rejects_malformed_response() -> None:
    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(
            transport=httpx.MockTransport(lambda request: httpx.Response(200, json={}))
        ),
    )

    with pytest.raises(MlApiResponseError):
        client.predict(sample_features())
```

- [ ] **Step 2: Run ML client tests to verify they fail**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_ml_client.py -v
```

Expected: FAIL because `app.ml_client` does not exist yet.

- [ ] **Step 3: Implement `ml_client.py`**

Create `apps/property-estimator-api/app/ml_client.py` with:

```python
from __future__ import annotations

import httpx

from app.schemas import PropertyFeatures


class MlApiError(Exception):
    """Base error for ML API client failures."""


class MlApiConnectionError(MlApiError):
    """Raised when the ML API cannot be reached."""


class MlApiTimeoutError(MlApiError):
    """Raised when the ML API request times out."""


class MlApiResponseError(MlApiError):
    """Raised when the ML API returns an invalid or unsuccessful response."""


class MlApiClient:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: float = 5.0,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(timeout=timeout_seconds)

    def predict(self, features: PropertyFeatures) -> float:
        try:
            response = self._client.post(
                f"{self.base_url}/predict",
                json=features.model_dump(),
            )
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise MlApiTimeoutError("ML API request timed out") from exc
        except httpx.ConnectError as exc:
            raise MlApiConnectionError("ML API connection failed") from exc
        except httpx.HTTPStatusError as exc:
            raise MlApiResponseError("ML API returned an unsuccessful response") from exc
        except httpx.HTTPError as exc:
            raise MlApiConnectionError("ML API request failed") from exc

        try:
            body = response.json()
            predictions = body["predictions"]
            first_prediction = predictions[0]
            predicted_price = first_prediction["predicted_price"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise MlApiResponseError("ML API returned a malformed prediction response") from exc

        return round(float(predicted_price), 2)

    def close(self) -> None:
        if self._owns_client:
            self._client.close()
```

- [ ] **Step 4: Run ML client tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_ml_client.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit ML client**

```bash
git add apps/property-estimator-api/app/ml_client.py apps/property-estimator-api/tests/test_ml_client.py
git commit -m "feat: add ml api client for property estimates"
```

---

### Task 5: Add estimator service layer

**Files:**
- Create: `apps/property-estimator-api/app/service.py`
- Create: `apps/property-estimator-api/tests/test_service.py`

**Interfaces:**
- Consumes:
  - `app.schemas.PropertyFeatures`
  - `app.schemas.EstimateRecord`
  - `app.schemas.ComparisonResponse`
  - `app.repository.EstimateRepository`
  - `MlApiClient.predict(features: PropertyFeatures) -> float`
- Produces:
  - `class EstimateNotFoundError(Exception)`
  - `class ComparisonValidationError(Exception)`
  - `class EstimatorService`
  - `EstimatorService.create_estimate(features: PropertyFeatures) -> EstimateRecord`
  - `EstimatorService.list_estimates(limit: int = 20) -> list[EstimateRecord]`
  - `EstimatorService.get_estimate(record_id: str) -> EstimateRecord`
  - `EstimatorService.compare_estimates(estimate_ids: list[str]) -> ComparisonResponse`

- [ ] **Step 1: Write failing service tests**

Create `apps/property-estimator-api/tests/test_service.py` with:

```python
import pytest

from app.repository import EstimateRepository
from app.schemas import PropertyFeatures
from app.service import ComparisonValidationError, EstimateNotFoundError, EstimatorService


class FakeMlClient:
    def __init__(self, price: float = 250829.56) -> None:
        self.price = price
        self.calls: list[PropertyFeatures] = []

    def predict(self, features: PropertyFeatures) -> float:
        self.calls.append(features)
        return self.price


def sample_features(square_footage: float = 1550) -> PropertyFeatures:
    return PropertyFeatures(
        square_footage=square_footage,
        bedrooms=3,
        bathrooms=2,
        year_built=1997,
        lot_size=6800,
        distance_to_city_center=4.1,
        school_rating=7.6,
    )


def make_service(price: float = 250829.56) -> tuple[EstimatorService, FakeMlClient]:
    fake_client = FakeMlClient(price=price)
    service = EstimatorService(
        repository=EstimateRepository(),
        ml_client=fake_client,
    )
    return service, fake_client


def test_create_estimate_calls_ml_api_and_stores_record() -> None:
    service, fake_client = make_service()
    features = sample_features()

    record = service.create_estimate(features)

    assert record.predicted_price == 250829.56
    assert record.features == features
    assert fake_client.calls == [features]
    assert service.get_estimate(record.id) == record


def test_list_estimates_returns_created_records() -> None:
    service, _ = make_service()
    first = service.create_estimate(sample_features(square_footage=1200))
    second = service.create_estimate(sample_features(square_footage=1800))

    assert [item.id for item in service.list_estimates()] == [second.id, first.id]


def test_get_missing_estimate_raises_not_found() -> None:
    service, _ = make_service()

    with pytest.raises(EstimateNotFoundError):
        service.get_estimate("missing")


def test_compare_estimates_returns_summary() -> None:
    service, fake_client = make_service(price=200000)
    first = service.create_estimate(sample_features(square_footage=1200))
    fake_client.price = 300000
    second = service.create_estimate(sample_features(square_footage=1800))

    comparison = service.compare_estimates([first.id, second.id])

    assert [item.id for item in comparison.items] == [first.id, second.id]
    assert comparison.lowest_price == 200000
    assert comparison.highest_price == 300000
    assert comparison.price_difference == 100000


def test_compare_estimates_rejects_fewer_than_two_ids() -> None:
    service, _ = make_service()

    with pytest.raises(ComparisonValidationError):
        service.compare_estimates(["one"])


def test_compare_estimates_rejects_unknown_ids() -> None:
    service, _ = make_service()
    record = service.create_estimate(sample_features())

    with pytest.raises(EstimateNotFoundError):
        service.compare_estimates([record.id, "missing"])
```

- [ ] **Step 2: Run service tests to verify they fail**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_service.py -v
```

Expected: FAIL because `app.service` does not exist yet.

- [ ] **Step 3: Implement `service.py`**

Create `apps/property-estimator-api/app/service.py` with:

```python
from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from app.repository import EstimateRepository
from app.schemas import ComparisonResponse, EstimateRecord, PropertyFeatures


class EstimateNotFoundError(Exception):
    """Raised when an estimate id does not exist."""


class ComparisonValidationError(Exception):
    """Raised when a comparison request is invalid."""


class PredictionClient(Protocol):
    def predict(self, features: PropertyFeatures) -> float:
        """Return a predicted price for property features."""


class EstimatorService:
    def __init__(
        self,
        repository: EstimateRepository,
        ml_client: PredictionClient,
    ) -> None:
        self.repository = repository
        self.ml_client = ml_client

    def create_estimate(self, features: PropertyFeatures) -> EstimateRecord:
        predicted_price = self.ml_client.predict(features)
        record = EstimateRecord(
            id=str(uuid4()),
            features=features,
            predicted_price=predicted_price,
            created_at=datetime.now(UTC),
        )
        return self.repository.add(record)

    def list_estimates(self, limit: int = 20) -> list[EstimateRecord]:
        return self.repository.list(limit=limit)

    def get_estimate(self, record_id: str) -> EstimateRecord:
        record = self.repository.get(record_id)
        if record is None:
            raise EstimateNotFoundError(f"Estimate not found: {record_id}")
        return record

    def compare_estimates(self, estimate_ids: list[str]) -> ComparisonResponse:
        if len(estimate_ids) < 2:
            raise ComparisonValidationError("At least two estimate ids are required")

        records = [self.get_estimate(record_id) for record_id in estimate_ids]
        prices = [record.predicted_price for record in records]

        highest_price = max(prices)
        lowest_price = min(prices)
        return ComparisonResponse(
            items=records,
            highest_price=highest_price,
            lowest_price=lowest_price,
            price_difference=round(highest_price - lowest_price, 2),
        )
```

- [ ] **Step 4: Run service tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_service.py -v
```

Expected: PASS.

- [ ] **Step 5: Run non-API test suite**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_schemas.py tests/test_repository.py tests/test_ml_client.py tests/test_service.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit service layer**

```bash
git add apps/property-estimator-api/app/service.py apps/property-estimator-api/tests/test_service.py
git commit -m "feat: add property estimator service layer"
```

---

### Task 6: Add FastAPI endpoints

**Files:**
- Create: `apps/property-estimator-api/app/main.py`
- Create: `apps/property-estimator-api/tests/test_api.py`

**Interfaces:**
- Consumes:
  - `app.config.get_settings`
  - `app.ml_client.MlApiClient`
  - `app.ml_client.MlApiConnectionError`
  - `app.ml_client.MlApiResponseError`
  - `app.ml_client.MlApiTimeoutError`
  - `app.repository.EstimateRepository`
  - `app.schemas.*`
  - `app.service.EstimatorService`
- Produces:
  - `create_app(service: EstimatorService | None = None, settings: Settings | None = None) -> FastAPI`
  - module-level `app`
  - `GET /health`
  - `POST /estimates`
  - `GET /estimates`
  - `GET /estimates/{id}`
  - `POST /comparisons`

- [ ] **Step 1: Write failing API tests**

Create `apps/property-estimator-api/tests/test_api.py` with:

```python
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.repository import EstimateRepository
from app.schemas import PropertyFeatures
from app.service import EstimatorService


class FakeMlClient:
    def __init__(self, price: float = 250829.56) -> None:
        self.price = price

    def predict(self, features: PropertyFeatures) -> float:
        return self.price


def make_client(price: float = 250829.56) -> TestClient:
    service = EstimatorService(
        repository=EstimateRepository(),
        ml_client=FakeMlClient(price=price),
    )
    settings = Settings(ml_api_base_url="http://ml-api.test")
    return TestClient(create_app(service=service, settings=settings))


def valid_payload() -> dict[str, float | int]:
    return {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6,
    }


def test_health_endpoint() -> None:
    with make_client() as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "property-estimator-api",
        "ml_api_base_url": "http://ml-api.test",
    }


def test_create_estimate_and_get_history() -> None:
    with make_client() as client:
        create_response = client.post("/estimates", json=valid_payload())
        history_response = client.get("/estimates")

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["predicted_price"] == 250829.56
    assert created["features"]["square_footage"] == 1550

    assert history_response.status_code == 200
    assert history_response.json()["items"][0]["id"] == created["id"]


def test_get_estimate_by_id() -> None:
    with make_client() as client:
        created = client.post("/estimates", json=valid_payload()).json()
        response = client.get(f"/estimates/{created['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_missing_estimate_returns_404() -> None:
    with make_client() as client:
        response = client.get("/estimates/missing")

    assert response.status_code == 404


def test_create_comparison() -> None:
    with make_client() as client:
        first = client.post("/estimates", json=valid_payload()).json()
        second_payload = valid_payload()
        second_payload["square_footage"] = 1800
        second = client.post("/estimates", json=second_payload).json()
        response = client.post(
            "/comparisons",
            json={"estimate_ids": [first["id"], second["id"]]},
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 2
    assert body["highest_price"] == 250829.56
    assert body["lowest_price"] == 250829.56
    assert body["price_difference"] == 0.0


def test_comparison_with_one_id_returns_422() -> None:
    with make_client() as client:
        response = client.post("/comparisons", json={"estimate_ids": ["one"]})

    assert response.status_code == 422


def test_comparison_with_unknown_id_returns_404() -> None:
    with make_client() as client:
        first = client.post("/estimates", json=valid_payload()).json()
        response = client.post(
            "/comparisons",
            json={"estimate_ids": [first["id"], "missing"]},
        )

    assert response.status_code == 404


def test_create_estimate_rejects_invalid_payload() -> None:
    payload = valid_payload()
    payload["school_rating"] = 11

    with make_client() as client:
        response = client.post("/estimates", json=payload)

    assert response.status_code == 422
```

- [ ] **Step 2: Run API tests to verify they fail**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_api.py -v
```

Expected: FAIL because `app.main` does not exist yet.

- [ ] **Step 3: Implement `main.py`**

Create `apps/property-estimator-api/app/main.py` with:

```python
from fastapi import FastAPI, HTTPException, Query

from app.config import Settings, get_settings
from app.ml_client import (
    MlApiClient,
    MlApiConnectionError,
    MlApiResponseError,
    MlApiTimeoutError,
)
from app.repository import EstimateRepository
from app.schemas import (
    ComparisonRequest,
    ComparisonResponse,
    EstimateListResponse,
    EstimateRecord,
    HealthResponse,
    PropertyFeatures,
)
from app.service import ComparisonValidationError, EstimateNotFoundError, EstimatorService


def build_default_service(settings: Settings) -> EstimatorService:
    return EstimatorService(
        repository=EstimateRepository(),
        ml_client=MlApiClient(
            base_url=str(settings.ml_api_base_url),
            timeout_seconds=settings.ml_api_timeout_seconds,
        ),
    )


def create_app(
    service: EstimatorService | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    active_settings = settings or get_settings()
    active_service = service or build_default_service(active_settings)

    app = FastAPI(
        title="Property Estimator API",
        description="Backend API for property value estimates and comparisons.",
        version="0.1.0",
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            service=active_settings.service_name,
            ml_api_base_url=str(active_settings.ml_api_base_url),
        )

    @app.post("/estimates", response_model=EstimateRecord)
    def create_estimate(features: PropertyFeatures) -> EstimateRecord:
        try:
            return active_service.create_estimate(features)
        except MlApiTimeoutError as exc:
            raise HTTPException(status_code=504, detail="ML API request timed out") from exc
        except (MlApiConnectionError, MlApiResponseError) as exc:
            raise HTTPException(status_code=502, detail="ML API prediction failed") from exc

    @app.get("/estimates", response_model=EstimateListResponse)
    def list_estimates(
        limit: int = Query(default=20, ge=1, le=100),
    ) -> EstimateListResponse:
        return EstimateListResponse(items=active_service.list_estimates(limit=limit))

    @app.get("/estimates/{estimate_id}", response_model=EstimateRecord)
    def get_estimate(estimate_id: str) -> EstimateRecord:
        try:
            return active_service.get_estimate(estimate_id)
        except EstimateNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Estimate not found") from exc

    @app.post("/comparisons", response_model=ComparisonResponse)
    def compare_estimates(request: ComparisonRequest) -> ComparisonResponse:
        try:
            return active_service.compare_estimates(request.estimate_ids)
        except ComparisonValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except EstimateNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Estimate not found") from exc

    return app


app = create_app()
```

- [ ] **Step 4: Run API tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest tests/test_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest -v
```

Expected: all tests PASS.

- [ ] **Step 6: Commit API endpoints**

```bash
git add apps/property-estimator-api/app/main.py apps/property-estimator-api/tests/test_api.py
git commit -m "feat: add property estimator api endpoints"
```

---

### Task 7: Add Dockerfile, `.dockerignore`, and README

**Files:**
- Create: `apps/property-estimator-api/.dockerignore`
- Create: `apps/property-estimator-api/Dockerfile`
- Create: `apps/property-estimator-api/README.md`

**Interfaces:**
- Consumes:
  - completed `apps/property-estimator-api` service.
- Produces:
  - Docker image runnable on port `8001`.
  - README with local, test, run, integration, and Docker instructions.

- [ ] **Step 1: Create `.dockerignore`**

Create `apps/property-estimator-api/.dockerignore` with:

```gitignore
.venv/
__pycache__/
.pytest_cache/
*.pyc
.git/
dist/
build/
*.egg-info/
```

- [ ] **Step 2: Create Dockerfile**

Create `apps/property-estimator-api/Dockerfile` with:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

- [ ] **Step 3: Create README**

Create `apps/property-estimator-api/README.md` with:

````markdown
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

The Docker command assumes `ml-api` is running on the host at port `8000`.

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
````

- [ ] **Step 4: Run full test suite**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest -v
```

Expected: all tests PASS.

- [ ] **Step 5: Try Docker build if Docker is available**

Run:

```bash
cd apps/property-estimator-api
docker build -t property-estimator-api .
```

Expected if Docker is installed: image builds successfully.

If Docker is not installed, record the exact error in the task report and continue.

- [ ] **Step 6: Commit Docker and README**

```bash
git add apps/property-estimator-api/.dockerignore apps/property-estimator-api/Dockerfile apps/property-estimator-api/README.md
git commit -m "docs: add property estimator api docker and usage instructions"
```

---

### Task 8: Final verification and integration smoke test

**Files:**
- Modify: `apps/property-estimator-api/README.md` only if verified commands differ from documented commands.

**Interfaces:**
- Consumes: completed `ml-api` and `property-estimator-api` modules.
- Produces: verified local run/test instructions and clean git state.

- [ ] **Step 1: Run property estimator tests**

Run:

```bash
cd apps/property-estimator-api
.venv/bin/pytest -q
```

Expected: all tests PASS.

- [ ] **Step 2: Run `ml-api` tests**

Run:

```bash
cd apps/ml-api
.venv/bin/pytest -q
```

Expected: all tests PASS.

- [ ] **Step 3: Start `ml-api`**

Run:

```bash
cd apps/ml-api
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Expected: Uvicorn starts on `http://127.0.0.1:8000`.

- [ ] **Step 4: Start `property-estimator-api` in a second terminal**

Run:

```bash
cd apps/property-estimator-api
ML_API_BASE_URL=http://localhost:8000 .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Expected: Uvicorn starts on `http://127.0.0.1:8001`.

- [ ] **Step 5: Smoke test health**

Run:

```bash
curl http://localhost:8001/health
```

Expected response contains:

```json
{"status":"ok","service":"property-estimator-api"}
```

- [ ] **Step 6: Smoke test estimate creation**

Run:

```bash
curl -X POST http://localhost:8001/estimates \
  -H "Content-Type: application/json" \
  -d '{"square_footage":1550,"bedrooms":3,"bathrooms":2,"year_built":1997,"lot_size":6800,"distance_to_city_center":4.1,"school_rating":7.6}'
```

Expected response contains:

```json
"predicted_price"
```

and an `id`.

- [ ] **Step 7: Smoke test history**

Run:

```bash
curl http://localhost:8001/estimates
```

Expected response contains:

```json
"items"
```

with at least one item from Step 6.

- [ ] **Step 8: Smoke test comparison**

Create two estimates, then run:

```bash
curl -X POST http://localhost:8001/comparisons \
  -H "Content-Type: application/json" \
  -d '{"estimate_ids":["<first-id>","<second-id>"]}'
```

Expected response contains:

```json
"price_difference"
```

- [ ] **Step 9: Stop both Uvicorn processes**

Send `Ctrl-C` to both server terminals.

Expected: both servers stop cleanly.

- [ ] **Step 10: Confirm git status**

Run:

```bash
git status --short
```

Expected: clean working tree except ignored virtualenv/cache files.

- [ ] **Step 11: Commit any README correction**

If `apps/property-estimator-api/README.md` changed during verification, run:

```bash
git add apps/property-estimator-api/README.md
git commit -m "docs: clarify property estimator verification steps"
```

If README did not change, skip this commit.
