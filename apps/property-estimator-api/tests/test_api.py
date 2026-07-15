import warnings

warnings.filterwarnings(
    "ignore",
    message="Using `httpx` with `starlette.testclient` is deprecated.*",
)

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.ml_client import (
    MlApiConnectionError,
    MlApiResponseError,
    MlApiTimeoutError,
)
from app.repository import EstimateRepository
from app.schemas import PropertyFeatures
from app.service import EstimatorService


class FakeMlClient:
    def __init__(self, price: float = 250829.56, error: Exception | None = None) -> None:
        self.price = price
        self.error = error

    def predict(self, features: PropertyFeatures) -> float:
        if self.error is not None:
            raise self.error
        return self.price


class ClosableFakeMlClient(FakeMlClient):
    def __init__(self, price: float = 250829.56) -> None:
        super().__init__(price=price)
        self.closed = False

    def close(self) -> None:
        self.closed = True


def make_client(
    price: float = 250829.56,
    error: Exception | None = None,
) -> TestClient:
    service = EstimatorService(
        repository=EstimateRepository(),
        ml_client=FakeMlClient(price=price, error=error),
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
    assert created["features"]["square_footage"] == 1550.0

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
    with make_client(price=250829.56) as client:
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


def test_create_estimate_maps_ml_timeout_to_504() -> None:
    with make_client(error=MlApiTimeoutError("timed out")) as client:
        response = client.post("/estimates", json=valid_payload())

    assert response.status_code == 504
    assert response.json()["detail"] == "ML API request timed out"


def test_create_estimate_maps_ml_connection_failure_to_502() -> None:
    with make_client(error=MlApiConnectionError("offline")) as client:
        response = client.post("/estimates", json=valid_payload())

    assert response.status_code == 502
    assert response.json()["detail"] == "ML API prediction failed"


def test_create_estimate_maps_ml_response_failure_to_502() -> None:
    with make_client(error=MlApiResponseError("bad response")) as client:
        response = client.post("/estimates", json=valid_payload())

    assert response.status_code == 502
    assert response.json()["detail"] == "ML API prediction failed"


def test_app_shutdown_closes_ml_client() -> None:
    ml_client = ClosableFakeMlClient()
    service = EstimatorService(
        repository=EstimateRepository(),
        ml_client=ml_client,
    )
    settings = Settings(ml_api_base_url="http://ml-api.test")

    with TestClient(create_app(service=service, settings=settings)) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert ml_client.closed is True
