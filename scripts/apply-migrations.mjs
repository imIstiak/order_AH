import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

function normalizeEnvValue(value) {
  return String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\r?\n/g, "");
}

function readMigrationConnectionString() {
  const raw = process.env.MIGRATION_DATABASE_URL;
  if (!raw || !String(raw).trim()) {
    throw new Error(
      "Missing MIGRATION_DATABASE_URL. Migration runner requires migration_user credentials via MIGRATION_DATABASE_URL."
    );
  }

  const connectionString = normalizeEnvValue(raw);

  let username = "";
  try {
    username = decodeURIComponent(new URL(connectionString).username || "").toLowerCase();
  } catch {
    throw new Error("MIGRATION_DATABASE_URL is not a valid connection string URL.");
  }

  if (username === "app_user") {
    throw new Error("MIGRATION_DATABASE_URL must not use app_user credentials. Use migration_user credentials only.");
  }

  return connectionString;
}

function shouldSkipMigrations() {
  const value = String(process.env.SKIP_DB_MIGRATIONS || "").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

async function ensureMigrationTable(pool) {
  await pool.query(`
    create table if not exists public.schema_migrations (
      version varchar(128) primary key,
      description text,
      applied_at timestamptz not null default now()
    )
  `);
}

async function listMigrationFiles(migrationsDir) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => !name.endsWith(".rollback.sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function loadAppliedVersions(pool) {
  const result = await pool.query("select version from public.schema_migrations");
  return new Set(result.rows.map((row) => String(row.version)));
}

function deriveVersion(fileName) {
  return fileName.replace(/\.sql$/i, "");
}

async function applyMigration(pool, migrationsDir, fileName) {
  const version = deriveVersion(fileName);
  const migrationPath = path.join(migrationsDir, fileName);
  const sql = (await readFile(migrationPath, "utf8")).trim();

  if (!sql) {
    console.log(`[db:migrate] Skipping empty migration ${fileName}`);
    return;
  }

  console.log(`[db:migrate] Applying ${fileName}`);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);

    await client.query(
      `
        insert into public.schema_migrations (version, description)
        values ($1, $2)
        on conflict (version) do nothing
      `,
      [version, `Applied from ${fileName}`]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`[db:migrate] Rolled back ${fileName}`);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  if (shouldSkipMigrations()) {
    console.log("[db:migrate] SKIP_DB_MIGRATIONS enabled; skipping.");
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, "..");
  const migrationsDir = path.join(rootDir, "database", "migrations");

  const migrationFiles = await listMigrationFiles(migrationsDir);
  if (!migrationFiles.length) {
    console.log("[db:migrate] No migration files found.");
    return;
  }

  const connectionString = readMigrationConnectionString();
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    await pool.query("select 1");
    await ensureMigrationTable(pool);

    const applied = await loadAppliedVersions(pool);
    const pending = migrationFiles.filter((fileName) => !applied.has(deriveVersion(fileName)));

    if (!pending.length) {
      console.log("[db:migrate] No pending migrations.");
      return;
    }

    for (const fileName of pending) {
      await applyMigration(pool, migrationsDir, fileName);
    }

    console.log(`[db:migrate] Applied ${pending.length} migration(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[db:migrate] Failed:", error?.message || error);
  process.exit(1);
});
