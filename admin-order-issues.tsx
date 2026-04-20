import { useEffect, useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { appendTimelineEvent, loadOrderCollection, persistOrderCollectionToServer, syncOrderCollectionFromServer } from "./core/order-store";

const DARK = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)" };

const NAV = [["▦", "Dashboard"], ["≡", "Orders"], ["📦", "Batches"], ["⏳", "Pre-Orders"], ["⬡", "Products"], ["◉", "Customers"], ["⊡", "Abandoned"], ["◈", "Coupons"], ["$", "Remittance"], ["⌗", "Analytics"], ["⚙", "Settings"]];
const VIEW_ORDER_KEY = "shopadmin.viewOrder.num";

export default function AdminOrderIssuesPage() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;
  const [orders, setOrders] = useState(() => loadOrderCollection([]));
  const [ordersHydrated, setOrdersHydrated] = useState(false);
  const [nav, setNav] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const synced = await syncOrderCollectionFromServer([]);
      if (cancelled) return;
      setOrders(synced as any);
      setOrdersHydrated(true);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ordersHydrated) return;
    persistOrderCollectionToServer(orders as any);
  }, [orders, ordersHydrated]);

  const issueOrders = orders.filter((o: any) => Boolean(o.issue));

  const openOrder = (orderNum: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VIEW_ORDER_KEY, orderNum);
    }
    navigateByAdminNavLabel("Orders");
  };

  const resolveIssue = (orderNum: string) => {
    setOrders((prev: any[]) =>
      prev.map((o: any) => {
        if (o.num !== orderNum) return o;
        const withStatus = appendTimelineEvent(o, o.status || "Placed", "Order issue resolved", "order-issues-page");
        return { ...withStatus, issue: null };
      })
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "system-ui,sans-serif", color: T.text, overflow: "hidden" }}>
      <div style={{ width: "236px", background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 15px 13px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: "17px", fontWeight: 800, color: T.accent, letterSpacing: "0.2px" }}>ShopAdmin</div>
          <div style={{ fontSize: "10px", color: T.textMuted, marginTop: "2px", fontWeight: 600 }}>LADIES FASHION BD</div>
        </div>
        <div style={{ padding: "10px 8px", flex: 1 }}>
          {NAV.map(([icon, label], i) => (
            <button key={i} onClick={() => { setNav(i); navigateByAdminNavLabel(label); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", marginBottom: "2px", background: nav === i ? T.accent + "18" : "transparent", color: nav === i ? T.accent : T.textMuted, textAlign: "left" }}>
              <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: nav === i ? 700 : 500 }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "11px 12px", borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => setDark(!dark)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "9px", padding: "8px 10px", cursor: "pointer", color: T.textMid, fontSize: "12px", fontWeight: 600 }}>
            <span>{dark ? "🌙 Dark" : "☀️ Light"}</span>
            <div style={{ width: "30px", height: "16px", background: dark ? "#6366F1" : "#CBD5E1", borderRadius: "16px", position: "relative" }}>
              <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: dark ? "16px" : "2px", transition: "left 0.2s" }} />
            </div>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: T.sidebar, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: T.text }}>Open Order Issues</div>
            <div style={{ fontSize: "11px", color: T.textMuted }}>All issue-flagged orders in one page</div>
          </div>
          <button onClick={() => navigateByAdminNavLabel("Dashboard")} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: "8px", padding: "7px 12px", fontSize: "11px", cursor: "pointer" }}>Back to Dashboard</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "11px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 120px 120px 210px", padding: "8px 12px", borderBottom: `1px solid ${T.border}`, background: T.tHead }}>
              {["Order", "Customer", "Phone", "Status", "Risk", "Actions"].map((h) => (
                <div key={h} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {!issueOrders.length && <div style={{ padding: "28px", textAlign: "center", color: T.textMuted, fontSize: "12px" }}>No open issues found.</div>}

            {issueOrders.map((o: any, i: number) => (
              <div key={o.id || i} style={{ padding: "10px 12px", borderBottom: i < issueOrders.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 120px 120px 210px", alignItems: "center", marginBottom: "7px" }}>
                  <button onClick={() => openOrder(String(o.num || ""))} style={{ background: "transparent", border: "none", color: T.accent, fontWeight: 700, fontSize: "12px", cursor: "pointer", textAlign: "left" }}>{o.num}</button>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: T.text }}>{o.customer || "Unknown"}</div>
                  <div style={{ fontSize: "11px", color: T.textMid }}>{o.phone || "-"}</div>
                  <div><span style={{ fontSize: "10px", padding: "3px 7px", borderRadius: "5px", background: "#EF444415", color: "#DC2626", fontWeight: 700 }}>{o.status || "Placed"}</span></div>
                  <div><span style={{ fontSize: "10px", padding: "3px 7px", borderRadius: "5px", background: o.fraud === "high" ? "#EF444415" : o.fraud === "medium" ? "#F59E0B15" : "#10B98115", color: o.fraud === "high" ? "#DC2626" : o.fraud === "medium" ? "#D97706" : "#059669", fontWeight: 700 }}>{String(o.fraud || "low").toUpperCase()}</span></div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => openOrder(String(o.num || ""))} style={{ background: T.accent + "15", border: `1px solid ${T.accent}35`, color: T.accent, borderRadius: "6px", padding: "4px 9px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Open Order</button>
                    <button onClick={() => resolveIssue(String(o.num || ""))} style={{ background: "#10B98115", border: "1px solid #10B98135", color: "#059669", borderRadius: "6px", padding: "4px 9px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Resolve</button>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#EF4444", lineHeight: 1.5 }}>{o.issue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
