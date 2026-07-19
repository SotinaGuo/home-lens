#!/usr/bin/env bash
set -euo pipefail

check_url() {
  local name="$1"
  local url="$2"

  printf "%-28s" "$name"
  if curl --fail --silent --show-error --max-time 8 "$url" > /dev/null; then
    echo "OK"
  else
    echo "FAILED ($url)"
    return 1
  fi
}

check_url "ML API" "http://localhost:8000/health"
check_url "Property Estimator API" "http://localhost:8001/health"
check_url "Market Analysis API" "http://localhost:8002/health"
check_url "Web Portal" "http://localhost:3000"

echo "Smoke check passed."
