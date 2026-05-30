#!/usr/bin/env bash
# Backup the Seerr/Bookarr config folder (settings, SQLite DB, logs, cache).
#
# Production layout (compose.prod.yaml):
#   Host:  /media/config/overseerr  ->  Container: /app/config
#
# Run on vm-docker-01 (or wherever the seerr container lives):
#   chmod +x scripts/backup-overseerr-config.sh
#   ./scripts/backup-overseerr-config.sh
#
# Options:
#   --stop          Stop the seerr container before backup (safest for SQLite)
#   --db-only       Backup only overseerr/db/ (smaller, faster)
#   --keep N        Retain the N most recent backups (default: 14)
#
# Output:
#   /media/config/backups/overseerr-config-YYYYMMDD-HHMMSS.tar.gz
#
set -euo pipefail

CONFIG_ROOT="${CONFIG_ROOT:-/media/config}"
CONFIG_DIR="${CONFIG_DIR:-${CONFIG_ROOT}/overseerr}"
BACKUP_DIR="${BACKUP_DIR:-${CONFIG_ROOT}/backups}"
CONTAINER="${SEERR_CONTAINER:-seerr}"
KEEP="${KEEP:-14}"
STOP_CONTAINER=false
DB_ONLY=false

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stop)
      STOP_CONTAINER=true
      shift
      ;;
    --db-only)
      DB_ONLY=true
      shift
      ;;
    --keep)
      KEEP="$2"
      shift 2
      ;;
    -h | --help)
      usage 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage 1
      ;;
  esac
done

if [[ ! -d "${CONFIG_DIR}" ]]; then
  echo "Config directory not found: ${CONFIG_DIR}" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="${BACKUP_DIR}/overseerr-config-${STAMP}.tar.gz"
TMP="$(mktemp -d /tmp/overseerr-backup-XXXXXX)"
cleanup() {
  rm -rf "${TMP}"
}
trap cleanup EXIT

echo "=== Seerr config backup ==="
echo "Source:      ${CONFIG_DIR}"
echo "Destination: ${ARCHIVE}"
echo "Stop first:  ${STOP_CONTAINER}"

was_running=false
if docker ps --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  was_running=true
fi

if [[ "${STOP_CONTAINER}" == true ]]; then
  if [[ "${was_running}" == true ]]; then
    echo "Stopping ${CONTAINER}..."
    docker stop "${CONTAINER}"
  fi
elif [[ "${was_running}" == true ]] && [[ -f "${CONFIG_DIR}/db/db.sqlite3" ]]; then
  echo "Checkpointing SQLite WAL (container stays up)..."
  docker exec "${CONTAINER}" sqlite3 /app/config/db/db.sqlite3 \
    "PRAGMA wal_checkpoint(TRUNCATE);" \
    || echo "WARN: WAL checkpoint failed — use --stop for a cold backup" >&2
fi

echo "Copying config to staging area..."
mkdir -p "${TMP}/overseerr"
if [[ "${DB_ONLY}" == true ]]; then
  mkdir -p "${TMP}/overseerr/db"
  cp -a "${CONFIG_DIR}/db/." "${TMP}/overseerr/db/"
else
  cp -a "${CONFIG_DIR}/." "${TMP}/overseerr/"
fi

if [[ -f "${TMP}/overseerr/db/db.sqlite3" ]]; then
  echo "DB sanity check..."
  docker run --rm -v "${TMP}/overseerr/db:/db:ro" keinos/sqlite3 \
    sqlite3 /db/db.sqlite3 \
    "PRAGMA integrity_check; SELECT COUNT(*) AS users FROM user; SELECT COUNT(*) AS requests FROM media_request;" \
    || echo "WARN: sqlite integrity check failed" >&2
fi

echo "Creating archive..."
tar -czf "${ARCHIVE}" -C "${TMP}" overseerr

if [[ "${STOP_CONTAINER}" == true ]] && [[ "${was_running}" == true ]]; then
  echo "Starting ${CONTAINER}..."
  docker start "${CONTAINER}"
fi

BYTES="$(stat -c '%s' "${ARCHIVE}" 2>/dev/null || stat -f '%z' "${ARCHIVE}")"
echo "Backup written: ${ARCHIVE} (${BYTES} bytes)"
tar -tzf "${ARCHIVE}" | head -20
echo "..."

if [[ "${KEEP}" =~ ^[0-9]+$ ]] && [[ "${KEEP}" -gt 0 ]]; then
  echo "Pruning old backups (keeping ${KEEP})..."
  mapfile -t OLD_BACKUPS < <(
    ls -1t "${BACKUP_DIR}"/overseerr-config-*.tar.gz 2>/dev/null | tail -n +"$((KEEP + 1))" || true
  )
  for old in "${OLD_BACKUPS[@]:-}"; do
    [[ -z "${old}" ]] && continue
    echo "  removing ${old}"
    rm -f "${old}"
  done
fi

echo "Done."
