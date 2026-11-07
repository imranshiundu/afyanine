BEGIN;
ALTER TABLE "CareAccount" ADD COLUMN IF NOT EXISTS "opsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AccountIdentity" ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE "CareAlert" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'raised';
ALTER TABLE "CareAlert" ADD COLUMN IF NOT EXISTS "acknowledgedAt" TIMESTAMP(3);
UPDATE "CareAlert" SET status='resolved' WHERE NOT active;
CREATE TABLE IF NOT EXISTS "CareOperator" (
  "identityId" TEXT PRIMARY KEY REFERENCES "AccountIdentity"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "CareOperator" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "CareOperator" FROM PUBLIC;
DO $$
DECLARE r text; had_create boolean;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
      EXECUTE format('REVOKE ALL ON "CareOperator" FROM %I', r);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='afyanine_app') THEN
    had_create := has_schema_privilege('afyanine_app','public','CREATE');
    IF NOT had_create THEN GRANT CREATE ON SCHEMA public TO afyanine_app; END IF;
    ALTER TABLE "CareOperator" OWNER TO afyanine_app;
    IF NOT had_create THEN REVOKE CREATE ON SCHEMA public FROM afyanine_app; END IF;
  END IF;
END $$;
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['CareOperator','AccountIdentity','AccountSession']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='afyanine_changed' AND tgrelid=format('public.%I',tbl)::regclass) THEN
      EXECUTE format('CREATE TRIGGER afyanine_changed AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.afyanine_notify_change()',tbl);
    END IF;
  END LOOP;
END $$;
COMMIT;
