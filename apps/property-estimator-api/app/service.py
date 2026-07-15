from __future__ import annotations

from datetime import UTC, datetime
from typing import Protocol
from uuid import uuid4

from app.repository import EstimateRepository
from app.schemas import ComparisonResponse, EstimateRecord, PropertyFeatures


class EstimateNotFoundError(Exception):
    """未找到指定估价记录时抛出。"""


class ComparisonValidationError(Exception):
    """Raised when a comparison request is invalid."""


class PredictionClient(Protocol):
    def predict(self, features: PropertyFeatures) -> float:
        """Return a predicted price for property features."""


class EstimatorService:
    """封装估价业务流程，协调 ML 预测与历史记录。"""

    def __init__(
        self,
        repository: EstimateRepository,
        ml_client: PredictionClient,
    ) -> None:
        self.repository = repository
        self.ml_client = ml_client

    def create_estimate(self, features: PropertyFeatures) -> EstimateRecord:
        predicted_price = self.ml_client.predict(features)
        record = EstimateRecord(
            id=str(uuid4()),
            features=features,
            predicted_price=predicted_price,
            created_at=datetime.now(UTC),
        )
        return self.repository.add(record)

    def list_estimates(self, limit: int = 20) -> list[EstimateRecord]:
        return self.repository.list(limit=limit)

    def get_estimate(self, record_id: str) -> EstimateRecord:
        record = self.repository.get(record_id)
        if record is None:
            raise EstimateNotFoundError(f"Estimate not found: {record_id}")
        return record

    def compare_estimates(self, estimate_ids: list[str]) -> ComparisonResponse:
        # 对比至少需要两套房源，避免无意义比较。
        if len(estimate_ids) < 2:
            raise ComparisonValidationError("At least two estimate ids are required")

        records = [self.get_estimate(record_id) for record_id in estimate_ids]
        prices = [record.predicted_price for record in records]
        highest_price = max(prices)
        lowest_price = min(prices)

        return ComparisonResponse(
            items=records,
            highest_price=highest_price,
            lowest_price=lowest_price,
            price_difference=round(highest_price - lowest_price, 2),
        )
