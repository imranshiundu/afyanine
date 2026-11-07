BEGIN;
-- Notifications contain NO account, contact, credential or health data.
CREATE OR REPLACE FUNCTION public.afyanine_notify_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify('afyanine_changes', '');
  RETURN NULL;
END $$;
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['CareAccount','CareInvite','CareAccess','CareVisit','CareNote','CareVital','CareContact','CareAlert','CareBand']
  LOOP
    EXECUTE format('CREATE TRIGGER afyanine_changed AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.afyanine_notify_change()', tbl);
  END LOOP;
END $$;
-- The only generated domain data: clearly marked simulated band readings.
-- No bindings or withdrawn Vitals consent => no readings. No auto-SOS.
CREATE OR REPLACE FUNCTION public.afyanine_simulate_bands() RETURNS integer
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE binding record; written integer := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('afyanine-band-simulator')) THEN RETURN 0; END IF;
  FOR binding IN
    SELECT b."id", b."motherId" FROM "CareBand" b
    JOIN "CareAccount" a ON a.id = b."motherId"
    WHERE a.role = 'MOTHER' AND 'VITALS' = ANY(a."storageScopes")
      AND (b."lastReadingAt" IS NULL OR b."lastReadingAt" < now() - interval '10 seconds')
    FOR UPDATE OF b, a
  LOOP
    INSERT INTO "CareVital" ("id","motherId",systolic,diastolic,"heartRate","source","measuredAt")
    VALUES ('band-' || gen_random_uuid()::text, binding."motherId",
      108 + floor(random()*20)::integer, 68 + floor(random()*15)::integer,
      65 + floor(random()*25)::integer, 'SIMULATED_BAND', now());
    UPDATE "CareBand" SET "lastReadingAt"=now() WHERE id=binding.id;
    written := written + 1;
  END LOOP;
  RETURN written;
END $$;
REVOKE ALL ON FUNCTION public.afyanine_simulate_bands() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.afyanine_notify_change() FROM PUBLIC;
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.afyanine_simulate_bands() FROM %I', r);
      EXECUTE format('REVOKE ALL ON FUNCTION public.afyanine_notify_change() FROM %I', r);
    END IF;
  END LOOP;
END $$;
COMMIT;
