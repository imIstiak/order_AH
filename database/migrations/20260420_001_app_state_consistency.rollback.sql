-- Rollback for 20260420_001_app_state_consistency
-- Safe rollback path for emergency compatibility with legacy array-default behavior.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'app_state'
  ) THEN
    ALTER TABLE public.app_state
      ALTER COLUMN state_value SET DEFAULT '[]'::jsonb;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schema_migrations'
  ) THEN
    DELETE FROM public.schema_migrations
    WHERE version = '20260420_001_app_state_consistency';
  END IF;
END $$;

COMMIT;
