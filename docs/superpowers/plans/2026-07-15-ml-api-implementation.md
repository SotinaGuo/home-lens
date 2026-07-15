# ML API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a FastAPI `ml-api` service that trains, loads, and serves a Ridge Regression housing price prediction model from the provided Excel workbook.

**Architecture:** The service lives under `apps/ml-api` inside a future monorepo. Training, model loading, request schemas, and HTTP endpoints are separated into focused files. The API loads a persisted model on startup and automatically trains from the workbook if the model artifact is missing.

**Tech Stack:** Python 3.12+, FastAPI, Pydantic v2, pandas, openpyxl, scikit-learn, joblib, pytest, httpx, Docker.

## Global Constraints

- Build only the `ml-api` module in this phase.
- Do not build the Next.js portal, App 1 Python backend, App 2 Java backend, or cross-service `docker-compose` in this phase.
- Use `Python 3.12+`.
- Use `FastAPI`.
- Use `Scikit-learn`.
- Use a scikit-learn pipeline: `StandardScaler -> Ridge Regression`.
- Train from sheet `Test Data For Prediction`.
- Use target column `price`.
- Exclude `id` from model features.
- Use feature columns in this exact order: `square_footage`, `bedrooms`, `bathrooms`, `year_built`, `lot_size`, `distance_to_city_center`, `school_rating`.
- Support single-object and batch-array requests in `POST /predict`.
- Expose `GET /health`, `POST /predict`, and `GET /model-info`.
- Keep generated model artifacts out of git; they must be reproducible from the workbook and training code.

---

## Planned File Structure

```text
apps/
  ml-api/
    .gitignore
    Dockerfile
    README.md
    pyproject.toml
    app/
      __init__.py
      config.py
      main.py
      model_service.py
      schemas.py
      training.py
    data/
      House Price Dataset & Test Data For Prediction.xlsx
    models/
      .gitkeep
    tests/
      test_api.py
      test_model_service.py
      test_schemas.py
      test_training.py
```

## File Responsibility Map

- `apps/ml-api/pyproject.toml`: Python package metadata, runtime dependencies, dev dependencies, pytest config.
- `apps/ml-api/.gitignore`: Ignores virtualenvs, caches, and generated model artifacts.
- `apps/ml-api/app/config.py`: Central constants for paths, sheet names, feature columns, model artifact names, and algorithm config.
- `apps/ml-api/app/schemas.py`: Pydantic request and response schemas with validation.
- `apps/ml-api/app/training.py`: Workbook loading, data validation, model training, metric calculation, and artifact writing.
- `apps/ml-api/app/model_service.py`: Runtime model loading, automatic fallback training, prediction, and model metadata access.
- `apps/ml-api/app/main.py`: FastAPI app, startup loading, HTTP endpoints, and API error mapping.
- `apps/ml-api/tests/*.py`: Unit and API tests.
- `apps/ml-api/Dockerfile`: Container image for local interview demo.
- `apps/ml-api/README.md`: Local run, training, test, Docker, and Swagger instructions.

---

### Task 1: Scaffold the `ml-api` Python module

**Files:**
- Create: `apps/ml-api/.gitignore`
- Create: `apps/ml-api/pyproject.toml`
- Create: `apps/ml-api/app/__init__.py`
- Create: `apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx`
- Create: `apps/ml-api/models/.gitkeep`

**Interfaces:**
- Consumes: Provided workbook at `/Users/raven/Downloads/House Price Dataset & Test Data For Prediction.xlsx`.
- Produces: Installable Python package rooted at `apps/ml-api` with importable package `app`.

- [ ] **Step 1: Create module directories**

Run:

```bash
mkdir -p apps/ml-api/app apps/ml-api/data apps/ml-api/models apps/ml-api/tests
```

Expected: directories exist under `apps/ml-api`.

- [ ] **Step 2: Copy the workbook into the module**

Run:

```bash
cp "/Users/raven/Downloads/House Price Dataset & Test Data For Prediction.xlsx" "apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx"
```

Expected: `apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx` exists.

- [ ] **Step 3: Create `.gitignore`**

Create `apps/ml-api/.gitignore` with:

```gitignore
.venv/
__pycache__/
.pytest_cache/
*.pyc

models/*
!models/.gitkeep
```

- [ ] **Step 4: Create package marker and model directory marker**

Create `apps/ml-api/app/__init__.py` with:

```python
"""Housing price prediction ML API package."""
```

Create `apps/ml-api/models/.gitkeep` as an empty file.

- [ ] **Step 5: Create `pyproject.toml`**

Create `apps/ml-api/pyproject.toml` with:

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "house-price-ml-api"
version = "0.1.0"
description = "FastAPI service for housing price prediction"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115,<1.0",
  "uvicorn[standard]>=0.30,<1.0",
  "pydantic>=2.8,<3.0",
  "pandas>=2.2,<3.0",
  "openpyxl>=3.1,<4.0",
  "scikit-learn>=1.5,<2.0",
  "joblib>=1.4,<2.0",
  "numpy>=1.26,<3.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2,<9.0",
  "httpx>=0.27,<1.0"
]

[tool.hatch.build.targets.wheel]
packages = ["app"]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 6: Install the package with dev dependencies**

Run:

```bash
cd apps/ml-api
python -m pip install -e ".[dev]"
```

Expected: dependencies install successfully and the local package `house-price-ml-api` is installed in editable mode.

- [ ] **Step 7: Verify the workbook and package metadata**

Run:

```bash
test -f "apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx"
test -f "apps/ml-api/pyproject.toml"
```

Expected: both commands exit with code 0.

- [ ] **Step 8: Commit scaffold**

```bash
git add apps/ml-api/.gitignore apps/ml-api/pyproject.toml apps/ml-api/app/__init__.py "apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx" apps/ml-api/models/.gitkeep
git commit -m "chore: scaffold ml api module"
```

---

### Task 2: Add configuration constants and request/response schemas

**Files:**
- Create: `apps/ml-api/app/config.py`
- Create: `apps/ml-api/app/schemas.py`
- Create: `apps/ml-api/tests/test_schemas.py`

**Interfaces:**
- Consumes: `apps/ml-api/pyproject.toml` dependencies from Task 1.
- Produces:
  - `app.config.FEATURE_COLUMNS: list[str]`
  - `app.config.DATA_PATH: pathlib.Path`
  - `app.schemas.HousingFeatures`
  - `app.schemas.PredictionResponse`
  - `app.schemas.HealthResponse`
  - `app.schemas.ModelInfoResponse`

- [ ] **Step 1: Write failing schema tests**

Create `apps/ml-api/tests/test_schemas.py` with:

```python
import pytest
from pydantic import ValidationError

from app.config import FEATURE_COLUMNS
from app.schemas import HousingFeatures


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


def test_feature_columns_are_in_expected_order() -> None:
    assert FEATURE_COLUMNS == [
        "square_footage",
        "bedrooms",
        "bathrooms",
        "year_built",
        "lot_size",
        "distance_to_city_center",
        "school_rating",
    ]


def test_housing_features_accept_valid_payload() -> None:
    features = HousingFeatures(**valid_payload())
    assert features.square_footage == 1550
    assert features.school_rating == 7.6


def test_housing_features_reject_negative_square_footage() -> None:
    payload = valid_payload()
    payload["square_footage"] = -1

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)


def test_housing_features_reject_school_rating_above_ten() -> None:
    payload = valid_payload()
    payload["school_rating"] = 10.5

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)


def test_housing_features_reject_unknown_fields() -> None:
    payload = valid_payload()
    payload["garage_spaces"] = 2

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)
```

- [ ] **Step 2: Run schema tests to verify they fail**

Run:

```bash
cd apps/ml-api
pytest tests/test_schemas.py -v
```

Expected: FAIL because `app.config` and `app.schemas` do not exist yet.

- [ ] **Step 3: Implement `config.py`**

Create `apps/ml-api/app/config.py` with:

```python
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"
DATA_PATH = DATA_DIR / "House Price Dataset & Test Data For Prediction.xlsx"

MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = MODEL_DIR / "ridge_model.joblib"
METRICS_FILE = MODEL_DIR / "metrics.json"

TRAINING_SHEET = "Test Data For Prediction"
PREDICTION_SAMPLE_SHEET = "House Price Dataset"

ID_COLUMN = "id"
TARGET_COLUMN = "price"

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

ALGORITHM_NAME = "Ridge Regression"
PIPELINE_NAME = "StandardScaler -> Ridge Regression"
RIDGE_ALPHA = 1.0
TEST_SIZE = 0.2
RANDOM_STATE = 42
```

- [ ] **Step 4: Implement `schemas.py`**

Create `apps/ml-api/app/schemas.py` with:

```python
from pydantic import BaseModel, ConfigDict, Field


class HousingFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0)
    bedrooms: int = Field(ge=0)
    bathrooms: float = Field(ge=0)
    year_built: int = Field(ge=1800, le=2100)
    lot_size: float = Field(gt=0)
    distance_to_city_center: float = Field(ge=0)
    school_rating: float = Field(ge=0, le=10)


class PredictionItem(BaseModel):
    predicted_price: float


class PredictionResponse(BaseModel):
    count: int = Field(ge=0)
    predictions: list[PredictionItem]
    algorithm: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    algorithm: str


class ModelInfoResponse(BaseModel):
    algorithm: str
    pipeline: str
    features: list[str]
    coefficients: dict[str, float]
    intercept: float
    metrics: dict[str, float]
    training_samples: int
```

- [ ] **Step 5: Run schema tests to verify they pass**

Run:

```bash
cd apps/ml-api
pytest tests/test_schemas.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit schemas and config**

```bash
git add apps/ml-api/app/config.py apps/ml-api/app/schemas.py apps/ml-api/tests/test_schemas.py
git commit -m "feat: add ml api config and schemas"
```

---

### Task 3: Add training pipeline and artifact generation

**Files:**
- Create: `apps/ml-api/app/training.py`
- Create: `apps/ml-api/tests/test_training.py`

**Interfaces:**
- Consumes:
  - `app.config.DATA_PATH`
  - `app.config.FEATURE_COLUMNS`
  - `app.config.TARGET_COLUMN`
  - `app.config.MODEL_FILE`
  - `app.config.METRICS_FILE`
- Produces:
  - `load_training_data(data_path: Path = DATA_PATH) -> tuple[pd.DataFrame, pd.Series]`
  - `train_model(data_path: Path = DATA_PATH, model_file: Path = MODEL_FILE, metrics_file: Path = METRICS_FILE) -> dict[str, Any]`
  - Generated `ridge_model.joblib`
  - Generated `metrics.json`

- [ ] **Step 1: Write failing training tests**

Create `apps/ml-api/tests/test_training.py` with:

```python
import json
from pathlib import Path

from app.config import DATA_PATH, FEATURE_COLUMNS
from app.training import load_training_data, train_model


def test_load_training_data_uses_expected_features() -> None:
    features, target = load_training_data(DATA_PATH)

    assert list(features.columns) == FEATURE_COLUMNS
    assert len(features) == 50
    assert len(target) == 50


def test_train_model_writes_artifacts(tmp_path: Path) -> None:
    model_file = tmp_path / "ridge_model.joblib"
    metrics_file = tmp_path / "metrics.json"

    info = train_model(
        data_path=DATA_PATH,
        model_file=model_file,
        metrics_file=metrics_file,
    )

    assert model_file.exists()
    assert metrics_file.exists()
    assert info["algorithm"] == "Ridge Regression"
    assert info["pipeline"] == "StandardScaler -> Ridge Regression"
    assert info["features"] == FEATURE_COLUMNS
    assert set(info["metrics"]) == {"mae", "rmse", "r2"}
    assert set(info["coefficients"]) == set(FEATURE_COLUMNS)
    assert info["training_samples"] == 50

    persisted = json.loads(metrics_file.read_text())
    assert persisted == info
```

- [ ] **Step 2: Run training tests to verify they fail**

Run:

```bash
cd apps/ml-api
pytest tests/test_training.py -v
```

Expected: FAIL because `app.training` does not exist yet.

- [ ] **Step 3: Implement `training.py`**

Create `apps/ml-api/app/training.py` with:

```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.config import (
    ALGORITHM_NAME,
    DATA_PATH,
    FEATURE_COLUMNS,
    METRICS_FILE,
    MODEL_FILE,
    PIPELINE_NAME,
    RANDOM_STATE,
    RIDGE_ALPHA,
    TARGET_COLUMN,
    TEST_SIZE,
    TRAINING_SHEET,
)


def load_training_data(data_path: Path = DATA_PATH) -> tuple[pd.DataFrame, pd.Series]:
    if not data_path.exists():
        raise FileNotFoundError(f"Training workbook not found: {data_path}")

    frame = pd.read_excel(data_path, sheet_name=TRAINING_SHEET)
    required_columns = [*FEATURE_COLUMNS, TARGET_COLUMN]
    missing_columns = [column for column in required_columns if column not in frame.columns]
    if missing_columns:
        raise ValueError(f"Training sheet is missing required columns: {missing_columns}")

    features = frame[FEATURE_COLUMNS].astype(float)
    target = frame[TARGET_COLUMN].astype(float)
    return features, target


def _build_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("ridge", Ridge(alpha=RIDGE_ALPHA)),
        ]
    )


def _round_float(value: float) -> float:
    return round(float(value), 6)


def train_model(
    data_path: Path = DATA_PATH,
    model_file: Path = MODEL_FILE,
    metrics_file: Path = METRICS_FILE,
) -> dict[str, Any]:
    features, target = load_training_data(data_path)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        target,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    pipeline = _build_pipeline()
    pipeline.fit(x_train, y_train)

    predictions = pipeline.predict(x_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    ridge = pipeline.named_steps["ridge"]
    coefficients = {
        feature: _round_float(coefficient)
        for feature, coefficient in zip(FEATURE_COLUMNS, ridge.coef_, strict=True)
    }

    info: dict[str, Any] = {
        "algorithm": ALGORITHM_NAME,
        "pipeline": PIPELINE_NAME,
        "features": FEATURE_COLUMNS,
        "coefficients": coefficients,
        "intercept": _round_float(ridge.intercept_),
        "metrics": {
            "mae": _round_float(mean_absolute_error(y_test, predictions)),
            "rmse": _round_float(rmse),
            "r2": _round_float(r2_score(y_test, predictions)),
        },
        "training_samples": int(len(features)),
    }

    model_file.parent.mkdir(parents=True, exist_ok=True)
    metrics_file.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, model_file)
    metrics_file.write_text(json.dumps(info, indent=2, sort_keys=True))

    return info


if __name__ == "__main__":
    print(json.dumps(train_model(), indent=2, sort_keys=True))
```

- [ ] **Step 4: Run training tests to verify they pass**

Run:

```bash
cd apps/ml-api
pytest tests/test_training.py -v
```

Expected: PASS.

- [ ] **Step 5: Run explicit training command**

Run:

```bash
cd apps/ml-api
python -m app.training
```

Expected: command prints JSON containing `"algorithm": "Ridge Regression"` and writes:

```text
apps/ml-api/models/ridge_model.joblib
apps/ml-api/models/metrics.json
```

- [ ] **Step 6: Confirm generated artifacts are ignored by git**

Run:

```bash
cd apps/ml-api
git status --short models
```

Expected: only `models/.gitkeep` is tracked or staged; generated `.joblib` and `metrics.json` are not shown as untracked changes.

- [ ] **Step 7: Commit training pipeline**

```bash
git add apps/ml-api/app/training.py apps/ml-api/tests/test_training.py
git commit -m "feat: add housing price training pipeline"
```

---

### Task 4: Add runtime model service

**Files:**
- Create: `apps/ml-api/app/model_service.py`
- Create: `apps/ml-api/tests/test_model_service.py`

**Interfaces:**
- Consumes:
  - `app.schemas.HousingFeatures`
  - `app.training.train_model`
  - `app.config.MODEL_FILE`
  - `app.config.METRICS_FILE`
- Produces:
  - `class ModelService`
  - `ModelService.load() -> ModelService`
  - `ModelService.predict(inputs: Sequence[HousingFeatures]) -> list[float]`
  - `ModelService.get_model_info() -> dict[str, Any]`
  - `ModelService.model_loaded -> bool`
  - `model_service: ModelService`

- [ ] **Step 1: Write failing model service tests**

Create `apps/ml-api/tests/test_model_service.py` with:

```python
from pathlib import Path

from app.config import DATA_PATH, FEATURE_COLUMNS
from app.model_service import ModelService
from app.schemas import HousingFeatures


def sample_features() -> HousingFeatures:
    return HousingFeatures(
        square_footage=1550,
        bedrooms=3,
        bathrooms=2,
        year_built=1997,
        lot_size=6800,
        distance_to_city_center=4.1,
        school_rating=7.6,
    )


def test_model_service_trains_when_artifacts_are_missing(tmp_path: Path) -> None:
    service = ModelService(
        data_path=DATA_PATH,
        model_file=tmp_path / "ridge_model.joblib",
        metrics_file=tmp_path / "metrics.json",
    )

    service.load()

    assert service.model_loaded is True
    assert service.model_file.exists()
    assert service.metrics_file.exists()


def test_model_service_predicts_prices(tmp_path: Path) -> None:
    service = ModelService(
        data_path=DATA_PATH,
        model_file=tmp_path / "ridge_model.joblib",
        metrics_file=tmp_path / "metrics.json",
    ).load()

    predictions = service.predict([sample_features()])

    assert len(predictions) == 1
    assert predictions[0] > 0


def test_model_service_returns_model_info(tmp_path: Path) -> None:
    service = ModelService(
        data_path=DATA_PATH,
        model_file=tmp_path / "ridge_model.joblib",
        metrics_file=tmp_path / "metrics.json",
    ).load()

    info = service.get_model_info()

    assert info["algorithm"] == "Ridge Regression"
    assert info["pipeline"] == "StandardScaler -> Ridge Regression"
    assert info["features"] == FEATURE_COLUMNS
    assert set(info["coefficients"]) == set(FEATURE_COLUMNS)
    assert set(info["metrics"]) == {"mae", "rmse", "r2"}
```

- [ ] **Step 2: Run model service tests to verify they fail**

Run:

```bash
cd apps/ml-api
pytest tests/test_model_service.py -v
```

Expected: FAIL because `app.model_service` does not exist yet.

- [ ] **Step 3: Implement `model_service.py`**

Create `apps/ml-api/app/model_service.py` with:

```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Sequence

import joblib
import pandas as pd

from app.config import DATA_PATH, FEATURE_COLUMNS, METRICS_FILE, MODEL_FILE
from app.schemas import HousingFeatures
from app.training import train_model


class ModelService:
    def __init__(
        self,
        data_path: Path = DATA_PATH,
        model_file: Path = MODEL_FILE,
        metrics_file: Path = METRICS_FILE,
    ) -> None:
        self.data_path = data_path
        self.model_file = model_file
        self.metrics_file = metrics_file
        self._model: Any | None = None
        self._info: dict[str, Any] | None = None

    @property
    def model_loaded(self) -> bool:
        return self._model is not None

    def load(self) -> "ModelService":
        if not self.model_file.exists() or not self.metrics_file.exists():
            train_model(
                data_path=self.data_path,
                model_file=self.model_file,
                metrics_file=self.metrics_file,
            )

        self._model = joblib.load(self.model_file)
        self._info = json.loads(self.metrics_file.read_text())
        return self

    def predict(self, inputs: Sequence[HousingFeatures]) -> list[float]:
        if not inputs:
            return []

        if self._model is None:
            self.load()

        rows = [item.model_dump() for item in inputs]
        frame = pd.DataFrame(rows, columns=FEATURE_COLUMNS).astype(float)
        predictions = self._model.predict(frame)

        return [round(float(prediction), 2) for prediction in predictions]

    def get_model_info(self) -> dict[str, Any]:
        if self._info is None:
            self.load()

        if self._info is None:
            raise RuntimeError("Model info is unavailable after loading the model")

        return self._info


model_service = ModelService()
```

- [ ] **Step 4: Run model service tests to verify they pass**

Run:

```bash
cd apps/ml-api
pytest tests/test_model_service.py -v
```

Expected: PASS.

- [ ] **Step 5: Run all non-API tests**

Run:

```bash
cd apps/ml-api
pytest tests/test_schemas.py tests/test_training.py tests/test_model_service.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit model service**

```bash
git add apps/ml-api/app/model_service.py apps/ml-api/tests/test_model_service.py
git commit -m "feat: add runtime model service"
```

---

### Task 5: Add FastAPI endpoints

**Files:**
- Create: `apps/ml-api/app/main.py`
- Create: `apps/ml-api/tests/test_api.py`

**Interfaces:**
- Consumes:
  - `app.model_service.model_service`
  - `app.schemas.HousingFeatures`
  - `app.schemas.HealthResponse`
  - `app.schemas.ModelInfoResponse`
  - `app.schemas.PredictionResponse`
- Produces:
  - `app.main.app: FastAPI`
  - `GET /health`
  - `POST /predict`
  - `GET /model-info`

- [ ] **Step 1: Write failing API tests**

Create `apps/ml-api/tests/test_api.py` with:

```python
from fastapi.testclient import TestClient

from app.main import app


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
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["algorithm"] == "Ridge Regression"


def test_predict_single_payload() -> None:
    with TestClient(app) as client:
        response = client.post("/predict", json=valid_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["algorithm"] == "Ridge Regression"
    assert body["predictions"][0]["predicted_price"] > 0


def test_predict_batch_payload() -> None:
    payload = [valid_payload(), valid_payload()]

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert len(body["predictions"]) == 2


def test_predict_rejects_invalid_payload() -> None:
    payload = valid_payload()
    payload["school_rating"] = 11

    with TestClient(app) as client:
        response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_model_info_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/model-info")

    assert response.status_code == 200
    body = response.json()
    assert body["algorithm"] == "Ridge Regression"
    assert body["pipeline"] == "StandardScaler -> Ridge Regression"
    assert "square_footage" in body["features"]
    assert "square_footage" in body["coefficients"]
    assert set(body["metrics"]) == {"mae", "rmse", "r2"}
    assert body["training_samples"] == 50
```

- [ ] **Step 2: Run API tests to verify they fail**

Run:

```bash
cd apps/ml-api
pytest tests/test_api.py -v
```

Expected: FAIL because `app.main` does not exist yet.

- [ ] **Step 3: Implement `main.py`**

Create `apps/ml-api/app/main.py` with:

```python
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Body, FastAPI, HTTPException

from app.config import ALGORITHM_NAME
from app.model_service import model_service
from app.schemas import (
    HealthResponse,
    HousingFeatures,
    ModelInfoResponse,
    PredictionItem,
    PredictionResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    model_service.load()
    yield


app = FastAPI(
    title="Housing Price Prediction Model API",
    description="FastAPI service for Ridge Regression housing price predictions.",
    version="0.1.0",
    lifespan=lifespan,
)


PredictPayload = Annotated[
    HousingFeatures | list[HousingFeatures],
    Body(
        examples=[
            {
                "square_footage": 1550,
                "bedrooms": 3,
                "bathrooms": 2,
                "year_built": 1997,
                "lot_size": 6800,
                "distance_to_city_center": 4.1,
                "school_rating": 7.6,
            },
            [
                {
                    "square_footage": 1550,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "year_built": 1997,
                    "lot_size": 6800,
                    "distance_to_city_center": 4.1,
                    "school_rating": 7.6,
                }
            ],
        ]
    ),
]


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=model_service.model_loaded,
        algorithm=ALGORITHM_NAME,
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictPayload) -> PredictionResponse:
    try:
        items = payload if isinstance(payload, list) else [payload]
        predicted_prices = model_service.predict(items)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    return PredictionResponse(
        count=len(predicted_prices),
        predictions=[
            PredictionItem(predicted_price=predicted_price)
            for predicted_price in predicted_prices
        ],
        algorithm=ALGORITHM_NAME,
    )


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    try:
        return ModelInfoResponse(**model_service.get_model_info())
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Model info unavailable") from exc
```

- [ ] **Step 4: Run API tests to verify they pass**

Run:

```bash
cd apps/ml-api
pytest tests/test_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run:

```bash
cd apps/ml-api
pytest -v
```

Expected: all tests PASS.

- [ ] **Step 6: Start the API locally**

Run:

```bash
cd apps/ml-api
uvicorn app.main:app --reload
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8000
```

Open `http://localhost:8000/docs` and confirm Swagger lists:

```text
GET /health
POST /predict
GET /model-info
```

- [ ] **Step 7: Commit FastAPI endpoints**

```bash
git add apps/ml-api/app/main.py apps/ml-api/tests/test_api.py
git commit -m "feat: add ml api endpoints"
```

---

### Task 6: Add Dockerfile and README demo instructions

**Files:**
- Create: `apps/ml-api/Dockerfile`
- Create: `apps/ml-api/README.md`
- Modify: no source files

**Interfaces:**
- Consumes:
  - `apps/ml-api/pyproject.toml`
  - `apps/ml-api/app/main.py`
  - `apps/ml-api/data/House Price Dataset & Test Data For Prediction.xlsx`
- Produces:
  - Docker image runnable with `docker run --rm -p 8000:8000 house-price-ml-api`
  - README with local, test, training, Docker, and Swagger demo commands.

- [ ] **Step 1: Create Dockerfile**

Create `apps/ml-api/Dockerfile` with:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
COPY data ./data
COPY models/.gitkeep ./models/.gitkeep

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create README**

Create `apps/ml-api/README.md` with:

````markdown
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
````

- [ ] **Step 3: Run full test suite after docs and Dockerfile**

Run:

```bash
cd apps/ml-api
pytest -v
```

Expected: all tests PASS.

- [ ] **Step 4: Build Docker image**

Run:

```bash
cd apps/ml-api
docker build -t house-price-ml-api .
```

Expected: image builds successfully.

- [ ] **Step 5: Run Docker container**

Run:

```bash
docker run --rm -p 8000:8000 house-price-ml-api
```

Expected: container starts Uvicorn on `0.0.0.0:8000`.

- [ ] **Step 6: Verify API from Docker in a second terminal**

Run:

```bash
curl http://localhost:8000/health
```

Expected response contains:

```json
{"status":"ok","model_loaded":true,"algorithm":"Ridge Regression"}
```

- [ ] **Step 7: Commit Docker and README**

```bash
git add apps/ml-api/Dockerfile apps/ml-api/README.md
git commit -m "docs: add ml api docker and usage instructions"
```

---

### Task 7: Final verification and handoff notes

**Files:**
- Modify: `apps/ml-api/README.md` only if a verified command differs from the README.

**Interfaces:**
- Consumes: Completed `apps/ml-api` service.
- Produces: Verified run/test instructions and clean git state.

- [ ] **Step 1: Run all tests**

Run:

```bash
cd apps/ml-api
pytest -v
```

Expected: all tests PASS.

- [ ] **Step 2: Run training command**

Run:

```bash
cd apps/ml-api
python -m app.training
```

Expected: JSON output includes:

```json
"algorithm": "Ridge Regression"
```

- [ ] **Step 3: Run local API smoke test**

Run:

```bash
cd apps/ml-api
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In a second terminal, run:

```bash
curl http://localhost:8000/health
```

Expected response contains:

```json
{"status":"ok","model_loaded":true,"algorithm":"Ridge Regression"}
```

- [ ] **Step 4: Run prediction smoke test**

In the second terminal, run:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"square_footage":1550,"bedrooms":3,"bathrooms":2,"year_built":1997,"lot_size":6800,"distance_to_city_center":4.1,"school_rating":7.6}'
```

Expected response contains:

```json
"count":1
```

and a positive `predicted_price`.

- [ ] **Step 5: Confirm git status**

Run:

```bash
git status --short
```

Expected: clean working tree, or only intentionally generated ignored model files absent from status.

- [ ] **Step 6: Commit any README correction from verification**

If `apps/ml-api/README.md` changed during verification, run:

```bash
git add apps/ml-api/README.md
git commit -m "docs: clarify ml api verification steps"
```

If the README did not change, skip this commit.
