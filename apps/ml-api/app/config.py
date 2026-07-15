from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data"
DATA_PATH = DATA_DIR / "House Price Dataset & Test Data For Prediction.xlsx"

MODEL_DIR = BASE_DIR / "models"
MODEL_FILE = MODEL_DIR / "ridge_model.joblib"
METRICS_FILE = MODEL_DIR / "metrics.json"

TRAINING_SHEET = "Test Data For Prediction"
PREDICTION_SAMPLE_SHEET = "House Price Dataset"

ID_COLUMN = "id"
TARGET_COLUMN = "price"

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

ALGORITHM_NAME = "Ridge Regression"
PIPELINE_NAME = "StandardScaler -> Ridge Regression"
RIDGE_ALPHA = 1.0
TEST_SIZE = 0.2
RANDOM_STATE = 42
