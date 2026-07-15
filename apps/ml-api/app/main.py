from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Body, FastAPI, HTTPException

from app.config import ALGORITHM_NAME
from app.model_service import ModelService, model_service as default_model_service
from app.schemas import (
    HealthResponse,
    HousingFeatures,
    ModelInfoResponse,
    PredictionItem,
    PredictionResponse,
)


PredictPayload = Annotated[
    HousingFeatures | list[HousingFeatures],
    Body(
        examples=[
            {
                "square_footage": 1550,
                "bedrooms": 3,
                "bathrooms": 2,
                "year_built": 1997,
                "lot_size": 6800,
                "distance_to_city_center": 4.1,
                "school_rating": 7.6,
            },
            [
                {
                    "square_footage": 1550,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "year_built": 1997,
                    "lot_size": 6800,
                    "distance_to_city_center": 4.1,
                    "school_rating": 7.6,
                }
            ],
        ]
    ),
]


def create_app(model_service: ModelService | None = None) -> FastAPI:
    service = model_service or default_model_service

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        service.load()
        yield

    app = FastAPI(
        title="Housing Price Prediction Model API",
        description="FastAPI service for Ridge Regression housing price predictions.",
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            model_loaded=service.model_loaded,
            algorithm=ALGORITHM_NAME,
        )

    @app.post("/predict", response_model=PredictionResponse)
    def predict(payload: PredictPayload) -> PredictionResponse:
        items = payload if isinstance(payload, list) else [payload]
        if not items:
            raise HTTPException(
                status_code=422,
                detail="Prediction batch must contain at least one item",
            )

        try:
            predicted_prices = service.predict(items)
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Prediction failed") from exc

        return PredictionResponse(
            count=len(predicted_prices),
            predictions=[
                PredictionItem(predicted_price=predicted_price)
                for predicted_price in predicted_prices
            ],
            algorithm=ALGORITHM_NAME,
        )

    @app.get("/model-info", response_model=ModelInfoResponse)
    def model_info() -> ModelInfoResponse:
        try:
            return ModelInfoResponse(**service.get_model_info())
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Model info unavailable") from exc

    return app


app = create_app()
