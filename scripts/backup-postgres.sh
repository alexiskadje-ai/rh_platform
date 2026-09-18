#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/rh_platform-$STAMP.sql"
docker compose exec -T postgres pg_dump -U rh_user -d rh_platform --no-owner --format=plain > "$OUT_FILE"
echo "Backup written to $OUT_FILE"
echo "Copy this file to S3/R2 and keep a 30-day retention window."
