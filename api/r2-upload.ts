import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_BYTES = 8 * 1024 * 1024;

function normalizedEnv(name: string): string {
  return String(process.env[name] || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\r?\n/g, "");
}

function requiredEnv(name: string): string {
  const value = normalizedEnv(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function requiredAnyEnv(names: string[]): string {
  for (const name of names) {
    const value = normalizedEnv(name);
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names[0]}`);
}

function normalizeExt(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "bin";
  return filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function folderSafe(value: string): string {
  return String(value || "products").replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "") || "products";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accountId = requiredAnyEnv(["R2_ACCOUNT_ID", "CF_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID"]);
    const s3Endpoint = normalizedEnv("R2_S3_ENDPOINT") || `https://${accountId}.r2.cloudflarestorage.com`;
    const accessKeyId = (normalizedEnv("R2_ACCESS_KEY_ID") || normalizedEnv("CF_R2_ACCESS_KEY_ID") || normalizedEnv("CLOUDFLARE_R2_ACCESS_KEY_ID") || normalizedEnv("AWS_ACCESS_KEY_ID") || requiredAnyEnv([
      "R2_ACCESS_KEY_ID",
      "CF_R2_ACCESS_KEY_ID",
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
      "AWS_ACCESS_KEY_ID",
    ])).trim();
    const secretAccessKey = (normalizedEnv("R2_SECRET_ACCESS_KEY") || normalizedEnv("CF_R2_SECRET_ACCESS_KEY") || normalizedEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || normalizedEnv("AWS_SECRET_ACCESS_KEY") || requiredAnyEnv([
      "R2_SECRET_ACCESS_KEY",
      "CF_R2_SECRET_ACCESS_KEY",
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
      "AWS_SECRET_ACCESS_KEY",
    ])).trim();
    const bucket = requiredAnyEnv(["R2_BUCKET", "CF_R2_BUCKET", "CLOUDFLARE_R2_BUCKET"]);
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
