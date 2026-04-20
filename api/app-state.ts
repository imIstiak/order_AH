export const config = { runtime: "nodejs" };
import { assertAppStateSchema, getDb } from "./_db.js";

function safeKey(raw: unknown): string {
  return String(raw || "").trim();
}

function resolveStateValue(body: any): unknown {
  if (body && Object.prototype.hasOwnProperty.call(body, "value")) {
    return body.value;
  }
  return {};
}

export default async function handler(req: any, res: any) {
  try {
    const pool = await getDb();
    await assertAppStateSchema(pool);

    if (req.method === "GET") {
      const key = safeKey(req.query?.key);
      if (!key) return res.status(400).json({ error: "Missing key." });
      const result = await pool.query(`select state_value, updated_at from app_state where state_key = $1 limit 1`, [key]);
      return res.status(200).json({ key, value: result.rows[0]?.state_value ?? null, updatedAt: result.rows[0]?.updated_at || null });
    }

    if (req.method === "PUT") {
      const key = safeKey(req.body?.key);
      if (!key) return res.status(400).json({ error: "Missing key." });
      const value = resolveStateValue(req.body);
      await pool.query(
        `
          insert into app_state (state_key, state_value, updated_at)
          values ($1, $2::jsonb, now())
          on conflict (state_key)
          do update set state_value = excluded.state_value, updated_at = now()
        `,
        [key, JSON.stringify(value)]
      );
      return res.status(200).json({ ok: true, key, value });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "App state API failed." });
  }
}
