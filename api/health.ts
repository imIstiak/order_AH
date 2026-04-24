export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  const results: Record<string, any> = {
    node: process.version,
    env_supabase_url: !!process.env.SUPABASE_URL,
    env_supabase_key: !!process.env.SUPABASE_ANON_KEY,
    env_secret: !!process.env.ADMIN_API_SECRET,
  };

  try {
    const { getAppState } = await import("./_rest.js");
    await getAppState("__health_check__");
    results.db = "ok";
  } catch (e: any) {
    results.db = "error";
    results.db_error = e?.message || String(e);
  }

  return res.status(results.db === "ok" ? 200 : 503).json(results);
}
