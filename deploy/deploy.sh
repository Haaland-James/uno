#!/usr/bin/env bash
# Usage: deploy.sh <production|staging> <image-tag>
#
# Called over SSH by .github/workflows/deploy.yml after the image is pushed.
# Pulls the new image, runs migrations, restarts the one service, and waits for
# /api/health. If the app doesn't come up healthy, it rolls back to the previous
# image tag. Migrations are NOT rolled back, so schema changes must stay
# backward compatible with the previous release (add columns before using them,
# drop them a release later).
set -euo pipefail

ENVIRONMENT="${1:?usage: deploy.sh <production|staging> <tag>}"
NEW_TAG="${2:?usage: deploy.sh <production|staging> <tag>}"

case "$ENVIRONMENT" in
  production) SERVICE=app;         TAG_VAR=PROD_TAG;    PORT=3000 ;;
  staging)    SERVICE=app-staging; TAG_VAR=STAGING_TAG; PORT=3001 ;;
  *) echo "Unknown environment: $ENVIRONMENT" >&2; exit 2 ;;
esac

cd /opt/uno

set_tag() {
  if grep -q "^${TAG_VAR}=" .env; then
    sed -i "s|^${TAG_VAR}=.*|${TAG_VAR}=$1|" .env
  else
    echo "${TAG_VAR}=$1" >> .env
  fi
}

wait_healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null; then return 0; fi
    sleep 3
  done
  return 1
}

PREV_TAG="$(grep "^${TAG_VAR}=" .env | cut -d= -f2- || true)"
echo "==> ${ENVIRONMENT}: ${PREV_TAG:-<none>} -> ${NEW_TAG}"

set_tag "$NEW_TAG"
docker compose pull "$SERVICE"

# First deploy (or after a reboot race): make sure Postgres is up before migrating.
docker compose up -d --wait db

echo "==> Running migrations"
if ! docker compose run --rm --no-deps "$SERVICE" prisma migrate deploy; then
  echo "!! Migration failed — keeping ${PREV_TAG:-previous} running" >&2
  [ -n "$PREV_TAG" ] && set_tag "$PREV_TAG"
  exit 1
fi

echo "==> Restarting ${SERVICE}"
docker compose up -d "$SERVICE"

if wait_healthy; then
  echo "==> ${ENVIRONMENT} healthy on ${NEW_TAG}"
  docker image prune -f >/dev/null
  exit 0
fi

echo "!! ${SERVICE} failed health check — rolling back" >&2
docker compose logs --tail 80 "$SERVICE" >&2 || true
if [ -n "$PREV_TAG" ]; then
  set_tag "$PREV_TAG"
  docker compose up -d "$SERVICE"
  wait_healthy && echo "==> Rolled back to ${PREV_TAG}" >&2
fi
exit 1
