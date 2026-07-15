from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Sequence

import joblib
import pandas as pd

from app.config import DATA_PATH, FEATURE_COLUMNS, METRICS_FILE, MODEL_FILE
from app.schemas import HousingFeatures
from app.training import train_model


class ModelService:
    def __init__(
        self,
        data_path: Path = DATA_PATH,
        model_file: Path = MODEL_FILE,
        metrics_file: Path = METRICS_FILE,
    ) -> None:
        self.data_path = data_path
        self.model_file = model_file
        self.metrics_file = metrics_file
        self._model: Any | None = None
        self._info: dict[str, Any] | None = None

    @property
    def model_loaded(self) -> bool:
        return self._model is not None

    def load(self) -> "ModelService":
        if not self.model_file.exists() or not self.metrics_file.exists():
            train_model(
                data_path=self.data_path,
                model_file=self.model_file,
                metrics_file=self.metrics_file,
            )

        self._model = joblib.load(self.model_file)
        self._info = json.loads(self.metrics_file.read_text())
        return self

    def predict(self, inputs: Sequence[HousingFeatures]) -> list[float]:
        if not inputs:
            return []

        if self._model is None:
            self.load()

        rows = [item.model_dump() for item in inputs]
        frame = pd.DataFrame(rows, columns=FEATURE_COLUMNS).astype(float)
        predictions = self._model.predict(frame)

        return [round(float(prediction), 2) for prediction in predictions]

    def get_model_info(self) -> dict[str, Any]:
        if self._info is None:
            self.load()

        if self._info is None:
            raise RuntimeError("Model info is unavailable after loading the model")

        return self._info


model_service = ModelService()
