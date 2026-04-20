import { useEffect, useRef, useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";
import { loadAppState, saveAppState } from "./core/app-state-client";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const COD_FEE_PCT = 0.5; // Pathao charges 0.5% COD fee
const MATCH_TABLE_COLS = "30px minmax(130px,1fr) minmax(160px,1.4fr) minmax(90px,0.8fr) minmax(80px,0.7fr) minmax(70px,0.65fr) minmax(90px,0.8fr)";
const PENDING_TABLE_COLS = "minmax(150px,1.3fr) minmax(220px,1.9fr) minmax(110px,0.95fr) minmax(100px,0.9fr) minmax(90px,0.8fr) minmax(80px,0.72fr) minmax(110px,0.95fr) minmax(90px,0.75fr)";
const SETTLED_TABLE_COLS = "minmax(140px,1.3fr) minmax(220px,2fr) minmax(90px,0.8fr) minmax(80px,0.7fr) minmax(70px,0.6fr) minmax(90px,0.8fr)";

// ── MOCK: Orders with Pathao consignment IDs ──────────────────────────────
// In real system these are generated when order is sent to Pathao via API
// DL = delivery, RL = return
const PENDING_ORDERS = [
  { id:"o1",  num:"#1001", consId:"DL140426NSE58N", customer:"Takia",          phone:"01859505075", area:"Dhaka",       deliveredAt:"14 Apr 2026", codCollected:1530, deliveryCharge:70,  type:"delivery", daysAgo:3, overdue:true  },
  { id:"o2",  num:"#1002", consId:"DL120426L99NUJ", customer:"Maliha Mimty",   phone:"01741930222", area:"Dinajpur",    deliveredAt:"12 Apr 2026", codCollected:1500, deliveryCharge:130, type:"delivery", daysAgo:5, overdue:true  },
  { id:"o3",  num:"#1003", consId:"DL120426QZ2NK5", customer:"Tasnin",         phone:"01321766877", area:"Savar",       deliveredAt:"12 Apr 2026", codCollected:1430, deliveryCharge:100, type:"delivery", daysAgo:5, overdue:true  },
  { id:"o4",  num:"#1004", consId:"DL140426VLTPB6", customer:"Rabita Faiza",   phone:"01798111565", area:"Mymensingh",  deliveredAt:"14 Apr 2026", codCollected:2350, deliveryCharge:130, type:"delivery", daysAgo:3, overdue:true  },
  { id:"o5",  num:"#1005", consId:"DL140426E6JVGU", customer:"Sumaiya Oithy",  phone:"01819425987", area:"Dhaka",       deliveredAt:"14 Apr 2026", codCollected:1430, deliveryCharge:70,  type:"delivery", daysAgo:3, overdue:true  },
  { id:"o6",  num:"#1006", consId:"DL120426DXRMZZ", customer:"Monia",          phone:"01970135654", area:"Dhaka",       deliveredAt:"12 Apr 2026", codCollected:1530, deliveryCharge:70,  type:"delivery", daysAgo:5, overdue:true  },
  { id:"o7",  num:"#1007", consId:"DL120426PDGJ67", customer:"Tanjina Jui",    phone:"01754656976", area:"Mymensingh",  deliveredAt:"12 Apr 2026", codCollected:4250, deliveryCharge:130, type:"delivery", daysAgo:5, overdue:true  },
  { id:"o8",  num:"#1008", consId:"DL140426FY9A69", customer:"Lamiya Lamisha",  phone:"01715545545", area:"Shahmokdum", deliveredAt:"14 Apr 2026", codCollected:1600, deliveryCharge:110, type:"delivery", daysAgo:3, overdue:false },
  { id:"o9",  num:"#1009", consId:"DL140426VEJBRD", customer:"Saiba",           phone:"01612833079", area:"Tangail",    deliveredAt:"14 Apr 2026", codCollected:1600, deliveryCharge:110, type:"delivery", daysAgo:3, overdue:false },
  { id:"o10", num:"#1010", consId:"DL120426KLZ9J8", customer:"Tasfiah Sabah",   phone:"01970956667", area:"Dhaka",      deliveredAt:"12 Apr 2026", codCollected:1360, deliveryCharge:70,  type:"delivery", daysAgo:5, overdue:true  },
  { id:"o11", num:"#1011", consId:"DL120426RSDYXL", customer:"Farhana",         phone:"01792229588", area:"Moulvibazar",deliveredAt:"12 Apr 2026", codCollected:3800, deliveryCharge:170, type:"delivery", daysAgo:5, overdue:true  },
  { id:"o12", num:"#1012", consId:"DL120426ZWH8PE", customer:"Tasmia Tabassum", phone:"01932222611", area:"Dhaka",      deliveredAt:"12 Apr 2026", codCollected:1530, deliveryCharge:70,  type:"delivery", daysAgo:5, overdue:true  },
  // A return order - Pathao charges return fee, no COD collected
  { id:"o13", num:"#1013", consId:"RL120426JUPS9B", customer:"Little Things",   phone:"01755070168", area:"Dhaka",      deliveredAt:"12 Apr 2026", codCollected:0,    deliveryCharge:40,  type:"return",   daysAgo:5, overdue:true  },
];

const INIT_SETTLED = [
  {
    id:"s1", invoiceId:"PATHAO-INV-2025-041", settledAt:"14 Apr 2026",
    method:"bKash", txId:"BK20260414882211", fileName:"PATHAO-INV-041.pdf",
    orders:[
      { num:"#0975", consId:"DL090426STP2R4", customer:"Zia Chowdhury",   phone:"01815020914", area:"Dhaka",      deliveredAt:"9 Apr",  codCollected:1130, deliveryCharge:110, type:"delivery" },
      { num:"#0963", consId:"DL090426GM3J2V", customer:"Tofayel",         phone:"01705219211", area:"Dhaka",      deliveredAt:"9 Apr",  codCollected:1130, deliveryCharge:70,  type:"delivery" },
      { num:"#0944", consId:"DL0904267E8ELQ", customer:"Afroja Momy",     phone:"01783755519", area:"Sylhet",     deliveredAt:"9 Apr",  codCollected:0,    deliveryCharge:170, type:"delivery" },
      { num:"#0930", consId:"RL0904267E8ELQ", customer:"Little Things",   phone:"01755070168", area:"Dhaka",      deliveredAt:"9 Apr",  codCollected:0,    deliveryCharge:75,  type:"return"   },
    ],
    grossCOD:2260, totalDelivery:425, totalCodFee:11.3, netPaidOut:1823.7,
  },
];

type PendingOrder = (typeof PENDING_ORDERS)[number];
type SettledBatch = (typeof INIT_SETTLED)[number];

// Calc per order
const calcOrder = (o) => {
  const codFee = +(o.codCollected * COD_FEE_PCT / 100).toFixed(2);
  const net    = o.type === "return"
    ? -(o.deliveryCharge)                     // returns: you pay return fee
    : +(o.codCollected - o.deliveryCharge - codFee).toFixed(2);
  return { codFee, net };
};

const calcBatch = (orders) => {
  const grossCOD    = orders.filter(o=>o.type==="delivery").reduce((a,o)=>a+o.codCollected,0);
  const totalDel    = orders.reduce((a,o)=>a+o.deliveryCharge,0);
  const totalCodFee = +orders.filter(o=>o.type==="delivery").reduce((a,o)=>a+(o.codCollected*COD_FEE_PCT/100),0).toFixed(2);
  const returnFees  = orders.filter(o=>o.type==="return").reduce((a,o)=>a+o.deliveryCharge,0);
  const netPayable  = +(grossCOD - totalDel - totalCodFee).toFixed(2);
  return { grossCOD, totalDel, totalCodFee, returnFees, netPayable };
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SidebarComp({ dark, setDark, nav, setNav, T, onSignOut, userName, userRole, userAvatar, userColor }) {
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
          <span>{dark ? "🌙 Dark" : "☀️ Light"}</span>
          <div style={{ width:"30px", height:"16px", background:dark?"#6366F1":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
            <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"16px":"2px", transition:"left 0.2s" }}/>
          </div>
        </button>
        <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"7px", background:"transparent", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:userColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>{userAvatar}</div>
          <div><div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{userName}</div><div style={{ fontSize:"10px", color:T.textMuted }}>{userRole}</div></div>
        </button>
        <button onClick={onSignOut}
          style={{ width:"100%", marginTop:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", background:"#EF444410", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"9px", padding:"9px 10px", cursor:"pointer", fontSize:"12px", fontWeight:700 }}>
          <span>↩</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, T }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"14px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
        <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
        <span style={{ fontSize:"18px" }}>{icon}</span>
      </div>
      <div style={{ fontSize:"22px", fontWeight:800, color, marginBottom:"3px", letterSpacing:"-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted }}>{sub}</div>}
    </div>
  );
}

// ── INVOICE UPLOAD + MATCH MODAL ──────────────────────────────────────────
function SettleModal({ pending, onSettle, onClose, T }) {
  const [step, setStep]           = useState(1); // 1=upload, 2=review matches, 3=payment, 4=done
  const [parsing, setParsing]     = useState(false);
  const [parsed, setParsed]       = useState(null); // parsed invoice data
  const [matched, setMatched]     = useState([]);   // orders matched from invoice
  const [unmatched, setUnmatched] = useState([]);   // consIDs in invoice but not in system
  const [selected, setSelected]   = useState([]);   // manually toggled
  const [method,   setMethod]     = useState("bKash");
  const [txId,     setTxId]       = useState("");
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setParsing(true);
    // Keep a short parsing delay for UX while deriving candidates from live pending rows.
    setTimeout(() => {
      const calc = calcBatch(pending);
      const invoiceId = (file.name || "").replace(/\.[^/.]+$/, "") || `INV-${Date.now()}`;
      const invoice = {
        invoiceId,
        invoiceDate: new Date().toISOString().slice(0, 10),
        totalPaidOut: calc.netPayable,
        fileName: file.name,
        consignmentIds: pending.map((order) => order.consId).filter(Boolean),
      };
      const matchedOrders = [];
      const unmatchedIds  = [];
      invoice.consignmentIds.forEach(cid => {
        const order = pending.find(o => o.consId === cid);
        if (order) matchedOrders.push(order);
        else unmatchedIds.push(cid);
      });
      setParsed({ ...invoice, fileName:file.name });
      setMatched(matchedOrders);
      setUnmatched(unmatchedIds);
      setSelected(matchedOrders.map(o => o.id));
      setParsing(false);
      setStep(2);
    }, 1800);
  };

  const toggleSel = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const selOrders = matched.filter(o => selected.includes(o.id));
  const batch     = calcBatch(selOrders);

  const Inp2 = ({ value, onChange, placeholder }) => {
    const [f,setF]=useState(false);
    return <input value={value} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ background:T.input,border:`1.5px solid ${f?T.accent:T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"monospace" }}/>;
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:"680px", maxWidth:"96vw", maxHeight:"90vh", display:"flex", flexDirection:"column", zIndex:1, boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>Record Pathao Settlement</div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>
              {step===1 && "Upload Pathao invoice to auto-match orders"}
              {step===2 && parsed && `${parsed.invoiceId} · ${matched.length} orders found · ${unmatched.length} not in system`}
              {step===3 && "Confirm payment details"}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            {/* Step indicators */}
            {[1,2,3].map(s => (
              <div key={s} style={{ width:"8px", height:"8px", borderRadius:"50%", background:step>=s?T.accent:T.border }}/>
            ))}
            <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer", marginLeft:"6px" }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"20px" }}>

          {/* STEP 1: Upload */}
          {step === 1 && !parsing && (
            <div>
              <div style={{ border:`2px dashed ${T.border}`, borderRadius:"12px", padding:"40px 20px", textAlign:"center", cursor:"pointer", transition:"all 0.15s" }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accent+"06";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";}}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📄</div>
                <div style={{ fontSize:"15px", fontWeight:700, color:T.text, marginBottom:"6px" }}>Upload Pathao Invoice</div>
                <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"16px" }}>PDF or CSV · System will extract consignment IDs and auto-match your orders</div>
                <button style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"8px", padding:"10px 22px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
                  Browse File
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.csv" style={{ display:"none" }}
                  onChange={e => { if(e.target.files[0]) handleFile(e.target.files[0]); }}/>
              </div>

              <div style={{ marginTop:"16px", padding:"12px 16px", background:T.bg, borderRadius:"9px", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:"11px", fontWeight:600, color:T.text, marginBottom:"6px" }}>How it works:</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                  {["System reads consignment IDs (DL..., RL...) from the invoice","Matches each ID against orders in your system","Auto-selects matched orders — you can review before confirming","Unmatched IDs (not in your system) are shown separately"].map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:"8px", fontSize:"11px", color:T.textMuted }}>
                      <span style={{ color:T.accent, fontWeight:700, flexShrink:0 }}>→</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parsing animation */}
          {parsing && (
            <div style={{ textAlign:"center", padding:"50px 20px" }}>
              <div style={{ fontSize:"40px", marginBottom:"16px" }}>⚙️</div>
              <div style={{ fontSize:"15px", fontWeight:700, color:T.text, marginBottom:"8px" }}>Reading Invoice...</div>
              <div style={{ fontSize:"12px", color:T.textMuted }}>Extracting consignment IDs and matching with your orders</div>
              <div style={{ marginTop:"20px", display:"flex", justifyContent:"center", gap:"6px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:T.accent, opacity:0.4, animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Review matches */}
          {step === 2 && parsed && (
            <>
              {/* Invoice summary */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"16px" }}>
                {[
                  ["Invoice ID",    parsed.invoiceId,      T.text],
                  ["Invoice Date",  parsed.invoiceDate,    T.textMid],
                  ["Total Paid Out","৳"+parsed.totalPaidOut.toLocaleString(), "#059669"],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:T.bg, borderRadius:"8px", padding:"10px 12px" }}>
                    <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", marginBottom:"3px" }}>{l}</div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:c, fontFamily:l==="Invoice ID"?"monospace":"inherit" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Matched orders */}
              <div style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>
                    ✅ Matched Orders ({matched.length})
                    <span style={{ fontSize:"10px", fontWeight:400, color:T.textMuted, marginLeft:"8px" }}>Auto-detected from invoice — deselect any to exclude</span>
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button onClick={() => setSelected(matched.map(o=>o.id))} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"5px", padding:"3px 9px", fontSize:"10px", cursor:"pointer" }}>All</button>
                    <button onClick={() => setSelected([])} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"5px", padding:"3px 9px", fontSize:"10px", cursor:"pointer" }}>None</button>
                  </div>
                </div>
                <div style={{ border:`1px solid ${T.border}`, borderRadius:"9px", overflow:"hidden" }}>
                  {/* Column header */}
                  <div style={{ display:"grid", gridTemplateColumns:MATCH_TABLE_COLS, padding:"7px 12px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                    {["","Consignment ID","Customer · Area","COD","Del. Fee","COD Fee","Net"].map((h,i)=>(
                      <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase" }}>{h}</div>
                    ))}
                  </div>
                  {matched.map((o, i) => {
                    const { codFee, net } = calcOrder(o);
                    const isSel = selected.includes(o.id);
                    const isReturn = o.type === "return";
                    return (
                      <div key={o.id} onClick={() => toggleSel(o.id)}
                        style={{ display:"grid", gridTemplateColumns:MATCH_TABLE_COLS, padding:"9px 12px", borderBottom:i<matched.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", background:isSel?"transparent":T.bg+"80", alignItems:"center" }}>
                        <div style={{ width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${isSel?T.accent:T.border}`, background:isSel?T.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {isSel && <span style={{ color:"#fff", fontSize:"10px", fontWeight:800 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize:"10px", fontFamily:"monospace", fontWeight:700, color:isReturn?"#D97706":T.accent }}>{o.consId}</div>
                          <div style={{ fontSize:"9px", background:isReturn?"#F59E0B15":"#6366F115", color:isReturn?"#D97706":"#6366F1", padding:"1px 5px", borderRadius:"3px", marginTop:"2px", display:"inline-block", fontWeight:600 }}>{isReturn?"↩ Return":"📦 Delivery"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{o.customer}</div>
                          <div style={{ fontSize:"10px", color:T.textMuted }}>{o.num} · {o.area} · {o.deliveredAt}</div>
                        </div>
                        <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{o.codCollected > 0 ? "৳"+o.codCollected.toLocaleString() : "—"}</div>
                        <div style={{ fontSize:"11px", color:"#DC2626" }}>-৳{o.deliveryCharge}</div>
                        <div style={{ fontSize:"11px", color:"#DC2626" }}>{o.codCollected > 0 ? "-৳"+codFee : "—"}</div>
                        <div style={{ fontSize:"12px", fontWeight:700, color:net >= 0 ? "#059669" : "#DC2626" }}>{net >= 0 ? "৳"+net : "-৳"+Math.abs(net)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unmatched IDs */}
              {unmatched.length > 0 && (
                <div style={{ marginBottom:"14px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#D97706", marginBottom:"8px" }}>
                    ⚠ Not in Your System ({unmatched.length})
                    <span style={{ fontSize:"10px", fontWeight:400, color:T.textMuted, marginLeft:"8px" }}>These consignment IDs are in the Pathao invoice but don't match any order</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                    {unmatched.map(cid => (
                      <span key={cid} style={{ fontFamily:"monospace", fontSize:"10px", padding:"3px 9px", borderRadius:"5px", background:"#F59E0B12", border:"1px solid #F59E0B25", color:"#D97706" }}>{cid}</span>
                    ))}
                  </div>
                  <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"6px" }}>These may be orders from a different merchant account, or orders not yet entered into your system.</div>
                </div>
              )}

              {/* Batch total */}
              {selOrders.length > 0 && (
                <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"14px 16px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.text, marginBottom:"10px" }}>Settlement Total — {selOrders.length} selected orders</div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}><span style={{ fontSize:"12px", color:T.textMuted }}>Gross COD Collected</span><span style={{ fontSize:"12px", fontWeight:600, color:T.text }}>৳{batch.grossCOD.toLocaleString()}</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}><span style={{ fontSize:"12px", color:"#DC2626" }}>— Pathao Delivery Charges</span><span style={{ fontSize:"12px", fontWeight:600, color:"#DC2626" }}>-৳{batch.totalDel.toLocaleString()}</span></div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}><span style={{ fontSize:"12px", color:"#DC2626" }}>— Pathao COD Fee ({COD_FEE_PCT}%)</span><span style={{ fontSize:"12px", fontWeight:600, color:"#DC2626" }}>-৳{batch.totalCodFee}</span></div>
                  <div style={{ height:"1px", background:T.border, margin:"8px 0" }}/>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"14px", fontWeight:800, color:T.text }}>Net Payable to You</span>
                    <span style={{ fontSize:"20px", fontWeight:800, color:"#059669" }}>৳{batch.netPayable.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: Payment details */}
          {step === 3 && (
            <>
              <div style={{ background:T.bg, borderRadius:"10px", padding:"14px", marginBottom:"16px" }}>
                <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"2px" }}>Invoice</div>
                <div style={{ fontSize:"14px", fontWeight:800, color:T.text, fontFamily:"monospace" }}>{parsed?.invoiceId}</div>
                <div style={{ fontSize:"12px", color:T.textMuted, marginTop:"2px" }}>{selOrders.length} orders · Net: <strong style={{ color:"#059669" }}>৳{batch.netPayable.toLocaleString()}</strong></div>
              </div>

              <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"10px" }}>How did Pathao pay you?</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
                {[["bKash","💳","#E2136E"],["Bank Transfer","🏦","#2563EB"]].map(([m,icon,color]) => (
                  <div key={m} onClick={() => setMethod(m)}
                    style={{ padding:"12px 16px", borderRadius:"9px", border:`2px solid ${method===m?color:T.border}`, background:method===m?color+"10":T.bg, cursor:"pointer", display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"22px" }}>{icon}</span>
                    <span style={{ fontSize:"13px", fontWeight:700, color:method===m?color:T.text }}>{m}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:"14px" }}>
                <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"5px" }}>Transaction ID / Reference Number</div>
                <Inp2 value={txId} onChange={e=>setTxId(e.target.value)} placeholder={method==="bKash"?"e.g. BK20260417XXXX":"e.g. TXN-2026-04-17-001"}/>
              </div>

              <div style={{ padding:"12px 16px", background:"#05996910", border:"1px solid #05996925", borderRadius:"9px", fontSize:"12px", color:"#059669" }}>
                After confirming, all selected orders will be marked as settled and moved out of the pending list.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${T.border}`, display:"flex", gap:"8px", justifyContent:"flex-end", flexShrink:0, background:T.surface }}>
          {step === 1 && <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px 18px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px 16px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>← Upload Different</button>
              <button onClick={() => setStep(3)} disabled={selOrders.length===0}
                style={{ background:selOrders.length>0?T.accent:T.bg, border:`1px solid ${selOrders.length>0?T.accent:T.border}`, color:selOrders.length>0?"#fff":T.textMuted, borderRadius:"8px", padding:"9px 20px", fontSize:"12px", fontWeight:700, cursor:selOrders.length>0?"pointer":"not-allowed" }}>
                Confirm {selOrders.length} Orders →
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <button onClick={() => setStep(2)} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px 16px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>← Back</button>
              <button onClick={() => {
                onSettle({ invoiceId:parsed.invoiceId, invoiceDate:parsed.invoiceDate, fileName:parsed.fileName, settledAt:"17 Apr 2026", method, txId, orders:selOrders, ...batch });
              }}
                style={{ background:"#059669", border:"none", color:"#fff", borderRadius:"8px", padding:"9px 22px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
                ✓ Mark Settled — ৳{batch.netPayable.toLocaleString()}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function RemittancePage() {
  const [dark, setDark]           = useState(false);
  const T = dark ? DARK : LIGHT;
  const [tab, setTab]             = useState("pending");
  const [pending, setPending]     = useState<PendingOrder[]>([]);
  const [settled, setSettled]     = useState<SettledBatch[]>([]);
  const [remittanceReady, setRemittanceReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedBatch, setExpanded] = useState(null);
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
    window.dispatchEvent(new Event("hashchange"));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loadedPending = await loadAppState<PendingOrder[]>("remittance.pending", []);
      const loadedSettled = await loadAppState<SettledBatch[]>("remittance.settled", []);
      if (!mounted) {
        return;
      }
      setPending(Array.isArray(loadedPending) ? loadedPending : []);
      setSettled(Array.isArray(loadedSettled) ? loadedSettled : []);
      setRemittanceReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!remittanceReady) {
      return;
    }
    void saveAppState("remittance.pending", pending);
  }, [pending, remittanceReady]);

  useEffect(() => {
    if (!remittanceReady) {
      return;
    }
    void saveAppState("remittance.settled", settled);
  }, [settled, remittanceReady]);

  const pendingDeliveries = pending.filter(o => o.type === "delivery");
  const pendingReturns    = pending.filter(o => o.type === "return");
  const pendingCalc       = calcBatch(pending);
  const allSettledOrders  = settled.flatMap(s => s.orders);
  const totalSettledNet   = settled.reduce((a,b) => a + b.netPaidOut, 0);
  const overdueCount      = pending.filter(o => o.overdue).length;

  const handleSettle = (data) => {
    const { grossCOD, totalDel, totalCodFee, netPayable, orders } = data;
    setSettled(p => [{
      id:"s"+Date.now(), invoiceId:data.invoiceId, invoiceDate:data.invoiceDate,
      fileName:data.fileName, settledAt:data.settledAt, method:data.method, txId:data.txId,
      orders, grossCOD, totalDelivery:totalDel, totalCodFee, netPaidOut:netPayable,
    }, ...p]);
    setPending(p => p.filter(o => !orders.find(so => so.id === o.id)));
    setShowModal(false);
  };

  const STATS = [
    { label:"Pending COD",        value:"৳"+pendingCalc.grossCOD.toLocaleString(),      sub:`${pendingDeliveries.length} delivered orders`,    color:"#D97706", icon:"⏳" },
    { label:"Pathao Charges",     value:"৳"+(pendingCalc.totalDel+pendingCalc.totalCodFee).toLocaleString(), sub:`Del ৳${pendingCalc.totalDel} · Fee ${COD_FEE_PCT}% ৳${pendingCalc.totalCodFee}`, color:"#DC2626", icon:"🚴" },
    { label:"Net You'll Receive", value:"৳"+pendingCalc.netPayable.toLocaleString(),     sub:"After all deductions",                            color:"#059669", icon:"💰" },
    { label:"Overdue (3+ days)",  value:overdueCount,                                    sub:"Pathao should have settled",                       color:overdueCount>0?"#DC2626":"#059669", icon:"⚠️" },
    { label:"Total Settled",      value:"৳"+totalSettledNet.toLocaleString(),            sub:`${settled.length} invoices · ${allSettledOrders.length} orders`, color:"#6366F1", icon:"✅" },
    { label:"Total COD Fee Paid", value:"৳"+settled.reduce((a,b)=>a+b.totalCodFee,0).toLocaleString(), sub:`${COD_FEE_PCT}% of all COD collected`, color:"#64748B", icon:"📊" },
  ];

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

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>COD Remittance</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>Track Pathao settlements · COD fee: {COD_FEE_PCT}%</div>
          </div>
          <button onClick={() => setShowModal(true)} disabled={pending.length===0}
            style={{ background:pending.length>0?T.accent:T.bg, border:`1px solid ${pending.length>0?T.accent:T.border}`, color:pending.length>0?"#fff":T.textMuted, borderRadius:"8px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:pending.length>0?"pointer":"not-allowed", display:"flex", alignItems:"center", gap:"7px" }}>
            📄 Upload Pathao Invoice
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"10px", marginBottom:"18px" }}>
            {STATS.map((s,i) => <StatCard key={i} {...s} T={T}/>)}
          </div>

          {/* Overdue warning */}
          {overdueCount > 0 && (
            <div style={{ padding:"11px 16px", background:"#EF444410", border:"1px solid #EF444425", borderRadius:"10px", marginBottom:"14px", display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"18px" }}>⚠️</span>
              <div>
                <div style={{ fontSize:"13px", fontWeight:700, color:"#DC2626" }}>{overdueCount} orders are 3+ days old without settlement</div>
                <div style={{ fontSize:"11px", color:"#EF4444", marginTop:"2px" }}>Pathao typically settles within 3 days of delivery. If overdue, upload your latest invoice or contact Pathao support.</div>
              </div>
              <button style={{ marginLeft:"auto", background:"transparent", border:"1px solid #EF4444", color:"#DC2626", borderRadius:"6px", padding:"6px 12px", fontSize:"12px", fontWeight:700, cursor:"pointer", flexShrink:0 }}>Contact Pathao</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"9px", padding:"3px", border:`1px solid ${T.border}`, width:"fit-content", marginBottom:"14px" }}>
            {[["pending",`⏳ Pending (${pending.length})`],["settled",`✅ Settled (${settled.length} invoices)`]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding:"7px 18px", borderRadius:"7px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:700, background:tab===id?T.accent+"20":"transparent", color:tab===id?T.accent:T.textMuted }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── PENDING TAB ── */}
          {tab === "pending" && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:PENDING_TABLE_COLS, padding:"9px 16px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                {["Consignment ID","Customer · Area","Delivered","COD","Del. Charge","COD Fee","Net Payable","Status"].map((h,i) => (
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</div>
                ))}
              </div>

              {pending.map((o, i) => {
                const { codFee, net } = calcOrder(o);
                const isReturn = o.type === "return";
                return (
                  <div key={o.id} style={{ display:"grid", gridTemplateColumns:PENDING_TABLE_COLS, padding:"11px 16px", borderBottom:i<pending.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div>
                      <div style={{ fontSize:"10px", fontFamily:"monospace", fontWeight:700, color:isReturn?"#D97706":T.accent }}>{o.consId}</div>
                      <div style={{ fontSize:"9px", marginTop:"2px" }}>
                        <span style={{ background:isReturn?"#F59E0B15":"#6366F115", color:isReturn?"#D97706":"#6366F1", padding:"1px 5px", borderRadius:"3px", fontWeight:600 }}>{isReturn?"↩ Return":"📦 Delivery"}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{o.customer}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{o.num} · {o.area}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{o.deliveredAt}</div>
                      <div style={{ fontSize:"10px", color:o.overdue?"#DC2626":T.textMuted }}>{o.daysAgo===0?"Today":o.daysAgo===1?"Yesterday":`${o.daysAgo}d ago`}</div>
                    </div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{o.codCollected>0?"৳"+o.codCollected.toLocaleString():"—"}</div>
                    <div style={{ fontSize:"12px", color:"#DC2626", fontWeight:600 }}>-৳{o.deliveryCharge}</div>
                    <div style={{ fontSize:"12px", color:"#DC2626", fontWeight:600 }}>{o.codCollected>0?"-৳"+codFee:"—"}</div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:net>=0?"#059669":"#DC2626" }}>{net>=0?"৳"+net:"-৳"+Math.abs(net)}</div>
                    <div>
                      {o.overdue
                        ? <span style={{ fontSize:"9px", fontWeight:700, background:"#EF444415", color:"#DC2626", padding:"2px 7px", borderRadius:"4px" }}>OVERDUE</span>
                        : <span style={{ fontSize:"9px", fontWeight:700, background:"#F59E0B15", color:"#D97706", padding:"2px 7px", borderRadius:"4px" }}>Pending</span>}
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div style={{ display:"grid", gridTemplateColumns:PENDING_TABLE_COLS, padding:"11px 16px", background:T.tHead, borderTop:`2px solid ${T.border}`, alignItems:"center" }}>
                <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>Total</div>
                <div style={{ fontSize:"11px", color:T.textMuted }}>{pending.length} orders</div>
                <div/>
                <div style={{ fontSize:"13px", fontWeight:800, color:T.text }}>৳{pendingCalc.grossCOD.toLocaleString()}</div>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#DC2626" }}>-৳{pendingCalc.totalDel}</div>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#DC2626" }}>-৳{pendingCalc.totalCodFee}</div>
                <div style={{ fontSize:"14px", fontWeight:800, color:"#059669" }}>৳{pendingCalc.netPayable.toLocaleString()}</div>
                <div/>
              </div>

              {pending.length===0 && (
                <div style={{ padding:"36px", textAlign:"center", color:T.textMuted }}>✅ All orders settled. No pending remittance.</div>
              )}
            </div>
          )}

          {/* ── SETTLED TAB ── */}
          {tab === "settled" && (
            <div>
              {settled.map(batch => {
                const isOpen = expandedBatch === batch.id;
                return (
                  <div key={batch.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", marginBottom:"12px" }}>
                    {/* Batch header */}
                    <div onClick={() => setExpanded(isOpen ? null : batch.id)}
                      style={{ padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px" }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.tHead}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:"22px" }}>{batch.method==="bKash"?"💳":"🏦"}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
                          <span style={{ fontSize:"13px", fontWeight:800, color:T.text, fontFamily:"monospace" }}>{batch.invoiceId}</span>
                          <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 7px", borderRadius:"4px", background:"#10B98115", color:"#059669" }}>SETTLED</span>
                          <span style={{ fontSize:"10px", fontWeight:600, padding:"2px 7px", borderRadius:"4px", background:batch.method==="bKash"?"#E2136E15":"#2563EB15", color:batch.method==="bKash"?"#E2136E":"#2563EB" }}>{batch.method}</span>
                        </div>
                        <div style={{ fontSize:"11px", color:T.textMuted }}>
                          {batch.settledAt} · {batch.orders.length} orders · TxID: <span style={{ fontFamily:"monospace" }}>{batch.txId||"—"}</span>
                          {batch.fileName && <span style={{ marginLeft:"8px" }}>📄 {batch.fileName}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"20px", fontWeight:800, color:"#059669" }}>৳{batch.netPaidOut.toLocaleString()}</div>
                        <div style={{ fontSize:"10px", color:T.textMuted }}>Net received</div>
                      </div>
                      <div style={{ fontSize:"12px", color:T.textMuted }}>{isOpen?"▲":"▼"}</div>
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ borderTop:`1px solid ${T.border}` }}>
                        {/* Deduction summary */}
                        <div style={{ display:"flex", gap:"24px", padding:"12px 18px", background:T.bg, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap" }}>
                          {[
                            ["Gross COD",     "৳"+batch.grossCOD.toLocaleString(),       T.text],
                            ["Delivery Fees", "-৳"+batch.totalDelivery.toLocaleString(), "#DC2626"],
                            [`COD Fee ${COD_FEE_PCT}%`, "-৳"+batch.totalCodFee,          "#DC2626"],
                            ["Net Paid Out",  "৳"+batch.netPaidOut.toLocaleString(),     "#059669"],
                          ].map(([l,v,c]) => (
                            <div key={l}>
                              <div style={{ fontSize:"10px", color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"2px" }}>{l}</div>
                              <div style={{ fontSize:"14px", fontWeight:800, color:c }}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Per-order */}
                        <div style={{ display:"grid", gridTemplateColumns:SETTLED_TABLE_COLS, padding:"7px 18px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                          {["Consignment ID","Customer · Area","COD","Del. Fee","COD Fee","Net"].map((h,i) => (
                            <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase" }}>{h}</div>
                          ))}
                        </div>
                        {batch.orders.map((o, i) => {
                          const { codFee, net } = calcOrder(o);
                          const isReturn = o.type === "return";
                          return (
                            <div key={i} style={{ display:"grid", gridTemplateColumns:SETTLED_TABLE_COLS, padding:"9px 18px", borderBottom:i<batch.orders.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:"10px", fontFamily:"monospace", fontWeight:700, color:isReturn?"#D97706":T.accent }}>{o.consId}</div>
                                <span style={{ fontSize:"9px", background:isReturn?"#F59E0B15":"transparent", color:isReturn?"#D97706":T.textMuted, padding:isReturn?"1px 5px":"0", borderRadius:"3px", fontWeight:isReturn?600:400 }}>{isReturn?"↩ Return":""}</span>
                              </div>
                              <div>
                                <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{o.customer}</div>
                                <div style={{ fontSize:"10px", color:T.textMuted }}>{o.num} · {o.area} · {o.deliveredAt}</div>
                              </div>
                              <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{o.codCollected>0?"৳"+o.codCollected:"-"}</div>
                              <div style={{ fontSize:"11px", color:"#DC2626" }}>-৳{o.deliveryCharge}</div>
                              <div style={{ fontSize:"11px", color:"#DC2626" }}>{o.codCollected>0?"-৳"+codFee:"—"}</div>
                              <div style={{ fontSize:"12px", fontWeight:700, color:net>=0?"#059669":"#DC2626" }}>{net>=0?"৳"+net:"-৳"+Math.abs(net)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {settled.length===0 && <div style={{ padding:"36px", textAlign:"center", color:T.textMuted }}>No settled invoices yet.</div>}
            </div>
          )}
        </div>
      </div>

      {showModal && <SettleModal pending={pending} onSettle={handleSettle} onClose={() => setShowModal(false)} T={T}/>}
    </div>
  );
}










