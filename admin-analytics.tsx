import { useEffect, useState, type ReactNode } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import { loadOrderCollection, syncOrderCollectionFromServer } from "./core/order-store";
import AdminSidebar from "./core/admin-sidebar";

type ChartMetric = "revenue" | "profit" | "orders" | "cod";

type TrendPoint = {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
  returns: number;
  cod: number;
};

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)" };

const NAV: [string, string][] = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const fmt = (n: number) => n >= 100000 ? "৳"+(n/100000).toFixed(1)+"L" : n >= 1000 ? "৳"+(n/1000).toFixed(0)+"k" : "৳"+n;

function BarChart({ data, valueKey, color, T, height, formatter }: { data: TrendPoint[]; valueKey: ChartMetric; color: string; T: any; height?: number; formatter?: (v: number) => string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:height||160 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", height:"100%" }}>
            <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%", position:"relative" }}
              title={`${d.month}: ${formatter ? formatter(d[valueKey]) : d[valueKey]}`}>
              <div style={{ width:"100%", height:`${Math.max(pct,2)}%`, background:color, borderRadius:"5px 5px 0 0", transition:"height 0.3s" }}/>
            </div>
            <div style={{ fontSize:"10px", color:T.textMuted, textAlign:"center", whiteSpace:"nowrap" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function DualBarChart({ data, key1, key2, color1, color2, T, height }: { data: TrendPoint[]; key1: Exclude<ChartMetric, "cod"> | "returns"; key2: Exclude<ChartMetric, "cod"> | "returns"; color1: string; color2: string; T: any; height?: number }) {
  const max = Math.max(...data.flatMap(d => [d[key1], d[key2]]), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:height||160 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", height:"100%" }}>
          <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:"2px", width:"100%" }}>
            <div style={{ flex:1, height:`${Math.max(d[key1]/max*100,2)}%`, background:color1, borderRadius:"4px 4px 0 0" }}/>
            <div style={{ flex:1, height:`${Math.max(d[key2]/max*100,2)}%`, background:color2, borderRadius:"4px 4px 0 0" }}/>
          </div>
          <div style={{ fontSize:"10px", color:T.textMuted, textAlign:"center" }}>{d.month}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, delta, color, icon, T }: { label: string; value: ReactNode; sub: string; delta?: number; color: string; icon: string; T: any }) {
  const positive = typeof delta === "number" ? delta > 0 : false;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"14px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
        <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
        <span style={{ fontSize:"18px" }}>{icon}</span>
      </div>
      <div style={{ fontSize:"22px", fontWeight:800, color, marginBottom:"3px", letterSpacing:"-0.5px" }}>{value}</div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        {delta !== undefined && (
          <span style={{ fontSize:"12px", fontWeight:700, color:positive?"#059669":"#DC2626" }}>
            {positive?"▲":"▼"} {Math.abs(delta)}%
          </span>
        )}
        <span style={{ fontSize:"11px", color:T.textMuted }}>{sub}</span>
      </div>
    </div>
  );
}

function CardWrap({ title, sub, action, children, T }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; T: any }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", marginBottom:"16px" }}>
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{title}</div>
          {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding:"16px" }}>{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dark, setDark]       = useState(false);
  const T = dark ? DARK : LIGHT;
  const [period, setPeriod]   = useState<"monthly" | "weekly">("monthly");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("revenue");
  const [quickRange, setQuickRange]   = useState("6m");
  const [dateFrom,   setDateFrom]     = useState("");
  const [dateTo,     setDateTo]       = useState("");
  const [orders, setOrders] = useState<any[]>(() => loadOrderCollection([]) as any[]);
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const synced = await syncOrderCollectionFromServer([]);
      if (cancelled) return;
      setOrders(synced as any[]);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const calcAmount = (order: any) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.reduce((sum: number, item: any) => sum + Number(item?.price || 0) * Number(item?.qty || 0), 0);
  };
  const isReturnLike = (status: string) => {
    const s = String(status || "").toLowerCase();
    return s.includes("return") || s.includes("cancel");
  };

  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: 0,
      profit: 0,
      orders: 0,
      returns: 0,
      cod: 0,
    };
  });
  const monthMap = new Map(monthBuckets.map((m) => [m.key, m]));

  const weekBuckets = Array.from({ length: 4 }, (_, i) => ({
    month: `W${i + 1}`,
    revenue: 0,
    profit: 0,
    orders: 0,
    returns: 0,
    cod: 0,
  }));

  const productMap = new Map<string, { name: string; cat: string; orders: number; revenue: number; profit: number; returnCount: number; topVar: Record<string, number> }>();
  const sourceMap = new Map<string, { name: string; orders: number; revenue: number; color: string; icon: string }>();
  const categoryMap = new Map<string, { name: string; orders: number; revenue: number; profit: number; color: string }>();
  const agentMap = new Map<string, { name: string; avatar: string; color: string; orders: number; revenue: number; delivered: number; cancelled: number; returns: number; avgTime: string }>();

  let insideOrders = 0;
  let outsideOrders = 0;
  let insideRevenue = 0;
  let outsideRevenue = 0;

  orders.forEach((order: any) => {
    const amount = calcAmount(order);
    const date = new Date(String(order?.date || order?.updatedAt || ""));
    const status = String(order?.status || "");
    const isReturn = isReturnLike(status);
    const isCod = String(order?.pay || "").toLowerCase().includes("cod");

    if (!Number.isNaN(date.getTime())) {
      const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const mb = monthMap.get(mKey);
      if (mb) {
        mb.revenue += amount;
        mb.profit += Math.round(amount * 0.3);
        mb.orders += 1;
        mb.returns += isReturn ? 1 : 0;
        mb.cod += isCod ? amount : 0;
      }

      const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 28) {
        const idx = 3 - Math.floor(diffDays / 7);
        if (weekBuckets[idx]) {
          weekBuckets[idx].revenue += amount;
          weekBuckets[idx].profit += Math.round(amount * 0.3);
          weekBuckets[idx].orders += 1;
          weekBuckets[idx].returns += isReturn ? 1 : 0;
          weekBuckets[idx].cod += isCod ? amount : 0;
        }
      }
    }

    const sourceRaw = String(order?.source || "").toLowerCase();
    const sourceMeta =
      sourceRaw === "facebook" ? { name: "Facebook", icon: "📘", color: "#1877F2" } :
      sourceRaw === "instagram" ? { name: "Instagram", icon: "📸", color: "#E1306C" } :
      sourceRaw === "website" ? { name: "Website", icon: "🌐", color: "#6366F1" } :
      sourceRaw === "whatsapp" ? { name: "WhatsApp", icon: "💬", color: "#25D366" } :
      sourceRaw === "phone" ? { name: "Phone", icon: "📞", color: "#64748B" } :
      { name: "Other", icon: "📦", color: "#D97706" };
    const src = sourceMap.get(sourceMeta.name) || { ...sourceMeta, orders: 0, revenue: 0 };
    src.orders += 1;
    src.revenue += amount;
    sourceMap.set(sourceMeta.name, src);

    const agentName = String(order?.agent || "Unassigned");
    const initials = agentName.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase() || "").join("") || "UA";
    const agent = agentMap.get(agentName) || { name: agentName, avatar: initials, color: "#6366F1", orders: 0, revenue: 0, delivered: 0, cancelled: 0, returns: 0, avgTime: "-" };
    agent.orders += 1;
    agent.revenue += amount;
    if (String(status).toLowerCase() === "delivered") agent.delivered += 1;
    if (String(status).toLowerCase().includes("cancel")) agent.cancelled += 1;
    if (isReturn) agent.returns += 1;
    agentMap.set(agentName, agent);

    const area = String(order?.area || order?.deliveryArea || order?.district || "").toLowerCase();
    const isInside = area.includes("dhaka") || area.includes("inside");
    if (isInside) {
      insideOrders += 1;
      insideRevenue += amount;
    } else {
      outsideOrders += 1;
      outsideRevenue += amount;
    }

    const items = Array.isArray(order?.items) ? order.items : [];
    items.forEach((item: any) => {
      const name = String(item?.name || "Unnamed Product");
      const qty = Number(item?.qty || 0);
      const lineRevenue = Number(item?.price || 0) * qty;
      const lc = name.toLowerCase();
      const cat = lc.includes("bag") || lc.includes("tote") || lc.includes("clutch") ? "Bags" : lc.includes("shoe") || lc.includes("sneaker") || lc.includes("heel") || lc.includes("converse") ? "Shoes" : "General";
      const varKey = `${String(item?.size || "")} ${String(item?.color || "")}`.trim() || "-";

      const p = productMap.get(name) || { name, cat, orders: 0, revenue: 0, profit: 0, returnCount: 0, topVar: {} };
      p.orders += qty;
      p.revenue += lineRevenue;
      p.profit += Math.round(lineRevenue * 0.3);
      p.returnCount += isReturn ? 1 : 0;
      p.topVar[varKey] = (p.topVar[varKey] || 0) + qty;
      productMap.set(name, p);

      const color = cat === "Bags" ? "#6366F1" : cat === "Shoes" ? "#D97706" : "#0D9488";
      const c = categoryMap.get(cat) || { name: cat, orders: 0, revenue: 0, profit: 0, color };
      c.orders += qty;
      c.revenue += lineRevenue;
      c.profit += Math.round(lineRevenue * 0.3);
      categoryMap.set(cat, c);
    });
  });

  const MONTHLY: TrendPoint[] = monthBuckets.map((m) => ({ month: m.month, revenue: m.revenue, profit: m.profit, orders: m.orders, returns: m.returns, cod: m.cod }));
  const WEEKLY: TrendPoint[] = weekBuckets;
  const CATEGORY_DATA = Array.from(categoryMap.values());
  const SOURCE_DATA = Array.from(sourceMap.values());
  const AGENT_DATA = Array.from(agentMap.values());
  const DELIVERY_ZONES = [
    { name: "Inside Dhaka", orders: insideOrders, revenue: insideRevenue, pct: 0, color: "#6366F1" },
    { name: "Outside Dhaka", orders: outsideOrders, revenue: outsideRevenue, pct: 0, color: "#D97706" },
  ];
  const zoneTotal = DELIVERY_ZONES.reduce((sum, z) => sum + z.orders, 0) || 1;
  DELIVERY_ZONES.forEach((z) => {
    z.pct = Math.round((z.orders / zoneTotal) * 100);
  });

  const TOP_PRODUCTS = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p, i) => ({
      rank: i + 1,
      name: p.name,
      cat: p.cat,
      img: p.cat === "Shoes" ? "👟" : p.cat === "Bags" ? "👜" : "🛍️",
      bg: p.cat === "Shoes" ? "#1E40AF" : p.cat === "Bags" ? "#92400E" : "#334155",
      orders: p.orders,
      revenue: p.revenue,
      profit: p.profit,
      returnCount: p.returnCount,
      topVar: Object.entries(p.topVar).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
    }));

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
  };

  const applyRange = (range: string) => {
    setQuickRange(range);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2,"0");
    const fmt2 = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const today = fmt2(now);
    if (range==="7d")  { const d=new Date(now);d.setDate(d.getDate()-6);setDateFrom(fmt2(d));setDateTo(today); }
    else if (range==="30d") { const d=new Date(now);d.setDate(d.getDate()-29);setDateFrom(fmt2(d));setDateTo(today); }
    else if (range==="3m")  { const d=new Date(now);d.setMonth(d.getMonth()-3);setDateFrom(fmt2(d));setDateTo(today); }
    else if (range==="6m")  { const d=new Date(now);d.setMonth(d.getMonth()-6);setDateFrom(fmt2(d));setDateTo(today); }
    else if (range==="1y")  { const d=new Date(now);d.setFullYear(d.getFullYear()-1);setDateFrom(fmt2(d));setDateTo(today); }
    else if (range==="custom") { }
  };

  const data = period === "monthly" ? MONTHLY : WEEKLY;
  const totalRevenue  = data.reduce((a,b)=>a+b.revenue,0);
  const totalProfit   = data.reduce((a,b)=>a+b.profit,0);
  const totalOrders   = data.reduce((a,b)=>a+b.orders,0);
  const totalReturns  = data.reduce((a,b)=>a+b.returns,0);
  const totalCOD      = data.reduce((a,b)=>a+b.cod,0);
  const avgOrderVal   = totalOrders > 0 ? Math.round(totalRevenue/totalOrders) : 0;
  const profitMargin  = totalRevenue > 0 ? Math.round(totalProfit/totalRevenue*100) : 0;
  const returnRateNum = totalOrders > 0 ? (totalReturns/totalOrders)*100 : 0;
  const returnRate    = returnRateNum.toFixed(1);
  const totalSrcOrd   = SOURCE_DATA.reduce((a,b)=>a+b.orders,0);
  const totalCatOrd   = CATEGORY_DATA.reduce((a,b)=>a+b.orders,0);
  const maxProdOrders = TOP_PRODUCTS[0]?.orders || 1;

  const STATS = [
    { label:"Total Revenue",   value:fmt(totalRevenue),  sub:"this period",   delta:14,  color:"#6366F1", icon:"💰" },
    { label:"Net Profit",      value:fmt(totalProfit),   sub:`${profitMargin}% margin`,delta:18, color:"#059669", icon:"📈" },
    { label:"Total Orders",    value:totalOrders,         sub:"this period",   delta:8,   color:T.accent,  icon:"🛍️" },
    { label:"COD Collected",   value:fmt(totalCOD),      sub:"from Pathao",   delta:12,  color:"#D97706", icon:"💵" },
    { label:"Avg. Order Value",value:"৳"+avgOrderVal.toLocaleString(), sub:"per order", delta:5, color:"#0D9488", icon:"📊" },
    { label:"Return Rate",     value:returnRate+"%",      sub:`${totalReturns} returned`, delta:-2, color:returnRateNum>5?"#DC2626":"#059669", icon:"↩️" },
  ];

  const metricColor: Record<ChartMetric, string> = { revenue:"#6366F1", profit:"#059669", orders:"#D97706", cod:"#0D9488" };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>
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
        onLogout={handleSignOut}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        <div style={{ background:T.sidebar, borderBottom:`1px solid ${T.border}`, padding:"10px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <div>
              <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>Analytics</div>
              <div style={{ fontSize:"11px", color:T.textMuted }}>Revenue, profit, product and agent performance</div>
            </div>
            <div style={{ display:"flex", gap:"3px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
              {([["monthly","Monthly"],["weekly","Weekly"]] as Array<["monthly" | "weekly", string]>).map(([id,label])=>(
                <button key={id} onClick={()=>setPeriod(id)}
                  style={{ padding:"5px 14px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:period===id?T.accent+"20":"transparent", color:period===id?T.accent:T.textMuted }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:"2px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
              {[["7d","7 Days"],["30d","30 Days"],["3m","3 Months"],["6m","6 Months"],["1y","1 Year"],["custom","Custom"]].map(([id,label])=>(
                <button key={id} onClick={()=>applyRange(id)}
                  style={{ padding:"5px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:quickRange===id?T.accent+"20":"transparent", color:quickRange===id?T.accent:T.textMuted, whiteSpace:"nowrap" }}>
                  {label}
                </button>
              ))}
            </div>
            <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setQuickRange("custom");}}
              style={{ background:T.input, border:`1px solid ${quickRange==="custom"?T.accent:T.border}`, borderRadius:"7px", color:T.text, padding:"6px 10px", fontSize:"12px", outline:"none", fontFamily:"inherit" }}/>
            <span style={{ fontSize:"12px", color:T.textMuted }}>→</span>
            <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setQuickRange("custom");}}
              style={{ background:T.input, border:`1px solid ${quickRange==="custom"?T.accent:T.border}`, borderRadius:"7px", color:T.text, padding:"6px 10px", fontSize:"12px", outline:"none", fontFamily:"inherit" }}/>
            {(dateFrom||dateTo) && (
              <button onClick={()=>{setDateFrom("");setDateTo("");setQuickRange("6m");}}
                style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer" }}>✕ Clear</button>
            )}
            {dateFrom && dateTo && <span style={{ fontSize:"11px", color:T.accent, fontWeight:600 }}>{dateFrom} → {dateTo}</span>}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"10px", marginBottom:"18px" }}>
            {STATS.map((s,i)=><StatCard key={i} {...s} T={T}/>) }
          </div>

          <CardWrap title="Revenue & Profit Trend" sub={`${period==="monthly"?"Last 6 months":"This month by week"}`}
            action={
              <div style={{ display:"flex", gap:"3px", background:T.bg, borderRadius:"7px", padding:"3px", border:`1px solid ${T.border}` }}>
                {([["revenue","Revenue","#6366F1"],["profit","Profit","#059669"],["orders","Orders","#D97706"],["cod","COD","#0D9488"]] as Array<[ChartMetric, string, string]>).map(([id,label,color])=>(
                  <button key={id} onClick={()=>setChartMetric(id)}
                    style={{ padding:"4px 11px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"10px", fontWeight:600, background:chartMetric===id?color+"20":"transparent", color:chartMetric===id?color:T.textMuted }}>
                    {label}
                  </button>
                ))}
              </div>
            } T={T}>
            <BarChart data={data} valueKey={chartMetric} color={metricColor[chartMetric]} T={T} height={180}
              formatter={chartMetric==="orders"?v=>v+" orders":v=>"৳"+v.toLocaleString()}/>
            <div style={{ display:"flex", gap:"20px", marginTop:"14px", paddingTop:"14px", borderTop:`1px solid ${T.border}` }}>
              {([["Revenue",fmt(totalRevenue),"#6366F1"],["Profit",fmt(totalProfit),"#059669"],["Orders",totalOrders+" orders","#D97706"],["COD",fmt(totalCOD),"#0D9488"]] as Array<[string, string, string]>).map(([l,v,c])=>(
                <div key={l}>
                  <div style={{ fontSize:"10px", color:T.textMuted }}>{l}</div>
                  <div style={{ fontSize:"14px", fontWeight:800, color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </CardWrap>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>

            <CardWrap title="Revenue vs Profit" sub="Side by side comparison" T={T}>
              <div style={{ display:"flex", gap:"14px", marginBottom:"12px" }}>
                {[["Revenue","#6366F1"],["Profit","#059669"]].map(([l,c])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"3px", background:c }}/>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{l}</span>
                  </div>
                ))}
              </div>
              <DualBarChart data={data} key1="revenue" key2="profit" color1="#6366F1" color2="#059669" T={T} height={160}/>
            </CardWrap>

            <CardWrap title="Orders vs Returns" sub="Return rate over time" T={T}>
              <div style={{ display:"flex", gap:"14px", marginBottom:"12px" }}>
                {[["Orders","#D97706"],["Returns","#DC2626"]].map(([l,c])=>(
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"3px", background:c }}/>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{l}</span>
                  </div>
                ))}
              </div>
              <DualBarChart data={data} key1="orders" key2="returns" color1="#D97706" color2="#DC2626" T={T} height={160}/>
              <div style={{ marginTop:"10px", padding:"8px 12px", background:T.tHead, borderRadius:"8px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"12px", color:T.textMuted }}>Overall return rate</span>
                <span style={{ fontSize:"13px", fontWeight:800, color:returnRateNum>5?"#DC2626":"#059669" }}>{returnRate}%</span>
              </div>
            </CardWrap>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"16px" }}>

            <CardWrap title="Revenue by Category" T={T}>
              {CATEGORY_DATA.map((c,i)=>{
                const pct = totalCatOrd > 0 ? Math.round(c.orders/totalCatOrd*100) : 0;
                return (
                  <div key={i} style={{ marginBottom:"12px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                      <span style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{c.name}</span>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{fmt(c.revenue)}</span>
                        <span style={{ fontSize:"10px", color:T.textMuted, marginLeft:"5px" }}>({pct}%)</span>
                      </div>
                    </div>
                    <div style={{ height:"7px", background:T.border, borderRadius:"7px" }}>
                      <div style={{ height:"7px", width:`${pct}%`, background:c.color, borderRadius:"7px" }}/>
                    </div>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"3px" }}>{c.orders} orders · ৳{c.profit.toLocaleString()} profit</div>
                  </div>
                );
              })}
            </CardWrap>

            <CardWrap title="Orders by Source" T={T}>
              {SOURCE_DATA.map((s,i)=>{
                const pct = totalSrcOrd > 0 ? Math.round(s.orders/totalSrcOrd*100) : 0;
                return (
                  <div key={i} style={{ marginBottom:"11px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                        <span style={{ fontSize:"14px" }}>{s.icon}</span>
                        <span style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{s.orders} <span style={{ fontSize:"10px", color:T.textMuted }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height:"5px", background:T.border, borderRadius:"5px" }}>
                      <div style={{ height:"5px", width:`${pct}%`, background:s.color, borderRadius:"5px" }}/>
                    </div>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px" }}>{fmt(s.revenue)}</div>
                  </div>
                );
              })}
            </CardWrap>

            <CardWrap title="Delivery Zones" T={T}>
              {DELIVERY_ZONES.map((z,i)=>(
                <div key={i} style={{ marginBottom:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                    <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{z.name}</span>
                    <span style={{ fontSize:"13px", fontWeight:800, color:z.color }}>{z.pct}%</span>
                  </div>
                  <div style={{ height:"10px", background:T.border, borderRadius:"10px" }}>
                    <div style={{ height:"10px", width:`${z.pct}%`, background:z.color, borderRadius:"10px" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"5px" }}>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{z.orders} orders</span>
                    <span style={{ fontSize:"11px", color:T.textMuted }}>{fmt(z.revenue)}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:"6px", padding:"10px 12px", background:T.tHead, borderRadius:"8px" }}>
                <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"4px" }}>Delivery charge collected</div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"12px", color:T.textMuted }}>Inside (৳80 × {DELIVERY_ZONES[0]?.orders || 0})</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{(80*(DELIVERY_ZONES[0]?.orders || 0)).toLocaleString()}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"3px" }}>
                  <span style={{ fontSize:"12px", color:T.textMuted }}>Outside (৳150 × {DELIVERY_ZONES[1]?.orders || 0})</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{(150*(DELIVERY_ZONES[1]?.orders || 0)).toLocaleString()}</span>
                </div>
              </div>
            </CardWrap>
          </div>

          <CardWrap title="🏆 Top Products by Revenue" sub="All time" T={T}>
            <div style={{ overflowX:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"44px 1fr 90px 100px 100px 100px 100px 110px", padding:"8px 12px", background:T.tHead, borderRadius:"8px", marginBottom:"4px" }}>
                {["","Product","Category","Orders","Revenue","Profit","Return","Top Variant"].map((h,i)=>(
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</div>
                ))}
              </div>
              {TOP_PRODUCTS.map((p,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"44px 1fr 90px 100px 100px 100px 100px 110px", padding:"10px 12px", borderBottom:i<TOP_PRODUCTS.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.tHead}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ fontSize:"14px", textAlign:"center" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":p.rank}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"7px", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{p.img}</div>
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{p.name}</div>
                      <div style={{ width:"80px", height:"3px", background:T.border, borderRadius:"3px", marginTop:"4px" }}>
                        <div style={{ height:"3px", width:`${Math.round(p.orders/maxProdOrders*100)}%`, background:T.accent, borderRadius:"3px" }}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:"11px", color:T.textMuted }}>{p.cat}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:T.accent }}>{p.orders}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>৳{p.revenue.toLocaleString()}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#059669" }}>৳{p.profit.toLocaleString()}</div>
                  <div style={{ fontSize:"12px", color:p.returnCount>0?"#DC2626":T.textMuted, fontWeight:p.returnCount>0?600:400 }}>{p.returnCount > 0 ? `⚠ ${p.returnCount}` : "—"}</div>
                  <div style={{ fontSize:"11px", color:T.textMuted, background:T.tHead, borderRadius:"5px", padding:"2px 7px", display:"inline-block" }}>{p.topVar}</div>
                </div>
              ))}
            </div>
          </CardWrap>

          <CardWrap title="Agent Performance" sub="Order handling and revenue contribution" T={T}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
              {AGENT_DATA.map((a,i)=>{
                const totalAgentOrders = AGENT_DATA.reduce((x,b)=>x+b.orders,0);
                const pct = totalAgentOrders > 0 ? Math.round(a.orders/totalAgentOrders*100) : 0;
                return (
                  <div key={i} style={{ background:T.bg, borderRadius:"10px", padding:"14px", border:`1px solid ${T.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:a.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"14px", fontWeight:700 }}>{a.avatar}</div>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{a.name}</div>
                        <div style={{ fontSize:"10px", color:T.textMuted }}>Avg response: {a.avgTime}</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"10px" }}>
                      {([["Orders",a.orders,T.accent],["Revenue",fmt(a.revenue),"#059669"],["Delivered",a.delivered,"#059669"],["Returns",a.returns,"#DC2626"]] as Array<[string, ReactNode, string]>).map(([l,v,c])=>(
                        <div key={l} style={{ background:T.surface, borderRadius:"7px", padding:"7px 9px" }}>
                          <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:600, textTransform:"uppercase", marginBottom:"2px" }}>{l}</div>
                          <div style={{ fontSize:"14px", fontWeight:800, color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"4px" }}>Share of total orders: {pct}%</div>
                    <div style={{ height:"5px", background:T.border, borderRadius:"5px" }}>
                      <div style={{ height:"5px", width:`${pct}%`, background:a.color, borderRadius:"5px" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardWrap>

        </div>
      </div>
    </div>
  );
}










