import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireAuth } from "./_auth.js";

const MAX_BYTES = 8 * 1024 * 1024;

function normalizedEnv(name: string): string {
  return String(process.env[name] || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\r?\n/g, "");
}

function normalizeExt(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "bin";
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function folderSafe(value: string): string {
  return String(value || "products").replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "") || "products";
}

/** Check whether R2 is configured — returns null if OK, or a list of missing var groups. */
function checkR2Config(): string[] | null {
  const missing: string[] = [];
  const accountId = normalizedEnv("R2_ACCOUNT_ID") || normalizedEnv("CF_ACCOUNT_ID") || normalizedEnv("CLOUDFLARE_ACCOUNT_ID");
  if (!accountId) missing.push("R2_ACCOUNT_ID (or CF_ACCOUNT_ID / CLOUDFLARE_ACCOUNT_ID)");
  const accessKey = normalizedEnv("R2_ACCESS_KEY_ID") || normalizedEnv("CF_R2_ACCESS_KEY_ID") || normalizedEnv("CLOUDFLARE_R2_ACCESS_KEY_ID") || normalizedEnv("AWS_ACCESS_KEY_ID");
  if (!accessKey) missing.push("R2_ACCESS_KEY_ID (or CF_R2_ACCESS_KEY_ID)");
  const secretKey = normalizedEnv("R2_SECRET_ACCESS_KEY") || normalizedEnv("CF_R2_SECRET_ACCESS_KEY") || normalizedEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || normalizedEnv("AWS_SECRET_ACCESS_KEY");
  if (!secretKey) missing.push("R2_SECRET_ACCESS_KEY (or CF_R2_SECRET_ACCESS_KEY)");
  const bucket = normalizedEnv("R2_BUCKET") || normalizedEnv("CF_R2_BUCKET") || normalizedEnv("CLOUDFLARE_R2_BUCKET");
  if (!bucket) missing.push("R2_BUCKET (or CF_R2_BUCKET)");
  return missing.length ? missing : null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAuth(req, res)) return;

  // Upfront check: return a clear 503 if R2 is not configured
  const missingVars = checkR2Config();
  if (missingVars) {
    return res.status(503).json({
      error: "Image upload is not configured on this server.",
      details: "Cloudflare R2 environment variables are missing.",
      missing: missingVars,
      hint: "Add these variables in Vercel → Project Settings → Environment Variables, then redeploy.",
    });
  }

  try {
    const accountId = normalizedEnv("R2_ACCOUNT_ID") || normalizedEnv("CF_ACCOUNT_ID") || normalizedEnv("CLOUDFLARE_ACCOUNT_ID");
    const s3Endpoint = normalizedEnv("R2_S3_ENDPOINT") || `https://${accountId}.r2.cloudflarestorage.com`;
    const accessKeyId = (normalizedEnv("R2_ACCESS_KEY_ID") || normalizedEnv("CF_R2_ACCESS_KEY_ID") || normalizedEnv("CLOUDFLARE_R2_ACCESS_KEY_ID") || normalizedEnv("AWS_ACCESS_KEY_ID")).trim();
    const secretAccessKey = (normalizedEnv("R2_SECRET_ACCESS_KEY") || normalizedEnv("CF_R2_SECRET_ACCESS_KEY") || normalizedEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || normalizedEnv("AWS_SECRET_ACCESS_KEY")).trim();
    const bucket = normalizedEnv("R2_BUCKET") || normalizedEnv("CF_R2_BUCKET") || normalizedEnv("CLOUDFLARE_R2_BUCKET");
    const publicBaseUrl = (normalizedEnv("R2_PUBLIC_BASE_URL") || `https://${bucket}.r2.dev`).replace(/\/$/, "");

    const { filename, contentType, dataUrl, folder } = req.body || {};

    if (!filename || !contentType || !dataUrl) {
      return res.status(400).json({ error: "filename, contentType and dataUrl are required." });
    }

    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return res.status(400).json({ error: "Invalid image payload." });
    }

    const comma = dataUrl.indexOf(",");
    if (comma === -1) {
      return res.status(400).json({ error: "Malformed dataUrl." });
    }

    const base64 = dataUrl.slice(comma + 1);
    const buffer = Buffer.from(base64, "base64");

    if (!buffer.length) {
      return res.status(400).json({ error: "Empty file." });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ error: "File too large. Max 8MB." });
    }

    const ext = normalizeExt(String(filename));
    const safeFolder = folderSafe(folder);
    const key = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const client = new S3Client({
      region: "auto",
      endpoint: s3Endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: String(contentType),
      })
    );

    return res.status(200).json({ url: `${publicBaseUrl}/${key}` });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Upload failed." });
  }
}
