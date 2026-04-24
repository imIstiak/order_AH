export const config = { runtime: "nodejs" };

function norm(name: string) {
  return String(process.env[name] || "").trim().replace(/^['\"]|['\"]$/g, "");
}

export default async function handler(req: any, res: any) {
  const accountId = norm("R2_ACCOUNT_ID") || norm("CF_ACCOUNT_ID") || norm("CLOUDFLARE_ACCOUNT_ID");
  const accessKey = norm("R2_ACCESS_KEY_ID") || norm("CF_R2_ACCESS_KEY_ID") || norm("CLOUDFLARE_R2_ACCESS_KEY_ID") || norm("AWS_ACCESS_KEY_ID");
  const secretKey = norm("R2_SECRET_ACCESS_KEY") || norm("CF_R2_SECRET_ACCESS_KEY") || norm("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || norm("AWS_SECRET_ACCESS_KEY");
  const bucket    = norm("R2_BUCKET") || norm("CF_R2_BUCKET") || norm("CLOUDFLARE_R2_BUCKET");
  const pubUrl    = norm("R2_PUBLIC_BASE_URL");
  const endpoint  = norm("R2_S3_ENDPOINT");

  const results: Record<string, any> = {
    node: process.version,
    env_supabase_url: !!process.env.SUPABASE_URL,
    env_supabase_key: !!process.env.SUPABASE_ANON_KEY,
    env_secret: !!process.env.ADMIN_API_SECRET,
    r2: {
      account_id: !!accountId,
      access_key: !!accessKey,
      secret_key: !!secretKey,
      bucket: bucket || null,           // show bucket name (not secret)
      public_url: pubUrl || null,
      s3_endpoint: endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null),
      ready: !!(accountId && accessKey && secretKey && bucket),
    },
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
