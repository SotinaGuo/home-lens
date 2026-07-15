import pytest
from pydantic import ValidationError

from app.config import Settings
from app.schemas import ComparisonRequest, PropertyFeatures


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


def test_settings_defaults() -> None:
    settings = Settings()
    assert settings.service_name == "property-estimator-api"
    assert settings.ml_api_base_url == "http://localhost:8000"
    assert settings.ml_api_timeout_seconds == 5.0


def test_property_features_accept_valid_payload() -> None:
    features = PropertyFeatures(**valid_payload())
    assert features.square_footage == 1550
    assert features.school_rating == 7.6


def test_property_features_reject_unknown_fields() -> None:
    payload = valid_payload()
    payload["garage_spaces"] = 2

    with pytest.raises(ValidationError):
        PropertyFeatures(**payload)


def test_property_features_reject_invalid_school_rating() -> None:
    payload = valid_payload()
    payload["school_rating"] = 10.5

    with pytest.raises(ValidationError):
        PropertyFeatures(**payload)


def test_comparison_request_requires_at_least_two_ids() -> None:
    with pytest.raises(ValidationError):
        ComparisonRequest(estimate_ids=["one"])
