#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.local/logs"
PID_FILE="$ROOT_DIR/.local/pids"

mkdir -p "$LOG_DIR"
: > "$PID_FILE"

start_service() {
  local name="$1"
  local workdir="$2"
  local command="$3"
  local logfile="$LOG_DIR/$name.log"

  echo "Starting $name..."
  (
    cd "$workdir"
    bash -lc "$command"
  ) > "$logfile" 2>&1 &

  local pid=$!
  echo "$pid $name" >> "$PID_FILE"
  echo "  pid: $pid"
  echo "  log: $logfile"
}

require_path() {
  local path="$1"
  local message="$2"

  if [[ ! -e "$path" ]]; then
    echo "$message"
    exit 1
  fi
}

require_path "$ROOT_DIR/apps/ml-api/.venv/bin/activate" "Missing apps/ml-api/.venv. Install ML API dependencies first."
require_path "$ROOT_DIR/apps/property-estimator-api/.venv/bin/activate" "Missing apps/property-estimator-api/.venv. Install Property Estimator API dependencies first."
require_path "$ROOT_DIR/apps/web-portal/node_modules" "Missing apps/web-portal/node_modules. Run npm install in apps/web-portal first."

start_service "ml-api" \
  "$ROOT_DIR/apps/ml-api" \
  "source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000"

start_service "property-estimator-api" \
  "$ROOT_DIR/apps/property-estimator-api" \
  "source .venv/bin/activate && ML_API_BASE_URL=http://localhost:8000 uvicorn app.main:app --host 127.0.0.1 --port 8001"

start_service "market-analysis-api" \
  "$ROOT_DIR/apps/market-analysis-api" \
  "ML_API_BASE_URL=http://localhost:8000 mvn spring-boot:run"

start_service "web-portal" \
  "$ROOT_DIR/apps/web-portal" \
  "PROPERTY_ESTIMATOR_API_BASE_URL=http://localhost:8001 MARKET_ANALYSIS_API_BASE_URL=http://localhost:8002 npm run dev"

echo
echo "Services are starting. Logs are in $LOG_DIR."
echo "Open http://localhost:3000 after the web portal is ready."
echo "Run ./scripts/smoke-check.sh to check service health."
echo "Run ./scripts/stop-local.sh to stop all started services."
