# Migration Policy

1. Add one forward migration per schema change using this naming format:
   - YYYYMMDD_NNN_short_description.sql
2. Add a matching rollback file:
   - YYYYMMDD_NNN_short_description.rollback.sql
3. Do not edit previously applied migrations.
4. Track all applied versions in public.schema_migrations.
5. Keep forward migrations idempotent where possible.
6. Avoid destructive operations without a rollback plan.
7. Migration execution must use MIGRATION_DATABASE_URL (migration_user credentials).
