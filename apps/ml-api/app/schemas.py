from pydantic import BaseModel, ConfigDict, Field


class HousingFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float = Field(gt=0)
    bedrooms: int = Field(ge=0)
    bathrooms: float = Field(ge=0)
    year_built: int = Field(ge=1800, le=2100)
    lot_size: float = Field(gt=0)
    distance_to_city_center: float = Field(ge=0)
    school_rating: float = Field(ge=0, le=10)


class PredictionItem(BaseModel):
    predicted_price: float


class PredictionResponse(BaseModel):
    count: int = Field(ge=0)
    predictions: list[PredictionItem]
    algorithm: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    algorithm: str


class ModelInfoResponse(BaseModel):
    algorithm: str
    pipeline: str
    features: list[str]
    coefficients: dict[str, float]
    intercept: float
    metrics: dict[str, float]
    training_samples: int
