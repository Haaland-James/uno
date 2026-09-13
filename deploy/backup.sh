#!/usr/bin/env bash
# Nightly database backup. Install via root's crontab:
#   30 2 * * * /opt/uno/backup.sh >> /opt/uno/backups/backup.log 2>&1
# Keeps 14 days locally. TODO: copy to off-server storage (R2/B2) — a backup
# that lives on the same disk as the database doesn't survive losing the server.
set -euo pipefail

cd /opt/uno
mkdir -p backups
STAMP="$(date +%F_%H%M)"

for DB in uno_prod uno_staging; do
  docker compose exec -T db pg_dump -U postgres -Fc "$DB" > "backups/${DB}_${STAMP}.dump"
  echo "$(date -Is) ok ${DB} $(du -h "backups/${DB}_${STAMP}.dump" | cut -f1)"
done

find backups -name '*.dump' -mtime +14 -delete
