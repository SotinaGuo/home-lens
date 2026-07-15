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
            parsed_price = float(predicted_price)
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise MlApiResponseError("ML API returned a malformed prediction response") from exc

        return round(parsed_price, 2)

    def close(self) -> None:
        if self._owns_client:
            self._client.close()
