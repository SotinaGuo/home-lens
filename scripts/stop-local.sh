#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.local/pids"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No PID file found. Nothing to stop."
  exit 0
fi

while read -r pid name; do
  if [[ -z "${pid:-}" ]]; then
    continue
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name ($pid)..."
    kill "$pid" 2>/dev/null || true
  else
    echo "$name ($pid) is not running."
  fi
done < "$PID_FILE"

rm -f "$PID_FILE"
echo "Done."
