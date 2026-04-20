-- Role and permission strategy for schema safety.
-- Run this script as a superuser or database owner in the target database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'CHANGE_ME_APP_PASSWORD';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'migration_user') THEN
    CREATE ROLE migration_user LOGIN PASSWORD 'CHANGE_ME_MIGRATION_PASSWORD';
  END IF;
END
$$;

-- Replace loose defaults: public should not create objects in schema public.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM app_user;

-- Both roles can connect; only migration_user can create/alter schema objects.
DO $$
DECLARE
  db_name text := current_database();
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_user', db_name);
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO migration_user', db_name);
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO migration_user;

-- Existing objects: app_user can read/write data only.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Future objects created by migration_user inherit app_user data privileges.
ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO app_user;

-- To guarantee migration_user can ALTER existing objects, transfer ownership.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT format('%I.%I', schemaname, tablename) AS fq_name
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s OWNER TO migration_user', r.fq_name);
  END LOOP;

  FOR r IN
    SELECT format('%I.%I', sequence_schema, sequence_name) AS fq_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE %s OWNER TO migration_user', r.fq_name);
  END LOOP;

  FOR r IN
    SELECT format('%I.%I', n.nspname, p.proname) AS fq_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER FUNCTION %s(%s) OWNER TO migration_user', r.fq_name, r.args);
  END LOOP;
END
$$;

-- Optional hardening:
-- Ensure app deployments always use app_user credentials.
-- Ensure CI/CD migration step always uses migration_user credentials.
