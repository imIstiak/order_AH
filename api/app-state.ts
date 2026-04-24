export const config = { runtime: "nodejs" };

import { requireAuth } from "./_auth.js";
import { getAppState, setAppState } from "./_rest.js";

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
    if (req.method === "GET") {
      if (!requireAuth(req, res)) return;
      const key = safeKey(req.query?.key);
      if (!key) return res.status(400).json({ error: "Missing key." });
      const { value, updatedAt } = await getAppState(key);
      return res.status(200).json({ key, value, updatedAt });
    }

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;
      const key = safeKey(req.body?.key);
      if (!key) return res.status(400).json({ error: "Missing key." });
      const value = resolveStateValue(req.body);
      await setAppState(key, value);
      return res.status(200).json({ ok: true, key, value });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error: isDev ? (error?.message || "App state API failed.") : "An internal error occurred.",
    });
  }
}
