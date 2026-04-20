import { useEffect, useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";
import { loadAppState, saveAppState } from "./core/app-state-client";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const INIT_COUPONS = [
  { id:"c1", code:"WELCOME20",   type:"pct",      value:20,   minOrder:0,    maxUses:0,    usedCount:47,  singleUse:false, freeShip:false, status:"active",   expiresAt:"",           description:"Welcome discount for new customers", applicableTo:"all" },
  { id:"c2", code:"FLAT100",     type:"flat",     value:100,  minOrder:500,  maxUses:100,  usedCount:38,  singleUse:false, freeShip:false, status:"active",   expiresAt:"2025-06-30", description:"৳100 off on orders above ৳500", applicableTo:"all" },
  { id:"c3", code:"FREESHIP",    type:"free_ship",value:0,    minOrder:2000, maxUses:0,    usedCount:12,  singleUse:false, freeShip:true,  status:"active",   expiresAt:"2025-05-31", description:"Free delivery on orders above ৳2000", applicableTo:"all" },
  { id:"c4", code:"EID50",       type:"pct",      value:50,   minOrder:1500, maxUses:200,  usedCount:200, singleUse:false, freeShip:false, status:"expired",  expiresAt:"2025-04-10", description:"Eid special 50% off", applicableTo:"all" },
  { id:"c5", code:"VIP500",      type:"flat",     value:500,  minOrder:3000, maxUses:50,   usedCount:9,   singleUse:false, freeShip:false, status:"active",   expiresAt:"2025-12-31", description:"VIP customer discount", applicableTo:"all" },
  { id:"c6", code:"NEWBAG15",    type:"pct",      value:15,   minOrder:0,    maxUses:0,    usedCount:3,   singleUse:false, freeShip:false, status:"inactive", expiresAt:"",           description:"15% off on bags only", applicableTo:"Bags" },
  { id:"c7", code:"CART2025XJ",  type:"pct",      value:10,   minOrder:0,    maxUses:1,    usedCount:0,   singleUse:true,  freeShip:false, status:"active",   expiresAt:"2025-05-20", description:"Abandoned cart recovery — single use", applicableTo:"all" },
];

const today = new Date().toISOString().split("T")[0];

const couponStatus = (c) => {
  if (c.status === "inactive") return ["inactive", "#64748B15", "#64748B"];
  if (c.expiresAt && c.expiresAt < today) return ["expired", "#EF444415", "#DC2626"];
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) return ["maxed", "#F59E0B15", "#D97706"];
  return ["active", "#10B98115", "#059669"];
};

const discLabel = (c) => {
  if (c.type === "free_ship") return "Free Shipping";
  if (c.type === "pct")  return `${c.value}% off`;
  return `৳${c.value} off`;
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SL({ c, T, req, sub }) {
  return (
    <div style={{ marginBottom:"6px" }}>
      <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{c}{req && <span style={{ color:"#EF4444", marginLeft:"3px" }}>*</span>}</div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"1px" }}>{sub}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, T, type, style }) {
  const [f, setF] = useState(false);
  return (
    <input type={type||"text"} value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", ...(style||{}) }}/>
  );
}

function Sel({ value, onChange, children, T }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", cursor:"pointer", fontFamily:"inherit" }}>
      {children}
    </select>
  );
}

function Toggle({ val, set, label, sub, T }) {
  return (
    <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"10px 12px", background:T.bg, borderRadius:"8px", border:`1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{label}</div>
        {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"1px" }}>{sub}</div>}
      </div>
      <div onClick={() => set(p => !p)}
        style={{ width:"38px", height:"22px", borderRadius:"22px", background:val?T.accent:"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:val?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
      </div>
    </label>
  );
}

// Usage progress bar
function UsageBar({ used, max, T }) {
  if (!max) return <span style={{ fontSize:"11px", color:T.textMuted }}>∞ unlimited</span>;
  const pct = Math.min(100, Math.round(used / max * 100));
  const color = pct >= 100 ? "#DC2626" : pct >= 80 ? "#D97706" : "#059669";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
        <span style={{ fontSize:"11px", color:T.textMid, fontWeight:600 }}>{used} / {max} used</span>
        <span style={{ fontSize:"10px", color }}>{pct}%</span>
      </div>
      <div style={{ height:"5px", background:T.border, borderRadius:"5px" }}>
        <div style={{ height:"5px", width:`${pct}%`, background:color, borderRadius:"5px", transition:"width 0.3s" }}/>
      </div>
    </div>
  );
}

// Coupon card (grid view)
function CouponCard({ coupon, onEdit, onToggle, onDelete, T }) {
  const [, bgColor, textColor] = couponStatus(coupon);
  const [statusKey] = couponStatus(coupon);
  const isActive = statusKey === "active";
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
      {/* Top color stripe */}
      <div style={{ height:"6px", background:coupon.type==="free_ship"?"#0D9488":coupon.type==="pct"?"#6366F1":"#D97706" }}/>
      <div style={{ padding:"14px" }}>
        {/* Code + status */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
          <div style={{ fontFamily:"monospace", fontSize:"16px", fontWeight:800, color:T.text, letterSpacing:"1px" }}>{coupon.code}</div>
          <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:bgColor, color:textColor, textTransform:"uppercase" }}>{statusKey}</span>
        </div>

        {/* Discount type */}
        <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"8px" }}>
          <span style={{ fontSize:"20px" }}>{coupon.type==="free_ship"?"🚚":coupon.type==="pct"?"%":"৳"}</span>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:coupon.type==="free_ship"?"#0D9488":coupon.type==="pct"?"#6366F1":"#D97706" }}>{discLabel(coupon)}</div>
            {coupon.minOrder > 0 && <div style={{ fontSize:"10px", color:T.textMuted }}>Min. order ৳{coupon.minOrder.toLocaleString()}</div>}
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"10px", minHeight:"16px" }}>{coupon.description}</div>

        {/* Tags */}
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"10px" }}>
          {coupon.singleUse && <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px", background:"#6366F115", color:"#6366F1" }}>SINGLE USE</span>}
          {coupon.freeShip  && <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px", background:"#0D948815", color:"#0D9488" }}>FREE SHIP</span>}
          {coupon.applicableTo !== "all" && <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px", background:"#D9770615", color:"#D97706" }}>{coupon.applicableTo} only</span>}
          {coupon.expiresAt && <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px", background:T.tHead, color:T.textMuted }}>Exp {coupon.expiresAt}</span>}
        </div>

        {/* Usage */}
        <div style={{ marginBottom:"12px" }}>
          <UsageBar used={coupon.usedCount} max={coupon.maxUses} T={T}/>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:"6px" }}>
          <button onClick={() => onEdit(coupon)}
            style={{ flex:1, background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"7px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
            ✏ Edit
          </button>
          <button onClick={() => onToggle(coupon.id)}
            style={{ flex:1, background:isActive?"#F59E0B15":"#10B98115", border:`1px solid ${isActive?"#F59E0B30":"#10B98130"}`, color:isActive?"#D97706":"#059669", borderRadius:"7px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
            {isActive ? "⏸ Pause" : "▶ Activate"}
          </button>
          <button onClick={() => onDelete(coupon.id)}
            style={{ background:"#EF444412", border:"1px solid #EF444425", color:"#DC2626", borderRadius:"7px", padding:"7px 9px", fontSize:"11px", cursor:"pointer" }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// Coupon row (table view)
function CouponRow({ coupon, onEdit, onToggle, onDelete, T }) {
  const [, bgColor, textColor] = couponStatus(coupon);
  const [statusKey] = couponStatus(coupon);
  const isActive = statusKey === "active";
  return (
    <div style={{ display:"grid", gridTemplateColumns:"170px 110px 120px 120px 90px 110px 240px 130px", padding:"10px 14px", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}
      onMouseEnter={e => e.currentTarget.style.background = T.rowHover}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ fontFamily:"monospace", fontSize:"13px", fontWeight:800, color:T.text }}>{coupon.code}</div>
      <div style={{ fontSize:"13px", fontWeight:700, color:coupon.type==="free_ship"?"#0D9488":coupon.type==="pct"?"#6366F1":"#D97706" }}>{discLabel(coupon)}</div>
      <div style={{ fontSize:"12px", color:T.textMuted }}>{coupon.minOrder > 0 ? `Min ৳${coupon.minOrder.toLocaleString()}` : "No minimum"}</div>
      <div><UsageBar used={coupon.usedCount} max={coupon.maxUses} T={T}/></div>
      <div style={{ fontSize:"11px", color:T.textMuted }}>{coupon.expiresAt || "—"}</div>
      <div><span style={{ fontSize:"12px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:bgColor, color:textColor, textTransform:"uppercase" }}>{statusKey}</span></div>
      <div style={{ fontSize:"11px", color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{coupon.description}</div>
      <div style={{ display:"flex", gap:"5px" }}>
        <button onClick={() => onEdit(coupon)} style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"5px", padding:"4px 8px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Edit</button>
        <button onClick={() => onToggle(coupon.id)} style={{ background:isActive?"#F59E0B15":"#10B98115", border:`1px solid ${isActive?"#F59E0B30":"#10B98130"}`, color:isActive?"#D97706":"#059669", borderRadius:"5px", padding:"4px 8px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>{isActive?"Pause":"On"}</button>
        <button onClick={() => onDelete(coupon.id)} style={{ background:"#EF444412", border:"1px solid #EF444425", color:"#DC2626", borderRadius:"5px", padding:"4px 7px", fontSize:"10px", cursor:"pointer" }}>🗑</button>
      </div>
    </div>
  );
}

// ── COUPON FORM MODAL ─────────────────────────────────────────────────────
function CouponModal({ coupon, onSave, onClose, T }) {
  const isNew = !coupon.id;
  const [code,         setCode]         = useState(coupon.code||"");
  const [type,         setType]         = useState(coupon.type||"pct");
  const [value,        setValue]        = useState(coupon.value||"");
  const [minOrder,     setMinOrder]     = useState(coupon.minOrder||"");
  const [maxUses,      setMaxUses]      = useState(coupon.maxUses||"");
  const [singleUse,    setSingleUse]    = useState(coupon.singleUse||false);
  const [freeShip,     setFreeShip]     = useState(coupon.freeShip||false);
  const [expiresAt,    setExpiresAt]    = useState(coupon.expiresAt||"");
  const [description,  setDescription]  = useState(coupon.description||"");
  const [applicableTo, setApplicableTo] = useState(coupon.applicableTo||"all");
  const [status,       setStatus]       = useState(coupon.status||"active");

  const genCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    setCode(Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join(""));
  };

  const canSave = code.trim() && (type === "free_ship" || value > 0);

  const handleSave = async () => {
    if (!canSave) return;
    await onSave({
      id: coupon.id || "c" + Date.now(),
      code: code.toUpperCase().trim(),
      type, value:parseFloat(value)||0,
      minOrder:parseInt(minOrder)||0,
      maxUses:parseInt(maxUses)||0,
      usedCount: coupon.usedCount||0,
      singleUse, freeShip, expiresAt, description, applicableTo, status
    });
  };

  const IS = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

  // Live preview
  const previewDisc = type==="free_ship" ? "Free Shipping" : type==="pct" ? `${value||0}% off` : `৳${value||0} off`;
  const previewMin  = minOrder > 0 ? ` on orders above ৳${minOrder}` : "";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:"580px", maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", zIndex:1, boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:T.surface, zIndex:2 }}>
          <span style={{ fontSize:"14px", fontWeight:800, color:T.text }}>{isNew ? "Create New Coupon" : `Edit — ${coupon.code}`}</span>
          <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"3px 9px", cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"16px" }}>

          {/* Code */}
          <div>
            <SL c="Coupon Code" T={T} req sub="Uppercase letters and numbers only. Customers type this at checkout."/>
            <div style={{ display:"flex", gap:"8px" }}>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} placeholder="e.g. WELCOME20"
                style={{ ...IS, fontFamily:"monospace", fontSize:"15px", fontWeight:800, letterSpacing:"1.5px", flex:1 }}/>
              <button onClick={genCode}
                style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"8px", padding:"9px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                ⚡ Generate
              </button>
            </div>
          </div>

          {/* Discount type */}
          <div>
            <SL c="Discount Type" T={T} req/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
              {[
                ["pct",       "%",  "Percentage off",    "#6366F1"],
                ["flat",      "৳",  "Flat amount off",   "#D97706"],
                ["free_ship", "🚚", "Free shipping",     "#0D9488"],
              ].map(([id, icon, label, color]) => (
                <div key={id} onClick={() => { setType(id); if(id==="free_ship") setFreeShip(true); else setFreeShip(false); }}
                  style={{ padding:"12px", borderRadius:"9px", border:`2px solid ${type===id?color:T.border}`, background:type===id?color+"12":T.bg, cursor:"pointer", textAlign:"center", transition:"all 0.12s" }}>
                  <div style={{ fontSize:"20px", marginBottom:"4px" }}>{icon}</div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:type===id?color:T.textMuted }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Value */}
          {type !== "free_ship" && (
            <div>
              <SL c={type==="pct" ? "Discount Percentage (%)" : "Discount Amount (BDT)"} T={T} req/>
              <Inp value={value} onChange={e => setValue(e.target.value)} placeholder={type==="pct"?"e.g. 20":"e.g. 100"} T={T} type="number"/>
              {value > 0 && type === "pct" && value > 100 && (
                <div style={{ fontSize:"11px", color:"#DC2626", marginTop:"4px" }}>⚠ Percentage can't exceed 100%</div>
              )}
            </div>
          )}

          {/* Conditions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <SL c="Minimum Order Amount (BDT)" T={T} sub="Leave 0 for no minimum"/>
              <Inp value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="0 — no minimum" T={T} type="number"/>
            </div>
            <div>
              <SL c="Maximum Uses" T={T} sub="Leave 0 for unlimited uses"/>
              <Inp value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="0 — unlimited" T={T} type="number"/>
            </div>
          </div>

          {/* Expiry */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <SL c="Expiry Date" T={T} sub="Leave empty — coupon never expires"/>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} min={today}
                style={{ ...IS }}/>
            </div>
            <div>
              <SL c="Applicable To" T={T}/>
              <Sel value={applicableTo} onChange={e => setApplicableTo(e.target.value)} T={T}>
                <option value="all">All Products</option>
                <option value="Bags">Bags only</option>
                <option value="Shoes">Shoes only</option>
                <option value="Accessories">Accessories only</option>
              </Sel>
            </div>
          </div>

          {/* Options */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <Toggle val={singleUse} set={setSingleUse} label="Single Use Per Customer" sub="Each customer can only use this coupon once" T={T}/>
            {type !== "free_ship" && (
              <Toggle val={freeShip} set={setFreeShip} label="Also Include Free Shipping" sub="Customer gets both the discount AND free delivery" T={T}/>
            )}
            <Toggle val={status==="active"} set={v => setStatus(v?"active":"inactive")} label="Active" sub="Inactive coupons cannot be used at checkout" T={T}/>
          </div>

          {/* Description */}
          <div>
            <SL c="Internal Description (team only)" T={T}/>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Eid campaign, expires end of April..."
              style={{ ...IS }}/>
          </div>

          {/* Live preview */}
          {code && (
            <div style={{ background:T.accent+"0A", border:`1px solid ${T.accent}25`, borderRadius:"10px", padding:"14px" }}>
              <div style={{ fontSize:"10px", color:T.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"10px" }}>Live Preview — how this coupon appears</div>
              <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ fontFamily:"monospace", fontSize:"18px", fontWeight:800, color:T.text, background:T.bg, padding:"8px 14px", borderRadius:"8px", border:`2px dashed ${T.accent}40`, letterSpacing:"2px" }}>{code}</div>
                <div>
                  <div style={{ fontSize:"15px", fontWeight:800, color:type==="free_ship"?"#0D9488":type==="pct"?"#6366F1":"#D97706" }}>{previewDisc}{previewMin}</div>
                  <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {singleUse && <span>· Single use</span>}
                    {freeShip && type!=="free_ship" && <span style={{ color:"#0D9488" }}>+ Free shipping</span>}
                    {maxUses > 0 && <span>· Max {maxUses} uses</span>}
                    {expiresAt && <span>· Expires {expiresAt}</span>}
                    {applicableTo !== "all" && <span style={{ color:"#D97706" }}>· {applicableTo} only</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:"flex", gap:"8px", paddingTop:"4px" }}>
            <button onClick={onClose} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!canSave}
              style={{ flex:2, background:canSave?T.accent:"transparent", border:`1px solid ${canSave?T.accent:T.border}`, color:canSave?"#fff":T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"13px", fontWeight:700, cursor:canSave?"pointer":"not-allowed" }}>
              {isNew ? "✓ Create Coupon" : "✓ Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const [dark, setDark]         = useState(false);
  const T = dark ? DARK : LIGHT;
  const [coupons, setCoupons]   = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [editCoupon, setEditCoupon] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [delId, setDelId]           = useState(null);
  const [feedback, setFeedback]     = useState("");
  const [loadError, setLoadError]   = useState("");
    useEffect(() => {
      let cancelled = false;
      const hydrate = async () => {
        const data = await loadAppState<any[]>("coupons.list", []);
        if (cancelled) return;
        if (Array.isArray(data)) {
          setCoupons(data as any);
        } else {
          setCoupons([]);
        }
      };
      hydrate().catch((error: any) => {
        if (cancelled) return;
        setLoadError(String(error?.message || "Failed to load coupons."));
        setCoupons([]);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    const persistCoupons = async (next: any[], successMessage: string, rollback?: any[]) => {
      try {
        await saveAppState("coupons.list", next);
        setFeedback(successMessage);
      } catch (error: any) {
        if (rollback) setCoupons(rollback as any);
        setFeedback(String(error?.message || "Failed to save coupon changes."));
        throw error;
      }
    };

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

  const filtered = coupons.filter(c => {
    const [statusKey] = couponStatus(c);
    if (filter !== "all" && statusKey !== filter) return false;
    if (search) { const q = search.toLowerCase(); if (!c.code.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false; }
    return true;
  });

  const handleSave = async (updated) => {
    const snapshot = [...coupons];
    if (coupons.find(c => c.id === updated.id)) {
      const next = coupons.map(c => c.id === updated.id ? updated : c);
      setCoupons(next as any);
      await persistCoupons(next as any[], "Coupon updated successfully.", snapshot as any[]);
    } else {
      const next = [...coupons, updated];
      setCoupons(next as any);
      await persistCoupons(next as any[], "Coupon created successfully.", snapshot as any[]);
    }
    setShowModal(false); setEditCoupon(null);
  };

  const handleToggle = async (id) => {
    const target = coupons.find(c => c.id === id);
    if (!target) return;
    const nextStatus = target.status === "active" ? "inactive" : "active";
    if (!window.confirm(`Change status for coupon ${target.code} to ${nextStatus}?`)) return;
    const snapshot = [...coupons];
    const next = coupons.map(c => c.id === id ? { ...c, status: nextStatus } : c);
    setCoupons(next as any);
    await persistCoupons(next as any[], `Coupon ${target.code} is now ${nextStatus}.`, snapshot as any[]);
  };

  const handleDelete = async (id) => {
    const snapshot = [...coupons];
    const next = coupons.filter(c => c.id !== id);
    setCoupons(next as any);
    await persistCoupons(next as any[], "Coupon deleted successfully.", snapshot as any[]);
    setDelId(null);
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const openNew  = () => { setEditCoupon({ code:"", type:"pct", value:"", minOrder:"", maxUses:"", singleUse:false, freeShip:false, expiresAt:"", description:"", applicableTo:"all", status:"active" }); setShowModal(true); };
  const openEdit = (c) => { setEditCoupon(c); setShowModal(true); };

  const activeCount  = coupons.filter(c => couponStatus(c)[0] === "active").length;
  const totalUsed    = coupons.reduce((a, b) => a + b.usedCount, 0);
  const expiredCount = coupons.filter(c => couponStatus(c)[0] === "expired").length;
  const maxedCount   = coupons.filter(c => couponStatus(c)[0] === "maxed").length;

  const stats = [
    ["Total Coupons", coupons.length, "#6366F1"],
    ["Active",        activeCount,    "#059669"],
    ["Total Used",    totalUsed,      "#0D9488"],
    ["Expired",       expiredCount,   "#DC2626"],
    ["Maxed Out",     maxedCount,     "#D97706"],
    ["Inactive",      coupons.filter(c => c.status === "inactive").length, "#64748B"],
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
        badgeByLabel={{ Coupons: { text: String(coupons.length) } }}
        onLogout={handleSignOut}
      />

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:"10px", flexShrink:0 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"12px" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupon code or description..."
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 10px 7px 30px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
          </div>
          {/* View toggle */}
          <div style={{ display:"flex", gap:"2px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
            {[["grid","⊞ Grid"],["table","≡ Table"]].map(([id, label]) => (
              <button key={id} onClick={() => setViewMode(id)} style={{ padding:"5px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:viewMode===id?T.accent+"18":"transparent", color:viewMode===id?T.accent:T.textMuted }}>{label}</button>
            ))}
          </div>
          <button onClick={openNew} style={{ background:T.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"7px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            + Create Coupon
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>

          {/* Title */}
          <div style={{ marginBottom:"14px" }}>
            <h1 style={{ margin:0, fontSize:"16px", fontWeight:800, color:T.text }}>Coupons & Discounts</h1>
            <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>Create and manage discount codes for your customers</div>
          </div>

          {feedback && (
            <div style={{ marginBottom:"12px", padding:"10px 12px", borderRadius:"8px", background:"#05966915", border:"1px solid #05966930", color:"#059669", fontSize:"12px", fontWeight:700 }}>
              {feedback}
            </div>
          )}

          {loadError && (
            <div style={{ marginBottom:"12px", padding:"10px 12px", borderRadius:"8px", background:"#EF444415", border:"1px solid #EF444430", color:"#DC2626", fontSize:"12px", fontWeight:700 }}>
              {loadError}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"8px", marginBottom:"14px" }}>
            {stats.map(([label, val, color], i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"11px 12px" }}>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"5px" }}>{label}</div>
                <div style={{ fontSize:"18px", fontWeight:800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center" }}>
            <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
              {[["all","All","#6366F1"],["active","Active","#059669"],["inactive","Inactive","#64748B"],["expired","Expired","#DC2626"],["maxed","Maxed Out","#D97706"]].map(([id, label, color]) => (
                <button key={id} onClick={() => setFilter(id)}
                  style={{ padding:"5px 12px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:filter===id?color+"18":"transparent", color:filter===id?color:T.textMuted }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft:"auto", fontSize:"11px", color:T.textMuted }}>Showing {filtered.length} of {coupons.length}</div>
          </div>

          {/* GRID */}
          {viewMode === "grid" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"12px" }}>
              {filtered.map(c => (
                <CouponCard key={c.id} coupon={c} onEdit={openEdit} onToggle={handleToggle} onDelete={id => setDelId(id)} T={T}/>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"40px", color:T.textMuted, fontSize:"13px" }}>
                  No coupons match your filters.
                </div>
              )}
            </div>
          )}

          {/* TABLE */}
          {viewMode === "table" && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"170px 110px 120px 120px 90px 110px 240px 130px", padding:"9px 14px", borderBottom:`1px solid ${T.border}`, background:T.tHead }}>
                {["Code","Discount","Min Order","Usage","Expires","Status","Description","Actions"].map((h, i) => (
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
                ))}
              </div>
              {filtered.map(c => (
                <CouponRow key={c.id} coupon={c} onEdit={openEdit} onToggle={handleToggle} onDelete={id => setDelId(id)} T={T}/>
              ))}
              {filtered.length === 0 && <div style={{ padding:"32px", textAlign:"center", color:T.textMuted, fontSize:"12px" }}>No coupons match.</div>}
            </div>
          )}

        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && editCoupon && (
        <CouponModal coupon={editCoupon} onSave={handleSave} onClose={() => { setShowModal(false); setEditCoupon(null); }} T={T}/>
      )}

      {/* DELETE CONFIRM */}
      {delId && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={() => setDelId(null)}/>
          <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", padding:"28px", maxWidth:"360px", width:"90%", textAlign:"center", zIndex:1 }}>
            <div style={{ fontSize:"32px", marginBottom:"10px" }}>🗑</div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text, marginBottom:"6px" }}>Delete this coupon?</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"20px", lineHeight:"1.6" }}>
              Code: <strong style={{ fontFamily:"monospace", color:T.text }}>{coupons.find(c => c.id === delId)?.code}</strong><br/>
              This cannot be undone. Customers who have this code will no longer be able to use it.
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setDelId(null)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(delId)} style={{ flex:1, background:"#EF4444", border:"none", color:"#fff", borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}










