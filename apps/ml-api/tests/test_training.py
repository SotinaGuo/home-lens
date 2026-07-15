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
