import pytest
from pydantic import ValidationError

from app.config import FEATURE_COLUMNS
from app.schemas import HousingFeatures


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


def test_feature_columns_are_in_expected_order() -> None:
    assert FEATURE_COLUMNS == [
        "square_footage",
        "bedrooms",
        "bathrooms",
        "year_built",
        "lot_size",
        "distance_to_city_center",
        "school_rating",
    ]


def test_housing_features_accept_valid_payload() -> None:
    features = HousingFeatures(**valid_payload())
    assert features.square_footage == 1550
    assert features.school_rating == 7.6


def test_housing_features_reject_negative_square_footage() -> None:
    payload = valid_payload()
    payload["square_footage"] = -1

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)


def test_housing_features_reject_school_rating_above_ten() -> None:
    payload = valid_payload()
    payload["school_rating"] = 10.5

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)


def test_housing_features_reject_unknown_fields() -> None:
    payload = valid_payload()
    payload["garage_spaces"] = 2

    with pytest.raises(ValidationError):
        HousingFeatures(**payload)
