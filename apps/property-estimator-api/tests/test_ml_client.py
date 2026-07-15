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
        assert request.method == "POST"
        assert request.url.path == "/predict"
        assert request.read() == (
            b'{"square_footage":1550.0,"bedrooms":3,"bathrooms":2.0,"year_built":1997,'
            b'"lot_size":6800.0,"distance_to_city_center":4.1,"school_rating":7.6}'
        )
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


@pytest.mark.parametrize("predicted_price", ["abc", None])
def test_predict_rejects_non_numeric_predicted_price(predicted_price: object) -> None:
    client = MlApiClient(
        base_url="http://ml-api.test",
        http_client=httpx.Client(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(
                    200,
                    json={"predictions": [{"predicted_price": predicted_price}]},
                )
            )
        ),
    )

    with pytest.raises(MlApiResponseError):
        client.predict(sample_features())
