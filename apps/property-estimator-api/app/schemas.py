from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PropertyFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0)
    bedrooms: int = Field(ge=0)
    bathrooms: float = Field(ge=0)
    year_built: int = Field(ge=1800, le=2100)
    lot_size: float = Field(gt=0)
    distance_to_city_center: float = Field(ge=0)
    school_rating: float = Field(ge=0, le=10)


class EstimateRecord(BaseModel):
    id: str
    features: PropertyFeatures
    predicted_price: float
    created_at: datetime


class EstimateListResponse(BaseModel):
    items: list[EstimateRecord]


class ComparisonRequest(BaseModel):
    estimate_ids: list[str] = Field(min_length=2)


class ComparisonResponse(BaseModel):
    items: list[EstimateRecord]
    highest_price: float
    lowest_price: float
    price_difference: float


class HealthResponse(BaseModel):
    status: str
    service: str
    ml_api_base_url: str
