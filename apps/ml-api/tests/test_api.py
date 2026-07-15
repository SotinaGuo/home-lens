from pathlib import Path

from fastapi.testclient import TestClient

from app.config import DATA_PATH
from app.main import create_app
from app.model_service import ModelService


def make_client(tmp_path: Path) -> TestClient:
    service = ModelService(
        data_path=DATA_PATH,
        model_file=tmp_path / "ridge_model.joblib",
        metrics_file=tmp_path / "metrics.json",
    )
    return TestClient(create_app(service))


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


def test_health_endpoint(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["algorithm"] == "Ridge Regression"


def test_predict_single_payload(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.post("/predict", json=valid_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["algorithm"] == "Ridge Regression"
    assert body["predictions"][0]["predicted_price"] > 0


def test_predict_batch_payload(tmp_path: Path) -> None:
    payload = [valid_payload(), valid_payload()]

    with make_client(tmp_path) as client:
        response = client.post("/predict", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert len(body["predictions"]) == 2


def test_predict_rejects_empty_batch_payload(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.post("/predict", json=[])

    assert response.status_code == 422


def test_predict_rejects_invalid_payload(tmp_path: Path) -> None:
    payload = valid_payload()
    payload["school_rating"] = 11

    with make_client(tmp_path) as client:
        response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_model_info_endpoint(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.get("/model-info")

    assert response.status_code == 200
    body = response.json()
    assert body["algorithm"] == "Ridge Regression"
    assert body["pipeline"] == "StandardScaler -> Ridge Regression"
    assert "square_footage" in body["features"]
    assert "square_footage" in body["coefficients"]
    assert set(body["metrics"]) == {"mae", "rmse", "r2"}
    assert body["training_samples"] == 50


def test_api_tests_use_tmp_path_model_artifacts(tmp_path: Path) -> None:
    with make_client(tmp_path) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert (tmp_path / "ridge_model.joblib").exists()
    assert (tmp_path / "metrics.json").exists()
