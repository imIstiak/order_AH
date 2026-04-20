export const config = { runtime: "nodejs" };

import { getDb } from "./_db.js";

type ClientRole = "admin" | "agent" | "product-uploader";

function normalizeRoleForClient(rawRole: unknown): ClientRole {
  const role = String(rawRole || "").trim().toLowerCase();
  if (role === "agent") return "agent";
  if (role === "product_uploader" || role === "product-uploader") return "product-uploader";
  return "admin";
}

function safeEmail(raw: unknown): string {
  return String(raw || "").trim().toLowerCase();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pool = await getDb();
    const action = String(req.body?.action || "login").toLowerCase();

    if (action === "check_email") {
      const email = safeEmail(req.body?.email);
      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      const existing = await pool.query(
        `
          select 1
          from app_users
          where lower(email) = $1 and is_active = true
          limit 1
        `,
        [email]
      );

      return res.status(200).json({ exists: existing.rows.length > 0 });
    }

    const email = safeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const userResult = await pool.query(
      `
        select id, email, name, role, avatar, color
        from app_users
        where lower(email) = $1
          and is_active = true
          and password_hash is not null
          and password_hash = crypt($2, password_hash)
        limit 1
      `,
      [email, password]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRoleForClient(user.role),
        avatar: user.avatar || "A",
        color: user.color || "#6366F1",
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Authentication failed." });
  }
}
