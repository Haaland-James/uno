#!/bin/bash
# Runs once, on first start with an empty data volume.
# The postgis image's own init script (10_postgis.sh) runs first and creates
# template_postgis with the extension preinstalled, so the app roles below never
# need superuser — the migration's `CREATE EXTENSION IF NOT EXISTS postgis` is a no-op.
# No `set -u` here: if the file isn't executable the entrypoint *sources* it,
# and shell options would leak into the entrypoint. ON_ERROR_STOP handles failures.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
	CREATE ROLE uno_prod LOGIN PASSWORD '${UNO_PROD_DB_PASSWORD}';
	CREATE ROLE uno_staging LOGIN PASSWORD '${UNO_STAGING_DB_PASSWORD}';
	CREATE DATABASE uno_prod OWNER uno_prod TEMPLATE template_postgis;
	CREATE DATABASE uno_staging OWNER uno_staging TEMPLATE template_postgis;
	-- Staging must never be able to reach production data.
	REVOKE ALL ON DATABASE uno_prod FROM PUBLIC;
	REVOKE ALL ON DATABASE uno_staging FROM PUBLIC;
EOSQL
