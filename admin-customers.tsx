import { useEffect, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";
import { loadAppState, saveAppState } from "./core/app-state-client";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];
const AGENT_NAV = [["▦","Dashboard"],["≡","Orders"],["⬡","Products"],["◉","Customers"],["+","New Order"],["👤","Profile"]];

const SRC_ICON = { facebook:"📘", instagram:"📸", whatsapp:"💬", phone:"📞", website:"🌐", "walk-in":"🏪" };
const SRC_COLOR = { facebook:"#1877F2", instagram:"#E1306C", whatsapp:"#25D366", phone:"#64748B", website:"#6366F1", "walk-in":"#D97706" };

type Theme = typeof DARK;
type SourceKey = keyof typeof SRC_ICON;

type CustomerOrder = {
  num: string;
  date: string;
  status: string;
  amount: number;
  type: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  firstSrc: SourceKey;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  codCollected: number;
  advancePaid: number;
  returnCount: number;
  lastOrderAt: string;
  lastOrderNum: string;
  fraud: boolean;
  blacklisted: boolean;
  note: string;
  tags: string[];
  orders: CustomerOrder[];
};

const INIT_CUSTOMERS: Customer[] = [
  {
    id:"c1", name:"Fatima Akter",     phone:"01711111111", area:"Dhaka / Dhanmondi",
    firstSrc:"facebook", joinedAt:"12 Jan 2025",
    totalOrders:8, totalSpent:22400, codCollected:18600, advancePaid:3800, returnCount:0,
    lastOrderAt:"17 Apr 2025", lastOrderNum:"#1001",
    fraud:false, blacklisted:false,
    note:"Repeat customer. Always pays on time. Prefers afternoon delivery.",
    tags:["VIP","Repeat"],
    orders:[
      { num:"#1001", date:"17 Apr", status:"Shipped",   amount:2580, type:"stock" },
      { num:"#0988", date:"2 Apr",  status:"Delivered", amount:3500, type:"stock" },
      { num:"#0951", date:"15 Mar", status:"Delivered", amount:1900, type:"stock" },
      { num:"#0912", date:"28 Feb", status:"Delivered", amount:2200, type:"preorder" },
      { num:"#0878", date:"10 Feb", status:"Delivered", amount:3500, type:"stock" },
    ],
  },
  {
    id:"c2", name:"Rahela Khanam",    phone:"01722222222", area:"Dhaka / Uttara",
    firstSrc:"instagram", joinedAt:"3 Feb 2025",
    totalOrders:5, totalSpent:14800, codCollected:10000, advancePaid:4800, returnCount:1,
    lastOrderAt:"14 Apr 2025", lastOrderNum:"#1002",
    fraud:false, blacklisted:false,
    note:"Returned one item — sizing issue. Handle carefully.",
    tags:["Regular"],
    orders:[
      { num:"#1002", date:"14 Apr", status:"Ordered Supplier", amount:3200, type:"preorder" },
      { num:"#0963", date:"19 Mar", status:"Delivered",        amount:2800, type:"stock" },
      { num:"#0930", date:"5 Mar",  status:"Returned",         amount:3200, type:"preorder" },
      { num:"#0890", date:"14 Feb", status:"Delivered",        amount:2800, type:"stock" },
      { num:"#0855", date:"28 Jan", status:"Delivered",        amount:2800, type:"stock" },
    ],
  },
  {
    id:"c3", name:"Sabrina Islam",    phone:"01633333333", area:"Sylhet / Zindabazar",
    firstSrc:"facebook", joinedAt:"10 Mar 2025",
    totalOrders:3, totalSpent:7200, codCollected:5500, advancePaid:1700, returnCount:0,
    lastOrderAt:"10 Apr 2025", lastOrderNum:"#1004",
    fraud:false, blacklisted:false,
    note:"Order #1004 delayed. Customer complained. Needs priority handling.",
    tags:["Issue"],
    orders:[
      { num:"#1004", date:"10 Apr", status:"Delayed",   amount:2450, type:"preorder" },
      { num:"#0940", date:"10 Mar", status:"Delivered", amount:2450, type:"stock" },
      { num:"#0905", date:"22 Feb", status:"Delivered", amount:2300, type:"stock" },
    ],
  },
  {
    id:"c4", name:"Mithila Rahman",   phone:"01544444444", area:"Dhaka / Mirpur",
    firstSrc:"whatsapp", joinedAt:"9 Jan 2025",
    totalOrders:12, totalSpent:39600, codCollected:39600, advancePaid:0, returnCount:0,
    lastOrderAt:"9 Apr 2025", lastOrderNum:"#1005",
    fraud:false, blacklisted:false,
    note:"Best customer. Only does COD. Never pre-orders.",
    tags:["VIP","Top Spender"],
    orders:[
      { num:"#1005", date:"9 Apr",  status:"Delivered", amount:3380, type:"stock" },
      { num:"#0975", date:"25 Mar", status:"Delivered", amount:3500, type:"stock" },
      { num:"#0944", date:"12 Mar", status:"Delivered", amount:2800, type:"stock" },
      { num:"#0911", date:"27 Feb", status:"Delivered", amount:3500, type:"stock" },
      { num:"#0880", date:"12 Feb", status:"Delivered", amount:3500, type:"stock" },
    ],
  },
  {
    id:"c5", name:"Taslima Begum",    phone:"01355555555", area:"Dhaka / Banani",
    firstSrc:"instagram", joinedAt:"1 Apr 2025",
    totalOrders:2, totalSpent:4400, codCollected:0, advancePaid:1400, returnCount:0,
    lastOrderAt:"17 Apr 2025", lastOrderNum:"#1006",
    fraud:true, blacklisted:false,
    note:"Suspected fake TxID on order #1006. Pending verification. Monitor closely.",
    tags:["High Risk"],
    orders:[
      { num:"#1006", date:"17 Apr", status:"Pend. Verify", amount:2200, type:"preorder" },
      { num:"#0998", date:"5 Apr",  status:"Delivered",    amount:2200, type:"stock" },
    ],
  },
  {
    id:"c6", name:"Parvin Sultana",   phone:"01566666666", area:"Chittagong / Nasirabad",
    firstSrc:"website", joinedAt:"20 Feb 2025",
    totalOrders:6, totalSpent:17400, codCollected:17400, advancePaid:0, returnCount:2,
    lastOrderAt:"3 Apr 2025", lastOrderNum:"#0999",
    fraud:false, blacklisted:false,
    note:"2 returns — both were wrong size. Advise to check size chart.",
    tags:["Regular"],
    orders:[
      { num:"#0999", date:"3 Apr",  status:"Delivered", amount:3800, type:"stock" },
      { num:"#0961", date:"18 Mar", status:"Returned",  amount:3200, type:"stock" },
      { num:"#0928", date:"4 Mar",  status:"Delivered", amount:2800, type:"stock" },
      { num:"#0897", date:"17 Feb", status:"Returned",  amount:2800, type:"stock" },
      { num:"#0861", date:"2 Feb",  status:"Delivered", amount:2400, type:"stock" },
      { num:"#0830", date:"20 Jan", status:"Delivered", amount:2400, type:"stock" },
    ],
  },
  {
    id:"c7", name:"Kohinoor Begum",   phone:"01677777777", area:"Gazipur / Tongi",
    firstSrc:"facebook", joinedAt:"5 Mar 2025",
    totalOrders:4, totalSpent:19400, codCollected:10000, advancePaid:9400, returnCount:0,
    lastOrderAt:"12 Apr 2025", lastOrderNum:"#1010",
    fraud:false, blacklisted:false,
    note:"Mostly pre-orders. Always pays advance promptly.",
    tags:["Pre-Order Regular"],
    orders:[
      { num:"#1010", date:"12 Apr", status:"Ordered Supplier", amount:9400, type:"preorder" },
      { num:"#0955", date:"15 Mar", status:"Delivered",        amount:3500, type:"stock" },
      { num:"#0920", date:"2 Mar",  status:"Delivered",        amount:3500, type:"preorder" },
      { num:"#0885", date:"14 Feb", status:"Delivered",        amount:3000, type:"preorder" },
    ],
  },
  {
    id:"c8", name:"Dilruba Hossain",  phone:"01488888888", area:"Dhaka / Gulshan",
    firstSrc:"instagram", joinedAt:"15 Apr 2025",
    totalOrders:1, totalSpent:3500, codCollected:0, advancePaid:0, returnCount:0,
    lastOrderAt:"16 Apr 2025", lastOrderNum:"#1014",
    fraud:false, blacklisted:false,
    note:"New customer.",
    tags:["New"],
    orders:[
      { num:"#1014", date:"16 Apr", status:"Confirmed", amount:3500, type:"stock" },
    ],
  },
  {
    id:"c9", name:"Nasreen Akter",    phone:"01499999999", area:"Dhaka / Badda",
    firstSrc:"whatsapp", joinedAt:"8 Apr 2025",
    totalOrders:2, totalSpent:7000, codCollected:0, advancePaid:800, returnCount:0,
    lastOrderAt:"14 Apr 2025", lastOrderNum:"#1012",
    fraud:false, blacklisted:true,
    note:"Blacklisted — received order, denied delivery, filed chargeback.",
    tags:["Blacklisted"],
    orders:[
      { num:"#1012", date:"14 Apr", status:"Advance Paid", amount:3200, type:"preorder" },
      { num:"#0990", date:"8 Apr",  status:"Delivered",    amount:3800, type:"stock" },
    ],
  },
  {
    id:"c10",name:"Ruma Islam",       phone:"01500000000", area:"Dhaka / Bashundhara",
    firstSrc:"instagram", joinedAt:"17 Apr 2025",
    totalOrders:1, totalSpent:2200, codCollected:0, advancePaid:800, returnCount:0,
    lastOrderAt:"17 Apr 2025", lastOrderNum:"#1015",
    fraud:false, blacklisted:false,
    note:"",
    tags:["New"],
    orders:[
      { num:"#1015", date:"17 Apr", status:"Pend. Verify", amount:2200, type:"preorder" },
    ],
  },
];

const TAG_META: Record<string, { bg: string; color: string; icon: string }> = {
  "VIP":               { bg:"#F59E0B15", color:"#D97706", icon:"★" },
  "Top Spender":       { bg:"#EF444415", color:"#DC2626", icon:"▲" },
  "Repeat":            { bg:"#10B98115", color:"#059669", icon:"↻" },
  "Regular":           { bg:"#6366F115", color:"#6366F1", icon:"•" },
  "New":               { bg:"#0D948815", color:"#0D9488", icon:"✦" },
  "Pre-Order Regular": { bg:"#A855F715", color:"#A855F7", icon:"⏳" },
  "High Risk":         { bg:"#EF444415", color:"#DC2626", icon:"⚠" },
  "Issue":             { bg:"#F59E0B20", color:"#D97706", icon:"!" },
  "Blacklisted":       { bg:"#64748B20", color:"#64748B", icon:"⛔" },
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  "Delivered":"#059669","Shipped":"#2563EB","Confirmed":"#059669","Advance Paid":"#6366F1",
  "Ordered Supplier":"#D97706","Delayed":"#DC2626","Pend. Verify":"#D97706",
  "Returned":"#DC2626","Cancelled":"#64748B",
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SL({ c, T }: { c: string; T: Theme }) {
  return <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px" }}>{c}</div>;
}

function Tag({ label }: { label: string }) {
  const meta = TAG_META[label] || { bg:"#64748B15", color:"#64748B", icon:"•" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"4px", background:meta.bg, color:meta.color }}>
      <span style={{ fontSize:"9px", lineHeight:1 }}>{meta.icon}</span>
      <span>{label}</span>
    </span>
  );
}

function StatMini({ label, value, color, T }: { label: string; value: string | number; color: string; T: Theme }) {
  return (
    <div style={{ background:T.bg, borderRadius:"9px", padding:"10px 12px" }}>
      <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"4px" }}>{label}</div>
      <div style={{ fontSize:"16px", fontWeight:800, color }}>{value}</div>
    </div>
  );
}

function Avatar({ name, size }: { name: string; size?: number; T?: Theme }) {
  const initials = name.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase();
  const colors = ["#6366F1","#0D9488","#D97706","#059669","#A855F7","#1877F2","#DC2626"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  const sz = size || 36;
  return (
    <div style={{ width:sz, height:sz, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:sz*0.36, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}

// ── CUSTOMER PROFILE PANEL ────────────────────────────────────────────────
function ProfilePanel({ customer, onClose, onUpdate, T }: { customer: Customer; onClose: () => void; onUpdate: (updated: Customer) => void; T: Theme }) {
  const [note,        setNote]        = useState(customer.note);
  const [blacklisted, setBlacklisted] = useState(customer.blacklisted);
  const [fraud,       setFraud]       = useState(customer.fraud);
  const [saved,       setSaved]       = useState(false);

  const save = () => {
    onUpdate({ ...customer, note, blacklisted, fraud });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const IS: CSSProperties = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:"70px" };

  const toggles: Array<[string, boolean, Dispatch<SetStateAction<boolean>>, string, string]> = [
    ["⚠️ Mark as Fraud / High Risk", fraud, setFraud, "#DC2626", "Account will be flagged — orders require extra verification"],
    ["🚫 Blacklist Customer", blacklisted, setBlacklisted, "#64748B", "Blacklisted customers cannot place new orders"],
  ];

  return (
    <div style={{ width:"400px", background:T.sidebar, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Customer Profile</span>
        <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer", fontSize:"12px" }}>✕</button>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"18px" }}>

        {/* Identity */}
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
          <Avatar name={customer.name} size={52} T={T}/>
          <div>
            <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"3px" }}>{customer.name}</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"5px" }}>📞 {customer.phone}</div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {customer.tags.map(t => <Tag key={t} label={t}/>)}
            </div>
          </div>
        </div>

        {/* Info row */}
        <div style={{ background:T.bg, borderRadius:"10px", padding:"12px 14px", marginBottom:"14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            {[
              ["📍 Area",       customer.area],
              ["📅 Joined",     customer.joinedAt],
              ["🛍️ Last Order", customer.lastOrderNum + " · " + customer.lastOrderAt],
              ["📣 First Source", (SRC_ICON[customer.firstSrc]||"") + " " + customer.firstSrc.charAt(0).toUpperCase() + customer.firstSrc.slice(1)],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"2px" }}>{label}</div>
                <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px", marginBottom:"14px" }}>
          <StatMini label="Total Orders"   value={customer.totalOrders}                       color={T.accent}  T={T}/>
          <StatMini label="Total Spent"    value={"৳"+customer.totalSpent.toLocaleString()}   color="#059669"   T={T}/>
          <StatMini label="COD Collected"  value={"৳"+customer.codCollected.toLocaleString()} color="#0D9488"   T={T}/>
          <StatMini label="Advance Paid"   value={"৳"+customer.advancePaid.toLocaleString()}  color="#6366F1"   T={T}/>
          <StatMini label="Return Count"   value={customer.returnCount}                        color={customer.returnCount>0?"#DC2626":T.textMid} T={T}/>
          <StatMini label="Avg. Order"     value={"৳"+(customer.totalOrders>0?Math.round(customer.totalSpent/customer.totalOrders).toLocaleString():0)} color="#D97706" T={T}/>
        </div>

        {/* Flags */}
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
          {toggles.map(([label, val, set, color, sub]) => (
            <label key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"10px 12px", background:val?color+"10":T.bg, borderRadius:"8px", border:`1px solid ${val?color+"30":T.border}` }}>
              <div>
                <div style={{ fontSize:"12px", fontWeight:600, color:val?color:T.text }}>{label}</div>
                <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>{sub}</div>
              </div>
              <div onClick={() => set((p: boolean) => !p)}
                style={{ width:"38px", height:"22px", borderRadius:"22px", background:val?color:"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:val?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
              </div>
            </label>
          ))}
        </div>

        {/* Note */}
        <div style={{ marginBottom:"14px" }}>
          <SL c="Internal Note (team only)" T={T}/>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add notes about this customer..." style={IS}/>
        </div>

        {/* Save */}
        <button onClick={save}
          style={{ width:"100%", background:saved?"#059669":T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px", fontSize:"13px", fontWeight:700, cursor:"pointer", marginBottom:"18px", transition:"background 0.2s" }}>
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>

        {/* Order history */}
        <div>
          <SL c="Order History" T={T}/>
          <div style={{ background:T.bg, borderRadius:"10px", overflow:"hidden", border:`1px solid ${T.border}` }}>
            {customer.orders.map((o: CustomerOrder, i: number) => {
              const sc = ORDER_STATUS_COLOR[o.status] || "#64748B";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 13px", borderBottom:i<customer.orders.length-1?`1px solid ${T.border}`:"none" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                      <span style={{ fontSize:"12px", fontWeight:700, color:T.accent }}>{o.num}</span>
                      <span style={{ fontSize:"9px", fontWeight:600, padding:"1px 5px", borderRadius:"3px", background:o.type==="preorder"?"#F59E0B15":"#10B98115", color:o.type==="preorder"?"#D97706":"#059669" }}>
                        {o.type==="preorder"?"Pre-Order":"Stock"}
                      </span>
                    </div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{o.date}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:T.text, marginBottom:"3px" }}>৳{o.amount.toLocaleString()}</div>
                    <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"3px", background:sc+"18", color:sc }}>{o.status}</span>
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

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [dark, setDark]               = useState(false);
  const T = dark ? DARK : LIGHT;
  const sessionUser = loadSession()?.user;
  const isAgent = sessionUser?.role === "agent";
  const navItems = isAgent ? AGENT_NAV : NAV;
  const userName = sessionUser?.name || "Admin";
  const userRole = isAgent ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [customersReady, setCustomersReady] = useState(false);
  const [selected,  setSelected]      = useState<Customer | null>(null);
  const [search,    setSearch]        = useState("");
  const [filter,    setFilter]        = useState("all");
  const [sortBy,    setSortBy]        = useState("totalSpent");

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
    window.dispatchEvent(new Event("hashchange"));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadAppState<Customer[]>("customers.list", []);
      if (!mounted) {
        return;
      }
      setCustomers(Array.isArray(loaded) ? loaded : []);
      setCustomersReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!customersReady) {
      return;
    }
    void saveAppState("customers.list", customers);
  }, [customers, customersReady]);

  const filtered = customers
    .filter(c => {
      if (filter === "blacklisted" && !c.blacklisted) return false;
      if (filter === "fraud"       && !c.fraud)        return false;
      if (filter === "vip"         && !c.tags.includes("VIP")) return false;
      if (filter === "new"         && !c.tags.includes("New")) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.area.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "totalSpent")  return b.totalSpent  - a.totalSpent;
      if (sortBy === "totalOrders") return b.totalOrders - a.totalOrders;
      if (sortBy === "name")        return a.name.localeCompare(b.name);
      if (sortBy === "lastOrder")   return b.lastOrderAt.localeCompare(a.lastOrderAt);
      return 0;
    });

  const handleUpdate = (updated: Customer) => {
    setCustomers(p => p.map(c => c.id === updated.id ? updated : c));
    setSelected(updated);
  };

  const stats: Array<[string, string | number, string]> = [
    ["Total Customers", customers.length,                                           "#6366F1"],
    ["VIP",            customers.filter(c => c.tags.includes("VIP")).length,       "#D97706"],
    ["New (7 days)",   customers.filter(c => c.tags.includes("New")).length,       "#0D9488"],
    ["High Risk",      customers.filter(c => c.fraud).length,                      "#DC2626"],
    ["Blacklisted",    customers.filter(c => c.blacklisted).length,                "#64748B"],
    ["Total Revenue",  "৳"+customers.reduce((a,b)=>a+b.totalSpent,0).toLocaleString(), "#059669"],
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>

      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={navItems}
        user={{
          name: userName,
          role: userRole,
          avatar: userAvatar,
          color: userColor,
        }}
        badgeByLabel={{ Customers: { text: String(customers.length) } }}
        onLogout={handleSignOut}
      />

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:"10px", flexShrink:0 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"12px" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone or area..."
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 10px 7px 30px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
          </div>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", color:T.textMid, padding:"7px 11px", fontSize:"12px", outline:"none", cursor:"pointer" }}>
            <option value="totalSpent">Sort: Total Spent</option>
            <option value="totalOrders">Sort: Total Orders</option>
            <option value="lastOrder">Sort: Last Order</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
        </div>

        {/* Content area with optional side panel */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>

            {/* Title */}
            <div style={{ marginBottom:"14px" }}>
              <h1 style={{ margin:0, fontSize:"16px", fontWeight:800, color:T.text }}>Customers</h1>
              <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>View profiles, order history, and manage customer flags</div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"8px", marginBottom:"14px" }}>
              {stats.map(([label, val, color], i) => (
                <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"11px 12px" }}>
                  <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"5px" }}>{label}</div>
                  <div style={{ fontSize:"18px", fontWeight:800, color }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center" }}>
              <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
                {[["all","All"],["vip","VIP"],["new","New"],["fraud","High Risk"],["blacklisted","Blacklisted"]].map(([id, label]) => (
                  <button key={id} onClick={() => setFilter(id)}
                    style={{ padding:"5px 12px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:filter===id?T.accent+"18":"transparent", color:filter===id?T.accent:T.textMuted }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft:"auto", fontSize:"11px", color:T.textMuted }}>Showing {filtered.length} of {customers.length}</div>
            </div>

            {/* Table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"44px minmax(240px,1.25fr) 120px 80px 100px 120px 130px minmax(180px,1fr)", padding:"9px 14px", borderBottom:`1px solid ${T.border}`, background:T.tHead }}>
                {["","Customer","Phone","Orders","Spent","COD Collected","Last Order","Tags"].map((h, i) => (
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
                ))}
              </div>

              {filtered.map((c, i) => (
                <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  style={{ display:"grid", gridTemplateColumns:"44px minmax(240px,1.25fr) 120px 80px 100px 120px 130px minmax(180px,1fr)", padding:"11px 14px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center", background:selected?.id===c.id?T.accent+"08":"transparent", transition:"background 0.1s" }}
                  onMouseEnter={e => { if(selected?.id!==c.id) e.currentTarget.style.background = T.rowHover; }}
                  onMouseLeave={e => { if(selected?.id!==c.id) e.currentTarget.style.background = "transparent"; }}>

                  <Avatar name={c.name} size={32} T={T}/>

                  <div style={{ paddingLeft:"10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"2px" }}>
                      <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{c.name}</span>
                      {c.fraud       && <span style={{ fontSize:"9px", fontWeight:700, background:"#EF444415", color:"#DC2626", padding:"1px 5px", borderRadius:"3px" }}>⚠ RISK</span>}
                      {c.blacklisted && <span style={{ fontSize:"9px", fontWeight:700, background:"#64748B20", color:"#64748B", padding:"1px 5px", borderRadius:"3px" }}>BLOCKED</span>}
                    </div>
                    <div style={{ fontSize:"11px", color:T.textMuted }}>
                      <span style={{ marginRight:"6px" }}>{SRC_ICON[c.firstSrc]}</span>{c.area}
                    </div>
                  </div>

                  <div style={{ fontSize:"12px", color:T.textMid, fontFamily:"monospace" }}>{c.phone}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:T.accent }}>{c.totalOrders}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#059669" }}>৳{c.totalSpent.toLocaleString()}</div>
                  <div style={{ fontSize:"12px", color:T.textMid }}>৳{c.codCollected.toLocaleString()}</div>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{c.lastOrderNum}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{c.lastOrderAt}</div>
                  </div>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {c.tags.slice(0,2).map(t => <Tag key={t} label={t}/>)}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ padding:"36px", textAlign:"center", color:T.textMuted, fontSize:"12px" }}>No customers match your search.</div>
              )}
            </div>
          </div>

          {/* PROFILE PANEL */}
          {selected && (
            <ProfilePanel
              key={selected.id}
              customer={selected}
              onClose={() => setSelected(null)}
              onUpdate={handleUpdate}
              T={T}
            />
          )}
        </div>
      </div>
    </div>
  );
}


