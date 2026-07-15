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
