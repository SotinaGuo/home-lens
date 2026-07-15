import pytest

from app.repository import EstimateRepository
from app.schemas import PropertyFeatures
from app.service import ComparisonValidationError, EstimateNotFoundError, EstimatorService


class FakeMlClient:
    def __init__(self, price: float = 250829.56) -> None:
        self.price = price
        self.calls: list[PropertyFeatures] = []

    def predict(self, features: PropertyFeatures) -> float:
        self.calls.append(features)
        return self.price


def sample_features(square_footage: float = 1550) -> PropertyFeatures:
    return PropertyFeatures(
        square_footage=square_footage,
        bedrooms=3,
        bathrooms=2,
        year_built=1997,
        lot_size=6800,
        distance_to_city_center=4.1,
        school_rating=7.6,
    )


def make_service(price: float = 250829.56) -> tuple[EstimatorService, FakeMlClient]:
    fake_client = FakeMlClient(price=price)
    service = EstimatorService(
        repository=EstimateRepository(),
        ml_client=fake_client,
    )
    return service, fake_client


def test_create_estimate_calls_ml_api_and_stores_record() -> None:
    service, fake_client = make_service()
    features = sample_features()

    record = service.create_estimate(features)

    assert record.predicted_price == 250829.56
    assert record.features == features
    assert fake_client.calls == [features]
    assert service.get_estimate(record.id) == record


def test_list_estimates_returns_created_records() -> None:
    service, _ = make_service()
    first = service.create_estimate(sample_features(square_footage=1200))
    second = service.create_estimate(sample_features(square_footage=1800))

    assert [item.id for item in service.list_estimates()] == [second.id, first.id]


def test_get_missing_estimate_raises_not_found() -> None:
    service, _ = make_service()

    with pytest.raises(EstimateNotFoundError):
        service.get_estimate("missing")


def test_compare_estimates_returns_summary() -> None:
    service, fake_client = make_service(price=200000)
    first = service.create_estimate(sample_features(square_footage=1200))
    fake_client.price = 300000
    second = service.create_estimate(sample_features(square_footage=1800))

    comparison = service.compare_estimates([first.id, second.id])

    assert [item.id for item in comparison.items] == [first.id, second.id]
    assert comparison.lowest_price == 200000
    assert comparison.highest_price == 300000
    assert comparison.price_difference == 100000


def test_compare_estimates_rejects_fewer_than_two_ids() -> None:
    service, _ = make_service()

    with pytest.raises(ComparisonValidationError):
        service.compare_estimates(["one"])


def test_compare_estimates_rejects_unknown_ids() -> None:
    service, _ = make_service()
    record = service.create_estimate(sample_features())

    with pytest.raises(EstimateNotFoundError):
        service.compare_estimates([record.id, "missing"])
