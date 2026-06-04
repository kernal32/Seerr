#!/usr/bin/env bash
# One-off fix for corrupted Overseerr quota values in SQLite.
# Prefer letting the app run cleanCorruptedUserQuotas on startup after deploy.
#
# Usage on vm-docker-01:
#   docker exec seerr sqlite3 /app/config/db/db.sqlite3 \
#     "UPDATE user SET movieQuotaLimit = NULL WHERE typeof(movieQuotaLimit) = 'text';
#      UPDATE user SET movieQuotaDays = NULL WHERE typeof(movieQuotaDays) = 'text';
#      UPDATE user SET tvQuotaLimit = NULL WHERE typeof(tvQuotaLimit) = 'text';
#      UPDATE user SET tvQuotaDays = NULL WHERE typeof(tvQuotaDays) = 'text';
#      SELECT id, email, movieQuotaLimit, movieQuotaDays, typeof(movieQuotaLimit) FROM user WHERE movieQuotaLimit IS NOT NULL OR tvQuotaLimit IS NOT NULL;"
#
# Then re-save global quotas in Settings → Users (admin UI) if defaultQuotas were malformed.

set -euo pipefail

CONTAINER="${SEERR_CONTAINER:-seerr}"
DB_PATH="${DB_PATH:-/app/config/db/db.sqlite3}"

echo "Cleaning corrupted text quota columns in ${CONTAINER}..."
docker exec "${CONTAINER}" sqlite3 "${DB_PATH}" <<'SQL'
UPDATE user SET movieQuotaLimit = NULL WHERE typeof(movieQuotaLimit) = 'text';
UPDATE user SET movieQuotaDays = NULL WHERE typeof(movieQuotaDays) = 'text';
UPDATE user SET tvQuotaLimit = NULL WHERE typeof(tvQuotaLimit) = 'text';
UPDATE user SET tvQuotaDays = NULL WHERE typeof(tvQuotaDays) = 'text';
SELECT id, email, movieQuotaLimit, movieQuotaDays, tvQuotaLimit, tvQuotaDays,
       typeof(movieQuotaLimit) AS t_limit, typeof(movieQuotaDays) AS t_days
FROM user
WHERE movieQuotaLimit IS NOT NULL OR tvQuotaLimit IS NOT NULL OR movieQuotaDays IS NOT NULL OR tvQuotaDays IS NOT NULL;
SQL

echo "Done. Restart ${CONTAINER} if it was running during manual cleanup."
