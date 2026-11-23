#!/bin/sh
set -eu

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD must be set}"
: "${MIGRATOR_DB_PASSWORD:?MIGRATOR_DB_PASSWORD must be set}"

psql --set=ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=database_name="$POSTGRES_DB" \
  --set=migrator_password="$MIGRATOR_DB_PASSWORD" \
  --set=app_password="$APP_DB_PASSWORD" <<'SQL'
create role school_portal_migrator login password :'migrator_password';
create role school_portal_app login password :'app_password';
alter database :"database_name" owner to school_portal_migrator;
alter schema public owner to school_portal_migrator;
revoke all on database :"database_name" from public;
grant connect on database :"database_name" to school_portal_app;
grant usage on schema public to school_portal_app;
SQL
