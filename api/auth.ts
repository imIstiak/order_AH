export const config = { runtime: "nodejs" };

import { createSessionToken } from "./_auth.js";
import { checkEmailExists, authenticateUser } from "./_rest.js";

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const action = String(req.body?.action || "login").toLowerCase();

    if (action === "check_email") {
      const email = safeEmail(req.body?.email);
      if (!email) return res.status(400).json({ error: "Email is required." });
      const exists = await checkEmailExists(email);
      return res.status(200).json({ exists });
    }

    const email = safeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const clientRole = normalizeRoleForClient(user.role);
    const displayName = String(
      user.name || user.display_name || user.username || user.full_name || ""
    ).trim() || safeEmail(user.email).split("@")[0];
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        role: clientRole,
        avatar: user.avatar || "A",
        color: user.color || "#6366F1",
      },
      token: createSessionToken(String(user.id), clientRole),
    });
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error: isDev ? (error?.message || "Authentication failed.") : "An internal error occurred.",
    });
  }
}
