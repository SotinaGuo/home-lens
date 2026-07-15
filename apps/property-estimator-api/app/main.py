from fastapi import FastAPI, HTTPException, Query

from app.config import Settings, get_settings
from app.ml_client import (
    MlApiClient,
    MlApiConnectionError,
    MlApiResponseError,
    MlApiTimeoutError,
)
from app.repository import EstimateRepository
from app.schemas import (
    ComparisonRequest,
    ComparisonResponse,
    EstimateListResponse,
    EstimateRecord,
    HealthResponse,
    PropertyFeatures,
)
from app.service import ComparisonValidationError, EstimateNotFoundError, EstimatorService


def build_default_service(settings: Settings) -> EstimatorService:
    return EstimatorService(
        repository=EstimateRepository(),
        ml_client=MlApiClient(
            base_url=str(settings.ml_api_base_url),
            timeout_seconds=settings.ml_api_timeout_seconds,
        ),
    )


def create_app(
    service: EstimatorService | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    active_settings = settings or get_settings()
    active_service = service or build_default_service(active_settings)

    app = FastAPI(
        title="Property Estimator API",
        description="Backend API for property value estimates and comparisons.",
        version="0.1.0",
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        """健康检查，便于确认服务配置是否生效。"""
        return HealthResponse(
            status="ok",
            service=active_settings.service_name,
            ml_api_base_url=str(active_settings.ml_api_base_url),
        )

    @app.post("/estimates", response_model=EstimateRecord)
    def create_estimate(features: PropertyFeatures) -> EstimateRecord:
        """创建估价记录，并透传 ML 依赖故障为 API 错误码。"""
        try:
            return active_service.create_estimate(features)
        except MlApiTimeoutError as exc:
            raise HTTPException(status_code=504, detail="ML API request timed out") from exc
        except (MlApiConnectionError, MlApiResponseError) as exc:
            raise HTTPException(status_code=502, detail="ML API prediction failed") from exc

    @app.get("/estimates", response_model=EstimateListResponse)
    def list_estimates(limit: int = Query(default=20, ge=1, le=100)) -> EstimateListResponse:
        return EstimateListResponse(items=active_service.list_estimates(limit=limit))

    @app.get("/estimates/{estimate_id}", response_model=EstimateRecord)
    def get_estimate(estimate_id: str) -> EstimateRecord:
        try:
            return active_service.get_estimate(estimate_id)
        except EstimateNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Estimate not found") from exc

    @app.post("/comparisons", response_model=ComparisonResponse)
    def compare_estimates(request: ComparisonRequest) -> ComparisonResponse:
        """按记录 id 做对比摘要。"""
        try:
            return active_service.compare_estimates(request.estimate_ids)
        except ComparisonValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except EstimateNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Estimate not found") from exc

    return app


app = create_app()
