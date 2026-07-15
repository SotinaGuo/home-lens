from threading import RLock

from app.schemas import EstimateRecord


class EstimateRepository:
    def __init__(self) -> None:
        self._records: dict[str, EstimateRecord] = {}
        self._lock = RLock()

    def add(self, record: EstimateRecord) -> EstimateRecord:
        with self._lock:
            self._records[record.id] = record
        return record

    def list(self, limit: int = 20) -> list[EstimateRecord]:
        with self._lock:
            snapshot = list(self._records.values())

        records = sorted(
            snapshot,
            key=lambda record: record.created_at,
            reverse=True,
        )
        return records[:limit]

    def get(self, record_id: str) -> EstimateRecord | None:
        with self._lock:
            return self._records.get(record_id)

    def clear(self) -> None:
        with self._lock:
            self._records.clear()
