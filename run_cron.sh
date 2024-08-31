#!/bin/bash

BASE_DIR=$(cd "$(dirname "$0")" && pwd)
chmod +x BASE_DIR

PYTHON_BIN="$BASE_DIR/venv/bin/python"
MANAGE_PY="$BASE_DIR/manage.py"
LOG_FILE="$BASE_DIR/cron.log"

"$PYTHON_BIN" "$MANAGE_PY" delete_verification_codes >> "$LOG_FILE" 2>&1
"$PYTHON_BIN" "$MANAGE_PY" delete_inactive_users >> "$LOG_FILE" 2>&1
