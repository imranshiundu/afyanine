#!/usr/bin/env bash
# Isolated local-only migration/RLS check. Requires container root + local Postgres.
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'const u=new URL(process.env.DATABASE_URL??""); if(!["localhost","127.0.0.1"].includes(u.hostname)||u.pathname!=="/afyanine") process.exit(1)'
test "$(id -u)" = 0 || { echo "Requires container root for temporary Postgres role"; exit 1; }
DB="afyanine_care_sql_$(date +%s)_$$"
ROLE="care_rls_$(date +%s)_$$"
BASE="$(mktemp --suffix=.prisma)"
cleanup() {
  runuser -u postgres -- dropdb --if-exists "$DB" >/dev/null
  runuser -u postgres -- psql -q -c "DROP ROLE IF EXISTS $ROLE" >/dev/null
  rm -f "$BASE"
}
trap cleanup EXIT
runuser -u postgres -- createdb -O root "$DB"
TEST_DATABASE_URL="postgresql://root@localhost/$DB?host=/var/run/postgresql"
awk '/^enum CareRole/{exit}{print}' prisma/schema.prisma > "$BASE"
DATABASE_URL="$TEST_DATABASE_URL" npx prisma db push --schema "$BASE" --skip-generate >/dev/null
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f prisma/care-team.sql
npx prisma migrate diff --from-url "$TEST_DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
test "$(psql -At -d "$DB" -c "SELECT count(*) FROM pg_class WHERE relname LIKE 'Care%' AND relkind='r' AND relrowsecurity")" = 8
test "$(psql -At -d "$DB" -c "SELECT count(*) FROM pg_indexes WHERE indexname='CareAccess_one_active_pair' AND indexdef LIKE 'CREATE UNIQUE%WHERE active%'")" = 1
psql -q -d "$DB" -c "INSERT INTO \"CareAccount\"(id,email,\"displayName\",role,\"updatedAt\") VALUES('synthetic','fixture@example.test','Fictional RLS fixture','MOTHER',now())"
runuser -u postgres -- psql -q -c "CREATE ROLE $ROLE NOLOGIN NOSUPERUSER NOBYPASSRLS"
psql -q -d "$DB" -c "GRANT SELECT ON \"CareAccount\" TO $ROLE"
test "$(runuser -u postgres -- psql -At -d "$DB" -c "SET ROLE $ROLE; SELECT count(*) FROM \"CareAccount\"" | tail -1)" = 0
echo "PASS: additive schema, RLS on8tables, untrusted SELECT denied by RLS"
