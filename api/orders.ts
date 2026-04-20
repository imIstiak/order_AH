export const config = { runtime: "nodejs" };
import { assertAppStateSchema, getDb } from "./_db.js";

function normalizeOrders(raw: unknown): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => (row && typeof row === "object" ? row : {}));
}

async function readOrders(pool: any): Promise<any[]> {
  const result = await pool.query(
    `select state_value from app_state where state_key = 'orders' limit 1`
  );
  const value = result.rows[0]?.state_value;
  return normalizeOrders(value);
}

async function writeOrders(pool: any, orders: any[]) {
  await pool.query(
    `
      insert into app_state (state_key, state_value, updated_at)
      values ('orders', $1::jsonb, now())
      on conflict (state_key)
      do update set state_value = excluded.state_value, updated_at = now()
    `,
    [JSON.stringify(normalizeOrders(orders))]
  );
}

export default async function handler(req: any, res: any) {
  try {
    const pool = await getDb();
    await assertAppStateSchema(pool);

    if (req.method === "GET") {
      const orders = await readOrders(pool);
      return res.status(200).json({ orders });
    }

    if (req.method === "PUT") {
      const orders = normalizeOrders(req.body?.orders);
      await writeOrders(pool, orders);
      return res.status(200).json({ ok: true, orders });
    }

    if (req.method === "POST") {
      const incoming = req.body?.order;
      if (!incoming || typeof incoming !== "object") {
        return res.status(400).json({ error: "Missing order payload." });
      }

      const orders = await readOrders(pool);
      const updated = [incoming, ...orders];
      await writeOrders(pool, updated);
      return res.status(200).json({ ok: true, order: incoming, orders: updated });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Orders API failed." });
  }
}
