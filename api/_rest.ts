/**
 * PostgREST HTTP client for Supabase.
 * Replaces direct pg.Pool connections — works from Vercel Lambda (IPv4, no TCP issues).
 */

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL env var.");
  return url.replace(/\/$/, "");
}

function getSupabaseKey(): string {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing SUPABASE_ANON_KEY env var.");
  return key;
}

async function rest(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<any> {
  const url = `${getSupabaseUrl()}${path}`;
  const key = getSupabaseKey();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    ...extraHeaders,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody?.message || errBody?.error || errMsg;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const text = await res.text();
  if (!text || !text.trim()) return null;
  return JSON.parse(text);
}

// ─── app_state helpers ───────────────────────────────────────────────────────

export async function getAppState(key: string): Promise<{ value: any; updatedAt: string | null }> {
  const rows = await rest(
    "GET",
    `/rest/v1/app_state?state_key=eq.${encodeURIComponent(key)}&select=state_value,updated_at&limit=1`
  );
  return {
    value: rows?.[0]?.state_value ?? null,
    updatedAt: rows?.[0]?.updated_at ?? null,
  };
}

export async function setAppState(key: string, value: unknown): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  const res = await fetch(`${supabaseUrl}/rest/v1/app_state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      state_key: key,
      state_value: value,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errMsg = errBody?.message || errBody?.error || errMsg;
    } catch { /* ignore */ }
    throw new Error(`setAppState failed: ${errMsg}`);
  }
}

// ─── auth helpers ─────────────────────────────────────────────────────────────

export async function checkEmailExists(email: string): Promise<boolean> {
  const result = await rest("POST", "/rest/v1/rpc/check_email_exists", { p_email: email });
  return Boolean(result);
}

export async function authenticateUser(email: string, password: string): Promise<any | null> {
  const rows = await rest("POST", "/rest/v1/rpc/authenticate", { p_email: email, p_password: password });
  if (Array.isArray(rows)) return rows[0] ?? null;
  // Some PostgREST versions return a single object for set-returning functions
  return rows ?? null;
}

// ─── sequence helpers ─────────────────────────────────────────────────────────

export async function nextOrderNumber(): Promise<number> {
  const result = await rest("POST", "/rest/v1/rpc/next_order_number", {});
  return Number(result);
}
