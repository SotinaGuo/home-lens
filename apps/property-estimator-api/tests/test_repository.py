from datetime import UTC, datetime, timedelta
from threading import Event, Thread

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


def test_list_uses_snapshot_when_repository_changes_concurrently() -> None:
    class CoordinatedRecords(dict[str, EstimateRecord]):
        def __init__(self) -> None:
            super().__init__()
            self.iteration_started = Event()
            self.mutation_finished = Event()

        def values(self):  # type: ignore[override]
            iterator = super().values().__iter__()
            first = next(iterator)
            yield first
            self.iteration_started.set()
            self.mutation_finished.wait(timeout=1)
            yield from iterator

    repository = EstimateRepository()
    coordinated_records = CoordinatedRecords()
    repository._records = coordinated_records  # type: ignore[assignment]

    first = make_record("first", minutes_ago=2, price=200000)
    second = make_record("second", minutes_ago=1, price=300000)
    repository.add(first)
    repository.add(second)

    listed_records: list[EstimateRecord] = []
    list_error: Exception | None = None

    def call_list() -> None:
        nonlocal listed_records, list_error
        try:
            listed_records = repository.list()
        except Exception as exc:  # pragma: no cover - asserted below
            list_error = exc

    list_thread = Thread(target=call_list)
    list_thread.start()

    assert coordinated_records.iteration_started.wait(timeout=1)

    repository.add(make_record("third", minutes_ago=0, price=400000))
    coordinated_records.mutation_finished.set()
    list_thread.join(timeout=1)

    assert list_error is None
    assert [record.id for record in listed_records] == ["second", "first"]
