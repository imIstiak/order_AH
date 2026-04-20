import { useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { getRouteForLabel, navigateByAdminNavLabel } from "./core/nav-routes";
import { loadSession } from "./core/auth-session";
import { appendTimelineEvent, loadOrderCollection, persistOrderCollectionToServer, syncOrderCollectionFromServer } from "./core/order-store";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)" };

type Theme = typeof DARK;
type ChartMetric = "revenue" | "profit" | "orders";

type RevenuePoint = {
  day: string;
  revenue: number;
  orders: number;
  profit: number;
};

type PendingVerify = {
  num: string;
  customer: string;
  phone: string;
  amount: number;
  txId: string;
  fraud: "high" | "medium" | "low";
  time: string;
};

type OpenIssue = {
  num: string;
  customer: string;
  issue: string;
  status: string;
  severity: "high" | "medium" | "low";
};

type RecentOrder = {
  num: string;
  customer: string;
  source: string;
  type: string;
  status: string;
  amount: number;
  time: string;
  statusColor: string;
};

type MostOrdered = {
  rank: number;
  name: string;
  cat: string;
  img: string;
  bg: string;
  orders: number;
  revenue: number;
  topVar: string;
};

type SourceData = {
  name: string;
  orders: number;
  revenue: number;
  color: string;
  icon: string;
};

type AgentData = {
  name: string;
  orders: number;
  revenue: number;
  delivered: number;
  pending: number;
};

type PipelineStage = {
  stage: string;
  count: number;
  color: string;
};

type SidebarProps = {
  dark: boolean;
  setDark: Dispatch<SetStateAction<boolean>>;
  nav: number;
  setNav: Dispatch<SetStateAction<number>>;
  T: Theme;
  issueCount: number;
  user: { name: string; role: string; avatar: string; color: string };
};

type StatCardProps = {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: string;
  T: Theme;
};

type StatItem = Omit<StatCardProps, "T">;

type CardWrapProps = {
  title: string;
  badge?: number;
  badgeColor?: string;
  action?: string;
  actionOnClick?: () => void;
  children: ReactNode;
  T: Theme;
};

type BarChartProps = {
  data: RevenuePoint[];
  valueKey: ChartMetric;
  color: string;
  T: Theme;
};

const NAV: Array<[string, string]> = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const VIEW_ORDER_KEY = "shopadmin.viewOrder.num";

// ── SUB-COMPONENTS (outside App) ─────────────────────────────────────────

function Sidebar({ dark, setDark, nav, setNav, T, issueCount, user }: SidebarProps) {
  return (
    <div style={{ width:"236px", background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"18px 15px 13px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:"17px", fontWeight:800, color:T.accent, letterSpacing:"0.2px" }}>ShopAdmin</div>
        <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px", fontWeight:600 }}>LADIES FASHION BD</div>
      </div>
      <div style={{ padding:"10px 8px", flex:1 }}>
        {NAV.map(([icon, label], i) => {
          const activeMain = window.location.hash === getRouteForLabel(label);
          const activeTeam = window.location.hash === "#/admin/team";
          const activeProfile = window.location.hash === "#/admin/profile";
          return (
            <div key={i}>
              <button onClick={() => { setNav(i); navigateByAdminNavLabel(label); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"2px", background:activeMain?T.accent+"18":"transparent", color:activeMain?T.accent:T.textMuted, textAlign:"left" }}>
                <span style={{ fontSize:"13px", width:"18px", textAlign:"center" }}>{icon}</span>
                <span style={{ fontSize:"13px", fontWeight:activeMain?700:500 }}>{label}</span>
                {label === "Orders" && issueCount > 0 && (
                  <span style={{ marginLeft:"auto", background:"#EF444420", color:"#DC2626", fontSize:"10px", padding:"2px 7px", borderRadius:"999px", fontWeight:700 }}>⚠{issueCount}</span>
                )}
              </button>
              {label === "Settings" && (activeMain || activeTeam || activeProfile) && (
                <div style={{ marginLeft:"20px", marginBottom:"5px", display:"flex", flexDirection:"column", gap:"3px" }}>
                  <button onClick={() => navigateByAdminNavLabel("Team")}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 9px", borderRadius:"8px", border:"none", cursor:"pointer", background:activeTeam?T.accent+"18":"transparent", color:activeTeam?T.accent:T.textMuted, textAlign:"left" }}>
                    <span style={{ fontSize:"12px" }}>👥</span>
                    <span style={{ fontSize:"11px", fontWeight:activeTeam?700:500 }}>Team</span>
                  </button>
                  <button onClick={() => navigateByAdminNavLabel("Profile")}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 9px", borderRadius:"8px", border:"none", cursor:"pointer", background:activeProfile?T.accent+"18":"transparent", color:activeProfile?T.accent:T.textMuted, textAlign:"left" }}>
                    <span style={{ fontSize:"12px" }}>👤</span>
                    <span style={{ fontSize:"11px", fontWeight:activeProfile?700:500 }}>Profile</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding:"11px 12px", borderTop:`1px solid ${T.border}` }}>
        <button onClick={() => setDark(!dark)}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"8px 10px", cursor:"pointer", color:T.textMid, fontSize:"12px", fontWeight:600, marginBottom:"10px" }}>
          <span>{dark ? "🌙 Dark" : "☀️ Light"}</span>
          <div style={{ width:"30px", height:"16px", background:dark?"#6366F1":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
            <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"16px":"2px", transition:"left 0.2s" }}/>
          </div>
        </button>
        <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"7px", background:"transparent", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:user.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>{user.avatar}</div>
          <div><div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{user.name}</div><div style={{ fontSize:"10px", color:T.textMuted }}>{user.role}</div></div>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, T }: StatCardProps) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"14px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
        <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
        <span style={{ fontSize:"18px" }}>{icon}</span>
      </div>
      <div style={{ fontSize:"22px", fontWeight:800, color, marginBottom:"3px", letterSpacing:"-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted }}>{sub}</div>}
    </div>
  );
}

function CardWrap({ title, badge, badgeColor, action, actionOnClick, children, T }: CardWrapProps) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{title}</span>
          {badge !== undefined && <span style={{ fontSize:"10px", fontWeight:800, padding:"1px 7px", borderRadius:"10px", background:(badgeColor || T.accent)+"20", color:(badgeColor || T.accent) }}>{badge}</span>}
        </div>
        {action && <button onClick={actionOnClick} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 11px", fontSize:"11px", cursor:"pointer" }}>{action}</button>}
      </div>
      {children}
    </div>
  );
}

// Pure CSS bar chart
function BarChartCSS({ data, valueKey, color, T }: BarChartProps) {
  const max = Math.max(...data.map(d => d[valueKey]));
  const fmt = (v: number) => valueKey === "orders" ? v : "৳" + (v >= 1000 ? Math.round(v/1000) + "k" : v);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:"160px", padding:"0 4px" }}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", height:"100%" }}>
            <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
              <div style={{ width:"100%", height:`${pct}%`, background:color, borderRadius:"5px 5px 0 0", minHeight:"4px", position:"relative", transition:"height 0.3s" }}
                onMouseEnter={e => { e.currentTarget.title = `${d.day}: ${fmt(d[valueKey])}`; }}>
              </div>
            </div>
            <div style={{ fontSize:"10px", color:T.textMuted, textAlign:"center", whiteSpace:"nowrap" }}>{d.day.split(" ")[1]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [dark, setDark]         = useState(false);
  const T = dark ? DARK : LIGHT;
  const [nav, setNav]           = useState(0);
  const sessionUser = loadSession()?.user;
  const isAgent = sessionUser?.role === "agent";
  const userInfo = {
    name: sessionUser?.name || "Admin",
    role: isAgent ? "Agent" : "Super Admin",
    avatar: sessionUser?.avatar || "A",
    color: sessionUser?.color || "#6366F1",
  };
  const [chartMetric, setChartMetric] = useState<ChartMetric>("revenue");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [quickRange, setQuickRange] = useState("7d");
  const [orders, setOrders] = useState(() => loadOrderCollection([]));
  const [ordersHydrated, setOrdersHydrated] = useState(false);

  const calcOrderAmount = (order: any) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.reduce((sum: number, item: any) => sum + Number(item?.price || 0) * Number(item?.qty || 0), 0);
  };

  const srcMeta = (source: string) => {
    const key = String(source || "").toLowerCase();
    if (key === "facebook") return { icon: "📘", color: "#1877F2", name: "Facebook" };
    if (key === "instagram") return { icon: "📸", color: "#E1306C", name: "Instagram" };
    if (key === "website") return { icon: "🌐", color: "#6366F1", name: "Website" };
    if (key === "whatsapp") return { icon: "💬", color: "#25D366", name: "WhatsApp" };
    if (key === "phone") return { icon: "📞", color: "#64748B", name: "Phone" };
    return { icon: "📦", color: "#64748B", name: "Other" };
  };

  const iconForProduct = (name: string) => {
    const n = String(name || "").toLowerCase();
    if (n.includes("shoe") || n.includes("heel") || n.includes("sneaker") || n.includes("converse")) return { img: "👟", bg: "#1E40AF", cat: "Shoes" };
    if (n.includes("bag") || n.includes("tote") || n.includes("clutch") || n.includes("backpack")) return { img: "👜", bg: "#92400E", cat: "Bags" };
    if (n.includes("bracelet") || n.includes("chain") || n.includes("necklace")) return { img: "📿", bg: "#6B21A8", cat: "Accessories" };
    return { img: "🛍️", bg: "#334155", cat: "General" };
  };

  const today = new Date();
  const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  const revenueMap = new Map<string, RevenuePoint>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    revenueMap.set(key, { day: fmtDay(d), revenue: 0, orders: 0, profit: 0 });
  }

  orders.forEach((order: any) => {
    const d = new Date(String(order?.date || order?.updatedAt || ""));
    if (Number.isNaN(d.getTime())) return;
    const key = dayKey(d);
    const point = revenueMap.get(key);
    if (!point) return;
    const amount = calcOrderAmount(order);
    point.revenue += amount;
    point.orders += 1;
    point.profit += Math.round(amount * 0.3);
  });

  const REVENUE_BARS: RevenuePoint[] = Array.from(revenueMap.values());

  const sourceMap = new Map<string, SourceData>();
  orders.forEach((order: any) => {
    const amount = calcOrderAmount(order);
    const meta = srcMeta(String(order?.source || ""));
    const cur = sourceMap.get(meta.name) || { ...meta, orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += amount;
    sourceMap.set(meta.name, cur);
  });
  const SOURCE_DATA: SourceData[] = Array.from(sourceMap.values());

  const itemMap = new Map<string, { name: string; orders: number; revenue: number; topVar: Record<string, number> }>();
  orders.forEach((order: any) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    items.forEach((item: any) => {
      const name = String(item?.name || "Unnamed Product");
      const amount = Number(item?.price || 0) * Number(item?.qty || 0);
      const key = `${String(item?.size || "")}-${String(item?.color || "")}`;
      const cur = itemMap.get(name) || { name, orders: 0, revenue: 0, topVar: {} };
      cur.orders += Number(item?.qty || 0);
      cur.revenue += amount;
      cur.topVar[key] = (cur.topVar[key] || 0) + Number(item?.qty || 0);
      itemMap.set(name, cur);
    });
  });

  const MOST_ORDERED: MostOrdered[] = Array.from(itemMap.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 8)
    .map((row, index) => {
      const topVar = Object.entries(row.topVar).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      const meta = iconForProduct(row.name);
      return {
        rank: index + 1,
        name: row.name,
        cat: meta.cat,
        img: meta.img,
        bg: meta.bg,
        orders: row.orders,
        revenue: row.revenue,
        topVar,
      };
    });

  const agentMap = new Map<string, AgentData>();
  orders.forEach((order: any) => {
    const agent = String(order?.agent || "Unassigned");
    const amount = calcOrderAmount(order);
    const cur = agentMap.get(agent) || { name: agent, orders: 0, revenue: 0, delivered: 0, pending: 0 };
    cur.orders += 1;
    cur.revenue += amount;
    if (String(order?.status || "").toLowerCase() === "delivered") cur.delivered += 1;
    else cur.pending += 1;
    agentMap.set(agent, cur);
  });
  const AGENTS: AgentData[] = Array.from(agentMap.values()).slice(0, 5);

  const PIPELINE: PipelineStage[] = [
    { stage: "Advance Paid", count: 0, color: "#6366F1" },
    { stage: "Ordered Supplier", count: 0, color: "#D97706" },
    { stage: "In Transit", count: 0, color: "#0D9488" },
    { stage: "Arrived BD", count: 0, color: "#A855F7" },
    { stage: "Packing", count: 0, color: "#059669" },
  ];
  orders.forEach((order: any) => {
    const status = String(order?.status || "");
    const row = PIPELINE.find((p) => p.stage.toLowerCase() === status.toLowerCase());
    if (row) row.count += 1;
  });

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

  const applyRange = (range: string) => {
    setQuickRange(range);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2,"0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const today = fmt(now);
    if (range === "today") { setDateFrom(today); setDateTo(today); }
    else if (range === "7d")  { const d = new Date(now); d.setDate(d.getDate()-6); setDateFrom(fmt(d)); setDateTo(today); }
    else if (range === "30d") { const d = new Date(now); d.setDate(d.getDate()-29); setDateFrom(fmt(d)); setDateTo(today); }
    else if (range === "month") { const d = new Date(now.getFullYear(), now.getMonth(), 1); setDateFrom(fmt(d)); setDateTo(today); }
  };

  const totalRevenue = REVENUE_BARS.reduce((a,b) => a+b.revenue, 0);
  const totalProfit  = REVENUE_BARS.reduce((a,b) => a+b.profit, 0);
  const totalSrcOrd  = SOURCE_DATA.reduce((a,b) => a+b.orders, 0);
  const pipTotal     = PIPELINE.reduce((a,b) => a+b.count, 0);
  const maxOrders    = MOST_ORDERED[0]?.orders || 1;

  const fmtAgo = (at?: string, fallback?: string) => {
    const raw = at || fallback;
    if (!raw) return "just now";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "just now";
    const diffMs = Date.now() - date.getTime();
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const openOrderByNum = (orderNum: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VIEW_ORDER_KEY, orderNum);
    }
    navigateByAdminNavLabel("Orders");
  };

  const verifyBkash = (orderNum: string, approved: boolean) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.num !== orderNum) return order;

        if (approved) {
          const withStatus = appendTimelineEvent(order, "Advance Paid", "bKash payment verified from dashboard", "dashboard-verify");
          return {
            ...withStatus,
            payStatus:"verified",
            issue:null,
          };
        }

        const withStatus = appendTimelineEvent(order, "Pend. Verify", "bKash verification rejected from dashboard", "dashboard-verify");
        return {
          ...withStatus,
          payStatus:"pending",
          issue:order.issue || "Payment verification failed. Customer follow-up needed.",
        };
      })
    );
  };

  const pendingVerifyRows = orders
    .filter((o) => o.status === "Pend. Verify" && String(o.pay || "").toLowerCase().includes("bkash"))
    .map((o) => {
      const txMatch = String(o.customerNote || "").match(/(BK\d+)/i);
      return {
        num:String(o.num || ""),
        customer:String(o.customer || "Unknown"),
        phone:String(o.phone || ""),
        amount:Number(o.advance || 0),
        txId:txMatch?.[1] || "N/A",
        fraud:(o.fraud === "high" || o.fraud === "medium") ? o.fraud : "low",
        time:fmtAgo(String(o.updatedAt || ""), String(o.date || "")),
      } as PendingVerify;
    });

  const openIssueRows = orders
    .filter((o) => Boolean(o.issue))
    .map((o) => ({
      num:String(o.num || ""),
      customer:String(o.customer || "Unknown"),
      issue:String(o.issue || ""),
      status:String(o.status || "Placed"),
      severity:(o.fraud === "high" || o.fraud === "medium") ? o.fraud : "low",
    } as OpenIssue));

  const recentOrdersRows = orders
    .slice()
    .sort((a, b) => new Date(String(b.updatedAt || b.date || "")).getTime() - new Date(String(a.updatedAt || a.date || "")).getTime())
    .slice(0, 6)
    .map((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const statusColor =
        o.status === "Confirmed" || o.status === "Delivered" ? "#059669" :
        o.status === "Advance Paid" ? "#6366F1" :
        o.status === "Shipped" ? "#2563EB" :
        o.status === "Pend. Verify" ? "#D97706" :
        "#64748B";

      return {
        num:String(o.num || ""),
        customer:String(o.customer || "Unknown"),
        source:String(o.source || "").toLowerCase() === "facebook" ? "📘" :
               String(o.source || "").toLowerCase() === "instagram" ? "📸" :
               String(o.source || "").toLowerCase() === "website" ? "🌐" :
               String(o.source || "").toLowerCase() === "whatsapp" ? "💬" :
               String(o.source || "").toLowerCase() === "phone" ? "📞" : "📦",
        type:String(o.type || "stock"),
        status:String(o.status || "Placed"),
        amount:Number(items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.qty || 0), 0) || 0),
        time:fmtAgo(String(o.updatedAt || ""), String(o.date || "")),
        statusColor,
      } as RecentOrder;
    });

  const pendingVerifyData = pendingVerifyRows;
  const openIssuesData = openIssueRows;
  const recentOrdersData = recentOrdersRows;

  const todayRevenue = REVENUE_BARS[REVENUE_BARS.length - 1]?.revenue || 0;
  const todayOrders = REVENUE_BARS[REVENUE_BARS.length - 1]?.orders || 0;
  const totalCodDue = orders.reduce((sum: number, order: any) => sum + Math.max(0, calcOrderAmount(order) - Number(order?.advance || 0)), 0);

  const STATS: StatItem[] = [
    { label:"Today's Revenue",   value:"৳"+todayRevenue.toLocaleString(),                  sub:`${todayOrders} orders today`,   color:"#6366F1", icon:"💰" },
    { label:"Total COD Due",     value:"৳"+totalCodDue.toLocaleString(),                   sub:"Across current orders",        color:"#D97706", icon:"💵" },
    { label:"Week Revenue",      value:"৳"+totalRevenue.toLocaleString(),                  sub:`৳${totalProfit.toLocaleString()} profit`, color:"#059669", icon:"📈" },
    { label:"Total Orders",      value:String(orders.length),                               sub:"All time",                    color:T.accent,  icon:"🛍️" },
    { label:"Pending Verify",    value:String(pendingVerifyData.length),                    sub:"Manual bKash TxID",           color:"#DC2626", icon:"⚠️" },
    { label:"Open Issues",       value:String(openIssuesData.length),                       sub:"Need resolution",             color:"#EF4444", icon:"🚨" },
  ];

  const IS = { background:T.input, border:`1px solid ${T.border}`, borderRadius:"7px", color:T.text, padding:"6px 10px", fontSize:"12px", outline:"none", fontFamily:"inherit" };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>

      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={userInfo}
        badgeByLabel={openIssuesData.length > 0 ? { Orders: { text: `⚠${openIssuesData.length}`, background: "#EF444420", color: "#DC2626" } } : undefined}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar with date filter */}
        <div style={{ background:T.sidebar, borderBottom:`1px solid ${T.border}`, padding:"10px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <div>
              <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>Dashboard</div>
              <div style={{ fontSize:"11px", color:T.textMuted }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              {!isAgent && (
                <button onClick={() => navigateByAdminNavLabel("Team")} style={{ background:T.bg, color:T.textMid, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 12px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>👥 Team</button>
              )}
              <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ background:T.bg, color:T.textMid, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 12px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>👤 Profile</button>
              <button onClick={() => navigateByAdminNavLabel("New Order")} style={{ background:T.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>+ New Order</button>
            </div>
          </div>
          {/* Date filter */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:"2px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
              {[["today","Today"],["7d","7 Days"],["30d","30 Days"],["month","This Month"],["custom","Custom"]].map(([id,label]) => (
                <button key={id} onClick={() => applyRange(id)}
                  style={{ padding:"5px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:quickRange===id?T.accent+"20":"transparent", color:quickRange===id?T.accent:T.textMuted }}>
                  {label}
                </button>
              ))}
            </div>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setQuickRange("custom"); }} style={IS}/>
            <span style={{ fontSize:"12px", color:T.textMuted }}>→</span>
            <input type="date" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setQuickRange("custom"); }} style={IS}/>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setQuickRange("7d"); }}
                style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer" }}>✕</button>
            )}
            {dateFrom && dateTo && <span style={{ fontSize:"11px", color:T.accent, fontWeight:600 }}>{dateFrom} → {dateTo}</span>}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"10px", marginBottom:"18px" }}>
            {STATS.map((s,i) => <StatCard key={i} {...s} T={T}/>)}
          </div>

          {/* Action items */}
          <div style={{ marginBottom:"18px" }}>
            <div style={{ fontSize:"14px", fontWeight:700, color:T.text, marginBottom:"4px" }}>⚡ Needs Your Attention</div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"10px" }}>Resolve these before processing new orders</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>

              {/* Pending bKash */}
              <CardWrap title="Pending bKash Verification" badge={pendingVerifyData.length} badgeColor="#DC2626" action="View all →" actionOnClick={() => navigateByAdminNavLabel("bKash Verification")} T={T}>
                {pendingVerifyData.map((o,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 16px", borderBottom:i<pendingVerifyData.length-1?`1px solid ${T.border}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"2px" }}>
                        <button onClick={() => openOrderByNum(o.num)} style={{ fontSize:"12px", fontWeight:700, color:T.accent, background:"transparent", border:"none", padding:0, cursor:"pointer" }}>{o.num}</button>
                        {o.fraud==="high" && <span style={{ fontSize:"9px", fontWeight:700, background:"#EF444415", color:"#DC2626", padding:"1px 6px", borderRadius:"3px" }}>HIGH RISK</span>}
                      </div>
                      <div style={{ fontSize:"11px", color:T.textMid }}>{o.customer} · {o.phone}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>TxID: {o.txId} · ৳{o.amount} · {o.time}</div>
                    </div>
                    <div style={{ display:"flex", gap:"5px" }}>
                      <button onClick={() => verifyBkash(o.num, true)} style={{ background:"#10B98115", border:"1px solid #10B98130", color:"#059669", borderRadius:"6px", padding:"5px 10px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✓</button>
                      <button onClick={() => verifyBkash(o.num, false)} style={{ background:"#EF444415", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"6px", padding:"5px 10px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✗</button>
                    </div>
                  </div>
                ))}
                {!pendingVerifyData.length && (
                  <div style={{ padding:"14px 16px", fontSize:"11px", color:T.textMuted }}>No pending bKash verifications.</div>
                )}
              </CardWrap>

              {/* Open Issues */}
              <CardWrap title="Open Order Issues" badge={openIssuesData.length} badgeColor="#DC2626" action="View all →" actionOnClick={() => navigateByAdminNavLabel("Order Issues")} T={T}>
                {openIssuesData.map((o,i) => (
                  <div key={i} style={{ padding:"11px 16px", borderBottom:i<openIssuesData.length-1?`1px solid ${T.border}`:"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                      <div style={{ display:"flex", gap:"7px", alignItems:"center" }}>
                        <button onClick={() => openOrderByNum(o.num)} style={{ fontSize:"12px", fontWeight:700, color:T.accent, background:"transparent", border:"none", padding:0, cursor:"pointer" }}>{o.num}</button>
                        <span style={{ fontSize:"11px", fontWeight:600, color:T.textMid }}>{o.customer}</span>
                      </div>
                      <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 7px", borderRadius:"4px", background:"#EF444415", color:"#DC2626" }}>{o.status}</span>
                    </div>
                    <div style={{ fontSize:"11px", color:"#EF4444", lineHeight:"1.5", marginBottom:"7px" }}>{o.issue}</div>
                    <button onClick={() => openOrderByNum(o.num)} style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"6px", padding:"4px 11px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Open Order →</button>
                  </div>
                ))}
                {!openIssuesData.length && (
                  <div style={{ padding:"14px 16px", fontSize:"11px", color:T.textMuted }}>No open order issues.</div>
                )}
              </CardWrap>
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"12px", marginBottom:"18px" }}>

            {/* Revenue bar chart */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Revenue & Performance</div>
                  <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>Last 7 days</div>
                </div>
                <div style={{ display:"flex", gap:"3px", background:T.bg, borderRadius:"7px", padding:"3px", border:`1px solid ${T.border}` }}>
                  {([["revenue","Revenue","#6366F1"],["profit","Profit","#059669"],["orders","Orders","#D97706"]] as Array<[ChartMetric, string, string]>).map(([id,label,color]) => (
                    <button key={id} onClick={() => setChartMetric(id)}
                      style={{ padding:"4px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"10px", fontWeight:600, background:chartMetric===id?color+"20":"transparent", color:chartMetric===id?color:T.textMuted }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding:"16px 16px 8px" }}>
                {/* Y-axis labels */}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  {chartMetric === "orders"
                    ? [9,6,3,0].map(v => <span key={v} style={{ fontSize:"10px", color:T.textMuted }}>{v}</span>)
                    : ["৳20k","৳15k","৳10k","৳5k","0"].map(v => <span key={v} style={{ fontSize:"10px", color:T.textMuted }}>{v}</span>)
                  }
                </div>
                <BarChartCSS
                  data={REVENUE_BARS}
                  valueKey={chartMetric}
                  color={chartMetric==="revenue"?"#6366F1":chartMetric==="profit"?"#059669":"#D97706"}
                  T={T}
                />
                {/* Summary row */}
                <div style={{ display:"flex", gap:"16px", marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${T.border}` }}>
                  {([
                    ["Total Revenue","৳"+totalRevenue.toLocaleString(),"#6366F1"],
                    ["Total Profit","৳"+totalProfit.toLocaleString(),"#059669"],
                    ["Total Orders",REVENUE_BARS.reduce((a,b)=>a+b.orders,0)+" orders","#D97706"],
                  ] as Array<[string, string, string]>).map(([label,val,color]) => (
                    <div key={label}>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{label}</div>
                      <div style={{ fontSize:"13px", fontWeight:800, color }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-order pipeline */}
            <CardWrap title="Pre-Order Pipeline" badge={pipTotal} badgeColor="#D97706" T={T}>
              <div style={{ padding:"14px 16px" }}>
                {PIPELINE.map((s,i) => {
                  const pct = Math.round(s.count/pipTotal*100);
                  return (
                    <div key={i} style={{ marginBottom:"12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ fontSize:"11px", fontWeight:600, color:T.textMid }}>{s.stage}</span>
                        <span style={{ fontSize:"11px", fontWeight:800, color:s.color }}>{s.count}</span>
                      </div>
                      <div style={{ height:"6px", background:T.border, borderRadius:"6px" }}>
                        <div style={{ height:"6px", width:`${pct}%`, background:s.color, borderRadius:"6px" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardWrap>
          </div>

          {/* Most ordered products */}
          <div style={{ marginBottom:"18px" }}>
            <CardWrap title="🏆 Most Ordered Products" action="View all →" T={T}>
              <div style={{ padding:"0" }}>
                <div style={{ display:"grid", gridTemplateColumns:"44px 1fr 100px 120px 130px 130px", padding:"8px 16px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                  {["","Product","Category","Orders","Revenue","Top Variant"].map((h,i) => (
                    <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
                  ))}
                </div>
                {MOST_ORDERED.map((p,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"44px 1fr 100px 120px 130px 130px", padding:"10px 16px", borderBottom:i<MOST_ORDERED.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.tHead}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize:"14px", textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":p.rank}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"32px", height:"32px", borderRadius:"7px", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{p.img}</div>
                      <div>
                        <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{p.name}</div>
                        <div style={{ width:"90px", height:"4px", background:T.border, borderRadius:"4px", marginTop:"4px" }}>
                          <div style={{ height:"4px", width:`${Math.round(p.orders/maxOrders*100)}%`, background:T.accent, borderRadius:"4px" }}/>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:"11px", color:T.textMuted }}>{p.cat}</div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:T.accent }}>{p.orders} orders</div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:"#059669" }}>৳{p.revenue.toLocaleString()}</div>
                    <div style={{ fontSize:"11px", color:T.textMuted, background:T.bg, borderRadius:"5px", padding:"3px 8px", display:"inline-block" }}>{p.topVar}</div>
                  </div>
                ))}
              </div>
            </CardWrap>
          </div>

          {/* Bottom row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px" }}>

            {/* Source breakdown */}
            <CardWrap title="Orders by Source" T={T}>
              <div style={{ padding:"14px 16px" }}>
                {SOURCE_DATA.map((s,i) => {
                  const pct = Math.round(s.orders/totalSrcOrd*100);
                  return (
                    <div key={i} style={{ marginBottom:"12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                          <span style={{ fontSize:"14px" }}>{s.icon}</span>
                          <span style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{s.name}</span>
                        </div>
                        <div>
                          <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{s.orders}</span>
                          <span style={{ fontSize:"10px", color:T.textMuted, marginLeft:"4px" }}>({pct}%)</span>
                        </div>
                      </div>
                      <div style={{ height:"5px", background:T.border, borderRadius:"5px" }}>
                        <div style={{ height:"5px", width:`${pct}%`, background:s.color, borderRadius:"5px" }}/>
                      </div>
                      <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"3px" }}>৳{s.revenue.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </CardWrap>

            {/* Agent performance */}
            <CardWrap title="Agent Performance" T={T}>
              {AGENTS.map((a,i) => (
                <div key={i} style={{ padding:"12px 16px", borderBottom:i<AGENTS.length-1?`1px solid ${T.border}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>{a.name[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{a.name}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{a.orders} orders this week</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#059669" }}>৳{(a.revenue/1000).toFixed(0)}k</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                    {([["✅ Delivered",a.delivered,"#059669"],["⏳ Pending",a.pending,"#D97706"]] as Array<[string, number, string]>).map(([label,val,color]) => (
                      <div key={label} style={{ background:T.bg, borderRadius:"6px", padding:"6px 9px", display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"10px", color:T.textMuted }}>{label}</span>
                        <span style={{ fontSize:"12px", fontWeight:700, color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardWrap>

            {/* Recent orders */}
            <CardWrap title="Recent Orders" action="View all →" actionOnClick={() => navigateByAdminNavLabel("Orders")} T={T}>
              {recentOrdersData.map((o,i) => (
                <div key={i} onClick={() => openOrderByNum(o.num)} style={{ display:"flex", alignItems:"center", gap:"9px", padding:"10px 14px", borderBottom:i<recentOrdersData.length-1?`1px solid ${T.border}`:"none", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.tHead}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                      <span style={{ fontSize:"12px", fontWeight:700, color:o.type==="preorder"?"#D97706":T.accent }}>{o.num}</span>
                      <span style={{ fontSize:"12px" }}>{o.source}</span>
                    </div>
                    <div style={{ fontSize:"11px", color:T.textMid }}>{o.customer}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{o.time}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:T.text, marginBottom:"3px" }}>৳{o.amount.toLocaleString()}</div>
                    <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 7px", borderRadius:"4px", background:o.statusColor+"18", color:o.statusColor }}>{o.status}</span>
                  </div>
                </div>
              ))}
              {!recentOrdersData.length && (
                <div style={{ padding:"14px 16px", fontSize:"11px", color:T.textMuted }}>No recent orders found.</div>
              )}
            </CardWrap>

          </div>
        </div>
      </div>
    </div>
  );
}



