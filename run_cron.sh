#!/bin/bash

BASE_DIR=$(cd "$(dirname "$0")" && pwd)

PYTHON_BIN="$BASE_DIR/venv/bin/python"
MANAGE_PY="$BASE_DIR/manage.py"
LOG_FILE="$BASE_DIR/cron.log"

touch "$LOG_FILE"

"$PYTHON_BIN" "$MANAGE_PY" delete_verification_codes >> "$LOG_FILE" 2>&1
"$PYTHON_BIN" "$MANAGE_PY" delete_inactive_users >> "$LOG_FILE" 2>&1
