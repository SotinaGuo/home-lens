from datetime import UTC, datetime, timedelta

from app.repository import EstimateRepository
from app.schemas import EstimateRecord, PropertyFeatures


def make_record(record_id: str, minutes_ago: int, price: float) -> EstimateRecord:
    return EstimateRecord(
        id=record_id,
        features=PropertyFeatures(
            square_footage=1550,
            bedrooms=3,
            bathrooms=2,
            year_built=1997,
            lot_size=6800,
            distance_to_city_center=4.1,
            school_rating=7.6,
        ),
        predicted_price=price,
        created_at=datetime.now(UTC) - timedelta(minutes=minutes_ago),
    )


def test_add_and_get_record() -> None:
    repository = EstimateRepository()
    record = make_record("one", minutes_ago=0, price=250000)

    repository.add(record)

    assert repository.get("one") == record


def test_get_missing_record_returns_none() -> None:
    repository = EstimateRepository()

    assert repository.get("missing") is None


def test_list_returns_reverse_chronological_order() -> None:
    repository = EstimateRepository()
    older = make_record("older", minutes_ago=10, price=200000)
    newer = make_record("newer", minutes_ago=1, price=300000)

    repository.add(older)
    repository.add(newer)

    assert [item.id for item in repository.list()] == ["newer", "older"]


def test_list_applies_limit() -> None:
    repository = EstimateRepository()
    repository.add(make_record("one", minutes_ago=3, price=100000))
    repository.add(make_record("two", minutes_ago=2, price=200000))
    repository.add(make_record("three", minutes_ago=1, price=300000))

    assert [item.id for item in repository.list(limit=2)] == ["three", "two"]


def test_clear_removes_records() -> None:
    repository = EstimateRepository()
    repository.add(make_record("one", minutes_ago=0, price=250000))

    repository.clear()

    assert repository.list() == []
