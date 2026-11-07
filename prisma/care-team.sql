-- Additive, one-time migration. Review before running against production.
-- Execute as the trusted server DATABASE_URL role (which must own these tables).
-- Do not add this to a Vercel build script or expose it through an HTTP endpoint.
BEGIN;
SET LOCAL search_path TO public;
CREATE TYPE "CareRole" AS ENUM ('MOTHER', 'CHW', 'PARTNER');
CREATE TYPE "CareScope" AS ENUM ('VITALS', 'PREGNANCY', 'VISITS', 'NOTES', 'CONTACTS');
CREATE TYPE "CareInviteKind" AS ENUM ('CHW', 'PARTNER');
CREATE TYPE "CareInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
CREATE TYPE "CareVisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TABLE "CareAccount" (
  "id" TEXT PRIMARY KEY, "email" TEXT NOT NULL, "displayName" TEXT NOT NULL,
  "phone" TEXT, "role" "CareRole" NOT NULL, "locale" TEXT NOT NULL DEFAULT 'EN',
  "isDemo" BOOLEAN NOT NULL DEFAULT false, "institutionName" TEXT,
  "registrationNumber" TEXT, "institutionContact" TEXT,
  "verifiedAt" TIMESTAMP(3), "verifiedBy" TEXT, "dueDate" TIMESTAMP(3),
  "storageScopes" "CareScope"[] DEFAULT ARRAY[]::"CareScope"[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "CareInvite" (
  "id" TEXT PRIMARY KEY, "requesterId" TEXT NOT NULL, "motherId" TEXT,
  "targetEmail" TEXT NOT NULL, "kind" "CareInviteKind" NOT NULL,
  "scopes" "CareScope"[], "status" "CareInviteStatus" NOT NULL DEFAULT 'PENDING',
  "isDemo" BOOLEAN NOT NULL DEFAULT false, "expiresAt" TIMESTAMP(3) NOT NULL,
  "respondedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareInvite_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CareInvite_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "CareAccess" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL, "viewerId" TEXT NOT NULL,
  "kind" "CareInviteKind" NOT NULL, "scopes" "CareScope"[],
  "active" BOOLEAN NOT NULL DEFAULT true, "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "inviteId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "CareAccess_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CareAccess_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CareAccess_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "CareInvite"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "CareVisit" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL, "chwId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "place" TEXT NOT NULL, "status" "CareVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareVisit_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CareVisit_chwId_fkey" FOREIGN KEY ("chwId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "CareNote" (
  "id" TEXT PRIMARY KEY, "visitId" TEXT NOT NULL, "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareNote_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "CareVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CareAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "CareVital" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL,
  "systolic" INTEGER NOT NULL, "diastolic" INTEGER NOT NULL, "heartRate" INTEGER NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareVital_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CareContact" (
  "id" TEXT PRIMARY KEY, "motherId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "relationship" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareContact_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "CareAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "CareAudit" (
  "id" TEXT PRIMARY KEY, "actorId" TEXT NOT NULL, "motherId" TEXT,
  "action" TEXT NOT NULL, "scopes" "CareScope"[] DEFAULT ARRAY[]::"CareScope"[],
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CareAccount_isDemo_email_idx" ON "CareAccount"("isDemo", "email");
CREATE INDEX "CareInvite_targetEmail_isDemo_status_idx" ON "CareInvite"("targetEmail", "isDemo", "status");
CREATE INDEX "CareInvite_requesterId_createdAt_idx" ON "CareInvite"("requesterId", "createdAt");
CREATE UNIQUE INDEX "CareAccess_inviteId_key" ON "CareAccess"("inviteId");
-- Prisma does not express partial unique indexes: retain this SQL constraint.
CREATE UNIQUE INDEX "CareAccess_one_active_pair" ON "CareAccess"("motherId","viewerId","kind") WHERE active;
CREATE INDEX "CareAccess_motherId_active_idx" ON "CareAccess"("motherId", "active");
CREATE INDEX "CareAccess_viewerId_active_idx" ON "CareAccess"("viewerId", "active");
CREATE INDEX "CareVisit_chwId_startsAt_idx" ON "CareVisit"("chwId", "startsAt");
CREATE INDEX "CareVisit_motherId_startsAt_idx" ON "CareVisit"("motherId", "startsAt");
CREATE INDEX "CareVital_motherId_measuredAt_idx" ON "CareVital"("motherId", "measuredAt");
CREATE INDEX "CareAudit_motherId_createdAt_idx" ON "CareAudit"("motherId", "createdAt");
-- Deny direct PostgREST/SDK access. Only the trusted table-owning server role
-- accesses these tables, after getUser + category/relationship checks.
DO $$
DECLARE tbl text; role_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['CareAccount','CareInvite','CareAccess','CareVisit','CareNote','CareVital','CareContact','CareAudit']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', tbl);
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', tbl, role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
