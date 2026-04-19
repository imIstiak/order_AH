import { useEffect, useRef, useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

// ── Category tree: parent → sub-categories ────────────────────────────────
const INIT_CAT_TREE = {
  "Bags":        ["Tote Bags","Shoulder Bags","Backpacks","Clutches","Crossbody Bags"],
  "Shoes":       ["Heels","Sneakers","Flats","Boots","Sandals"],
  "Accessories": ["Jewelry","Belts","Scarves","Sunglasses","Hair Accessories"],
  "Clothing":    ["Tops","Bottoms","Dresses","Outerwear"],
};

const INIT_PRODUCTS = [
  { id:"p1",  name:"Leather Tote Bag",      price:2500, costPrice:1100, category:"Bags",   subCategory:"Tote Bags",    img:"🛍️", bg:"#92400E", status:"active",  featuredPhoto:"",
    sizes:["S","M","L"],              colors:["Black","Brown","Beige"],  sourceLink:"https://aliexpress.com/item/123",
    stock:{"S-Black":3,"S-Brown":2,"S-Beige":0,"M-Black":0,"M-Brown":1,"M-Beige":4,"L-Black":2,"L-Brown":0,"L-Beige":1},
    variantPhotos:{"Black":"","Brown":"","Beige":""},
    descBlocks:[{type:"text",value:"Premium quality leather tote bag. Perfect for everyday use."},{type:"features",value:["Genuine leather","Magnetic snap closure","Inner zip pocket","Fits A4 documents"]}] },
  { id:"p2",  name:"High Ankle Converse",   price:3200, costPrice:1400, category:"Shoes",  subCategory:"Sneakers",     img:"👟", bg:"#1E40AF", status:"active",  featuredPhoto:"",
    sizes:["36","37","38","39","40"],  colors:["White","Black"],          sourceLink:"",
    stock:{"36-White":2,"36-Black":1,"37-White":0,"37-Black":3,"38-White":5,"38-Black":0,"39-White":2,"39-Black":2,"40-White":0,"40-Black":1},
    variantPhotos:{"White":"","Black":""},
    descBlocks:[{type:"text",value:"Classic high ankle canvas sneakers."}] },
  { id:"p3",  name:"Canvas Backpack",       price:2400, costPrice:900,  category:"Bags",   subCategory:"Backpacks",    img:"🎒", bg:"#065F46", status:"active",  featuredPhoto:"",
    sizes:["M","L"],                  colors:["Olive","Grey","Navy"],    sourceLink:"",
    stock:{"M-Olive":4,"M-Grey":2,"M-Navy":0,"L-Olive":1,"L-Grey":0,"L-Navy":3},
    variantPhotos:{"Olive":"","Grey":"","Navy":""},
    descBlocks:[{type:"text",value:"Durable canvas backpack for school, travel, and everyday use."}] },
  { id:"p4",  name:"Silver Bracelet",       price:1800, costPrice:600,  category:"Accessories",subCategory:"Jewelry",  img:"📿", bg:"#6B21A8", status:"active",  featuredPhoto:"",
    sizes:["Free"],                   colors:["Silver","Gold"],          sourceLink:"",
    stock:{"Free-Silver":8,"Free-Gold":0},
    variantPhotos:{"Silver":"","Gold":""},
    descBlocks:[{type:"text",value:"Adjustable chain bracelet in silver and gold."}] },
  { id:"p5",  name:"Quilted Shoulder Bag",  price:3500, costPrice:1500, category:"Bags",   subCategory:"Shoulder Bags",img:"👜", bg:"#9D174D", status:"active",  featuredPhoto:"",
    sizes:["S","M"],                  colors:["Beige","Pink","Black"],   sourceLink:"",
    stock:{"S-Beige":2,"S-Pink":0,"S-Black":1,"M-Beige":0,"M-Pink":3,"M-Black":2},
    variantPhotos:{"Beige":"","Pink":"","Black":""},
    descBlocks:[{type:"text",value:"Classic quilted shoulder bag with chain strap."}] },
  { id:"p6",  name:"Platform Sneakers",     price:3800, costPrice:1700, category:"Shoes",  subCategory:"Sneakers",     img:"👠", bg:"#7C3AED", status:"active",  featuredPhoto:"",
    sizes:["36","37","38","39","40"],  colors:["White","Black"],          sourceLink:"",
    stock:{"36-White":0,"36-Black":0,"37-White":2,"37-Black":1,"38-White":0,"38-Black":3,"39-White":1,"39-Black":0,"40-White":2,"40-Black":1},
    variantPhotos:{"White":"","Black":""},
    descBlocks:[{type:"text",value:"Chunky platform sneakers with extra height."}] },
  { id:"p7",  name:"Embroidered Clutch",    price:2200, costPrice:800,  category:"Bags",   subCategory:"Clutches",     img:"👝", bg:"#B91C1C", status:"active",  featuredPhoto:"",
    sizes:["Free"],                   colors:["Red","Blue","Gold"],      sourceLink:"",
    stock:{"Free-Red":3,"Free-Blue":1,"Free-Gold":0},
    variantPhotos:{"Red":"","Blue":"","Gold":""},
    descBlocks:[{type:"text",value:"Handcrafted embroidered evening clutch."}] },
  { id:"p8",  name:"Ankle Strap Heels",     price:2800, costPrice:1200, category:"Shoes",  subCategory:"Heels",        img:"🥿", bg:"#B45309", status:"active",  featuredPhoto:"",
    sizes:["36","37","38","39"],      colors:["Nude","Black"],           sourceLink:"",
    stock:{"36-Nude":2,"36-Black":1,"37-Nude":0,"37-Black":4,"38-Nude":3,"38-Black":0,"39-Nude":1,"39-Black":2},
    variantPhotos:{"Nude":"","Black":""},
    descBlocks:[{type:"text",value:"Strappy ankle strap heels with cushioned insole."}] },
  { id:"p9",  name:"Gold Chain Necklace",   price:2100, costPrice:700,  category:"Accessories",subCategory:"Jewelry",  img:"💛", bg:"#92400E", status:"active",  featuredPhoto:"",
    sizes:["Free"],                   colors:["Gold","Rose Gold"],       sourceLink:"",
    stock:{"Free-Gold":5,"Free-Rose Gold":2},
    variantPhotos:{"Gold":"","Rose Gold":""},
    descBlocks:[{type:"text",value:"Layered gold chain necklace. Lightweight and elegant."}] },
  { id:"p10", name:"Woven Raffia Bag",      price:1900, costPrice:750,  category:"Bags",   subCategory:"Tote Bags",    img:"🧺", bg:"#78350F", status:"inactive",featuredPhoto:"",
    sizes:["S","M","L"],              colors:["Natural","Black"],        sourceLink:"",
    stock:{"S-Natural":3,"S-Black":2,"M-Natural":0,"M-Black":1,"L-Natural":4,"L-Black":0},
    variantPhotos:{"Natural":"","Black":""},
    descBlocks:[{type:"text",value:"Summer woven raffia tote."}] },
];

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];
const AGENT_NAV = [["▦","Dashboard"],["≡","Orders"],["⬡","Products"],["◉","Customers"],["+","New Order"],["👤","Profile"]];
const PRODUCT_UPLOADER_NAV = [["⬡","Products"]];

const totalStock  = (p) => Object.values(p.stock).reduce((a,b)=>a+b,0);
const stockStatus = (p) => {
  const n = totalStock(p);
  if (n <= 0) return ["#FEE2E2", "#B91C1C", "Out of Stock"];
  if (n <= 5) return ["#FEF3C7", "#B45309", "Low Stock"];
  return ["#DCFCE7", "#166534", "In Stock"];
};

function isDefaultVariationName(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "" || text === "default" || text === "free" || text === "standard";
}

function parseCsvTokens(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function PhotoUpload({ photo, onUpload, onRemove, size = "110px", T }) {
  const ref = useRef(null);
  const h = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => onUpload(ev.target.result);
    r.readAsDataURL(file);
  };

  return (
    <div style={{ position: "relative", width: size, minHeight: typeof size === "string" && size.includes("%") ? "100px" : size }}>
      <div
        onClick={() => ref.current?.click()}
        style={{
          width: "100%",
          minHeight: typeof size === "string" && size.includes("%") ? "100px" : size,
          border: `1.5px dashed ${T.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          background: T.bg,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {photo ? (
          <>
            <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>Change</span>
            </div>
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                onRemove();
              }}
              style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", fontSize: "11px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div>
            <div style={{ fontSize: "11px", color: T.textMuted }}>Click to upload</div>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          h(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── VARIATION PHOTOS ──────────────────────────────────────────────────────
function VariantPhotos({ colors, variantPhotos, onPhotoChange, T }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:"10px"}}>
      {colors.map(color=>(
        <div key={color}>
          <div style={{fontSize:"10px",color:T.textMuted,fontWeight:600,marginBottom:"5px",textAlign:"center"}}>{color}</div>
          <PhotoUpload photo={variantPhotos[color]||""} onUpload={v=>onPhotoChange(color,v)} onRemove={()=>onPhotoChange(color,"")} size="100%" T={T}/>
        </div>
      ))}
    </div>
  );
}

// ── STOCK GRID ────────────────────────────────────────────────────────────
function StockGrid({ sizes, colors, stock, onStockChange, T }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr>
            <th style={{padding:"7px 12px",background:T.tHead,fontSize:"10px",color:T.textMuted,fontWeight:700,textAlign:"left",borderBottom:`1px solid ${T.border}`}}>Size \ Color</th>
            {colors.map(c=><th key={c} style={{padding:"7px 12px",background:T.tHead,fontSize:"10px",color:T.textMuted,fontWeight:700,textAlign:"center",borderBottom:`1px solid ${T.border}`}}>{c}</th>)}
            <th style={{padding:"7px 12px",background:T.tHead,fontSize:"10px",color:T.textMuted,fontWeight:700,textAlign:"center",borderBottom:`1px solid ${T.border}`}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map(s=>{
            const rowT=colors.reduce((a,c)=>a+(stock[`${s}-${c}`]||0),0);
            return (
              <tr key={s} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:"8px 12px",fontSize:"12px",fontWeight:600,color:T.text}}>{s}</td>
                {colors.map(c=>{
                  const key=`${s}-${c}`, cnt=stock[key]||0;
                  const col=cnt===0?"#DC2626":cnt<=2?"#D97706":"#059669";
                  return (
                    <td key={c} style={{padding:"6px 12px",textAlign:"center"}}>
                      <input type="number" min="0" value={cnt} onChange={e=>onStockChange(key,parseInt(e.target.value)||0)}
                        style={{width:"54px",background:T.bg,border:`1.5px solid ${T.ib}`,borderRadius:"6px",color:col,padding:"5px 0",fontSize:"12px",fontWeight:700,outline:"none",textAlign:"center",fontFamily:"inherit"}}/>
                    </td>
                  );
                })}
                <td style={{padding:"8px 12px",textAlign:"center",fontSize:"12px",fontWeight:800,color:rowT===0?"#DC2626":rowT<=3?"#D97706":T.text}}>{rowT}</td>
              </tr>
            );
          })}
          <tr style={{background:T.tHead}}>
            <td style={{padding:"8px 12px",fontSize:"11px",fontWeight:700,color:T.textMuted}}>Total</td>
            {colors.map(c=>{const t=sizes.reduce((a,s)=>a+(stock[`${s}-${c}`]||0),0); return <td key={c} style={{padding:"8px 12px",textAlign:"center",fontSize:"12px",fontWeight:700,color:T.textMid}}>{t}</td>;})}
            <td style={{padding:"8px 12px",textAlign:"center",fontSize:"13px",fontWeight:800,color:T.accent}}>{sizes.reduce((a,s)=>a+colors.reduce((b,c)=>b+(stock[`${s}-${c}`]||0),0),0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DescBlockWrap({ idx, badge, children, onMove, onDelete, T }) {
  return (
    <div style={{position:"relative",marginBottom:"9px",padding:"12px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"9px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
      <div style={{display:"flex",flexDirection:"column",gap:"3px",flexShrink:0}}>
        <button onClick={()=>onMove(idx,-1)} style={{width:"22px",height:"22px",background:T.surface,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:"5px",cursor:"pointer",fontSize:"10px"}}>▲</button>
        <button onClick={()=>onMove(idx,1)}  style={{width:"22px",height:"22px",background:T.surface,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:"5px",cursor:"pointer",fontSize:"10px"}}>▼</button>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:"9px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"7px",color:T.textMuted}}>{badge}</div>
        {children}
      </div>
      <button onClick={()=>onDelete(idx)} style={{background:"#EF444412",border:"1px solid #EF444425",color:"#DC2626",borderRadius:"5px",padding:"3px 7px",fontSize:"11px",cursor:"pointer",flexShrink:0}}>✕</button>
    </div>
  );
}

// ── DESCRIPTION EDITOR ────────────────────────────────────────────────────
function DescEditor({ blocks, onChange, T }) {
  const fileRef = useRef(null);
  const [waitImg, setWaitImg] = useState(null);
  const upd    = (idx,val) => onChange(blocks.map((b,i)=>i===idx?{...b,value:val}:b));
  const add    = (type) => onChange([...blocks, type==="text"?{type:"text",value:""}:type==="heading"?{type:"heading",value:""}:type==="features"?{type:"features",value:[""]}:type==="image"?{type:"image",value:"",caption:""}:{type:"divider",value:""}]);
  const del    = (idx) => { if(blocks.length<=1) return; onChange(blocks.filter((_,i)=>i!==idx)); };
  const move   = (idx,d) => { const a=[...blocks],s=idx+d; if(s<0||s>=a.length) return; [a[idx],a[s]]=[a[s],a[idx]]; onChange(a); };
  const updFeat = (bi,fi,v) => { const b={...blocks[bi],value:blocks[bi].value.map((f,i)=>i===fi?v:f)}; onChange(blocks.map((x,i)=>i===bi?b:x)); };
  const addFeat = (bi) => { const b={...blocks[bi],value:[...blocks[bi].value,""]}; onChange(blocks.map((x,i)=>i===bi?b:x)); };
  const delFeat = (bi,fi) => { const b={...blocks[bi],value:blocks[bi].value.filter((_,i)=>i!==fi)}; onChange(blocks.map((x,i)=>i===bi?b:x)); };
  const TA = {background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"};
  return (
    <div>
      <div style={{fontSize:"10px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>This content appears on the product page on your website ↓</div>
      {blocks.map((b,idx)=>(
        <DescBlockWrap key={idx} idx={idx} onMove={move} onDelete={del} T={T} badge={b.type==="heading"?"📌 Heading":b.type==="text"?"¶ Paragraph":b.type==="features"?"✓ Key Features":b.type==="image"?"🖼 Image":"— Divider"}>
          {b.type==="heading"&&<input value={b.value} onChange={e=>upd(idx,e.target.value)} placeholder="Section heading..." style={{...TA,fontSize:"14px",fontWeight:700}}/>}
          {b.type==="text"&&<textarea value={b.value} onChange={e=>upd(idx,e.target.value)} placeholder="Write product description..." style={{...TA,minHeight:"72px"}}/>}
          {b.type==="features"&&(
            <div>
              {b.value.map((f,fi)=>(
                <div key={fi} style={{display:"flex",gap:"6px",marginBottom:"6px",alignItems:"center"}}>
                  <span style={{color:"#059669",flexShrink:0}}>•</span>
                  <input value={f} onChange={e=>updFeat(idx,fi,e.target.value)} placeholder={`Feature ${fi+1}...`} style={{...TA}}/>
                  {b.value.length>1&&<button onClick={()=>delFeat(idx,fi)} style={{background:"transparent",border:"none",color:"#DC2626",cursor:"pointer",fontSize:"14px",flexShrink:0}}>✕</button>}
                </div>
              ))}
              <button onClick={()=>addFeat(idx)} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:"7px",padding:"6px 12px",fontSize:"11px",cursor:"pointer"}}>+ Add Feature</button>
            </div>
          )}
          {b.type==="image"&&(
            <div>
              {b.value?(<div style={{position:"relative",borderRadius:"8px",overflow:"hidden",marginBottom:"8px"}}><img src={b.value} alt="" style={{width:"100%",maxHeight:"180px",objectFit:"cover",display:"block"}}/><button onClick={()=>upd(idx,"")} style={{position:"absolute",top:"7px",right:"7px",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",borderRadius:"5px",padding:"4px 9px",fontSize:"11px",cursor:"pointer"}}>Change</button></div>):(
              <div onClick={()=>{setWaitImg(idx);fileRef.current?.click();}} style={{border:`2px dashed ${T.border}`,borderRadius:"9px",padding:"22px",textAlign:"center",cursor:"pointer",marginBottom:"8px"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}><div style={{fontSize:"24px",marginBottom:"5px"}}>🖼</div><div style={{fontSize:"12px",color:T.textMuted}}>Click to upload image</div></div>)}
              <input value={b.caption||""} onChange={e=>{const nb={...b,caption:e.target.value};onChange(blocks.map((x,i)=>i===idx?nb:x));}} placeholder="Caption (optional)..." style={{...TA}}/>
            </div>
          )}
          {b.type==="divider"&&<div style={{height:"2px",background:T.border,borderRadius:"2px"}}/>}
        </DescBlockWrap>
      ))}
      <div style={{display:"flex",gap:"7px",flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:"11px",color:T.textMuted,fontWeight:600}}>Add block:</span>
        {[["¶ Paragraph","text","#6366F1"],["📌 Heading","heading","#6366F1"],["✓ Features","features","#059669"],["🖼 Image","image","#D97706"],["— Divider","divider","#64748B"]].map(([label,type,color])=>(
          <button key={type} onClick={()=>add(type)} style={{background:color+"15",border:`1px solid ${color}30`,color,borderRadius:"7px",padding:"6px 12px",fontSize:"11px",fontWeight:600,cursor:"pointer"}}>{label}</button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(f&&waitImg!==null){const r=new FileReader();r.onload=ev=>{upd(waitImg,ev.target.result);setWaitImg(null);};r.readAsDataURL(f);}e.target.value="";}}/>
    </div>
  );
}

// ── WEB PREVIEW ───────────────────────────────────────────────────────────
function WebPreview({ name, price, category, subCategory, colors, featuredPhoto, variantPhotos, descBlocks, onSale, salePrice, liveSaleDisc, T }) {
  const [activeColor, setActiveColor] = useState(colors[0]||"");
  const varPhoto = variantPhotos[activeColor]||"";
  const displayPhoto = varPhoto || featuredPhoto || "";
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden"}}>
      <div style={{padding:"9px 14px",borderBottom:`1px solid ${T.border}`,background:T.tHead,display:"flex",alignItems:"center",gap:"7px"}}>
        <span style={{background:"#EF4444",color:"#fff",fontSize:"9px",fontWeight:700,padding:"2px 7px",borderRadius:"4px"}}>LIVE PREVIEW</span>
        <span style={{fontSize:"11px",color:T.textMuted}}>Customer view</span>
      </div>
      <div style={{padding:"14px"}}>
        <div style={{width:"100%",aspectRatio:"1",borderRadius:"10px",background:T.bg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"10px",overflow:"hidden"}}>
          {displayPhoto?<img src={displayPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"48px",opacity:0.25}}>📷</span>}
        </div>
        {colors.length>1&&(
          <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
            {colors.map(c=><button key={c} onClick={()=>setActiveColor(c)} style={{padding:"4px 10px",borderRadius:"6px",border:`1.5px solid ${activeColor===c?T.accent:T.border}`,background:activeColor===c?T.accent+"14":T.bg,color:activeColor===c?T.accent:T.textMid,fontSize:"11px",fontWeight:600,cursor:"pointer"}}>{c}</button>)}
          </div>
        )}
        <div style={{fontSize:"10px",color:T.textMuted,marginBottom:"2px"}}>{[category,subCategory].filter(Boolean).join(" › ")}</div>
        <div style={{fontSize:"16px",fontWeight:800,color:T.text,marginBottom:"3px"}}>{name||"Product Name"}</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
          {onSale&&liveSalePrice>0&&liveSalePrice<(parseInt(price)||0) ? (
            <>
              <span style={{fontSize:"22px",fontWeight:800,color:"#EF4444"}}>৳{liveSalePrice.toLocaleString()}</span>
              <span style={{fontSize:"15px",color:T.textMuted,textDecoration:"line-through"}}>৳{(parseInt(price)||0).toLocaleString()}</span>
              <span style={{fontSize:"10px",background:"#EF4444",color:"#fff",fontWeight:800,padding:"2px 7px",borderRadius:"4px"}}>{liveSaleDisc}% OFF</span>
            </>
          ) : (
            <span style={{fontSize:"20px",fontWeight:800,color:T.accent}}>৳{(parseInt(price)||0).toLocaleString()}</span>
          )}
        </div>
        {descBlocks.map((b,i)=>(
          <div key={i} style={{marginBottom:"8px"}}>
            {b.type==="heading"&&<div style={{fontSize:"13px",fontWeight:700,color:T.text,marginBottom:"4px"}}>{b.value||<span style={{color:T.textMuted,fontStyle:"italic"}}>Heading...</span>}</div>}
            {b.type==="text"&&<div style={{fontSize:"12px",color:T.textMid,lineHeight:"1.6"}}>{b.value||<span style={{color:T.textMuted,fontStyle:"italic"}}>Paragraph...</span>}</div>}
            {b.type==="features"&&<ul style={{margin:0,padding:"0 0 0 14px"}}>{b.value.map((f,j)=><li key={j} style={{fontSize:"12px",color:T.textMid,marginBottom:"2px"}}>{f||<span style={{color:T.textMuted,fontStyle:"italic"}}>Feature...</span>}</li>)}</ul>}
            {b.type==="image"&&b.value&&<><img src={b.value} alt="" style={{width:"100%",borderRadius:"8px",display:"block"}}/>{b.caption&&<div style={{fontSize:"10px",color:T.textMuted,textAlign:"center",marginTop:"4px"}}>{b.caption}</div>}</>}
            {b.type==="divider"&&<div style={{height:"1px",background:T.border}}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SL({ c, T, req = false }) {
  return (
    <label style={{ display: "block", fontSize: "10px", color: T.textMuted, fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
      {c}
      {req ? " *" : ""}
    </label>
  );
}

function Inp({ T, style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        background: T.input,
        border: `1px solid ${T.ib}`,
        borderRadius: "8px",
        color: T.text,
        padding: "8px 10px",
        fontSize: "12px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        ...style,
      }}
    />
  );
}

function Sel({ T, style, children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        background: T.input,
        border: `1px solid ${T.ib}`,
        borderRadius: "8px",
        color: T.text,
        padding: "8px 10px",
        fontSize: "12px",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function Box({ title, children, T }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px" }}>
      <div style={{ fontSize: "10px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function CategoryPicker({
  category,
  subCategory,
  onCategoryChange,
  onSubCategoryChange,
  catTree,
  onAddParent,
  onAddSub,
  T,
}) {
  const parentCategories = Object.keys(catTree || {});
  const subCategories = (catTree?.[category] || []).filter(Boolean);
  const [addingMode, setAddingMode] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCategoryChange = (value) => {
    if (value === "__add_parent__") {
      setAddingMode("parent");
      setNewCategoryName("");
      return;
    }
    setAddingMode("");
    onCategoryChange(value);
    if (!(catTree?.[value] || []).includes(subCategory)) {
      onSubCategoryChange("");
    }
  };

  const handleSubCategoryChange = (value) => {
    if (value === "__add_sub__") {
      if (!category) {
        return;
      }
      setAddingMode("sub");
      setNewCategoryName("");
      return;
    }
    setAddingMode("");
    onSubCategoryChange(value);
  };

  const submitAddCategory = () => {
    const text = String(newCategoryName || "").trim();
    if (!text) return;

    if (addingMode === "parent") {
      onAddParent(text);
      onCategoryChange(text);
      onSubCategoryChange("");
    } else if (addingMode === "sub" && category) {
      onAddSub(category, text);
      onSubCategoryChange(text);
    }

    setAddingMode("");
    setNewCategoryName("");
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div>
          <SL c="Category" T={T} req />
          <Sel value={category} onChange={(e) => handleCategoryChange(e.target.value)} T={T}>
            {parentCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__add_parent__">+ Add Parent Category...</option>
          </Sel>
        </div>
        <div>
          <SL c="Sub Category" T={T} />
          <Sel value={subCategory} onChange={(e) => handleSubCategoryChange(e.target.value)} T={T}>
            <option value="">None</option>
            {subCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__add_sub__">+ Add Sub Category...</option>
          </Sel>
        </div>
      </div>

      {addingMode && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Inp
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitAddCategory();
              }
            }}
            placeholder={addingMode === "parent" ? "Type new parent category" : `Type new sub-category under ${category}`}
            T={T}
            style={{ flex: 1 }}
          />
          <button
            onClick={submitAddCategory}
            style={{ background: T.accent, border: "none", color: "#fff", borderRadius: "8px", padding: "7px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setAddingMode("");
              setNewCategoryName("");
            }}
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: "8px", padding: "7px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── EDIT PAGE ─────────────────────────────────────────────────────────────
function EditPage({ product, isNew, T, catTree, onSave, onBack, onDelete, onAddParent, onAddSub }) {
  const legacyDefaultPhoto = Object.entries(product.variantPhotos||{}).find(([key, value])=>isDefaultVariationName(key) && value)?.[1] || "";
  const initialColors = (product.colors||[]).filter(color=>!isDefaultVariationName(color));
  const initialVariantPhotos = Object.fromEntries(Object.entries(product.variantPhotos||{}).filter(([key])=>!isDefaultVariationName(key)));
  const hadLegacyDefaultColor = (product.colors||[]).some(color=>isDefaultVariationName(color)) || Boolean(legacyDefaultPhoto);

  const [name,         setName]         = useState(product.name);
  const [price,        setPrice]        = useState(product.price);
  const [costPrice,    setCostPrice]    = useState(product.costPrice);
  const [category,     setCategory]     = useState(product.category||(Object.keys(catTree)[0]||""));
  const [subCategory,  setSubCategory]  = useState(product.subCategory||"");
  const [status,       setStatus]       = useState(product.status);
  const [sourceLink,   setSourceLink]   = useState(product.sourceLink||"");
  const [sizes,        setSizes]        = useState([...product.sizes]);
  const [colors,       setColors]       = useState(initialColors);
  const [stock,        setStock]        = useState({...product.stock});
  const [featuredPhoto,setFeaturedPhoto]= useState(product.featuredPhoto||legacyDefaultPhoto||"");
  const [variantPhotos,setVariantPhotos]= useState({...initialVariantPhotos});
  const [descBlocks,   setDescBlocks]   = useState(product.descBlocks?.length?[...product.descBlocks]:[{type:"text",value:""}]);
  const [newSize,      setNewSize]      = useState("");
  const [newColor,     setNewColor]     = useState("");
  const [bulkStockQty, setBulkStockQty] = useState("");
  const [onSale,       setOnSale]       = useState(product.onSale||false);
  const [salePrice,    setSalePrice]    = useState(product.salePrice||"");
  const [saleFrom,     setSaleFrom]     = useState(product.saleFrom||"");
  const [saleTo,       setSaleTo]       = useState(product.saleTo||"");
  const [showDel,      setShowDel]      = useState(false);
  const [activeTab,    setActiveTab]    = useState("info");

  const stockChange = (key,val) => setStock(p=>({...p,[key]:val}));
  const photoChange = (color,val) => setVariantPhotos(p=>({...p,[color]:val}));

  const addSize = (rawInput = newSize) => {
    const entries = parseCsvTokens(rawInput).filter(token=>!sizes.includes(token));
    if(!entries.length) return;
    setSizes(p=>[...p,...entries]);
    const ns={...stock};
    entries.forEach(size=>{
      colors.forEach(color=>{if(ns[`${size}-${color}`]===undefined) ns[`${size}-${color}`]=0;});
    });
    setStock(ns);
    setNewSize("");
  };
  const removeSize = (s) => {
    if(sizes.length<=1) return; setSizes(p=>p.filter(x=>x!==s));
    const ns={...stock}; colors.forEach(c=>delete ns[`${s}-${c}`]); setStock(ns);
  };
  const addColor = (rawInput = newColor) => {
    const entries = parseCsvTokens(rawInput)
      .filter(token=>!isDefaultVariationName(token))
      .filter(token=>!colors.includes(token));
    if(!entries.length) return;
    setColors(p=>[...p,...entries]);
    const ns={...stock};
    entries.forEach(color=>{
      sizes.forEach(size=>{if(ns[`${size}-${color}`]===undefined) ns[`${size}-${color}`]=0;});
    });
    setStock(ns);
    setVariantPhotos(p=>({
      ...p,
      ...Object.fromEntries(entries.map(color=>[color, ""]))
    }));
    setNewColor("");
  };
  const removeColor = (c) => {
    if(colors.length<=1) return; setColors(p=>p.filter(x=>x!==c));
    const ns={...stock}; sizes.forEach(s=>delete ns[`${s}-${c}`]); setStock(ns);
    const vp={...variantPhotos}; delete vp[c]; setVariantPhotos(vp);
  };
  const applyBulkStock = (mode) => {
    const qty = parseInt(bulkStockQty, 10);
    if (Number.isNaN(qty) || qty < 0) return;
    const ns = { ...stock };
    sizes.forEach(size=>{
      colors.forEach(color=>{
        const key = `${size}-${color}`;
        const current = ns[key] || 0;
        if (mode === "set") ns[key] = qty;
        if (mode === "add") ns[key] = current + qty;
        if (mode === "fill-empty" && current === 0) ns[key] = qty;
      });
    });
    setStock(ns);
  };

  const handleSave = () => onSave({...product,name,price:parseInt(price)||0,costPrice:parseInt(costPrice)||0,onSale,salePrice:parseInt(salePrice)||0,saleFrom,saleTo,category,subCategory,status,sourceLink,sizes,colors,stock,featuredPhoto,variantPhotos,descBlocks,img:product.img});
  const liveProfit     = (parseInt(price)||0)-(parseInt(costPrice)||0);
  const liveSalePrice  = parseInt(salePrice)||0;
  const liveSaleDisc   = liveSalePrice>0&&liveSalePrice<(parseInt(price)||0) ? Math.round(((parseInt(price)||0)-liveSalePrice)/(parseInt(price)||0)*100) : 0;
  const liveSaleProfit = liveSalePrice>0 ? liveSalePrice-(parseInt(costPrice)||0) : 0;
  const totalUnits = sizes.reduce((a,s)=>a+colors.reduce((b,c)=>b+(stock[`${s}-${c}`]||0),0),0);
  const IS = {background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"};

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"0 20px",height:"52px",display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
        <button onClick={onBack} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"7px",padding:"6px 12px",fontSize:"12px",color:T.textMuted,cursor:"pointer"}}>← Back</button>
        <div>
          <div style={{fontSize:"14px",fontWeight:800,color:T.text}}>{isNew?"Add New Product":"Edit: "+name}</div>
          <div style={{fontSize:"11px",color:T.textMuted}}>{category}{subCategory?" › "+subCategory:""}</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
          {!isNew&&<button onClick={()=>setShowDel(true)} style={{background:"#EF444415",border:"1px solid #EF444430",color:"#DC2626",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>🗑 Delete</button>}
          <button onClick={handleSave} style={{background:T.accent,border:"none",color:"#fff",borderRadius:"8px",padding:"8px 20px",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>{isNew?"✓ Add Product":"✓ Save Changes"}</button>
        </div>
      </div>
      {/* Tabs */}
      <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"0 20px",display:"flex",gap:"0"}}>
        {[["info","📋 Info & Pricing"],["stock","📦 Stock & Photos"],["description","🌐 Product Page"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{padding:"11px 16px",border:"none",cursor:"pointer",background:"transparent",borderBottom:`3px solid ${activeTab===id?T.accent:"transparent"}`,marginBottom:"-1px",fontSize:"12px",fontWeight:700,color:activeTab===id?T.accent:T.textMuted}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflow:"auto",padding:"20px"}}>
        <div style={{maxWidth:"940px",margin:"0 auto"}}>

          {/* TAB: INFO */}
          {activeTab==="info"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",alignItems:"start"}}>
              <div>
                <Box title="Product Details" T={T}>
                  <div style={{marginBottom:"12px"}}>
                    <SL c="Product Name" T={T} req/>
                    <Inp value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Leather Tote Bag" T={T}/>
                  </div>
                  <div style={{marginBottom:"12px"}}>
                    <CategoryPicker category={category} subCategory={subCategory} onCategoryChange={setCategory} onSubCategoryChange={setSubCategory} catTree={catTree} onAddParent={onAddParent} onAddSub={onAddSub} T={T}/>
                  </div>
                  <div style={{marginBottom:"12px"}}>
                    <SL c="Status" T={T}/>
                    <Sel value={status} onChange={e=>setStatus(e.target.value)} T={T}>
                      <option value="active">Active — visible on website</option>
                      <option value="inactive">Inactive — hidden from website</option>
                    </Sel>
                  </div>
                  <div style={{background:"#F59E0B08",border:"1px solid #F59E0B20",borderRadius:"9px",padding:"11px 13px"}}>
                    <SL c="🔒 Supplier Source Link (internal only — hidden from customers)" T={T}/>
                    <Inp value={sourceLink} onChange={e=>setSourceLink(e.target.value)} placeholder="https://aliexpress.com/item/..." T={T}/>
                  </div>
                </Box>

                <Box title="Sizes" T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"10px"}}>
                    {sizes.map(s=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:"4px",background:T.accent+"12",border:`1px solid ${T.accent}30`,borderRadius:"7px",padding:"5px 10px"}}>
                        <span style={{fontSize:"12px",fontWeight:600,color:T.accent}}>{s}</span>
                        <button onClick={()=>removeSize(s)} style={{background:"transparent",border:"none",color:T.accent,cursor:"pointer",fontSize:"12px",padding:0,lineHeight:1}}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:"8px"}}>
                    <Inp value={newSize} onChange={e=>setNewSize(e.target.value)} onKeyDown={e=>{
                      if(e.key==="Enter"||e.key===","){
                        e.preventDefault();
                        addSize();
                      }
                    }} placeholder='Type one or many sizes. Example: 36,37,38 then press Enter' T={T} style={{flex:1}}/>
                    <button onClick={addSize} style={{background:T.accent,border:"none",color:"#fff",borderRadius:"8px",padding:"9px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>
                  </div>
                  <div style={{fontSize:"10px",color:T.textMuted,marginTop:"8px"}}>Tip: press Enter or comma to add quickly.</div>
                </Box>

                <Box title="Colors" T={T}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"10px"}}>
                    {colors.map(c=>(
                      <div key={c} style={{display:"flex",alignItems:"center",gap:"4px",background:"#05996912",border:"1px solid #05996930",borderRadius:"7px",padding:"5px 10px"}}>
                        <span style={{fontSize:"12px",fontWeight:600,color:"#059669"}}>{c}</span>
                        <button onClick={()=>removeColor(c)} style={{background:"transparent",border:"none",color:"#059669",cursor:"pointer",fontSize:"12px",padding:0,lineHeight:1}}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:"8px"}}>
                    <Inp value={newColor} onChange={e=>setNewColor(e.target.value)} onKeyDown={e=>{
                      if(e.key==="Enter"||e.key===","){
                        e.preventDefault();
                        addColor();
                      }
                    }} placeholder='Type one or many colors. Example: black,white,cream then press Enter' T={T} style={{flex:1}}/>
                    <button onClick={addColor} style={{background:"#059669",border:"none",color:"#fff",borderRadius:"8px",padding:"9px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>
                  </div>
                  <div style={{fontSize:"10px",color:T.textMuted,marginTop:"8px"}}>Tip: press Enter or comma to add quickly. "Default" is reserved for the featured image fallback.</div>
                </Box>
              </div>

              <div>
                <Box title="Pricing & Profit" T={T}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
                    <div><SL c="Selling Price (BDT)" T={T} req/><Inp value={price} onChange={e=>setPrice(e.target.value)} placeholder="2500" T={T} type="number"/></div>
                    <div><SL c="Cost / Buy Price (BDT)" T={T} req/><Inp value={costPrice} onChange={e=>setCostPrice(e.target.value)} placeholder="1100" T={T} type="number"/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"16px"}}>
                    {[["Selling","৳"+(parseInt(price)||0).toLocaleString(),T.accent],["Cost","৳"+(parseInt(costPrice)||0).toLocaleString(),T.textMuted],["Profit","৳"+liveProfit,liveProfit>0?"#059669":"#DC2626"]].map(([label,val,color])=>(
                      <div key={label} style={{background:T.bg,borderRadius:"9px",padding:"10px 12px"}}>
                        <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",marginBottom:"4px"}}>{label}</div>
                        <div style={{fontSize:"15px",fontWeight:800,color}}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Sale / Discount toggle ── */}
                  <div style={{borderTop:`1px solid ${T.border}`,paddingTop:"14px"}}>
                    <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:onSale?"12px":"0"}}>
                      <div>
                        <div style={{fontSize:"13px",fontWeight:700,color:T.text}}>🏷 On Sale / Discount</div>
                        <div style={{fontSize:"11px",color:T.textMuted,marginTop:"2px"}}>Show a discounted price with a strikethrough on the original</div>
                      </div>
                      <div onClick={()=>setOnSale(p=>!p)}
                        style={{width:"42px",height:"24px",borderRadius:"24px",background:onSale?"#EF4444":"#CBD5E1",position:"relative",transition:"background 0.2s",flexShrink:0,cursor:"pointer"}}>
                        <div style={{width:"20px",height:"20px",background:"#fff",borderRadius:"50%",position:"absolute",top:"2px",left:onSale?"20px":"2px",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
                      </div>
                    </label>

                    {onSale&&(
                      <div style={{background:"#EF444408",border:"1px solid #EF444425",borderRadius:"10px",padding:"14px"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                          <div>
                            <SL c="Sale Price (BDT)" T={T} req/>
                            <Inp value={salePrice} onChange={e=>setSalePrice(e.target.value)} placeholder="e.g. 1999" T={T} type="number"/>
                            {liveSaleDisc>0&&<div style={{fontSize:"11px",color:"#EF4444",marginTop:"4px",fontWeight:600}}>{liveSaleDisc}% off — customers save ৳{(parseInt(price)||0)-liveSalePrice}</div>}
                            {liveSalePrice>0&&liveSalePrice>=(parseInt(price)||0)&&<div style={{fontSize:"11px",color:"#DC2626",marginTop:"4px"}}>⚠ Sale price must be lower than selling price</div>}
                          </div>
                          <div style={{background:T.bg,borderRadius:"9px",padding:"10px 12px"}}>
                            <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",marginBottom:"4px"}}>Sale Margin</div>
                            <div style={{fontSize:"15px",fontWeight:800,color:liveSaleProfit>0?"#059669":"#DC2626"}}>৳{liveSaleProfit}</div>
                            <div style={{fontSize:"10px",color:T.textMuted,marginTop:"2px"}}>profit after sale</div>
                          </div>
                        </div>

                        {/* Sale date range */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                          <div>
                            <SL c="Sale Start Date (optional)" T={T}/>
                            <input type="date" value={saleFrom} onChange={e=>setSaleFrom(e.target.value)}
                              style={{background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
                          </div>
                          <div>
                            <SL c="Sale End Date (optional)" T={T}/>
                            <input type="date" value={saleTo} onChange={e=>setSaleTo(e.target.value)}
                              style={{background:T.input,border:`1.5px solid ${T.ib}`,borderRadius:"8px",color:T.text,padding:"9px 12px",fontSize:"12px",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
                          </div>
                        </div>
                        <div style={{fontSize:"11px",color:T.textMuted,lineHeight:"1.5"}}>
                          {!saleFrom&&!saleTo?"💡 Leave dates empty to apply the sale immediately and run indefinitely.":saleFrom&&saleTo?`Sale will run from ${saleFrom} to ${saleTo}.`:saleFrom?`Sale starts ${saleFrom}.`:`Sale ends ${saleTo}.`}
                        </div>

                        {/* Preview of how it looks on website */}
                        <div style={{marginTop:"12px",padding:"10px 13px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"9px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                          <span style={{fontSize:"9px",background:"#EF4444",color:"#fff",fontWeight:700,padding:"2px 7px",borderRadius:"4px"}}>{liveSaleDisc>0?`-${liveSaleDisc}%`:"SALE"}</span>
                          <span style={{fontSize:"18px",fontWeight:800,color:"#EF4444"}}>৳{liveSalePrice>0?liveSalePrice.toLocaleString():"—"}</span>
                          <span style={{fontSize:"13px",color:T.textMuted,textDecoration:"line-through"}}>৳{(parseInt(price)||0).toLocaleString()}</span>
                          <span style={{fontSize:"11px",color:T.textMuted}}>← how customers will see it</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Box>
              </div>
            </div>
          )}

          {/* TAB: STOCK & PHOTOS */}
          {activeTab==="stock"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",alignItems:"start"}}>
              <div>
                {/* Featured photo — main cover */}
                <Box title="Featured Photo (Main Cover)" T={T}>
                  <div style={{fontSize:"11px",color:T.textMuted,marginBottom:"12px",lineHeight:"1.5"}}>
                    This is the <strong style={{color:T.text}}>main product photo</strong> shown first on the catalog and product page. Upload your best shot here.
                  </div>
                  <PhotoUpload photo={featuredPhoto} onUpload={setFeaturedPhoto} onRemove={()=>setFeaturedPhoto("")} T={T}/>
                </Box>

                {/* Variation photos */}
                <Box title="Variation Photos — one per color" T={T}>
                  <div style={{fontSize:"11px",color:T.textMuted,marginBottom:"12px",lineHeight:"1.5"}}>
                    When a customer selects a color, the matching photo will appear. If no variation photo is uploaded, the featured photo is shown instead. Featured photo works as the default image.
                  </div>
                  {hadLegacyDefaultColor&&(
                    <div style={{fontSize:"11px",color:"#D97706",background:"#F59E0B10",border:"1px solid #F59E0B30",padding:"8px 10px",borderRadius:"8px",marginBottom:"10px"}}>
                      Legacy "Default" variation was mapped to Featured Photo to keep behavior consistent.
                    </div>
                  )}
                  <VariantPhotos colors={colors} variantPhotos={variantPhotos} onPhotoChange={photoChange} T={T}/>
                </Box>
              </div>

              <div>
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:"13px",fontWeight:700,color:T.text}}>Stock Levels</span>
                    <span style={{fontSize:"13px",fontWeight:800,color:T.accent}}>{totalUnits} total units</span>
                  </div>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,background:T.tHead,display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
                    <input type="number" min="0" value={bulkStockQty} onChange={e=>setBulkStockQty(e.target.value)} placeholder="Bulk qty"
                      style={{width:"110px",background:T.bg,border:`1.5px solid ${T.ib}`,borderRadius:"7px",color:T.text,padding:"7px 10px",fontSize:"12px",outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={()=>applyBulkStock("set")} style={{background:T.accent,border:"none",color:"#fff",borderRadius:"7px",padding:"7px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>Set All</button>
                    <button onClick={()=>applyBulkStock("add")} style={{background:"#059669",border:"none",color:"#fff",borderRadius:"7px",padding:"7px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>Add All</button>
                    <button onClick={()=>applyBulkStock("fill-empty")} style={{background:T.bg,border:`1px solid ${T.border}`,color:T.textMid,borderRadius:"7px",padding:"7px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>Fill Empty</button>
                  </div>
                  <StockGrid sizes={sizes} colors={colors} stock={stock} onStockChange={stockChange} T={T}/>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DESCRIPTION */}
          {activeTab==="description"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",alignItems:"start"}}>
              <Box title="Product Page Content" T={T}>
                <DescEditor blocks={descBlocks} onChange={setDescBlocks} T={T}/>
              </Box>
              <WebPreview name={name} price={parseInt(price)||0} category={category} subCategory={subCategory} colors={colors} featuredPhoto={featuredPhoto} variantPhotos={variantPhotos} descBlocks={descBlocks} onSale={onSale} salePrice={liveSalePrice} liveSaleDisc={liveSaleDisc} T={T}/>
            </div>
          )}

        </div>
      </div>

      {showDel&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}} onClick={()=>setShowDel(false)}/>
          <div style={{position:"relative",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"14px",padding:"28px",maxWidth:"380px",width:"90%",textAlign:"center",zIndex:1}}>
            <div style={{fontSize:"32px",marginBottom:"10px"}}>🗑</div>
            <div style={{fontSize:"15px",fontWeight:800,color:T.text,marginBottom:"6px"}}>Delete "{name}"?</div>
            <div style={{fontSize:"12px",color:T.textMuted,lineHeight:"1.6",marginBottom:"20px"}}>This will permanently remove the product and all its data. Cannot be undone.</div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setShowDel(false)} style={{flex:1,background:T.bg,border:`1px solid ${T.border}`,color:T.textMuted,borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{setShowDel(false);onDelete(product.id);}} style={{flex:1,background:"#EF4444",border:"none",color:"#fff",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────
function ProductCard({ product, onClick, T, showProfit = true }) {
  const [bg,textC,label] = stockStatus(product);
  const cover = product.featuredPhoto || Object.values(product.variantPhotos||{}).find(v=>v) || "";
  const isSale = product.onSale && product.salePrice > 0 && product.salePrice < product.price;
  const saleDisc = isSale ? Math.round((product.price - product.salePrice)/product.price*100) : 0;
  return (
    <div onClick={onClick} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"border-color 0.15s"}}
      onMouseEnter={e=>onClick && (e.currentTarget.style.borderColor=T.accent+"70")}
      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
      <div style={{height:"110px",background:product.bg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        {cover?<img src={cover} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"52px"}}>{product.img}</span>}
        {isSale&&<div style={{position:"absolute",top:"8px",left:"8px",background:"#EF4444",color:"#fff",fontSize:"9px",fontWeight:800,padding:"2px 7px",borderRadius:"4px"}}>-{saleDisc}% SALE</div>}
        {product.status==="inactive"&&<div style={{position:"absolute",top:"8px",right:"8px",background:"rgba(0,0,0,0.55)",color:"#fff",fontSize:"9px",fontWeight:700,padding:"2px 7px",borderRadius:"4px"}}>INACTIVE</div>}
      </div>
      <div style={{padding:"12px"}}>
        <div style={{fontSize:"12px",fontWeight:700,color:T.text,marginBottom:"1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{product.name}</div>
        <div style={{fontSize:"10px",color:T.textMuted,marginBottom:"8px"}}>{product.category}{product.subCategory?" › "+product.subCategory:""}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"7px"}}>
          {isSale ? (
            <div>
              <span style={{fontSize:"14px",fontWeight:800,color:"#EF4444"}}>৳{product.salePrice.toLocaleString()}</span>
              <span style={{fontSize:"11px",color:T.textMuted,textDecoration:"line-through",marginLeft:"5px"}}>৳{product.price.toLocaleString()}</span>
            </div>
          ) : (
            <span style={{fontSize:"14px",fontWeight:800,color:T.accent}}>৳{product.price.toLocaleString()}</span>
          )}
          {showProfit && <span style={{fontSize:"10px",color:"#059669",fontWeight:600}}>+৳{(isSale?product.salePrice:product.price)-product.costPrice} margin</span>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:"10px",padding:"3px 8px",borderRadius:"5px",fontWeight:700,background:bg,color:textC}}>{label}</span>
          <span style={{fontSize:"11px",fontWeight:700,color:T.textMid}}>{totalStock(product)} units</span>
        </div>
      </div>
    </div>
  );
}

// ── PRODUCT ROW ───────────────────────────────────────────────────────────
function ProductRow({ product, onClick, T, showProfit = true }) {
  const tableCols = showProfit
    ? "56px minmax(260px,2.4fr) minmax(120px,1fr) minmax(100px,0.9fr) minmax(90px,0.85fr) minmax(120px,1fr) minmax(90px,0.85fr)"
    : "56px minmax(260px,2.6fr) minmax(120px,1fr) minmax(95px,0.9fr) minmax(120px,1fr) minmax(90px,0.85fr)";
  const [bg,textC,label] = stockStatus(product);
  const cover = product.featuredPhoto || Object.values(product.variantPhotos||{}).find(v=>v) || "";
  const isSale = product.onSale && product.salePrice > 0 && product.salePrice < product.price;
  const saleDisc = isSale ? Math.round((product.price - product.salePrice)/product.price*100) : 0;
  return (
    <div onClick={onClick} style={{display:"grid",gridTemplateColumns:tableCols,padding:"10px 14px",borderBottom:`1px solid ${T.border}`,cursor:onClick?"pointer":"default",alignItems:"center"}}
      onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{width:"36px",height:"36px",borderRadius:"8px",background:product.bg,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
        {cover?<img src={cover} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:product.img}
      </div>
      <div style={{paddingLeft:"12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{fontSize:"12px",fontWeight:700,color:T.text}}>{product.name}</span>
          {isSale&&<span style={{fontSize:"9px",background:"#EF444415",color:"#DC2626",fontWeight:700,padding:"1px 6px",borderRadius:"4px"}}>-{saleDisc}% SALE</span>}
        </div>
        <div style={{fontSize:"10px",color:T.textMuted}}>{product.category}{product.subCategory?" › "+product.subCategory:""} · {product.sizes.length} sizes · {product.colors.length} colors</div>
      </div>
      <div>
        {isSale ? (
          <div>
            <span style={{fontSize:"13px",fontWeight:800,color:"#EF4444"}}>৳{product.salePrice.toLocaleString()}</span>
            <span style={{fontSize:"11px",color:T.textMuted,textDecoration:"line-through",marginLeft:"5px"}}>৳{product.price.toLocaleString()}</span>
          </div>
        ) : (
          <span style={{fontSize:"13px",fontWeight:700,color:T.accent}}>৳{product.price.toLocaleString()}</span>
        )}
      </div>
      {showProfit && <div style={{fontSize:"11px",color:"#059669",fontWeight:600}}>+৳{(isSale?product.salePrice:product.price)-product.costPrice}</div>}
      <div style={{fontSize:"13px",fontWeight:700,color:T.textMid}}>{totalStock(product)}</div>
      <div><span style={{fontSize:"10px",padding:"3px 8px",borderRadius:"5px",fontWeight:700,background:bg,color:textC}}>{label}</span></div>
      <div><span style={{fontSize:"10px",padding:"3px 8px",borderRadius:"5px",fontWeight:700,background:product.status==="active"?"#10B98115":"#64748B15",color:product.status==="active"?"#059669":"#64748B"}}>{product.status==="active"?"Active":"Inactive"}</span></div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [dark, setDark]           = useState(false);
  const T = dark ? DARK : LIGHT;
  const [products, setProducts]   = useState(() => {
    try {
      const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (!raw) return INIT_PRODUCTS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : INIT_PRODUCTS;
    } catch {
      return INIT_PRODUCTS;
    }
  });
  const [catTree, setCatTree]     = useState(() => {
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (!raw) return INIT_CAT_TREE;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : INIT_CAT_TREE;
    } catch {
      return INIT_CAT_TREE;
    }
  });
  const [viewMode, setViewMode]   = useState("table");
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [isNew, setIsNew]         = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const sessionUser = loadSession()?.user;
  const isAgent = sessionUser?.role === "agent";
  const isProductUploader = sessionUser?.role === "product-uploader";
  const sessionName = sessionUser?.name || (isProductUploader ? "Product Uploader" : isAgent ? "Agent" : "Admin");
  const sessionAvatar = sessionUser?.avatar || (isProductUploader ? "PU" : "A");
  const sessionColor = sessionUser?.color || (isProductUploader ? "#0EA5E9" : "linear-gradient(135deg,#6366F1,#A855F7)");
  const canEditProducts = !isAgent;
  const navItems = isProductUploader ? PRODUCT_UPLOADER_NAV : isAgent ? AGENT_NAV : NAV;

  useEffect(() => {
    if (isAgent && editProduct) {
      setEditProduct(null);
      setIsNew(false);
    }
  }, [isAgent, editProduct]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage quota/runtime errors and keep in-memory state.
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(catTree));
    } catch {
      // Ignore storage quota/runtime errors and keep in-memory state.
    }
  }, [catTree]);

  // All parent cats + subs for the filter dropdown
  const allParents = Object.keys(catTree);
  const selectedCategory = catFilter.startsWith("sub::") ? catFilter.split("::")[1] : catFilter;
  const selectedSubCategory = catFilter.startsWith("sub::") ? catFilter.split("::")[2] : "all";

  const filtered = products.filter(p => {
    if (selectedCategory!=="all" && p.category!==selectedCategory) return false;
    if (selectedSubCategory!=="all" && p.subCategory!==selectedSubCategory) return false;
    if (stockFilter==="out" && totalStock(p)>0) return false;
    if (stockFilter==="low" && (totalStock(p)===0||totalStock(p)>5)) return false;
    if (stockFilter==="ok"  && totalStock(p)<=5) return false;
    if (statusFilter==="active" && p.status!=="active") return false;
    if (statusFilter==="inactive" && p.status!=="inactive") return false;
    if (search) { const q=search.toLowerCase(); if(!p.name.toLowerCase().includes(q)&&!p.category.toLowerCase().includes(q)) return false; }
    return true;
  });

  const stats = [
    ["Total",      products.length,                                                  "#6366F1"],
    ["Active",     products.filter(p=>p.status==="active").length,                  "#059669"],
    ["In Stock",   products.filter(p=>totalStock(p)>5).length,                     "#059669"],
    ["Low Stock",  products.filter(p=>totalStock(p)>0&&totalStock(p)<=5).length,   "#D97706"],
    ["Out of Stock",products.filter(p=>totalStock(p)===0).length,                  "#DC2626"],
    ["Total Units",products.reduce((a,b)=>a+totalStock(b),0),                      "#0D9488"],
  ];

  const handleSave = (updated) => {
    if (isNew) setProducts(p=>[...p,{...updated,id:"p"+Date.now()}]);
    else       setProducts(p=>p.map(x=>x.id===updated.id?updated:x));
    setActionMsg(isNew ? "Product created successfully." : "Product updated successfully.");
    setEditProduct(null); setIsNew(false);
  };
  const handleDelete  = (id) => {
    setProducts(p=>p.filter(x=>x.id!==id));
    setActionMsg("Product deleted successfully.");
    setEditProduct(null);
  };
  const addParentCat  = (cat) => setCatTree(p=>({...p,[cat]:[]}));
  const addSubCat     = (parent,sub) => setCatTree(p=>({...p,[parent]:[...(p[parent]||[]),sub]}));

  const openNew = () => {
    const firstCat = Object.keys(catTree)[0]||"";
    setEditProduct({id:"new",name:"",price:0,costPrice:0,category:firstCat,subCategory:"",status:"active",img:"🛍️",bg:"#92400E",sourceLink:"",sizes:["Free"],colors:["Black"],stock:{"Free-Black":0},featuredPhoto:"",variantPhotos:{"Black":""},descBlocks:[{type:"text",value:""}]});
    setIsNew(true);
  };

  const ISsmall = {background:T.input,border:`1px solid ${T.border}`,borderRadius:"7px",color:T.text,padding:"7px 10px",fontSize:"12px",outline:"none",boxSizing:"border-box",cursor:"pointer",fontFamily:"inherit"};

  if (editProduct && canEditProducts) return (
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={navItems}
        user={{
          name: sessionName,
          role: isProductUploader ? "Products Only" : isAgent ? "Agent" : "Super Admin",
          avatar: sessionAvatar,
          color: sessionColor,
        }}
        badgeByLabel={!isAgent ? { Products: { text: String(products.length) } } : undefined}
      />
      <EditPage product={editProduct} isNew={isNew} T={T} catTree={catTree} onSave={handleSave} onBack={()=>{setEditProduct(null);setIsNew(false);}} onDelete={handleDelete} onAddParent={addParentCat} onAddSub={addSubCat}/>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={navItems}
        user={{
          name: sessionName,
          role: isProductUploader ? "Products Only" : isAgent ? "Agent" : "Super Admin",
          avatar: sessionAvatar,
          color: sessionColor,
        }}
        badgeByLabel={!isAgent ? { Products: { text: String(products.length) } } : undefined}
      />
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Topbar */}
        <div style={{height:"52px",background:T.sidebar,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 18px",gap:"10px",flexShrink:0}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:T.textMuted,fontSize:"12px"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
              style={{width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:"8px",padding:"7px 10px 7px 30px",color:T.text,fontSize:"12px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:"2px",background:T.bg,borderRadius:"8px",padding:"3px",border:`1px solid ${T.border}`}}>
            {[["grid","⊞ Grid"],["table","≡ Table"]].map(([id,label])=>(
              <button key={id} onClick={()=>setViewMode(id)} style={{padding:"5px 12px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:600,background:viewMode===id?T.accent+"18":"transparent",color:viewMode===id?T.accent:T.textMuted}}>{label}</button>
            ))}
          </div>
          {canEditProducts && <button onClick={openNew} style={{background:T.accent,color:"#fff",border:"none",borderRadius:"8px",padding:"7px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add Product</button>}
        </div>

        <div style={{flex:1,overflow:"auto",padding:"16px 18px"}}>
          <div style={{marginBottom:"14px"}}>
            <h1 style={{margin:0,fontSize:"16px",fontWeight:800,color:T.text}}>Product Catalog</h1>
            <div style={{fontSize:"11px",color:T.textMuted,marginTop:"3px"}}>{isAgent ? "Browse products and stock availability" : "Manage products, stock levels, pricing and page content"}</div>
          </div>

            {actionMsg && (
              <div style={{ marginBottom:"12px", padding:"10px 12px", borderRadius:"8px", background:"#05966915", border:"1px solid #05966930", color:"#059669", fontSize:"12px", fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>{actionMsg}</span>
                <button onClick={() => setActionMsg("")} style={{ background:"transparent", border:"none", color:"#059669", cursor:"pointer", fontSize:"12px", fontWeight:700 }}>✕</button>
              </div>
            )}

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"8px",marginBottom:"14px"}}>
            {stats.map(([label,val,color],i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"11px 12px"}}>
                <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:"5px"}}>{label}</div>
                <div style={{fontSize:"18px",fontWeight:800,color}}>{val}</div>
              </div>
            ))}
          </div>

          {/* Filters — dropdowns */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"12px 14px",marginBottom:"14px",display:"flex",gap:"10px",alignItems:"flex-end",flexWrap:"wrap"}}>
            {/* Category dropdown with optgroups */}
            <div style={{minWidth:"180px"}}>
              <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px"}}>Category</div>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{...ISsmall,width:"100%"}}>
                <option value="all">All Categories</option>
                {allParents.map(parent=>(
                  <optgroup key={parent} label={parent}>
                    <option value={parent}>{parent} — All</option>
                    {(catTree[parent]||[]).map(sub=><option key={sub} value={`sub::${parent}::${sub}`}>{parent} › {sub}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Stock status */}
            <div style={{minWidth:"140px"}}>
              <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px"}}>Stock Status</div>
              <select value={stockFilter} onChange={e=>setStockFilter(e.target.value)} style={{...ISsmall,width:"100%"}}>
                <option value="all">All Stock</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            {/* Status */}
            <div style={{minWidth:"130px"}}>
              <div style={{fontSize:"9px",color:T.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px"}}>Status</div>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...ISsmall,width:"100%"}}>
                <option value="all">All Products</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div style={{marginLeft:"auto",fontSize:"11px",color:T.textMuted,alignSelf:"center",paddingBottom:"2px"}}>Showing {filtered.length} of {products.length}</div>
          </div>

          {/* Grid */}
          {viewMode==="grid"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:"12px"}}>
              {filtered.map(p=><ProductCard key={p.id} product={p} onClick={()=>setViewProduct(p)} T={T} showProfit={!isAgent}/>) }
              {filtered.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px",color:T.textMuted}}>No products match.</div>}
            </div>
          )}

          {/* Table */}
          {viewMode==="table"&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:isAgent?"56px minmax(260px,2.6fr) minmax(120px,1fr) minmax(95px,0.9fr) minmax(120px,1fr) minmax(90px,0.85fr)":"56px minmax(260px,2.4fr) minmax(120px,1fr) minmax(100px,0.9fr) minmax(90px,0.85fr) minmax(120px,1fr) minmax(90px,0.85fr)",padding:"9px 14px",borderBottom:`1px solid ${T.border}`,background:T.tHead}}>
                <div/>
                {(isAgent ? ["Product","Price","Stock","Status","Active"] : ["Product","Price","Profit","Stock","Status","Active"]).map((h,i)=>(
                  <div key={i} style={{fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase",letterSpacing:"0.5px",paddingLeft:i===0?"12px":0}}>{h}</div>
                ))}
              </div>
              {filtered.map(p=><ProductRow key={p.id} product={p} onClick={()=>setViewProduct(p)} T={T} showProfit={!isAgent}/>) }
              {filtered.length===0&&<div style={{padding:"36px",textAlign:"center",color:T.textMuted,fontSize:"12px"}}>No products match.</div>}
            </div>
          )}
        </div>
      </div>

      {viewProduct && (
        <div style={{ position:"fixed", inset:0, zIndex:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={() => setViewProduct(null)} />
          <div style={{ position:"relative", width:"520px", maxWidth:"94vw", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.35)" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>Product View</div>
              <button onClick={() => setViewProduct(null)} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 8px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"16px" }}>
              <div style={{ display:"flex", gap:"12px", marginBottom:"12px" }}>
                <div style={{ width:"56px", height:"56px", borderRadius:"10px", background:viewProduct.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>{viewProduct.img}</div>
                <div>
                  <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>{viewProduct.name}</div>
                  <div style={{ fontSize:"12px", color:T.textMuted }}>{viewProduct.category}{viewProduct.subCategory ? ` / ${viewProduct.subCategory}` : ""}</div>
                  <div style={{ fontSize:"12px", color:T.textMuted, marginTop:"3px" }}>Status: <strong style={{ color:viewProduct.status === "active" ? "#059669" : "#DC2626" }}>{viewProduct.status}</strong></div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"8px" }}><div style={{ fontSize:"10px", color:T.textMuted }}>Price</div><div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>৳{viewProduct.price.toLocaleString()}</div></div>
                <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"8px" }}><div style={{ fontSize:"10px", color:T.textMuted }}>Cost</div><div style={{ fontSize:"14px", fontWeight:800, color:"#DC2626" }}>৳{viewProduct.costPrice.toLocaleString()}</div></div>
                <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"8px" }}><div style={{ fontSize:"10px", color:T.textMuted }}>Stock</div><div style={{ fontSize:"14px", fontWeight:800, color:T.accent }}>{totalStock(viewProduct)}</div></div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:"8px" }}>
                <button onClick={() => setViewProduct(null)} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"8px 12px", fontSize:"12px", cursor:"pointer" }}>Close</button>
                {canEditProducts && <button onClick={() => { setEditProduct(viewProduct); setIsNew(false); setViewProduct(null); }} style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Edit Product</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










