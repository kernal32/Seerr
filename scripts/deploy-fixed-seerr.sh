#!/usr/bin/env bash
# Rebuild and deploy the fixed Bookarr/Seerr image from develop.
# Run on vm-docker-01 from the directory containing compose.prod.yaml.
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"

echo "=== Step 1: Stop running container ==="
docker stop seerr 2>/dev/null || true
docker rm seerr 2>/dev/null || true

echo "=== Step 2: Remove old cached image (forces fresh GitHub build) ==="
docker rmi seerr-home:local 2>/dev/null || true

echo "=== Step 3: Build from develop (no cache) ==="
docker compose -f "${COMPOSE_FILE}" build --no-cache --pull

echo "=== Step 4: Verify image has NO test file in dist/subscriber ==="
if docker run --rm --entrypoint sh seerr-home:local -c \
  'ls -la /app/dist/subscriber/; test ! -f /app/dist/subscriber/MediaSubscriber.test.js'; then
  echo "OK: dist/subscriber contains only real subscribers"
else
  echo "FATAL: MediaSubscriber.test.js still present — do NOT start container"
  exit 1
fi

echo "=== Step 5: Start container ==="
docker compose -f "${COMPOSE_FILE}" up -d

echo "=== Step 6: Tail logs (Ctrl+C to exit) ==="
sleep 3
docker logs seerr --tail 50

echo ""
echo "Verify DB after stable boot:"
echo "  docker exec seerr sqlite3 /app/config/db/db.sqlite3 \"SELECT COUNT(*) FROM user; SELECT COUNT(*) FROM media_request;\""
