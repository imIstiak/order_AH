import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./core/admin-sidebar";
import { clearSession, loadSession } from "./core/auth-session";

type HealthCheck = {
  id: string;
  label: string;
  path: string;
  method: "GET" | "HEAD";
  expected: string;
  okStatuses: number[];
  degradedStatuses?: number[];
  needsProductsArray?: boolean;
};

type HealthResult = {
  id: string;
  label: string;
  path: string;
  method: "GET" | "HEAD";
  expected: string;
  status: "healthy" | "degraded" | "down";
  code: number;
  latencyMs: number;
  note: string;
  checkedAt: string;
};

const DARK = {
  bg: "#0D0F14",
  surface: "#161820",
  sidebar: "#111318",
  border: "rgba(255,255,255,0.07)",
  text: "#E2E8F0",
  textMid: "#94A3B8",
  textMuted: "#475569",
  accent: "#6366F1",
};

const LIGHT = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  sidebar: "#FFFFFF",
  border: "rgba(0,0,0,0.08)",
  text: "#0F172A",
  textMid: "#334155",
  textMuted: "#64748B",
  accent: "#6366F1",
};

const NAV: [string, string][] = [
  ["▦", "Dashboard"],
  ["≡", "Orders"],
  ["📦", "Batches"],
  ["⏳", "Pre-Orders"],
  ["⬡", "Products"],
  ["◉", "Customers"],
  ["⊡", "Abandoned"],
  ["◈", "Coupons"],
  ["$", "Remittance"],
  ["⌗", "Analytics"],
  ["⚙", "Settings"],
];

const CHECKS: HealthCheck[] = [
  {
    id: "web",
    label: "Web App Server",
    path: "/",
    method: "GET",
    expected: "200-399",
    okStatuses: [200, 301, 302, 307, 308],
  },
  {
    id: "products",
    label: "Products API",
    path: "/api/products",
    method: "GET",
    expected: "200",
    okStatuses: [200],
  },
  {
    id: "db",
    label: "Database Read Check",
    path: "/api/products",
    method: "GET",
    expected: "200 + products[]",
    okStatuses: [200],
    needsProductsArray: true,
  },
  {
    id: "r2",
    label: "R2 Upload API Route",
    path: "/api/r2-upload",
    method: "GET",
    expected: "405 (GET blocked)",
    okStatuses: [405],
  },
  {
    id: "mimsms",
    label: "MiMSMS Gateway",
    path: "/api/sms-gateway?mode=health",
    method: "GET",
    expected: "200 (configured)",
    okStatuses: [200],
    degradedStatuses: [503],
  },
];

function statusColor(status: HealthResult["status"]) {
  if (status === "healthy") return "#059669";
  if (status === "degraded") return "#D97706";
  return "#DC2626";
}

function nowLabel() {
  return new Date().toLocaleString("en-GB", { hour12: true });
}

async function runOneCheck(def: HealthCheck): Promise<HealthResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(def.path, {
      method: def.method,
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
      signal: controller.signal,
    });

    const latencyMs = Math.round(performance.now() - started);
    let note = "OK";

    if (def.needsProductsArray) {
      try {
        const json = await res.clone().json();
        const products = (json as any)?.products;
        if (!Array.isArray(products)) {
          return {
            id: def.id,
            label: def.label,
            path: def.path,
            method: def.method,
            expected: def.expected,
            status: "degraded",
            code: res.status,
            latencyMs,
            note: "Response missing products[]",
            checkedAt: nowLabel(),
          };
        }
        note = `products: ${products.length}`;
      } catch {
        return {
          id: def.id,
          label: def.label,
          path: def.path,
          method: def.method,
          expected: def.expected,
          status: "degraded",
          code: res.status,
          latencyMs,
          note: "Invalid JSON payload",
          checkedAt: nowLabel(),
        };
      }
    }

    if (def.okStatuses.includes(res.status)) {
      return {
        id: def.id,
        label: def.label,
        path: def.path,
        method: def.method,
        expected: def.expected,
        status: "healthy",
        code: res.status,
        latencyMs,
        note,
        checkedAt: nowLabel(),
      };
    }

    if ((def.degradedStatuses || []).includes(res.status)) {
      return {
        id: def.id,
        label: def.label,
        path: def.path,
        method: def.method,
        expected: def.expected,
        status: "degraded",
        code: res.status,
        latencyMs,
        note: `Service reachable, but setup required (${res.status})`,
        checkedAt: nowLabel(),
      };
    }

    return {
      id: def.id,
      label: def.label,
      path: def.path,
      method: def.method,
      expected: def.expected,
      status: res.status >= 500 ? "down" : "degraded",
      code: res.status,
      latencyMs,
      note: `Unexpected status ${res.status}`,
      checkedAt: nowLabel(),
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - started);
    const isAbort = String(error?.name || "").toLowerCase() === "aborterror";
    return {
      id: def.id,
      label: def.label,
      path: def.path,
      method: def.method,
      expected: def.expected,
      status: "down",
      code: 0,
      latencyMs,
      note: isAbort ? "Request timed out" : String(error?.message || "Request failed"),
      checkedAt: nowLabel(),
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function AdminApiHealthPage() {
  const [dark, setDark] = useState(false);
  const [running, setRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastScan, setLastScan] = useState("Never");
  const [results, setResults] = useState<HealthResult[]>(
    CHECKS.map((c) => ({
      id: c.id,
      label: c.label,
      path: c.path,
      method: c.method,
      expected: c.expected,
      status: "degraded",
      code: 0,
      latencyMs: 0,
      note: "Not checked yet",
      checkedAt: "-",
    }))
  );

  const T = dark ? DARK : LIGHT;
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "#6366F1";

  const summary = useMemo(() => {
    const healthy = results.filter((r) => r.status === "healthy").length;
    const degraded = results.filter((r) => r.status === "degraded").length;
    const down = results.filter((r) => r.status === "down").length;
    const avgLatency = results.length
      ? Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length)
      : 0;
    const overall = down > 0 ? "Down" : degraded > 0 ? "Degraded" : "Healthy";
    return { healthy, degraded, down, avgLatency, overall };
  }, [results]);

  const runChecks = async () => {
    setRunning(true);
    const next = await Promise.all(CHECKS.map((check) => runOneCheck(check)));
    setResults(next);
    setLastScan(nowLabel());
    setRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      runChecks();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{
          name: userName,
          role: userRole,
          avatar: userAvatar,
          color: userColor,
        }}
        onLogout={() => {
          clearSession();
          window.location.hash = "#/admin/login";
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: "54px", borderBottom: `1px solid ${T.border}`, background: T.sidebar, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800 }}>API Health Status</div>
            <div style={{ fontSize: "11px", color: T.textMuted }}>Monitor server, database, and API endpoints in one place</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.textMid }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto refresh (30s)
            </label>
            <button
              onClick={runChecks}
              disabled={running}
              style={{ background: running ? T.border : T.accent, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: running ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: 700 }}
            >
              {running ? "Checking..." : "Run Scan Now"}
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 20px", overflow: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(130px, 1fr))", gap: "10px", marginBottom: "14px" }}>
            {[ 
              ["Overall", summary.overall],
              ["Healthy", String(summary.healthy)],
              ["Degraded", String(summary.degraded)],
              ["Down", String(summary.down)],
              ["Avg Latency", `${summary.avgLatency} ms`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "12px", fontSize: "12px", color: T.textMuted }}>
            Last scan: <span style={{ color: T.textMid, fontWeight: 700 }}>{lastScan}</span>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 110px 120px 1.2fr", padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)" }}>
              {["Service", "Path", "Method", "HTTP", "Latency", "Details"].map((head) => (
                <div key={head} style={{ fontSize: "10px", fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{head}</div>
              ))}
            </div>

            {results.map((row, idx) => {
              const color = statusColor(row.status);
              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 110px 120px 1.2fr", padding: "11px 14px", borderBottom: idx < results.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{row.label}</div>
                    <div style={{ fontSize: "11px", color }}>{row.status.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: T.textMid }}>{row.path}</div>
                  <div style={{ fontSize: "12px", color: T.text }}>{row.method}</div>
                  <div style={{ fontSize: "12px", color: row.code >= 500 || row.code === 0 ? "#DC2626" : T.text }}>{row.code || "-"}</div>
                  <div style={{ fontSize: "12px", color: T.text }}>{row.latencyMs} ms</div>
                  <div>
                    <div style={{ fontSize: "12px", color: T.textMid }}>{row.note}</div>
                    <div style={{ fontSize: "10px", color: T.textMuted, marginTop: "2px" }}>expected: {row.expected} · checked: {row.checkedAt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
