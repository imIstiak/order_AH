type GlobalWithPool = typeof globalThis & {
  __shopadminPool?: any;
  __shopadminAppStateChecked?: boolean;
};
const globalScope = globalThis as GlobalWithPool;

function normalizeEnvValue(value: string): string {
  return String(value || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\r?\n/g, "");
}

function readRuntimeConnectionString(): string {
  const raw = process.env.APP_DATABASE_URL;
  if (!raw || !String(raw).trim()) {
    throw new Error("Missing APP_DATABASE_URL. Runtime APIs require app_user credentials via APP_DATABASE_URL.");
  }

  const connectionString = normalizeEnvValue(raw);

  let username = "";
  try {
    username = decodeURIComponent(new URL(connectionString).username || "").toLowerCase();
  } catch {
    throw new Error("APP_DATABASE_URL is not a valid connection string URL.");
  }

  if (username === "migration_user") {
    throw new Error("APP_DATABASE_URL must not use migration_user credentials. Use app_user credentials only.");
  }

  return connectionString;
}

export async function getDb() {
  if (globalScope.__shopadminPool) {
    return globalScope.__shopadminPool;
  }

  const connectionString = readRuntimeConnectionString();
  const { Pool } = await import("pg");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    keepAlive: true,
  });

  // Validate connection early so a bad env fails fast with a clear error.
  await pool.query("select 1");
  globalScope.__shopadminPool = pool;

  return globalScope.__shopadminPool;
}

export async function assertAppStateSchema(pool: any) {
  if (globalScope.__shopadminAppStateChecked) {
    return;
  }

  const tableCheck = await pool.query(
    `
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'app_state'
      limit 1
    `
  );

  if (!tableCheck.rows.length) {
    throw new Error(
      "Database schema is missing public.app_state. Apply migrations before starting the app."
    );
  }

  const columnCheck = await pool.query(
    `
      select udt_name, coalesce(column_default, '') as column_default
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'app_state'
        and column_name = 'state_value'
      limit 1
    `
  );

  const column = columnCheck.rows[0];
  const normalizedDefault = String(column?.column_default || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!column || column.udt_name !== "jsonb" || !normalizedDefault.includes("'{}'::jsonb")) {
    throw new Error(
      "Database schema mismatch for public.app_state.state_value. Apply latest migrations before starting the app."
    );
  }

  globalScope.__shopadminAppStateChecked = true;
}
