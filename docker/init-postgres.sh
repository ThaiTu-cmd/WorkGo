#!/bin/sh
set -eu
# postgres runs init scripts only for a new volume; never reset or upgrade existing data here.
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 -v workgo_service="$WORKGO_SERVICE" -v workgo_mode=fresh \
  -f /workgo/postgres-schema.sql
