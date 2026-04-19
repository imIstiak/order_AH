import { useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

// Pipeline stages in order
const STAGES = [
  { id:"advance_paid",    label:"Advance Paid",       color:"#6366F1", icon:"💳", desc:"Advance received, not yet ordered from supplier" },
  { id:"ordered",         label:"Ordered Supplier",   color:"#D97706", icon:"📋", desc:"Sent order to Chinese supplier" },
  { id:"in_transit",      label:"In Transit",         color:"#0D9488", icon:"🚢", desc:"Item shipped from China, on the way" },
  { id:"arrived_bd",      label:"Arrived BD",         color:"#A855F7", icon:"📦", desc:"Item arrived in Bangladesh, at warehouse" },
  { id:"packing",         label:"Packing",            color:"#F59E0B", icon:"📦", desc:"Packing the item for local delivery" },
  { id:"shipped",         label:"Shipped to Customer",color:"#2563EB", icon:"🚚", desc:"Sent via Pathao to customer" },
  { id:"delayed",         label:"Delayed",            color:"#DC2626", icon:"⚠️", desc:"Shipment delayed — customer notified" },
];

const INIT_ORDERS = [
  { id:"o1",  num:"#1002", customer:"Rahela Khanam",    phone:"01722222222", area:"Dhaka", product:"High Ankle Converse", variant:"38 - White", qty:1, price:3200, advance:800,  stage:"ordered",      placedAt:"14 Apr",  eta:"14 May", supplier:"Ali Express Store #4421", supplierNote:"Order placed. Expected ship date: Apr 22.", notified:true  },
  { id:"o2",  num:"#1004", customer:"Sabrina Islam",    phone:"01633333333", area:"Sylhet",product:"Silver Bracelet",      variant:"Free-Silver",qty:1, price:1800, advance:500,  stage:"delayed",      placedAt:"10 Apr",  eta:"20 May", supplier:"Ali Express Store #2200", supplierNote:"Delayed due to customs. New ETA: May 20.",  notified:true  },
  { id:"o3",  num:"#1010", customer:"Kohinoor Begum",   phone:"01677777777", area:"Gazipur",product:"Quilted Shoulder Bag",variant:"M-Pink",     qty:2, price:7000, advance:2000, stage:"in_transit",   placedAt:"12 Apr",  eta:"10 May", supplier:"1688 Store #881",        supplierNote:"Shipped via sea freight. Tracking: CN-882211.", notified:false },
  { id:"o4",  num:"#1012", customer:"Nasreen Akter",    phone:"01499999999", area:"Dhaka", product:"Platform Sneakers",    variant:"37 - Black", qty:1, price:3800, advance:800,  stage:"advance_paid", placedAt:"14 Apr",  eta:"15 May", supplier:"",                       supplierNote:"",                                              notified:false },
  { id:"o5",  num:"#1015", customer:"Ruma Islam",       phone:"01500000000", area:"Dhaka", product:"High Ankle Converse",  variant:"37 - White", qty:1, price:3200, advance:800,  stage:"advance_paid", placedAt:"17 Apr",  eta:"17 May", supplier:"",                       supplierNote:"",                                              notified:false },
  { id:"o6",  num:"#1008", customer:"Dilruba Hossain",  phone:"01488888888", area:"Dhaka", product:"Canvas Backpack",      variant:"L - Navy",   qty:1, price:2400, advance:600,  stage:"arrived_bd",   placedAt:"5 Apr",   eta:"20 Apr", supplier:"Ali Express Store #4421", supplierNote:"Arrived warehouse Apr 19.",                      notified:true  },
  { id:"o7",  num:"#1009", customer:"Parvin Sultana",   phone:"01566666666", area:"Chittagong",product:"Ankle Strap Heels",variant:"38 - Nude",  qty:1, price:2800, advance:700,  stage:"packing",      placedAt:"4 Apr",   eta:"19 Apr", supplier:"1688 Store #331",        supplierNote:"Packed and ready.",                              notified:true  },
  { id:"o8",  num:"#1003", customer:"Mithila Rahman",   phone:"01544444444", area:"Dhaka", product:"Embroidered Clutch",   variant:"Free - Red", qty:1, price:2200, advance:600,  stage:"shipped",      placedAt:"1 Apr",   eta:"18 Apr", supplier:"Ali Express Store #2200", supplierNote:"Shipped via Pathao.",                            notified:true  },
  { id:"o9",  num:"#0998", customer:"Fatima Akter",     phone:"01711111111", area:"Dhaka", product:"Woven Raffia Bag",     variant:"M - Natural",qty:2, price:3800, advance:1000, stage:"in_transit",   placedAt:"10 Apr",  eta:"8 May",  supplier:"1688 Store #881",        supplierNote:"In transit via air freight.",                    notified:true  },
  { id:"o10", num:"#0995", customer:"Rahela Khanam",    phone:"01722222222", area:"Dhaka", product:"Silver Bracelet",      variant:"Free - Gold",qty:1, price:1800, advance:500,  stage:"ordered",      placedAt:"8 Apr",   eta:"8 May",  supplier:"Ali Express Store #2200", supplierNote:"",                                              notified:false },
  { id:"o11", num:"#0991", customer:"Sabrina Islam",    phone:"01633333333", area:"Sylhet",product:"Gold Chain Necklace",  variant:"Free - Gold",qty:1, price:2100, advance:500,  stage:"ordered",      placedAt:"6 Apr",   eta:"6 May",  supplier:"Ali Express Store #4421", supplierNote:"Order confirmed by supplier.",                   notified:true  },
  { id:"o12", num:"#0985", customer:"Kohinoor Begum",   phone:"01677777777", area:"Gazipur",product:"Platform Sneakers",  variant:"38 - Black", qty:1, price:3800, advance:1000, stage:"arrived_bd",   placedAt:"2 Apr",   eta:"16 Apr", supplier:"1688 Store #331",        supplierNote:"Arrived Apr 16, ready to pack.",                 notified:false },
];

const PROD_EMOJI = { "High Ankle Converse":"👟","Silver Bracelet":"📿","Quilted Shoulder Bag":"👜","Platform Sneakers":"👠","Canvas Backpack":"🎒","Ankle Strap Heels":"🥿","Embroidered Clutch":"👝","Woven Raffia Bag":"🧺","Leather Tote Bag":"🛍️","Gold Chain Necklace":"💛" };
const PROD_BG    = { "High Ankle Converse":"#1E40AF","Silver Bracelet":"#6B21A8","Quilted Shoulder Bag":"#9D174D","Platform Sneakers":"#7C3AED","Canvas Backpack":"#065F46","Ankle Strap Heels":"#B45309","Embroidered Clutch":"#B91C1C","Woven Raffia Bag":"#78350F","Leather Tote Bag":"#92400E","Gold Chain Necklace":"#92400E" };

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function Sidebar({ dark, setDark, nav, setNav, T, count, onSignOut, userName, userRole, userAvatar, userColor }) {
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
            {i===3 && <span style={{ marginLeft:"auto", background:"#F59E0B18", color:"#D97706", fontSize:"9px", padding:"1px 5px", borderRadius:"7px", fontWeight:700 }}>{count}</span>}
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

function Inp({ value, onChange, placeholder, T, style }) {
  const [f,setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"8px 11px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", ...(style||{}) }}/>;
}

// Single order card in pipeline column
function PipelineCard({ order, selected, onSelect, onMove, stages, T }) {
  const stageIdx  = stages.findIndex(s => s.id === order.stage);
  const prevStage = stages[stageIdx - 1];
  const nextStage = stages[stageIdx + 1];
  const isSelected = selected.includes(order.id);
  const codDue = order.price - order.advance;
  const stageInfo = stages.find(s => s.id === order.stage);

  return (
    <div style={{ background:T.surface, border:`1.5px solid ${isSelected ? stageInfo.color : T.border}`, borderRadius:"10px", padding:"12px", marginBottom:"8px", cursor:"pointer", transition:"border-color 0.15s", position:"relative" }}
      onClick={() => onSelect(order.id)}
      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.borderColor = T.border.replace("0.08","0.2"); }}
      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.borderColor = T.border; }}>

      {/* Select checkbox */}
      <div style={{ position:"absolute", top:"10px", right:"10px", width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${isSelected?stageInfo.color:T.border}`, background:isSelected?stageInfo.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}
        onClick={e => { e.stopPropagation(); onSelect(order.id); }}>
        {isSelected && <span style={{ color:"#fff", fontSize:"10px", fontWeight:800 }}>✓</span>}
      </div>

      {/* Product */}
      <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"9px", paddingRight:"20px" }}>
        <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:PROD_BG[order.product]||"#334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>
          {PROD_EMOJI[order.product]||"🛍️"}
        </div>
        <div>
          <div style={{ fontSize:"12px", fontWeight:700, color:T.text, lineHeight:"1.3" }}>{order.product}</div>
          <div style={{ fontSize:"10px", color:T.textMuted }}>{order.variant} × {order.qty}</div>
        </div>
      </div>

      {/* Customer */}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{order.customer}</div>
          <div style={{ fontSize:"10px", color:T.textMuted }}>{order.num} · {order.area}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#6366F1" }}>৳{order.price.toLocaleString()}</div>
          <div style={{ fontSize:"10px", color:"#059669" }}>Adv ৳{order.advance}</div>
        </div>
      </div>

      {/* ETA + notified */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"9px" }}>
        <div style={{ fontSize:"10px", color:T.textMuted }}>📅 ETA: <strong style={{ color:T.textMid }}>{order.eta}</strong></div>
        <span style={{ fontSize:"9px", fontWeight:700, padding:"1px 6px", borderRadius:"3px", background:order.notified?"#10B98115":"#F59E0B15", color:order.notified?"#059669":"#D97706" }}>
          {order.notified ? "✓ Notified" : "⚠ Not Notified"}
        </span>
      </div>

      {/* Move buttons */}
      <div style={{ display:"flex", gap:"5px" }}>
        {prevStage && (
          <button onClick={e => { e.stopPropagation(); onMove([order.id], prevStage.id); }}
            style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"5px", fontSize:"10px", fontWeight:600, cursor:"pointer" }}>
            ← {prevStage.label.split(" ")[0]}
          </button>
        )}
        {nextStage && nextStage.id !== "delayed" && (
          <button onClick={e => { e.stopPropagation(); onMove([order.id], nextStage.id); }}
            style={{ flex:2, background:stageInfo.color+"18", border:`1px solid ${stageInfo.color}30`, color:stageInfo.color, borderRadius:"6px", padding:"5px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
            Move to {nextStage.label} →
          </button>
        )}
        {nextStage?.id === "delayed" && (
          <button onClick={e => { e.stopPropagation(); onMove([order.id], "delayed"); }}
            style={{ flex:1, background:"#EF444412", border:"1px solid #EF444425", color:"#DC2626", borderRadius:"6px", padding:"5px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
            ⚠ Delay
          </button>
        )}
      </div>
    </div>
  );
}

// Order detail panel
function DetailPanel({ order, onClose, onUpdate, onMove, stages, T }) {
  const [eta,          setEta]          = useState(order.eta);
  const [supplier,     setSupplier]     = useState(order.supplier);
  const [supplierNote, setSupplierNote] = useState(order.supplierNote);
  const [notified,     setNotified]     = useState(order.notified);
  const [saved,        setSaved]        = useState(false);
  const stageInfo = stages.find(s => s.id === order.stage);
  const stageIdx  = stages.findIndex(s => s.id === order.stage);
  const codDue    = order.price - order.advance;

  const save = () => {
    onUpdate({ ...order, eta, supplier, supplierNote, notified });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const TA = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 11px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:"66px" };

  return (
    <div style={{ width:"360px", background:T.sidebar, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{order.num}</span>
          <span style={{ fontSize:"11px", color:T.textMuted, marginLeft:"8px" }}>{order.customer}</span>
        </div>
        <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"3px 9px", cursor:"pointer", fontSize:"12px" }}>✕</button>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"16px" }}>

        {/* Stage badge */}
        <div style={{ padding:"10px 14px", background:stageInfo.color+"12", border:`1px solid ${stageInfo.color}25`, borderRadius:"9px", marginBottom:"14px", display:"flex", alignItems:"center", gap:"9px" }}>
          <span style={{ fontSize:"20px" }}>{stageInfo.icon}</span>
          <div>
            <div style={{ fontSize:"12px", fontWeight:800, color:stageInfo.color }}>{stageInfo.label}</div>
            <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>{stageInfo.desc}</div>
          </div>
        </div>

        {/* Product info */}
        <div style={{ background:T.bg, borderRadius:"9px", padding:"12px", marginBottom:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"9px", background:PROD_BG[order.product]||"#334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>
              {PROD_EMOJI[order.product]||"🛍️"}
            </div>
            <div>
              <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{order.product}</div>
              <div style={{ fontSize:"11px", color:T.textMuted }}>{order.variant} × {order.qty}</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px" }}>
            {[["Total","৳"+order.price.toLocaleString(),"#6366F1"],["Advance","৳"+order.advance,"#059669"],["COD Due","৳"+codDue.toLocaleString(),"#D97706"]].map(([l,v,c])=>(
              <div key={l} style={{ background:T.surface, borderRadius:"7px", padding:"7px 9px" }}>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:600, textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:"13px", fontWeight:800, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline progress */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>Pipeline Progress</div>
          <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
            {stages.filter(s=>s.id!=="delayed").map((s,i)=>{
              const sIdx = stages.filter(st=>st.id!=="delayed").findIndex(st=>st.id===order.stage);
              const done = i <= sIdx;
              return (
                <div key={s.id} style={{ flex:1, height:"5px", borderRadius:"5px", background:done?s.color:T.border, transition:"background 0.3s" }}
                  title={s.label}/>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
            <span style={{ fontSize:"10px", color:T.textMuted }}>Start</span>
            <span style={{ fontSize:"10px", color:T.textMuted }}>Delivered</span>
          </div>
        </div>

        {/* Move stage */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>Move to Stage</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {stages.map((s) => (
              <button key={s.id} onClick={() => { onMove([order.id], s.id); onUpdate({ ...order, stage:s.id, eta, supplier, supplierNote, notified }); onClose(); }}
                disabled={s.id === order.stage}
                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 11px", borderRadius:"7px", border:`1.5px solid ${s.id===order.stage?s.color:T.border}`, background:s.id===order.stage?s.color+"12":T.bg, cursor:s.id===order.stage?"default":"pointer", transition:"all 0.1s", opacity:s.id===order.stage?1:0.7 }}
                onMouseEnter={e=>{ if(s.id!==order.stage) e.currentTarget.style.opacity="1"; }}
                onMouseLeave={e=>{ if(s.id!==order.stage) e.currentTarget.style.opacity="0.7"; }}>
                <span style={{ fontSize:"14px" }}>{s.icon}</span>
                <span style={{ fontSize:"12px", fontWeight:s.id===order.stage?700:500, color:s.id===order.stage?s.color:T.textMid }}>{s.label}</span>
                {s.id === order.stage && <span style={{ marginLeft:"auto", fontSize:"9px", fontWeight:700, color:s.color }}>CURRENT</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ETA + Supplier */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>Supplier & ETA</div>
          <div style={{ marginBottom:"9px" }}>
            <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"4px" }}>Expected Delivery Date</div>
            <input type="date" value={eta} onChange={e=>setEta(e.target.value)}
              style={{ background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"8px 11px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" }}/>
          </div>
          <div style={{ marginBottom:"9px" }}>
            <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"4px" }}>Supplier Name / Store</div>
            <Inp value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="e.g. AliExpress Store #4421" T={T}/>
          </div>
          <div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"4px" }}>Supplier Notes / Tracking</div>
            <textarea value={supplierNote} onChange={e=>setSupplierNote(e.target.value)} placeholder="Tracking ID, shipping notes, customs info..." style={TA}/>
          </div>
        </div>

        {/* Notify customer */}
        <div style={{ marginBottom:"14px" }}>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"10px 12px", background:notified?"#05996910":T.bg, borderRadius:"8px", border:`1px solid ${notified?"#05996930":T.border}` }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>Customer Notified</div>
              <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>Mark when SMS/WhatsApp sent about this stage</div>
            </div>
            <div onClick={() => setNotified(p=>!p)}
              style={{ width:"38px", height:"22px", borderRadius:"22px", background:notified?"#059669":"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:notified?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
            </div>
          </label>
        </div>

        <button onClick={save}
          style={{ width:"100%", background:saved?"#059669":T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px", fontSize:"13px", fontWeight:700, cursor:"pointer", transition:"background 0.2s" }}>
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function PreOrdersPipeline() {
  const [dark, setDark]       = useState(false);
  const T = dark ? DARK : LIGHT;
  const [orders, setOrders]   = useState(INIT_ORDERS);
  const [selected, setSelected] = useState([]);   // selected order IDs for bulk
  const [detail, setDetail]   = useState(null);   // order open in detail panel
  const [search, setSearch]   = useState("");
  const [bulkStage, setBulkStage] = useState("");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
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

  const filtered = orders.filter(o =>
    !search || o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.num.includes(search) || o.product.toLowerCase().includes(search.toLowerCase())
  );

  const stageOrders = (stageId) => filtered.filter(o => o.stage === stageId);
  const stageTotal  = (stageId) => filtered.filter(o => o.stage === stageId).reduce((a,b) => a+b.price, 0);

  const toggleSelect = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  };

  const moveOrders = (ids, toStage) => {
    setOrders(p => p.map(o => ids.includes(o.id) ? { ...o, stage:toStage } : o));
    setSelected([]);
  };

  const updateOrder = (updated) => {
    setOrders(p => p.map(o => o.id === updated.id ? updated : o));
    if (detail?.id === updated.id) setDetail(updated);
  };

  const handleBulkMove = () => {
    if (!bulkStage || selected.length === 0) return;
    moveOrders(selected, bulkStage);
    setBulkStage(""); setShowBulkConfirm(false);
  };

  const markAllNotified = (stageId) => {
    setOrders(p => p.map(o => o.stage === stageId ? { ...o, notified:true } : o));
  };

  const notNotifiedCount = orders.filter(o => !o.notified && o.stage !== "shipped").length;

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
        badgeByLabel={{ "Pre-Orders": { text: String(orders.length), background: "#F59E0B18", color: "#D97706" } }}
        onLogout={handleSignOut}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:"10px", flexShrink:0 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"12px" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by customer, order no, product..."
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 10px 7px 30px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 12px", background:T.accent+"12", border:`1px solid ${T.accent}25`, borderRadius:"8px" }}>
              <span style={{ fontSize:"12px", fontWeight:700, color:T.accent }}>{selected.length} selected</span>
              <select value={bulkStage} onChange={e=>setBulkStage(e.target.value)}
                style={{ background:T.input, border:`1px solid ${T.border}`, borderRadius:"6px", color:T.text, padding:"5px 9px", fontSize:"11px", outline:"none", cursor:"pointer" }}>
                <option value="">Move to stage...</option>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
              <button onClick={handleBulkMove} disabled={!bulkStage}
                style={{ background:bulkStage?T.accent:T.bg, border:`1px solid ${bulkStage?T.accent:T.border}`, color:bulkStage?"#fff":T.textMuted, borderRadius:"6px", padding:"5px 12px", fontSize:"12px", fontWeight:700, cursor:bulkStage?"pointer":"not-allowed" }}>
                Move
              </button>
              <button onClick={() => setSelected([])}
                style={{ background:"transparent", border:"none", color:T.textMuted, fontSize:"13px", cursor:"pointer", padding:"2px" }}>✕</button>
            </div>
          )}

          {notNotifiedCount > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 12px", background:"#F59E0B12", border:"1px solid #F59E0B25", borderRadius:"8px" }}>
              <span style={{ fontSize:"12px", fontWeight:700, color:"#D97706" }}>⚠ {notNotifiedCount} customers not notified</span>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ background:T.sidebar, borderBottom:`1px solid ${T.border}`, padding:"10px 18px", display:"flex", gap:"10px", flexShrink:0 }}>
          <div style={{ fontSize:"13px", fontWeight:800, color:T.text, marginRight:"4px" }}>Pre-Orders Pipeline</div>
          {STAGES.map(s => {
            const cnt = stageOrders(s.id).length;
            if (!cnt) return null;
            return (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", background:s.color+"12", border:`1px solid ${s.color}25`, borderRadius:"6px" }}>
                <span style={{ fontSize:"12px" }}>{s.icon}</span>
                <span style={{ fontSize:"12px", fontWeight:700, color:s.color }}>{cnt}</span>
                <span style={{ fontSize:"10px", color:T.textMuted }}>{s.label.split(" ")[0]}</span>
              </div>
            );
          })}
          <div style={{ marginLeft:"auto", fontSize:"11px", color:T.textMuted, alignSelf:"center" }}>
            {filtered.length} active pre-orders · ৳{filtered.reduce((a,b)=>a+b.price,0).toLocaleString()} total value
          </div>
        </div>

        {/* Kanban board + detail panel */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Board */}
          <div style={{ flex:1, overflow:"auto", padding:"16px" }}>
            <div style={{ display:"flex", gap:"12px", minWidth:"max-content", alignItems:"flex-start" }}>

              {STAGES.map(stage => {
                const stageOrd = stageOrders(stage.id);
                const total    = stageTotal(stage.id);
                const allSelectedInStage = stageOrd.length > 0 && stageOrd.every(o => selected.includes(o.id));

                return (
                  <div key={stage.id} style={{ width:"270px", flexShrink:0 }}>
                    {/* Column header */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"11px 13px", marginBottom:"10px", borderTop:`3px solid ${stage.color}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                          <span style={{ fontSize:"16px" }}>{stage.icon}</span>
                          <span style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{stage.label}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                          {/* Select all in column */}
                          {stageOrd.length > 0 && (
                            <button onClick={() => {
                              if (allSelectedInStage) setSelected(p => p.filter(id => !stageOrd.map(o=>o.id).includes(id)));
                              else setSelected(p => [...new Set([...p, ...stageOrd.map(o=>o.id)])]);
                            }}
                              style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"5px", padding:"2px 7px", fontSize:"9px", cursor:"pointer", fontWeight:600 }}>
                              {allSelectedInStage ? "✕ All" : "☐ All"}
                            </button>
                          )}
                          <span style={{ fontSize:"12px", fontWeight:800, padding:"2px 8px", borderRadius:"6px", background:stage.color+"18", color:stage.color }}>{stageOrd.length}</span>
                        </div>
                      </div>
                      {stageOrd.length > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"10px", color:T.textMuted }}>৳{total.toLocaleString()} value</span>
                          {stageOrd.some(o => !o.notified) && stage.id !== "shipped" && (
                            <button onClick={() => markAllNotified(stage.id)}
                              style={{ background:"transparent", border:"none", color:"#D97706", fontSize:"12px", fontWeight:700, cursor:"pointer", padding:0 }}>
                              Notify all →
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cards */}
                    {stageOrd.length > 0 ? stageOrd.map(order => (
                      <PipelineCard
                        key={order.id}
                        order={order}
                        selected={selected}
                        onSelect={(id) => { toggleSelect(id); setDetail(order); }}
                        onMove={moveOrders}
                        stages={STAGES}
                        T={T}
                      />
                    )) : (
                      <div style={{ border:`2px dashed ${T.border}`, borderRadius:"9px", padding:"22px", textAlign:"center" }}>
                        <div style={{ fontSize:"20px", marginBottom:"6px", opacity:0.4 }}>{stage.icon}</div>
                        <div style={{ fontSize:"11px", color:T.textMuted }}>No orders here</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {detail && (
            <DetailPanel
              key={detail.id}
              order={orders.find(o=>o.id===detail.id)||detail}
              onClose={() => setDetail(null)}
              onUpdate={updateOrder}
              onMove={moveOrders}
              stages={STAGES}
              T={T}
            />
          )}
        </div>
      </div>
    </div>
  );
}










