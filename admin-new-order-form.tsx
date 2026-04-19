import { useState, useRef, useEffect } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import { appendTimelineEvent, loadOrderCollection, saveOrderCollection } from "./core/order-store";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", success:"#059669", warning:"#D97706" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#FFFFFF", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", success:"#059669", warning:"#D97706" };

const CATALOG = [
  { id:"p1",  name:"Leather Tote Bag",     price:2500, sizes:["S","M","L"],             colors:["Black","Brown","Beige"],  img:"🛍️", bg:"#92400E", cat:"Bags",        stock:{"S-Black":3,"S-Brown":2,"S-Beige":0,"M-Black":0,"M-Brown":1,"M-Beige":4,"L-Black":2,"L-Brown":0,"L-Beige":1} },
  { id:"p2",  name:"High Ankle Converse",  price:3200, sizes:["36","37","38","39","40"], colors:["White","Black"],          img:"👟", bg:"#1E40AF", cat:"Shoes",       stock:{"36-White":2,"36-Black":1,"37-White":0,"37-Black":3,"38-White":5,"38-Black":0,"39-White":2,"39-Black":2,"40-White":0,"40-Black":1} },
  { id:"p3",  name:"Canvas Backpack",      price:2400, sizes:["M","L"],                 colors:["Olive","Grey","Navy"],    img:"🎒", bg:"#065F46", cat:"Bags",        stock:{"M-Olive":4,"M-Grey":2,"M-Navy":0,"L-Olive":1,"L-Grey":0,"L-Navy":3} },
  { id:"p4",  name:"Silver Bracelet",      price:1800, sizes:["Free"],                  colors:["Silver","Gold"],          img:"📿", bg:"#6B21A8", cat:"Accessories", stock:{"Free-Silver":8,"Free-Gold":0} },
  { id:"p5",  name:"Quilted Shoulder Bag", price:3500, sizes:["S","M"],                 colors:["Beige","Pink","Black"],   img:"👜", bg:"#9D174D", cat:"Bags",        stock:{"S-Beige":2,"S-Pink":0,"S-Black":1,"M-Beige":0,"M-Pink":3,"M-Black":2} },
  { id:"p6",  name:"Platform Sneakers",    price:3800, sizes:["36","37","38","39","40"], colors:["White","Black"],          img:"👠", bg:"#7C3AED", cat:"Shoes",       stock:{"36-White":0,"36-Black":0,"37-White":2,"37-Black":1,"38-White":0,"38-Black":3,"39-White":1,"39-Black":0,"40-White":2,"40-Black":1} },
  { id:"p7",  name:"Embroidered Clutch",   price:2200, sizes:["Free"],                  colors:["Red","Blue","Gold"],      img:"👝", bg:"#B91C1C", cat:"Bags",        stock:{"Free-Red":3,"Free-Blue":1,"Free-Gold":0} },
  { id:"p8",  name:"Ankle Strap Heels",    price:2800, sizes:["36","37","38","39"],     colors:["Nude","Black"],           img:"🥿", bg:"#B45309", cat:"Shoes",       stock:{"36-Nude":2,"36-Black":1,"37-Nude":0,"37-Black":4,"38-Nude":3,"38-Black":0,"39-Nude":1,"39-Black":2} },
  { id:"p9",  name:"Gold Chain Necklace",  price:2100, sizes:["Free"],                  colors:["Gold","Rose Gold"],       img:"💛", bg:"#92400E", cat:"Accessories", stock:{"Free-Gold":5,"Free-Rose Gold":2} },
  { id:"p10", name:"Woven Raffia Bag",     price:1900, sizes:["S","M","L"],             colors:["Natural","Black"],        img:"🧺", bg:"#78350F", cat:"Bags",        stock:{"S-Natural":3,"S-Black":2,"M-Natural":0,"M-Black":1,"L-Natural":4,"L-Black":0} },
];

const ZONES = {
  "Dhaka":["Dhanmondi","Uttara","Mirpur","Banani","Gulshan","Mohammadpur","Motijheel","Tejgaon","Bashundhara","Badda"],
  "Chittagong":["Agrabad","Nasirabad","Panchlaish","Halishahar","Khulshi"],
  "Sylhet":["Zindabazar","Amberkhana","Shahjalal","Akhalia"],
  "Rajshahi":["Shaheb Bazar","Uposhahar","Boalia"],
  "Khulna":["Sonadanga","Khalishpur","Daulatpur"],
  "Gazipur":["Tongi","Joydebpur","Konabari"],
  "Narayanganj":["Fatulla","Siddhirganj","Rupganj"],
};

const SOURCES = [
  { id:"facebook",  label:"Facebook",  icon:"📘", color:"#1877F2" },
  { id:"instagram", label:"Instagram", icon:"📸", color:"#E1306C" },
  { id:"whatsapp",  label:"WhatsApp",  icon:"💬", color:"#25D366" },
  { id:"phone",     label:"Phone",     icon:"📞", color:"#64748B" },
  { id:"website",   label:"Website",   icon:"🌐", color:"#6366F1" },
  { id:"walkin",    label:"Walk-in",   icon:"🏪", color:"#D97706" },
];

const PAY_METHODS = [
  { id:"bkash",  label:"bKash",  icon:"💳", color:"#E2136E" },
  { id:"nagad",  label:"Nagad",  icon:"📱", color:"#F77F00" },
  { id:"cod",    label:"COD",    icon:"💵", color:"#059669" },
  { id:"others", label:"Others", icon:"⚙",  color:"#64748B" },
];

const VIEW_ORDER_KEY = "shopadmin.viewOrder.num";

const getStockCount = (prod, size, color) => {
  if (!prod||!size||!color) return null;
  const v = prod.stock?.[`${size}-${color}`];
  return v === undefined ? null : v;
};

// ── SUB-COMPONENTS (outside App) ─────────────────────────────────────────

function SL({ c, T, req }) {
  return (
    <div style={{fontSize:"11px",color:T.textMuted,fontWeight:600,marginBottom:"6px"}}>
      {c}{req&&<span style={{color:"#EF4444",marginLeft:"3px"}}>*</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, T, style }) {
  const [f,setF] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{background:T.input,border:`1.5px solid ${f?T.accent:T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit",...(style||{})}}/>
  );
}

function Sel({ value, onChange, children, T, disabled }) {
  const [f,setF] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={!!disabled}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{background:T.input,border:`1.5px solid ${f?T.accent:T.ib}`,borderRadius:"8px",color:value?T.text:T.textMuted,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",opacity:disabled?0.5:1}}>
      {children}
    </select>
  );
}

function Card({ title, icon, children, T }) {
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",marginBottom:"14px",overflow:"hidden"}}>
      <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"7px"}}>
        <span style={{fontSize:"14px"}}>{icon}</span>
        <span style={{fontSize:"12px",fontWeight:700,color:T.text}}>{title}</span>
      </div>
      <div style={{padding:"14px 16px"}}>{children}</div>
    </div>
  );
}

// Button-grid selector — for source and payment
function BtnSelect({ options, value, onChange, T }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px"}}>
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button key={opt.id} onClick={()=>onChange(opt.id)}
            style={{padding:"10px 8px",borderRadius:"9px",border:`1.5px solid ${active ? opt.color : T.border}`,background:active ? opt.color+"14" : T.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"all 0.12s"}}>
            <span style={{fontSize:"18px"}}>{opt.icon}</span>
            <span style={{fontSize:"10px",fontWeight:700,color:active ? opt.color : T.textMuted}}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StockBadge({ count }) {
  if (count===null) return null;
  if (count===0)  return <span style={{fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"4px",background:"#EF444415",color:"#DC2626"}}>✕ Out of stock → Pre-Order</span>;
  if (count<=2)   return <span style={{fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"4px",background:"#F59E0B15",color:"#D97706"}}>⚠ Only {count} left</span>;
  return <span style={{fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"4px",background:"#10B98115",color:"#059669"}}>✓ {count} in stock</span>;
}

function TypeBadge({ type }) {
  return type==="stock"
    ? <span style={{fontSize:"9px",fontWeight:700,padding:"1px 5px",borderRadius:"3px",background:"#10B98115",color:"#059669"}}>📦 Stock</span>
    : <span style={{fontSize:"9px",fontWeight:700,padding:"1px 5px",borderRadius:"3px",background:"#F59E0B15",color:"#D97706"}}>⏳ Pre-Order</span>;
}

function SuccessScreen({ T, orderNum, custName, custPhone, items, discAmt, delivery, advance, codDue, onNew, mode, onViewOrder, orderLink, onCopyLink, onShareWhatsApp }) {
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"36px",maxWidth:"440px",width:"90%",textAlign:"center"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"50%",background:mode==="link"?"#6366F118":"#05996918",border:`2px solid ${mode==="link"?"#6366F1":"#059669"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",margin:"0 auto 14px"}}>
          {mode==="link"?"🔗":"✓"}
        </div>
        <div style={{fontSize:"18px",fontWeight:800,color:T.text,marginBottom:"4px"}}>{mode==="link"?"Payment Link Created!":"Order Confirmed!"}</div>
        <div style={{fontSize:"20px",fontWeight:800,color:T.accent,marginBottom:"14px"}}>{orderNum}</div>
        <div style={{background:T.bg,borderRadius:"9px",padding:"12px 14px",marginBottom:"16px",textAlign:"left"}}>
          {items.map((it,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"4px",fontSize:"12px"}}>
              <span style={{color:T.textMid}}>{it.name} {it.size!=="Free"?`(${it.size})`:""} {it.color} ×{it.qty}</span>
              <span style={{fontWeight:600,color:T.text}}>৳{(it.price*it.qty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{height:"1px",background:T.border,margin:"7px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:T.textMuted,marginBottom:"3px"}}><span>Delivery</span><span>৳{delivery}</span></div>
          {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:T.success,marginBottom:"3px"}}><span>Discount</span><span>-৳{discAmt}</span></div>}
          {advance>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:T.success,marginBottom:"3px"}}><span>Advance</span><span>-৳{advance}</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:"7px",borderTop:`1px solid ${T.border}`}}>
            <span style={{fontWeight:700,color:T.warning}}>COD Due</span>
            <span style={{fontSize:"16px",fontWeight:800,color:T.warning}}>৳{codDue.toLocaleString()}</span>
          </div>
        </div>
        {mode==="link"&&(
          <div style={{background:T.bg,borderRadius:"8px",padding:"10px 12px",marginBottom:"14px"}}>
            <div style={{fontSize:"11px",color:T.accent,wordBreak:"break-all",marginBottom:"8px"}}>{orderLink}</div>
            <div style={{display:"flex",gap:"7px"}}>
              <button onClick={onCopyLink} style={{flex:1,background:T.accent,border:"none",color:"#fff",borderRadius:"7px",padding:"8px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>📋 Copy Link</button>
              <button onClick={onShareWhatsApp} style={{flex:1,background:"#25D36618",border:"1px solid #25D36630",color:"#25D366",borderRadius:"7px",padding:"8px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>💬 WhatsApp</button>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:"9px"}}>
          <button onClick={onNew} style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:"9px",padding:"10px",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>+ New Order</button>
          <button onClick={onViewOrder} style={{flex:1,background:T.accent,border:"none",color:"#fff",borderRadius:"9px",padding:"10px",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>View Order</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function CreateOrder() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;

  const [source,       setSource]       = useState("");
  const [custName,     setCustName]     = useState("");
  const [custPhone,    setCustPhone]    = useState("");
  const [custCity,     setCustCity]     = useState("");
  const [custZone,     setCustZone]     = useState("");
  const [custAddr,     setCustAddr]     = useState("");
  const [custNote,     setCustNote]     = useState("");
  const [intNote,      setIntNote]      = useState("");
  const [items,        setItems]        = useState([]);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [discount,     setDiscount]     = useState(0);
  const [discType,     setDiscType]     = useState("flat");
  const [advance,      setAdvance]      = useState(0);
  const [payMethod,    setPayMethod]    = useState("");
  const [searchQ,      setSearchQ]      = useState("");
  const [showDrop,     setShowDrop]     = useState(false);
  const [selProdId,    setSelProdId]    = useState("");
  const [selSize,      setSelSize]      = useState("");
  const [selColor,     setSelColor]     = useState("");
  const [selQty,       setSelQty]       = useState(1);
  const [done,         setDone]         = useState(null);
  const [createdOrderNum, setCreatedOrderNum] = useState("");
  const [addrFocus,    setAddrFocus]    = useState(false);
  const sessionUser = loadSession()?.user;
  const isAgent = sessionUser?.role === "agent";
  const assignedAgent = sessionUser?.name || "Admin";

  const [delIn]  = useState(80);
  const [delOut] = useState(150);
  const searchRef = useRef(null);

  const deliveryCharge = deliveryZone==="inside" ? delIn : deliveryZone==="outside" ? delOut : 0;
  const subtotal  = items.reduce((s,i)=>s+i.price*i.qty,0);
  const discAmt   = !discount ? 0 : discType==="pct" ? Math.round(subtotal*discount/100) : discount;
  const codDue    = Math.max(0, subtotal-discAmt+deliveryCharge-advance);
  const selProd   = CATALOG.find(p=>p.id===selProdId)||null;
  const stockCount = getStockCount(selProd, selSize, selColor);
  const autoType  = stockCount===null ? "stock" : stockCount>0 ? "stock" : "preorder";
  const effectiveType = autoType;
  const orderNum = createdOrderNum || "#" + (1011 + items.length + (custPhone.length % 50));
  const orderLink = `${window.location.origin}/#/invoice?order=${encodeURIComponent(orderNum)}`;

  const filtProd = CATALOG.filter(p =>
    !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.cat.toLowerCase().includes(searchQ.toLowerCase())
  ).slice(0,8);

  useEffect(() => {
    const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const pickProd = (p) => { setSelProdId(p.id); setSelSize(p.sizes[0]); setSelColor(p.colors[0]); setSelQty(1); setSearchQ(p.name); setShowDrop(false); };

  const addItem = () => {
    if (!selProdId||!selSize||!selColor) return;
    const p = CATALOG.find(x=>x.id===selProdId); if (!p) return;
    const idx = items.findIndex(i=>i.pid===p.id&&i.size===selSize&&i.color===selColor);
    if (idx>=0) { setItems(prev=>prev.map((it,i)=>i===idx?{...it,qty:it.qty+selQty}:it)); }
    else { setItems(prev=>[...prev,{pid:p.id,name:p.name,img:p.img,bg:p.bg,size:selSize,color:selColor,qty:selQty,price:p.price,type:effectiveType}]); }
    setSearchQ(""); setSelProdId(""); setSelSize(""); setSelColor(""); setSelQty(1);
  };

  const rmItem = (i)   => setItems(p=>p.filter((_,j)=>j!==i));
  const chgQty = (i,v) => setItems(p=>p.map((it,j)=>j===i?{...it,qty:Math.max(1,parseInt(v)||1)}:it));

  const canConfirm = custName&&custPhone&&custCity&&custZone&&custAddr&&items.length>0&&payMethod&&source&&deliveryZone;
  const canLink    = custName&&custPhone&&custCity&&custZone&&items.length>0&&deliveryZone;

  const getNextOrderNumber = () => {
    const existing = loadOrderCollection([]);
    let maxNum = 1000;
    existing.forEach((order) => {
      const numeric = parseInt(String(order?.num || "").replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(numeric)) {
        maxNum = Math.max(maxNum, numeric);
      }
    });
    return `#${maxNum + 1}`;
  };

  const createOrderRecord = (mode) => {
    const nextNum = getNextOrderNumber();
    const area = `${custCity} / ${custZone}`;
    const orderType = items.some((item) => item.type === "preorder") ? "preorder" : "stock";
    const now = new Date();
    const baseOrder = {
      id: `O${Date.now()}`,
      num: nextNum,
      type: orderType,
      status: "Placed",
      source,
      customer: custName,
      phone: custPhone,
      area,
      advance,
      discount,
      discType,
      pay: PAY_METHODS.find((method) => method.id === payMethod)?.label || "COD",
      payStatus: payMethod === "cod" ? "pending" : "verified",
      fraud: "low",
      agent: assignedAgent,
      placedBy: isAgent ? "agent" : "admin",
      date: now.toISOString().slice(0, 10),
      consId: null,
      issue: null,
      customerNote: custNote,
      internalNote: intNote,
      items: items.map((item) => ({
        pid: item.pid,
        name: item.name,
        size: item.size,
        color: item.color,
        qty: item.qty,
        price: item.price,
      })),
      createdFrom: mode,
    };

    const withTimeline = appendTimelineEvent(baseOrder, "Placed", custNote, isAgent ? "agent" : "admin");
    const existing = loadOrderCollection([]);
    saveOrderCollection([withTimeline, ...existing]);
    return nextNum;
  };

  const handleCreate = (mode) => {
    const nextNum = createOrderRecord(mode);
    setCreatedOrderNum(nextNum);
    setDone(mode);
  };

  const handleViewOrder = () => {
    if (typeof window !== "undefined" && orderNum) {
      window.sessionStorage.setItem(VIEW_ORDER_KEY, orderNum);
    }
    navigateByAdminNavLabel("Orders");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(orderLink);
    } catch {
      // Clipboard might be unavailable in some contexts.
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;
    const text = encodeURIComponent(`Hi ${custName || ""}, your order ${orderNum} is ready. Track here: ${orderLink}`);
    window.open(`https://wa.me/${custPhone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const reset = () => {
    setDone(null); setSource(""); setCustName(""); setCustPhone(""); setCustCity(""); setCustZone(""); setCustAddr(""); setCustNote(""); setIntNote("");
    setItems([]); setDeliveryZone(""); setDiscount(0); setDiscType("flat"); setAdvance(0); setPayMethod("");
    setSearchQ(""); setSelProdId(""); setSelSize(""); setSelColor(""); setSelQty(1);
    setCreatedOrderNum("");
  };

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
    window.dispatchEvent(new Event("hashchange"));
  };

  const IS = {background:T.input,border:`1.5px solid ${addrFocus?T.accent:T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",minHeight:"70px",fontFamily:"inherit"};

  if (done) return <SuccessScreen T={T} orderNum={orderNum} custName={custName} custPhone={custPhone} items={items} discAmt={discAmt} delivery={deliveryCharge} advance={advance} codDue={codDue} onNew={reset} mode={done} onViewOrder={handleViewOrder} orderLink={orderLink} onCopyLink={handleCopyLink} onShareWhatsApp={handleShareWhatsApp}/>;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"system-ui,sans-serif",color:T.text}}>

      {/* Topbar */}
      <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"0 22px",height:"52px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:"11px"}}>
          <button onClick={() => navigateByAdminNavLabel("Orders")} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"7px",padding:"5px 11px",fontSize:"12px",color:T.textMuted,cursor:"pointer"}}>← Back</button>
          <div>
            <div style={{fontSize:"14px",fontWeight:800,color:T.text}}>Create New Order</div>
            <div style={{fontSize:"10px",color:T.textMuted}}>Fields marked * are required</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button onClick={handleSignOut}
            style={{background:"#EF444410",border:"1px solid #EF444430",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",color:"#DC2626",fontSize:"11px",fontWeight:700}}>
            ↩ Logout
          </button>
          <button onClick={()=>setDark(!dark)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"8px",padding:"6px 11px",cursor:"pointer",color:T.textMid,fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",gap:"7px"}}>
            <span>{dark?"🌙":"☀️"}</span>
            <div style={{width:"26px",height:"15px",background:dark?"#6366F1":"#CBD5E1",borderRadius:"15px",position:"relative"}}>
              <div style={{width:"11px",height:"11px",background:"#fff",borderRadius:"50%",position:"absolute",top:"2px",left:dark?"13px":"2px",transition:"left 0.2s"}}/>
            </div>
          </button>
        </div>
      </div>

      <div style={{maxWidth:"980px",margin:"0 auto",padding:"20px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",alignItems:"start"}}>

        {/* ══ LEFT COLUMN ═══════════════════════════════════════ */}
        <div>

          {/* Source channel — button grid */}
          <Card title="Order Source" icon="📡" T={T}>
            <SL c="Source Channel" T={T} req/>
            <BtnSelect options={SOURCES} value={source} onChange={setSource} T={T}/>
            <div style={{height:"12px"}}/>
            <SL c="Handled By" T={T}/>
            <div style={{padding:"10px 12px",borderRadius:"8px",border:`1.5px solid ${T.border}`,background:T.bg,fontSize:"12px",fontWeight:700,color:T.textMid}}>
              {assignedAgent} (auto-assigned from logged-in account)
            </div>
          </Card>

          {/* Customer */}
          <Card title="Customer Details" icon="👤" T={T}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
              <div>
                <SL c="Full Name" T={T} req/>
                <Inp value={custName} onChange={e=>setCustName(e.target.value)} placeholder="e.g. Fatima Akter" T={T}/>
              </div>
              <div>
                <SL c="Phone Number" T={T} req/>
                <Inp value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="01XXXXXXXXX" T={T}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
              <div>
                <SL c="City / District" T={T} req/>
                <Sel value={custCity} onChange={e=>{setCustCity(e.target.value);setCustZone("");}} T={T}>
                  <option value="">Select city...</option>
                  {Object.keys(ZONES).map(c=><option key={c}>{c}</option>)}
                </Sel>
              </div>
              <div>
                <SL c="Area / Zone" T={T} req/>
                <Sel value={custZone} onChange={e=>setCustZone(e.target.value)} T={T} disabled={!custCity}>
                  <option value="">{custCity?"Select area...":"City first"}</option>
                  {custCity&&ZONES[custCity]?.map(z=><option key={z}>{z}</option>)}
                </Sel>
              </div>
            </div>
            <SL c="Full Delivery Address" T={T} req/>
            <textarea value={custAddr} onChange={e=>setCustAddr(e.target.value)} placeholder="House/flat number, road, landmark..."
              style={{...IS,borderColor:addrFocus?T.accent:T.ib}} onFocus={()=>setAddrFocus(true)} onBlur={()=>setAddrFocus(false)}/>
          </Card>

          {/* Notes */}
          <Card title="Notes (optional)" icon="📝" T={T}>
            <SL c="📢 Customer Note (shown on tracking page)" T={T}/>
            <textarea value={custNote} onChange={e=>setCustNote(e.target.value)} placeholder="e.g. Handle with care, call before delivery..."
              style={{...IS,borderColor:T.ib,marginBottom:"10px"}}/>
            <SL c="🔒 Internal Note (team only)" T={T}/>
            <textarea value={intNote} onChange={e=>setIntNote(e.target.value)} placeholder="e.g. Customer prefers afternoon delivery..."
              style={{...IS,borderColor:T.ib}}/>
          </Card>

        </div>

        {/* ══ RIGHT COLUMN ══════════════════════════════════════ */}
        <div>

          {/* Products */}
          <Card title="Products" icon="🛍️" T={T}>

            {/* Search */}
            <div ref={searchRef} style={{position:"relative",marginBottom:"12px"}}>
              <SL c="Search Product" T={T} req/>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:"11px",top:"50%",transform:"translateY(-50%)",fontSize:"12px"}}>🔍</span>
                <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setShowDrop(true);if(!e.target.value){setSelProdId("");setSelSize("");setSelColor("");}}}
                  onFocus={()=>setShowDrop(true)} placeholder="Type product name or category..."
                  style={{background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px 9px 32px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
              {showDrop&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",zIndex:100,boxShadow:"0 16px 40px rgba(0,0,0,0.18)",overflow:"hidden",maxHeight:"240px",overflowY:"auto"}}>
                  {filtProd.map(p=>(
                    <div key={p.id} onClick={()=>pickProd(p)}
                      style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{width:"34px",height:"34px",borderRadius:"7px",background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>{p.img}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"12px",fontWeight:600,color:T.text}}>{p.name}</div>
                        <div style={{fontSize:"10px",color:T.textMuted}}>{p.cat}</div>
                      </div>
                      <div style={{fontSize:"12px",fontWeight:700,color:T.accent}}>৳{p.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected product config */}
            {selProd&&(
              <div style={{background:T.accent+"08",border:`1.5px solid ${T.accent}22`,borderRadius:"9px",padding:"12px",marginBottom:"12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <div style={{width:"42px",height:"42px",borderRadius:"9px",background:selProd.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>{selProd.img}</div>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:700,color:T.text}}>{selProd.name}</div>
                    <div style={{fontSize:"11px",color:T.textMuted}}>৳{selProd.price.toLocaleString()} per item</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px",gap:"8px",marginBottom:"8px"}}>
                  <div>
                    <SL c="Size" T={T} req/>
                    <Sel value={selSize} onChange={e=>setSelSize(e.target.value)} T={T}>
                      {selProd.sizes.map(s=><option key={s}>{s}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <SL c="Color" T={T} req/>
                    <Sel value={selColor} onChange={e=>setSelColor(e.target.value)} T={T}>
                      {selProd.colors.map(c=><option key={c}>{c}</option>)}
                    </Sel>
                  </div>
                  <div>
                    <SL c="Qty" T={T} req/>
                    <input type="number" min="1" value={selQty} onChange={e=>setSelQty(Math.max(1,parseInt(e.target.value)||1))}
                      style={{background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 0",fontSize:"12px",outline:"none",width:"100%",textAlign:"center",fontFamily:"inherit"}}/>
                  </div>
                </div>

                {/* Stock status row */}
                {selSize&&selColor&&(
                  <div style={{background:T.bg,borderRadius:"7px",padding:"8px 10px",border:`1px solid ${T.border}`,marginBottom:"8px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"6px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                      <StockBadge count={stockCount}/>
                      <span style={{fontSize:"10px",color:T.textMuted}}>→ <TypeBadge type={autoType}/></span>
                    </div>
                    <span style={{fontSize:"10px",color:T.textMuted,fontWeight:600}}>Auto type based on stock availability</span>
                  </div>
                )}

                <button onClick={addItem}
                  style={{width:"100%",background:T.accent,border:"none",color:"#fff",borderRadius:"8px",padding:"9px",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
                  + Add to Order · ৳{(selProd.price*selQty).toLocaleString()}
                </button>
              </div>
            )}

            {/* Items list */}
            {items.length>0 ? (
              <div>
                {items.map((it,idx)=>(
                  <div key={idx} style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"8px",marginBottom:"6px"}}>
                    <div style={{width:"32px",height:"32px",borderRadius:"7px",background:it.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{it.img}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                        <span style={{fontSize:"11px",fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.name}</span>
                        <TypeBadge type={it.type}/>
                      </div>
                      <div style={{fontSize:"10px",color:T.textMuted}}>{it.size!=="Free"?`Sz ${it.size} · `:""}{it.color}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
                      <button onClick={()=>chgQty(idx,it.qty-1)} style={{width:"24px",height:"24px",background:T.surface,border:`1px solid ${T.border}`,color:T.textMid,borderRadius:"5px",cursor:"pointer",fontSize:"13px",fontWeight:700,lineHeight:1}}>−</button>
                      <span style={{color:T.text,fontWeight:800,fontSize:"12px",minWidth:"18px",textAlign:"center"}}>{it.qty}</span>
                      <button onClick={()=>chgQty(idx,it.qty+1)} style={{width:"24px",height:"24px",background:T.surface,border:`1px solid ${T.border}`,color:T.textMid,borderRadius:"5px",cursor:"pointer",fontSize:"13px",fontWeight:700,lineHeight:1}}>+</button>
                    </div>
                    <div style={{fontSize:"12px",fontWeight:700,color:T.text,minWidth:"60px",textAlign:"right",flexShrink:0}}>৳{(it.price*it.qty).toLocaleString()}</div>
                    <button onClick={()=>rmItem(idx)} style={{background:"#EF444412",border:"1px solid #EF444430",color:"#DC2626",borderRadius:"5px",padding:"4px 7px",fontSize:"11px",cursor:"pointer",flexShrink:0}}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign:"center",padding:"18px",color:T.textMuted,fontSize:"12px",background:T.bg,borderRadius:"8px",border:`1px dashed ${T.border}`}}>
                🛍️ Search and add products above
              </div>
            )}
          </Card>

          {/* Pricing & Payment */}
          <Card title="Pricing & Payment" icon="💰" T={T}>

            {/* Delivery zone */}
            <SL c="Delivery Zone" T={T} req/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              {[["inside","🟢 Inside Dhaka",`৳${delIn}`, "#059669"],["outside","🟡 Outside Dhaka",`৳${delOut}`,"#D97706"]].map(([id,label,charge,color])=>(
                <button key={id} onClick={()=>setDeliveryZone(id)}
                  style={{padding:"11px 12px",borderRadius:"9px",border:`1.5px solid ${deliveryZone===id?color:T.border}`,background:deliveryZone===id?color+"12":T.bg,cursor:"pointer",display:"flex",alignItems:"center",gap:"9px",transition:"all 0.12s",textAlign:"left"}}>
                  <div style={{width:"16px",height:"16px",borderRadius:"50%",border:`2px solid ${deliveryZone===id?color:T.border}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {deliveryZone===id&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:color}}/>}
                  </div>
                  <div>
                    <div style={{fontSize:"11px",fontWeight:700,color:deliveryZone===id?color:T.text}}>{label}</div>
                    <div style={{fontSize:"10px",color:T.textMuted,fontWeight:600}}>{charge} delivery</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Discount + Advance */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
              <div>
                <SL c="Discount (optional)" T={T}/>
                <div style={{display:"flex",gap:"5px"}}>
                  <div style={{display:"flex",background:T.bg,borderRadius:"7px",border:`1px solid ${T.border}`,overflow:"hidden",flexShrink:0}}>
                    {[["flat","৳"],["pct","%"]].map(([id,lbl])=>(
                      <button key={id} onClick={()=>setDiscType(id)}
                        style={{padding:"9px 11px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,background:discType===id?T.accent+"20":"transparent",color:discType===id?T.accent:T.textMuted}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <Inp value={discount||""} onChange={e=>setDiscount(parseFloat(e.target.value)||0)} placeholder="0" T={T}/>
                </div>
                {discount>0&&<div style={{fontSize:"10px",color:T.success,marginTop:"4px"}}>Saving ৳{discAmt.toLocaleString()}</div>}
              </div>
              <div>
                <SL c="Advance Paid (BDT)" T={T}/>
                <Inp value={advance||""} onChange={e=>setAdvance(parseInt(e.target.value)||0)} placeholder="0 — enter if advance paid" T={T}/>
                {advance>0&&<div style={{fontSize:"10px",color:T.success,marginTop:"4px"}}>COD remaining: ৳{codDue.toLocaleString()}</div>}
              </div>
            </div>

            {/* Payment method — button grid */}
            <SL c="Payment Method" T={T} req/>
            <BtnSelect options={PAY_METHODS} value={payMethod} onChange={setPayMethod} T={T}/>

            {/* COD total */}
            {items.length>0&&deliveryZone&&(
              <div style={{marginTop:"12px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"9px",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"11px",color:T.textMuted}}>Products</span><span style={{fontSize:"11px",color:T.textMid}}>৳{subtotal.toLocaleString()}</span></div>
                {discAmt>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"11px",color:T.success}}>Discount</span><span style={{fontSize:"11px",color:T.success}}>-৳{discAmt}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"11px",color:T.textMuted}}>Delivery ({deliveryZone==="inside"?"Inside":"Outside"} Dhaka)</span><span style={{fontSize:"11px",color:T.textMuted}}>৳{deliveryCharge}</span></div>
                {advance>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><span style={{fontSize:"11px",color:T.success}}>Advance</span><span style={{fontSize:"11px",color:T.success}}>-৳{advance}</span></div>}
                <div style={{height:"1px",background:T.border,margin:"6px 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:"13px",fontWeight:700,color:T.warning}}>COD Due</span>
                  <span style={{fontSize:"20px",fontWeight:800,color:T.warning}}>৳{codDue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Action buttons */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"16px"}}>
            <button onClick={()=>{if(canConfirm)handleCreate("order");}} disabled={!canConfirm}
              style={{width:"100%",background:canConfirm?T.accent:T.bg,border:`1px solid ${canConfirm?T.accent:T.border}`,color:canConfirm?"#fff":T.textMuted,borderRadius:"9px",padding:"13px",fontSize:"14px",fontWeight:800,cursor:canConfirm?"pointer":"not-allowed",marginBottom:"10px",transition:"all 0.15s"}}>
              {canConfirm?"✓ Confirm Order":"Fill all required fields to confirm"}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <div style={{flex:1,height:"1px",background:T.border}}/>
              <span style={{fontSize:"11px",color:T.textMuted,fontWeight:600}}>OR</span>
              <div style={{flex:1,height:"1px",background:T.border}}/>
            </div>
            <button onClick={()=>{if(canLink)handleCreate("link");}} disabled={!canLink}
              style={{width:"100%",background:"transparent",border:`1.5px solid ${canLink?T.accent:T.border}`,color:canLink?T.accent:T.textMuted,borderRadius:"9px",padding:"12px",fontSize:"13px",fontWeight:700,cursor:canLink?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:"7px",transition:"all 0.15s"}}>
              <span>🔗</span>
              {canLink?"Create Payment Link for Customer":"Add customer + products + delivery first"}
            </button>
            <div style={{marginTop:"7px",fontSize:"10px",color:T.textMuted,textAlign:"center"}}>
              Payment link lets customer review &amp; pay via bKash directly
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}










