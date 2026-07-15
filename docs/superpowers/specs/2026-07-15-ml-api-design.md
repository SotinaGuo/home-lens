# ML API Design: Housing Price Prediction

Date: 2026-07-15

## 1. Purpose

Build the first project module: a FastAPI service that trains, loads, and serves a Ridge Regression housing price prediction model.

This module is the foundation for the later Python backend, Java backend, and Next.js portal. It exposes a stable HTTP API that other services can call and that can be demonstrated live through Swagger/OpenAPI.

> 中文注解：这一阶段先把“房价预测模型服务”做扎实。它是后续前端、Python 后端、Java 后端都会调用的核心能力，所以要先保证接口稳定、可演示、可测试。

## 2. Scope

Included in this phase:

- FastAPI application for the ML model.
- Training logic using the provided Excel workbook.
- Ridge Regression model with persisted model artifact.
- Automatic model training if the model artifact is missing.
- Prediction endpoint supporting single and batch inputs.
- Model metadata endpoint with coefficients and metrics.
- Health endpoint.
- Dockerfile for local containerized demo.
- Basic automated tests.
- Module README with run and test instructions.

Excluded from this phase:

- Next.js portal.
- App 1 Python backend.
- App 2 Java backend.
- docker-compose across multiple services.
- Production model registry or external database.
- Authentication or authorization.

> 中文注解：这里刻意控制范围，只做 ML API。Next.js、Java、额外 Python 后端都先不碰，避免第一步就把项目做散。这个模块完成后，其他服务只需要按 HTTP 契约调用它。

## 3. Repository Layout

The module will live under `apps/ml-api` so the repository can later grow into a monorepo without moving this service.

```text
apps/
  ml-api/
    app/
      __init__.py
      main.py
      config.py
      schemas.py
      model_service.py
      training.py
    data/
      House Price Dataset & Test Data For Prediction.xlsx
    models/
      .gitkeep
    tests/
      test_api.py
      test_model_service.py
    Dockerfile
    pyproject.toml
    README.md
```

### File responsibilities

- `app/main.py`: FastAPI app creation, startup model initialization, and route definitions.
- `app/config.py`: Paths, sheet names, feature list, target column, algorithm name, and model artifact names.
- `app/schemas.py`: Pydantic request and response models.
- `app/training.py`: Excel loading, feature/target extraction, train/test split, Ridge training, metric calculation, and artifact persistence.
- `app/model_service.py`: Model loading, fallback training, prediction, and model info assembly.
- `data/`: Local copy of the provided workbook used by training and demo examples.
- `models/`: Runtime model artifacts. The directory is tracked with `.gitkeep`; generated model files are not required to be committed.
- `tests/`: API and service-level tests.
- `Dockerfile`: Container build for interview demo.
- `pyproject.toml`: Python package metadata and dependencies.
- `README.md`: Developer setup, local run, Docker run, and Swagger demo instructions.

> 中文注解：虽然现在只做一个服务，但目录放在 `apps/ml-api`，是为了给后面的 `web-portal`、`python-backend`、`java-backend` 预留 monorepo 结构。`training.py` 和 `model_service.py` 分开，是为了让训练逻辑和线上预测逻辑边界清楚。

## 4. Data Design

The provided workbook has two sheets:

- `Test Data For Prediction`
  - Contains 50 rows and includes `price`.
  - Used for training and evaluation.
  - `id` is excluded from features.

- `House Price Dataset`
  - Contains 10 rows and does not include `price`.
  - Used as batch prediction sample data.
  - Not used for supervised training because it has no target value.

### Feature columns

The model uses these columns in this exact order:

```text
square_footage
bedrooms
bathrooms
year_built
lot_size
distance_to_city_center
school_rating
```

### Target column

```text
price
```

The fixed feature order is part of the contract. Training and prediction both use the same list to avoid column-order bugs.

> 中文注解：带 `price` 的 sheet 才能做监督学习训练；不带 `price` 的 sheet 更适合作为批量预测示例。固定特征顺序非常重要，因为模型训练和预测时列顺序错了，接口仍可能返回数字，但结果会悄悄变错。

## 5. Model Design

The model is a scikit-learn pipeline:

```text
StandardScaler -> Ridge Regression
```

Reasons:

- Simple enough to explain during an interview.
- More stable than plain linear regression on a small dataset.
- Standardizes numeric features so Ridge regularization is not dominated by large-scale columns such as `lot_size`.
- Exposes coefficients and intercept, matching the requirement for model coefficients.
- Works well with the all-numeric features in the workbook.

### Training behavior

The module supports both explicit training and automatic fallback training:

1. `python -m app.training` trains the model and writes artifacts.
2. On API startup, `model_service` tries to load the saved model.
3. If the saved model is missing, the service trains the model from the workbook and then loads it.

### Persisted artifacts

The model directory will contain:

- `ridge_model.joblib`: trained scikit-learn pipeline artifact.
- `metrics.json`: algorithm name, feature list, coefficients, intercept, training sample count, and evaluation metrics.

The model artifacts are generated outputs. They can be recreated from the workbook and training code.

Coefficients are reported for the Ridge step after feature standardization. They are useful for model inspection and interview discussion, but they should be described as standardized-feature coefficients rather than raw-dollar-per-unit effects.

### Metrics

The service reports:

- MAE
- RMSE
- R2

Because the training dataset is small, these metrics are demo indicators rather than production-quality evidence.

> 中文注解：使用 `StandardScaler -> Ridge Regression` 是一个面试友好的折中方案：比普通线性回归稳一点，又能解释系数。因为特征尺度差异很大，例如 `lot_size` 比 `school_rating` 数值范围大得多，所以先标准化再做 Ridge 更合理。

## 6. API Design

Base URL for local demo:

```text
http://localhost:8000
```

Swagger/OpenAPI:

```text
http://localhost:8000/docs
```

### `GET /health`

Confirms the API is running and whether the model is loaded.

Example response:

```json
{
  "status": "ok",
  "model_loaded": true,
  "algorithm": "Ridge Regression"
}
```

### `POST /predict`

Accepts either one housing feature object or a list of housing feature objects.

Single input example:

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

Batch input example:

```json
[
  {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6
  }
]
```

Example response:

```json
{
  "count": 1,
  "predictions": [
    {
      "predicted_price": 247500.25
    }
  ],
  "algorithm": "Ridge Regression"
}
```

### `GET /model-info`

Returns model metadata, feature order, coefficients, intercept, metrics, and sample count.

Example response:

```json
{
  "algorithm": "Ridge Regression",
  "features": [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating"
  ],
  "coefficients": {
    "square_footage": 120.5,
    "bedrooms": 3500.2,
    "bathrooms": 4200.4,
    "year_built": 800.1,
    "lot_size": 4.8,
    "distance_to_city_center": -6100.0,
    "school_rating": 9800.0
  },
  "intercept": -245000.0,
  "metrics": {
    "mae": 12345.67,
    "rmse": 15678.9,
    "r2": 0.91
  },
  "training_samples": 50
}
```

> 中文注解：接口保持三个就够了：健康检查、预测、模型信息。`/predict` 同时支持单条和批量输入，Swagger 演示时很顺手；`/model-info` 用来证明模型不是黑盒，能展示算法、特征、系数和指标。

## 7. Validation and Error Handling

Pydantic validates request shape and types.

Business validation:

- `square_footage` must be greater than 0.
- `bedrooms` must be greater than or equal to 0.
- `bathrooms` must be greater than or equal to 0.
- `year_built` must be between 1800 and 2100.
- `lot_size` must be greater than 0.
- `distance_to_city_center` must be greater than or equal to 0.
- `school_rating` must be between 0 and 10.

Expected error behavior:

- Missing or invalid request fields return FastAPI/Pydantic `422`.
- Missing model artifact triggers automatic training.
- Missing or malformed Excel workbook raises a clear service initialization error.
- Prediction failures return a clear API error without exposing stack traces.

> 中文注解：这里的重点不是做复杂业务规则，而是防止明显脏数据进入模型。比如面积不能小于等于 0，学校评分限定在 0 到 10。错误信息要清楚，方便面试现场快速定位问题。

## 8. Local Development Flow

Expected local commands:

```bash
cd apps/ml-api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
python -m app.training
uvicorn app.main:app --reload
```

Then open:

```text
http://localhost:8000/docs
```

> 中文注解：本地开发先跑 `python -m app.training` 是为了显式生成模型文件；即使不手动跑，API 启动时也会自动训练，保证 demo 不容易翻车。

## 9. Docker Demo Flow

Expected Docker commands:

```bash
cd apps/ml-api
docker build -t house-price-ml-api .
docker run --rm -p 8000:8000 house-price-ml-api
```

Then open:

```text
http://localhost:8000/docs
```

The Docker image includes the workbook so the model can train automatically if no model artifact exists in the image.

> 中文注解：Docker 演示是面试加分点。它证明这个服务不依赖你本机环境，只要构建镜像就能启动。后续多服务阶段再补 `docker-compose`，现在先保持单服务简单可靠。

## 10. Testing Strategy

Tests will cover:

- Model training or loading succeeds.
- Model predictions return numeric prices.
- `/health` returns `status: ok`.
- `/predict` works for single input.
- `/predict` works for batch input.
- `/model-info` includes algorithm, feature list, coefficients, metrics, and training sample count.
- Invalid inputs return validation errors.

The tests should be lightweight and runnable with:

```bash
cd apps/ml-api
pytest
```

> 中文注解：测试优先覆盖“服务真的能用”的路径：能训练/加载、能预测、接口返回正确结构、坏输入会被拒绝。这个阶段不用追求复杂测试矩阵，先保障核心演示链路。

## 11. Interview Demo Script

Recommended live demo flow:

1. Start the API locally or with Docker.
2. Open `/docs`.
3. Call `GET /health`.
4. Call `GET /model-info` and explain the model, features, coefficients, and metrics.
5. Call `POST /predict` with one property.
6. Call `POST /predict` with a batch of properties.
7. Briefly explain that the model auto-trains if the artifact is missing.

> 中文注解：面试演示时建议按这个顺序来：先证明服务活着，再证明模型已加载，再展示模型信息，最后做单条和批量预测。这样故事线很清楚：服务状态 -> 模型透明度 -> 实际预测能力。

## 12. Risks and Trade-offs

- The dataset is small, so model metrics can be unstable.
- The service is designed for interview demonstration, not production-grade ML operations.
- Automatic training during startup is useful for demo reliability but would not be ideal in a high-traffic production API.
- The workbook filename contains spaces and `&`, so path handling must use `pathlib` and avoid shell assumptions.
- The first module has no shared `docker-compose`; orchestration should wait until at least two services exist.

> 中文注解：最大风险是数据太少，所以不要把模型效果包装成生产级。我们要强调这是工程封装能力展示：如何读取数据、训练模型、保存模型、暴露 API、容器化和测试。

## 13. Next Modules After This Phase

After `ml-api` is complete and tested:

1. Add App 1 Python backend that validates estimator form submissions and calls `ml-api`.
2. Add App 2 Java Spring Boot backend that computes market statistics, caches results, and calls `ml-api`.
3. Add Next.js portal with shared layout, App Router navigation, estimator UI, dashboard UI, charts, and state handling.
4. Add cross-service orchestration with `docker-compose`.

> 中文注解：后续顺序建议不要变。先完成 `ml-api`，再做两个后端，最后做 Next.js 门户和跨服务编排。这样每一步都有明确依赖，不会三端同时联调打结。
