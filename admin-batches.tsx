import { useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import { createBatch, listAvailableOrders, listBatches, selectBatch } from "./core/batch-store";
import type { BatchOrder, BatchRecord, CreateBatchPayload } from "./core/batch-store";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const calcBatch = (orderIds: string[], allOrders: BatchOrder[]) => {
  const orders = allOrders.filter(o => orderIds.includes(o.id));
  let totalBuy = 0, totalSell = 0;
  orders.forEach(o => o.items.forEach(it => {
    totalBuy  += it.buyPrice  * it.qty;
    totalSell += it.sellPrice * it.qty;
  }));
  return { totalBuy, totalSell, profit: totalSell - totalBuy, orderCount: orders.length };
};

// ── HELPERS ───────────────────────────────────────────────────
function Sidebar({ dark, setDark, nav, setNav, T, userName, userRole, userAvatar, userColor }: { dark: boolean; setDark: Dispatch<SetStateAction<boolean>>; nav: number; setNav: Dispatch<SetStateAction<number>>; T: any; userName: string; userRole: string; userAvatar: string; userColor: string }) {
  return (
    <div style={{ width:"236px", background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"18px 15px 13px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:"17px", fontWeight:800, color:T.accent, letterSpacing:"0.2px" }}>ShopAdmin</div>
        <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px", fontWeight:600 }}>LADIES FASHION BD</div>
      </div>
      <div style={{ padding:"10px 8px", flex:1 }}>
        {NAV.map(([icon, label], i) => (
          <button key={i} onClick={() => { setNav(i); navigateByAdminNavLabel(label); }}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"1px", background:nav===i?T.accent+"18":"transparent", color:nav===i?T.accent:T.textMuted, textAlign:"left" }}>
            <span style={{ fontSize:"13px", width:"18px", textAlign:"center" }}>{icon}</span>
            <span style={{ fontSize:"13px", fontWeight:nav===i?700:500 }}>{label}</span>
          </button>
        ))}
      </div>
      <div style={{ padding:"11px 12px", borderTop:`1px solid ${T.border}` }}>
        <button onClick={() => setDark(!dark)}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"8px 10px", cursor:"pointer", color:T.textMid, fontSize:"12px", fontWeight:600, marginBottom:"10px" }}>
          <span>{dark?"🌙 Dark":"☀️ Light"}</span>
          <div style={{ width:"30px", height:"16px", background:dark?"#6366F1":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
            <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"16px":"2px", transition:"left 0.2s" }}/>
          </div>
        </button>
        <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"7px", background:"transparent", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:userColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>{userAvatar}</div>
          <div><div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{userName}</div><div style={{ fontSize:"10px", color:T.textMuted }}>{userRole}</div></div>
        </button>
        <button
          onClick={() => {
            clearSession();
            window.location.hash = "#/admin/login";
          }}
          style={{ width:"100%", marginTop:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", background:"#EF444410", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"9px", padding:"9px 10px", cursor:"pointer", fontSize:"12px", fontWeight:700 }}>
          <span>↩</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function CreateBatchModal({ onClose, onCreated, orders, T }: { onClose: () => void; onCreated: (payload: CreateBatchPayload) => BatchRecord; orders: BatchOrder[]; T: any }) {
  const [note,     setNote]     = useState("");
  const [selOrd,   setSelOrd]   = useState<Set<string>>(new Set());
  const [done,     setDone]     = useState(false);
  const [newCode,  setNewCode]  = useState("");

  const toggle = (id: string) => setSelOrd(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  const create = () => {
    const created = onCreated({ note, orderIds:[...selOrd] });
    setNewCode(created.batchCode);
    setDone(true);
  };

  const TA: CSSProperties = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:"64px" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:"520px", maxWidth:"95vw", zIndex:1, boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>📦 Create New Batch</div>
          <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer" }}>✕</button>
        </div>

        {done ? (
          <div style={{ padding:"36px", textAlign:"center" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"6px" }}>Batch Created!</div>
            <div style={{ fontSize:"13px", fontFamily:"monospace", color:"#A855F7", fontWeight:700, marginBottom:"4px" }}>{newCode}</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"20px" }}>{selOrd.size} orders added</div>
            <button onClick={onClose} style={{ background:"#A855F7", border:"none", color:"#fff", borderRadius:"9px", padding:"10px 26px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding:"20px" }}>
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"6px" }}>Batch Note (optional)</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Urgent pre-orders — Ali Express Store #4421" style={TA}/>
            </div>

            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"8px" }}>Select Orders <span style={{ color:T.textMuted, fontWeight:400 }}>({selOrd.size} selected)</span></div>
              <div style={{ border:`1px solid ${T.border}`, borderRadius:"9px", overflow:"hidden", maxHeight:"260px", overflowY:"auto" }}>
                {orders.map((o, i) => {
                  const isSel = selOrd.has(o.id);
                  const total = o.items.reduce((a,it)=>a+it.sellPrice*it.qty,0);
                  return (
                    <div key={o.id} onClick={() => toggle(o.id)}
                      style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderBottom:i<orders.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", background:isSel?T.accent+"08":"transparent" }}>
                      <div style={{ width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${isSel?T.accent:T.border}`, background:isSel?T.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {isSel && <span style={{ color:"#fff", fontSize:"10px", fontWeight:800 }}>✓</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"2px" }}>
                          <span style={{ fontSize:"12px", fontWeight:700, color:T.accent }}>{o.num}</span>
                          <span style={{ fontSize:"12px", fontWeight:700, padding:"1px 6px", borderRadius:"3px", background:o.status==="delivered"?"#05996915":o.status==="shipped"?"#2563EB15":"#6366F115", color:o.status==="delivered"?"#059669":o.status==="shipped"?"#2563EB":"#6366F1" }}>{o.status}</span>
                        </div>
                        <div style={{ fontSize:"11px", color:T.textMuted }}>{o.customer} · {o.items.length} item{o.items.length>1?"s":""}</div>
                      </div>
                      <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{total.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={onClose} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={create} disabled={selOrd.size===0}
                style={{ flex:2, background:selOrd.size>0?"#A855F7":T.bg, border:`1px solid ${selOrd.size>0?"#A855F7":T.border}`, color:selOrd.size>0?"#fff":T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"13px", fontWeight:700, cursor:selOrd.size>0?"pointer":"not-allowed" }}>
                📦 Create Batch with {selOrd.size} Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function BatchesPage() {
  const [dark,          setDark]          = useState(false);
  const T = dark ? DARK : LIGHT;
  const [orders]                           = useState<BatchOrder[]>(() => listAvailableOrders());
  const [batches,       setBatches]       = useState<BatchRecord[]>(() => listBatches());
  const [showCreate,    setShowCreate]    = useState(false);
  const [search,        setSearch]        = useState("");
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";

  const filtered = batches.filter(b =>
    !search ||
    b.batchCode.toLowerCase().includes(search.toLowerCase()) ||
    b.note.toLowerCase().includes(search.toLowerCase())
  );

  const totalOrders  = batches.reduce((a,b)=>a+b.orderIds.length,0);
  const totalProfit  = batches.reduce((a,b)=>a+calcBatch(b.orderIds, orders).profit,0);
  const totalSell    = batches.reduce((a,b)=>a+calcBatch(b.orderIds, orders).totalSell,0);

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
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>Order Batches</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>Group orders for agent sourcing and packing</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ background:"#A855F7", border:"none", color:"#fff", borderRadius:"8px", padding:"9px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"7px" }}>
            + Create Batch
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"18px" }}>
            {([
              ["Total Batches",   batches.length,                  "#A855F7","📦"],
              ["Orders in Batches", totalOrders,                   "#6366F1","🛍️"],
              ["Total Sell Value","৳"+totalSell.toLocaleString(),  "#059669","💰"],
              ["Total Gross Profit","৳"+totalProfit.toLocaleString(), "#D97706","📈"],
            ] as Array<[string, ReactNode, string, string]>).map(([label,val,color,icon])=>(
              <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px" }}>
                  <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                  <span style={{ fontSize:"18px" }}>{icon}</span>
                </div>
                <div style={{ fontSize:"22px", fontWeight:800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom:"14px", position:"relative" }}>
            <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"13px" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by batch code or note..."
              style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"9px 12px 9px 34px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Table */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"140px 1fr 80px 120px 160px 100px", padding:"9px 16px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
              {["Batch ID","Note","Orders","Total Sell","Gross Profit","Actions"].map((h,i)=>(
                <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
              ))}
            </div>

            {filtered.map((b, i) => {
              const { totalBuy, totalSell, profit, orderCount } = calcBatch(b.orderIds, orders);
              return (
                <div key={b.id} style={{ display:"grid", gridTemplateColumns:"140px 1fr 80px 120px 160px 100px", padding:"12px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                  <div>
                    <div style={{ fontSize:"12px", fontWeight:800, color:"#A855F7", fontFamily:"monospace" }}>{b.batchCode}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px" }}>{b.createdAt.split(",")[0]}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>by {b.createdBy}</div>
                  </div>

                  <div style={{ paddingRight:"16px" }}>
                    {b.note
                      ? <div style={{ fontSize:"12px", color:T.text, lineHeight:"1.5" }}>{b.note.length>70?b.note.slice(0,70)+"...":b.note}</div>
                      : <span style={{ fontSize:"11px", color:T.textMuted, fontStyle:"italic" }}>No note</span>}
                  </div>

                  <div style={{ fontSize:"14px", fontWeight:800, color:T.accent }}>{orderCount}</div>

                  <div style={{ fontSize:"13px", fontWeight:700, color:"#059669" }}>৳{totalSell.toLocaleString()}</div>

                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#D97706" }}>৳{profit.toLocaleString()}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>buy: ৳{totalBuy.toLocaleString()}</div>
                  </div>

                  <div>
                    <button onClick={() => {
                      selectBatch(b.id);
                      window.location.hash = "#/admin/batch-detail";
                    }}
                      style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"7px", padding:"6px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                      Details →
                    </button>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding:"36px", textAlign:"center", color:T.textMuted, fontSize:"13px" }}>
                No batches found.
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={(payload) => {
            const created = createBatch(payload);
            setBatches(listBatches());
            return created;
          }}
          orders={orders}
          T={T}
        />
      )}
    </div>
  );
}










