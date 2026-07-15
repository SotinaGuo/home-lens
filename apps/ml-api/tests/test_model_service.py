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
