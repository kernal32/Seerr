#!/usr/bin/env bash
# Restore Overseerr/Bookarr SQLite from May 27 backup before starting fixed image.
# Run on vm-docker-01 with container STOPPED.
set -euo pipefail

BACKUP="/media/config/backups/overseerr-config-20260527-093823.tar.gz"
DB_DIR="/media/config/overseerr/db"
BROKEN_DIR="${DB_DIR}/broken-$(date +%Y%m%d-%H%M%S)"
TMP="/tmp/overseerr-restore-$$"

echo "Stopping seerr..."
docker stop seerr 2>/dev/null || true

echo "Saving current DB to ${BROKEN_DIR}..."
mkdir -p "${BROKEN_DIR}"
cp "${DB_DIR}"/db.sqlite3* "${BROKEN_DIR}/" 2>/dev/null || true

echo "Extracting backup..."
mkdir -p "${TMP}"
tar -xzf "${BACKUP}" \
  -C "${TMP}" \
  overseerr/db/db.sqlite3 \
  overseerr/db/db.sqlite3-wal \
  overseerr/db/db.sqlite3-shm

echo "Installing restored DB files..."
cp "${TMP}/overseerr/db/db.sqlite3"* "${DB_DIR}/"
chown lswan:lswan "${DB_DIR}"/db.sqlite3*

echo "Verifying counts (requires keinos/sqlite3 image)..."
docker run --rm -v "${DB_DIR}:/db" keinos/sqlite3 \
  sqlite3 /db/db.sqlite3 \
  "SELECT COUNT(*) AS users FROM user; SELECT COUNT(*) AS requests FROM media_request; SELECT COUNT(*) AS migrations FROM migrations;"

echo "Checkpointing WAL (optional, recommended)..."
docker run --rm -v "${DB_DIR}:/db" keinos/sqlite3 \
  sqlite3 /db/db.sqlite3 "PRAGMA wal_checkpoint(TRUNCATE);"

rm -rf "${TMP}"
echo "Done. Start seerr only after rebuilding with the fixed develop image."
