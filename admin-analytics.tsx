import { useState, type ReactNode } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
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

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const MONTHLY: TrendPoint[] = [
  { month:"Nov", revenue:38400, profit:16200, orders:16, returns:1, cod:34200 },
  { month:"Dec", revenue:52100, profit:22400, orders:22, returns:2, cod:46800 },
  { month:"Jan", revenue:44800, profit:19100, orders:19, returns:1, cod:40200 },
  { month:"Feb", revenue:61200, profit:26800, orders:26, returns:3, cod:55100 },
  { month:"Mar", revenue:58700, profit:25200, orders:24, returns:2, cod:52900 },
  { month:"Apr", revenue:78500, profit:34600, orders:32, returns:2, cod:70600 },
];

const WEEKLY: TrendPoint[] = [
  { month:"Apr W1", revenue:16200, profit:7100, orders:7,  returns:0, cod:14600 },
  { month:"Apr W2", revenue:19400, profit:8500, orders:8,  returns:1, cod:17400 },
  { month:"Apr W3", revenue:22100, profit:9700, orders:9,  returns:1, cod:19800 },
  { month:"Apr W4", revenue:20800, profit:9300, orders:8,  returns:0, cod:18800 },
];

const TOP_PRODUCTS = [
  { rank:1, name:"Leather Tote Bag",     cat:"Bags",        img:"🛍️", bg:"#92400E", orders:24, revenue:60000, profit:33600, returnCount:0, topVar:"M-Black" },
  { rank:2, name:"High Ankle Converse",  cat:"Shoes",       img:"👟", bg:"#1E40AF", orders:19, revenue:60800, profit:34200, returnCount:1, topVar:"38-White" },
  { rank:3, name:"Quilted Shoulder Bag", cat:"Bags",        img:"👜", bg:"#9D174D", orders:16, revenue:56000, profit:32000, returnCount:0, topVar:"M-Pink" },
  { rank:4, name:"Platform Sneakers",    cat:"Shoes",       img:"👠", bg:"#7C3AED", orders:14, revenue:53200, profit:28000, returnCount:2, topVar:"37-Black" },
  { rank:5, name:"Canvas Backpack",      cat:"Bags",        img:"🎒", bg:"#065F46", orders:12, revenue:28800, profit:18000, returnCount:0, topVar:"L-Olive" },
  { rank:6, name:"Silver Bracelet",      cat:"Accessories", img:"📿", bg:"#6B21A8", orders:11, revenue:19800, profit:13200, returnCount:0, topVar:"Free-Silver" },
  { rank:7, name:"Ankle Strap Heels",    cat:"Shoes",       img:"🥿", bg:"#B45309", orders:9,  revenue:25200, profit:14400, returnCount:1, topVar:"37-Black" },
  { rank:8, name:"Embroidered Clutch",   cat:"Bags",        img:"👝", bg:"#B91C1C", orders:7,  revenue:15400, profit:9800,  returnCount:0, topVar:"Free-Red" },
];

const CATEGORY_DATA = [
  { name:"Bags",        orders:59, revenue:160000, profit:93600, color:"#6366F1" },
  { name:"Shoes",       orders:42, revenue:139200, profit:76400, color:"#D97706" },
  { name:"Accessories", orders:22, revenue:39600,  profit:26400, color:"#059669" },
  { name:"Clothing",    orders:8,  revenue:16800,  profit:9600,  color:"#A855F7" },
];

const SOURCE_DATA = [
  { name:"Facebook",  orders:32, revenue:78600,  color:"#1877F2", icon:"📘" },
  { name:"Instagram", orders:28, revenue:68200,  color:"#E1306C", icon:"📸" },
  { name:"Website",   orders:18, revenue:44100,  color:"#6366F1", icon:"🌐" },
  { name:"WhatsApp",  orders:12, revenue:29300,  color:"#25D366", icon:"💬" },
  { name:"Phone",     orders:4,  revenue:9800,   color:"#64748B", icon:"📞" },
  { name:"Walk-in",   orders:2,  revenue:4100,   color:"#D97706", icon:"🏪" },
];

const AGENT_DATA = [
  { name:"Istiak (Admin)", avatar:"IS", color:"#6366F1", orders:30, revenue:74200, delivered:24, cancelled:1, returns:1, avgTime:"0.9d" },
  { name:"Mitu",           avatar:"MA", color:"#D97706", orders:34, revenue:82700, delivered:28, cancelled:2, returns:2, avgTime:"1.0d" },
  { name:"Rafi",           avatar:"RA", color:"#059669", orders:28, revenue:68400, delivered:22, cancelled:1, returns:1, avgTime:"1.2d" },
];

const DELIVERY_ZONES = [
  { name:"Inside Dhaka",  orders:62, revenue:148400, pct:66, color:"#6366F1" },
  { name:"Outside Dhaka", orders:32, revenue:85600,  pct:34, color:"#D97706" },
];

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
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";

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
  const maxProdOrders = TOP_PRODUCTS[0].orders;

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
                const pct = Math.round(c.orders/totalCatOrd*100);
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
                const pct = Math.round(s.orders/totalSrcOrd*100);
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
                  <span style={{ fontSize:"12px", color:T.textMuted }}>Inside (৳80 × {DELIVERY_ZONES[0].orders})</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{(80*DELIVERY_ZONES[0].orders).toLocaleString()}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"3px" }}>
                  <span style={{ fontSize:"12px", color:T.textMuted }}>Outside (৳150 × {DELIVERY_ZONES[1].orders})</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{(150*DELIVERY_ZONES[1].orders).toLocaleString()}</span>
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
                const pct = Math.round(a.orders/totalAgentOrders*100);
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










