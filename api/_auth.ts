import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_VERSION = "1";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const SEP = "|";

function getSecret(): string {
  const raw = String(process.env.ADMIN_API_SECRET || "").trim();
  if (raw.length < 24) {
    throw new Error(
      "ADMIN_API_SECRET must be set to at least 24 characters. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return raw;
}

export type TokenClaims = { userId: string; role: string };

export function createSessionToken(userId: string, role: string): string {
  const secret = getSecret();
  const expiry = String(Date.now() + TOKEN_TTL_MS);
  const payload = [TOKEN_VERSION, userId, role, expiry].join(SEP);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}${SEP}${sig}`).toString("base64url");
}

export function verifySessionToken(raw: string): TokenClaims | null {
  try {
    const secret = getSecret();
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const lastSep = decoded.lastIndexOf(SEP);
    if (lastSep < 0) return null;

    const payload = decoded.slice(0, lastSep);
    const sig = decoded.slice(lastSep + SEP.length);
    const parts = payload.split(SEP);
    if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;

    const [, userId, role, expiryStr] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (!userId || !role || Number.isNaN(expiry) || Date.now() > expiry) return null;

    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig.padEnd(64, "0"), "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

    return { userId, role };
  } catch {
    return null;
  }
}

export function extractToken(req: any): string {
  const auth = String(req.headers?.authorization || "");
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return String(req.headers?.["x-admin-token"] || "").trim();
}

export function requireAuth(req: any, res: any): TokenClaims | null {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  const claims = verifySessionToken(token);
  if (!claims) {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    return null;
  }
  return claims;
}
