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
