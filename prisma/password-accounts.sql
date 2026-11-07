-- Run AFTER care-team.sql. Additive, transaction-wrapped; no data is deleted.
BEGIN;
SET LOCAL search_path TO public;
ALTER TABLE "CareInvite" ADD COLUMN "targetPhone" TEXT;
CREATE INDEX "CareInvite_targetPhone_isDemo_status_idx" ON "CareInvite"("targetPhone", "isDemo", "status");
ALTER TABLE "CareVital" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
CREATE TABLE "AccountIdentity" (
  "id" TEXT PRIMARY KEY, "email" TEXT NOT NULL UNIQUE,
  "phone" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL,
  "role" "CareRole" NOT NULL, "displayName" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0, "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "AccountSession" (
  "tokenHash" TEXT PRIMARY KEY, "identityId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountSession_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AccountIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AccountSession_identityId_idx" ON "AccountSession"("identityId");
CREATE INDEX "AccountSession_expiresAt_idx" ON "AccountSession"("expiresAt");
CREATE TABLE "AuthThrottle" (
  "key" TEXT PRIMARY KEY, "attempts" INTEGER NOT NULL, "resetAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "CareAlert" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL, "kind" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "CareAlert_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareAlert_motherId_active_createdAt_idx" ON "CareAlert"("motherId", "active", "createdAt");
CREATE UNIQUE INDEX "CareAlert_one_active_mother" ON "CareAlert"("motherId") WHERE active;
CREATE TABLE "CareBand" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL UNIQUE, "serial" TEXT NOT NULL UNIQUE,
  "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastReadingAt" TIMESTAMP(3),
  CONSTRAINT "CareBand_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
DO $$
DECLARE tbl text; role_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['AccountIdentity','AccountSession','AuthThrottle','CareAlert','CareBand']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', tbl);
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', tbl, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
