-- 20260420_001_app_state_consistency
-- Purpose:
-- 1) Ensure migration tracking exists
-- 2) Ensure app_state table exists
-- 3) Standardize app_state.state_value default to '{}'::jsonb

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version varchar(128) PRIMARY KEY,
  description text,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_state (
  state_key text PRIMARY KEY,
  state_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_state
  ALTER COLUMN state_value SET DEFAULT '{}'::jsonb;
