export const config = { runtime: "nodejs" };

function envValue(name: string): string {
  return String(process.env[name] || "")
    .trim()
    .replace(/^['\"]|['\"]$/g, "")
    .replace(/\r?\n/g, "");
}

function requireEnv(name: string): string {
  const value = envValue(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function normalizeBdMobile(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) return digits;
  if (digits.startsWith("01") && digits.length === 11) return `88${digits}`;
  return digits;
}

async function mimsmsPost(path: string, payload: Record<string, unknown>) {
  const authHeader = envValue("MIMSMS_AUTHORIZATION") || "bearer";
  const response = await fetch(`https://api.mimsms.com${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

async function balanceCheck() {
  const userName = requireEnv("MIMSMS_USERNAME");
  const apikey = requireEnv("MIMSMS_API_KEY");
  return mimsmsPost("/api/SmsSending/balanceCheck", { UserName: userName, Apikey: apikey });
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const mode = String(req.query?.mode || "").toLowerCase();
      if (mode !== "health") {
        return res.status(405).json({ error: "Use POST for send/balance/dlr or GET ?mode=health." });
      }

      const hasCreds = Boolean(envValue("MIMSMS_USERNAME") && envValue("MIMSMS_API_KEY"));
      if (!hasCreds) {
        return res.status(503).json({
          ok: false,
          status: "degraded",
          message: "MiMSMS credentials are not configured.",
          requiredEnv: ["MIMSMS_USERNAME", "MIMSMS_API_KEY", "MIMSMS_SENDER_NAME"],
        });
      }

      const result = await balanceCheck();
      if (!result.ok) {
        return res.status(502).json({ ok: false, status: "down", message: "MiMSMS balance check failed.", upstream: result });
      }

      return res.status(200).json({ ok: true, status: "healthy", message: "MiMSMS reachable.", upstream: result.data });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const action = String(req.body?.action || "send").toLowerCase();
    const userName = requireEnv("MIMSMS_USERNAME");
    const apikey = requireEnv("MIMSMS_API_KEY");
    const senderName = envValue("MIMSMS_SENDER_NAME") || "iSMS";

    if (action === "balance") {
      const result = await balanceCheck();
      return res.status(result.ok ? 200 : 502).json(result);
    }

    if (action === "dlr") {
      const trxnId = String(req.body?.trxnId || "").trim();
      const mobileNumber = normalizeBdMobile(String(req.body?.mobileNumber || "").trim());
      if (!trxnId || !mobileNumber) {
        return res.status(400).json({ error: "trxnId and mobileNumber are required for DLR check." });
      }

      const result = await mimsmsPost("/api/SmsSending/DlrApi", {
        ApiKey: apikey,
        UserName: userName,
        MobileNumber: mobileNumber,
        trxnId,
      });
      return res.status(result.ok ? 200 : 502).json(result);
    }

    const mobileNumber = normalizeBdMobile(String(req.body?.mobileNumber || req.body?.to || "").trim());
    const message = String(req.body?.message || "").trim();
    if (!/^8801\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({ error: "mobileNumber must be a valid BD number in 01XXXXXXXXX or 8801XXXXXXXXX format." });
    }
    if (!message) {
      return res.status(400).json({ error: "message is required." });
    }

    const result = await mimsmsPost("/api/SmsSending/SMS", {
      ApiKey: apikey,
      MobileNumber: mobileNumber,
      SenderName: String(req.body?.senderName || senderName),
      CampaignName: String(req.body?.campaignName || ""),
      UserName: userName,
      TransactionType: String(req.body?.transactionType || "T"),
      MessageId: String(req.body?.messageId || ""),
      Message: message,
      CampaignId: req.body?.campaignId ?? "null",
      SmsData: req.body?.smsData ?? null,
    });

    return res.status(result.ok ? 200 : 502).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "SMS gateway request failed." });
  }
}
