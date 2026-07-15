from app.schemas import EstimateRecord


class EstimateRepository:
    def __init__(self) -> None:
        self._records: dict[str, EstimateRecord] = {}

    def add(self, record: EstimateRecord) -> EstimateRecord:
        self._records[record.id] = record
        return record

    def list(self, limit: int = 20) -> list[EstimateRecord]:
        records = sorted(
            self._records.values(),
            key=lambda record: record.created_at,
            reverse=True,
        )
        return records[:limit]

    def get(self, record_id: str) -> EstimateRecord | None:
        return self._records.get(record_id)

    def clear(self) -> None:
        self._records.clear()
