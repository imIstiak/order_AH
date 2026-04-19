import { useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { loadSession } from "./core/auth-session";
import { getSelectedBatchId, listAvailableOrders, listBatches, selectBatch } from "./core/batch-store";
import * as XLSX from "xlsx";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const CNY_TO_BDT = 15;

// ── MOCK DATA ─────────────────────────────────────────────────
const BATCH = {
  id:"b1", batchCode:"BATCH-4421",
  batchName:"Ali Express Restock April W3",
  note:"Source from Ali Express Store #4421. Check sizing carefully before ordering. Expected sourcing window: 3 days.",
  createdAt:"17 Apr 2026, 10:00 AM", createdBy:"Istiak Shaharia",
};

const ORDERS = [
  {
    id:"o1", num:"#1001", customer:"Fatima Akter",   phone:"01711111111",
    address:"House 12, Road 5, Dhanmondi, Dhaka", status:"confirmed", codDue:4300,
    items:[
      { productId:"P001", name:"Leather Tote Bag",    code:"LTB-001", color:"Black",  size:"M",    qty:1, buyPrice:1400, sellPrice:2500, sourceUrl:"https://aliexpress.com/item/LTB001" },
      { productId:"P003", name:"Silver Bracelet",      code:"SB-003",  color:"Silver", size:"Free", qty:1, buyPrice:600,  sellPrice:1800, sourceUrl:"" },
    ],
  },
  {
    id:"o2", num:"#1002", customer:"Rahela Khanam",  phone:"01722222222",
    address:"Flat 3B, Road 10, Uttara Sector 7, Dhaka", status:"shipped", codDue:2400,
    items:[
      { productId:"P002", name:"High Ankle Converse", code:"HAC-002", color:"White",  size:"38",   qty:1, buyPrice:1600, sellPrice:3200, sourceUrl:"https://aliexpress.com/item/HAC002" },
    ],
  },
  {
    id:"o3", num:"#1003", customer:"Sabrina Islam",  phone:"01633333333",
    address:"Zindabazar Chairman Bari, Sylhet", status:"confirmed", codDue:5200,
    items:[
      { productId:"P004", name:"Quilted Shoulder Bag",code:"QSB-004", color:"Pink",   size:"M",    qty:2, buyPrice:1800, sellPrice:3500, sourceUrl:"https://aliexpress.com/item/QSB004" },
    ],
  },
  {
    id:"o4", num:"#1004", customer:"Mithila Rahman", phone:"01544444444",
    address:"Block C, Mirpur 12, Dhaka", status:"pending", codDue:5900,
    items:[
      { productId:"P005", name:"Platform Sneakers",   code:"PS-005",  color:"Black",  size:"37",   qty:1, buyPrice:1900, sellPrice:3800, sourceUrl:"https://aliexpress.com/item/PS005" },
      { productId:"P007", name:"Gold Chain Necklace", code:"GCN-007", color:"Gold",   size:"Free", qty:1, buyPrice:700,  sellPrice:2100, sourceUrl:"" },
    ],
  },
  {
    id:"o5", num:"#1005", customer:"Taslima Begum",  phone:"01355555555",
    address:"House 4, Road 9, Banani, Dhaka", status:"delivered", codDue:0,
    items:[
      { productId:"P001", name:"Leather Tote Bag",    code:"LTB-001", color:"Brown",  size:"L",    qty:1, buyPrice:1400, sellPrice:2500, sourceUrl:"https://aliexpress.com/item/LTB001" },
      { productId:"P002", name:"High Ankle Converse", code:"HAC-002", color:"White",  size:"39",   qty:1, buyPrice:1600, sellPrice:3200, sourceUrl:"https://aliexpress.com/item/HAC002" },
    ],
  },
];

const STATUS_COLOR = { confirmed:"#6366F1", shipped:"#2563EB", pending:"#D97706", delivered:"#059669", cancelled:"#DC2626" };

// ── BUILD PRODUCT MAP ─────────────────────────────────────────
// One entry per product (productId). Each has an array of variants with qty.
const buildProductMap = (orders) => {
  const productMap = {}; // productId → { info, variants: { "color||size" → qty } }
  orders.forEach(o => {
    o.items.forEach(it => {
      if (!productMap[it.productId]) {
        productMap[it.productId] = {
          productId: it.productId, name: it.name, code: it.code,
          sourceUrl: it.sourceUrl, buyPrice: it.buyPrice, sellPrice: it.sellPrice,
          variants: {},
        };
      }
      const vkey = `${it.color}||${it.size}`;
      if (!productMap[it.productId].variants[vkey]) {
        productMap[it.productId].variants[vkey] = { color:it.color, size:it.size, qty:0 };
      }
      productMap[it.productId].variants[vkey].qty += it.qty;
    });
  });
  return productMap;
};

// ── ANALYTICS ────────────────────────────────────────────────
const calcAnalytics = (orders) => {
  let totalBuy=0, totalSell=0, totalQty=0;
  orders.forEach(o => o.items.forEach(it => {
    totalBuy  += it.buyPrice  * it.qty;
    totalSell += it.sellPrice * it.qty;
    totalQty  += it.qty;
  }));
  return { totalBuy, totalSell, profit:totalSell-totalBuy, margin:totalSell>0?Math.round((totalSell-totalBuy)/totalSell*100):0, totalQty };
};

// ── XLSX EXPORT (matching sample format) ─────────────────────
const exportBatchXLSX = (batch, orders) => {
  const wb   = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("en-GB");
  const pmap  = buildProductMap(orders);
  const products = Object.values(pmap);

  // ── Sheet 1: Agent_Order_Summary ─────────────────────────────
  // One row per product. VariantsSummary = "Black M×1; Brown L×2"
  const s1header = [
    "BatchID", "BatchName", "ProductID", "ProductName", "ProductLink",
    "VariantsSummary", "TotalQty",
    "PricePerUnit_CNY (Agent)", "Seller→Agent_Ship_CNY (Agent)",
    "Subtotal_CNY", "TotalCost_CNY", "TotalCost_BDT", "Notes",
  ];

  const s1rows = products.map(p => {
    const variants = Object.values(p.variants);
    const variantSummary = variants.map(v => `${v.color} ${v.size}×${v.qty}`).join("; ");
    const totalQty = variants.reduce((a,v)=>a+v.qty, 0);
    return [
      batch.batchCode,
      batch.batchName,
      p.productId,
      p.name,
      p.sourceUrl || "—",
      variantSummary,
      totalQty,
      "",   // PricePerUnit_CNY — agent fills
      "",   // Shipping_CNY    — agent fills
      "",   // Subtotal_CNY    — formula
      "",   // TotalCost_CNY   — formula
      "",   // TotalCost_BDT   — formula
      "",   // Notes
    ];
  });

  const ws1 = XLSX.utils.aoa_to_sheet([s1header, ...s1rows]);

  // Column widths
  ws1["!cols"] = [
    { wch:14 }, { wch:28 }, { wch:10 }, { wch:28 }, { wch:40 },
    { wch:36 }, { wch:10 }, { wch:22 }, { wch:26 },
    { wch:14 }, { wch:14 }, { wch:14 }, { wch:20 },
  ];

  // Bold header row
  const headerRange = XLSX.utils.decode_range(ws1["!ref"]);
  for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r:0, c });
    if (ws1[cellAddr]) ws1[cellAddr].s = { font:{ bold:true }, fill:{ fgColor:{ rgb:"A855F7" } } };
  }

  XLSX.utils.book_append_sheet(wb, ws1, "Agent_Order_Summary");

  // ── Sheet 2: Variant_Details ──────────────────────────────────
  // One row per variant (product + color + size). Includes order reference.
  const s2header = [
    "BatchID", "ProductID", "ProductName", "Color", "Size", "Qty",
    "OrderRef", "BuyPrice_BDT", "SellPrice_BDT",
  ];

  const s2rows = [];
  orders.forEach(o => {
    o.items.forEach(it => {
      s2rows.push([
        batch.batchCode,
        it.productId,
        it.name,
        it.color,
        it.size,
        it.qty,
        o.num,
        `৳${it.buyPrice.toLocaleString()}`,
        `৳${it.sellPrice.toLocaleString()}`,
      ]);
    });
  });

  // Sort by product name then color then size for easy reading
  s2rows.sort((a,b) => a[2].localeCompare(b[2]) || a[3].localeCompare(b[3]) || String(a[4]).localeCompare(String(b[4])));

  const ws2 = XLSX.utils.aoa_to_sheet([s2header, ...s2rows]);
  ws2["!cols"] = [
    { wch:14 }, { wch:10 }, { wch:28 }, { wch:10 }, { wch:8 }, { wch:6 },
    { wch:10 }, { wch:16 }, { wch:16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Variant_Details");

  // ── Sheet 3: Order_Breakdown (Packing Slips) ──────────────────
  const s3header = [
    "OrderID","Customer","Phone","Full Address","Product","Color","Size","Qty","SellPrice","COD Due","Status",
  ];
  const s3rows = [];
  orders.forEach(o => {
    o.items.forEach((it, idx) => {
      s3rows.push([
        idx===0 ? o.num      : "",
        idx===0 ? o.customer : "",
        idx===0 ? o.phone    : "",
        idx===0 ? o.address  : "",
        it.name, it.color, it.size, it.qty,
        `৳${it.sellPrice.toLocaleString()}`,
        idx===0 ? (o.codDue>0?`৳${o.codDue.toLocaleString()}`:"PAID") : "",
        idx===0 ? o.status.toUpperCase() : "",
      ]);
    });
    s3rows.push(["","","","","","","","","","",""]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet([s3header, ...s3rows]);
  ws3["!cols"] = [
    { wch:10 }, { wch:20 }, { wch:14 }, { wch:40 },
    { wch:26 }, { wch:10 }, { wch:8 }, { wch:6 },
    { wch:12 }, { wch:12 }, { wch:12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Order_Breakdown");

  // ── Sheet 4: ReadMe ───────────────────────────────────────────
  const s4data = [
    ["How to use this file:"],
    [],
    ["Sheet 1 — Agent_Order_Summary"],
    ["  One row per product. All variants are summarized in the VariantsSummary column (e.g. Black M×1; Brown L×2)."],
    ["  ► Fill in: PricePerUnit_CNY and Seller→Agent_Ship_CNY for each product."],
    [],
    ["Sheet 2 — Variant_Details"],
    ["  One row per variant per order. Used for packing verification."],
    [],
    ["Sheet 3 — Order_Breakdown"],
    ["  Full per-order packing list. Match each order's items before dispatch."],
    [],
    ["CNY to BDT Rate", CNY_TO_BDT],
    [],
    ["Batch Info"],
    ["Batch ID",   batch.batchCode],
    ["Batch Name", batch.batchName],
    ["Note",       batch.note || "—"],
    ["Created By", batch.createdBy],
    ["Created At", batch.createdAt],
    ["Export Date",today],
  ];

  const ws4 = XLSX.utils.aoa_to_sheet(s4data);
  ws4["!cols"] = [{ wch:20 }, { wch:60 }];
  XLSX.utils.book_append_sheet(wb, ws4, "ReadMe");

  XLSX.writeFile(wb, `${batch.batchCode}-${batch.batchName.replace(/\s+/g,"-")}-Agent.xlsx`);
};

// ── HELPERS ───────────────────────────────────────────────────
function Sidebar({ dark, setDark, nav, setNav, T, userName, userRole, userAvatar, userColor }) {
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
      <div style={{ fontSize:"22px", fontWeight:800, color, letterSpacing:"-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>{sub}</div>}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function BatchDetailPage() {
  const [dark, setDark]       = useState(false);
  const T = dark ? DARK : LIGHT;
  const [exporting, setExporting] = useState(false);
  const [tab, setTab]         = useState("summary"); // summary | orders
  const sessionUser = loadSession()?.user;
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)";

  const allBatches = listBatches();
  const allOrders = listAvailableOrders();
  const selectedBatchId = getSelectedBatchId();
  const BATCH = allBatches.find((batch) => batch.id === selectedBatchId) || allBatches[0] || {
    id: "fallback-batch",
    batchCode: "BATCH-0000",
    batchName: "Fallback Batch",
    note: "",
    orderIds: [],
    createdAt: "",
    createdBy: "System",
  };
  const batchOrderIds = Array.isArray(BATCH.orderIds)
    ? new Set(BATCH.orderIds.map((id) => String(id || "").toLowerCase()))
    : new Set();
  const ORDERS = allOrders.filter((order) => batchOrderIds.has(String(order.id || "").toLowerCase()));

  if (!selectedBatchId && BATCH?.id) {
    selectBatch(BATCH.id);
  }

  const pmap    = buildProductMap(ORDERS);
  const products = Object.values(pmap);
  const { totalBuy, totalSell, profit, margin, totalQty } = calcAnalytics(ORDERS);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      exportBatchXLSX(BATCH, ORDERS);
      setExporting(false);
    }, 300);
  };

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
        showLogout={false}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ background:T.sidebar, borderBottom:`1px solid ${T.border}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <button onClick={() => navigateByAdminNavLabel("Batches")} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"7px", padding:"5px 12px", fontSize:"12px", color:T.textMuted, cursor:"pointer", flexShrink:0 }}>← Batches</button>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>{BATCH.batchName}</div>
              <span style={{ fontSize:"12px", fontWeight:700, fontFamily:"monospace", background:"#A855F715", color:"#A855F7", padding:"2px 9px", borderRadius:"5px", border:"1px solid #A855F725" }}>{BATCH.batchCode}</span>
            </div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>Created by {BATCH.createdBy} · {BATCH.createdAt}</div>
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ background:exporting?"#CBD5E1":"#059669", border:"none", color:exporting?"#94A3B8":"#fff", borderRadius:"9px", padding:"10px 20px", fontSize:"13px", fontWeight:800, cursor:exporting?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:"8px", boxShadow:exporting?"none":"0 4px 14px rgba(5,150,105,0.35)", transition:"all 0.15s", flexShrink:0 }}>
            <span>📊</span>
            {exporting ? "Generating..." : "Export for Agent (XLSX)"}
          </button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"18px 22px" }}>

          {/* Batch note */}
          {BATCH.note && (
            <div style={{ padding:"12px 16px", background:"#A855F710", border:"1px solid #A855F725", borderRadius:"10px", marginBottom:"16px", display:"flex", gap:"10px" }}>
              <span style={{ fontSize:"18px", flexShrink:0 }}>📝</span>
              <div>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#A855F7", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"3px" }}>Batch Note</div>
                <div style={{ fontSize:"13px", color:T.text, lineHeight:"1.6" }}>{BATCH.note}</div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"10px", marginBottom:"18px" }}>
            <StatCard label="Total Orders"    value={ORDERS.length}                    sub={`${totalQty} items`}                   color="#6366F1" icon="🛍️" T={T}/>
            <StatCard label="Total Buy Cost"  value={"৳"+totalBuy.toLocaleString()}   sub="Sum of cost prices"                    color="#DC2626" icon="🏷️" T={T}/>
            <StatCard label="Total Sell Value" value={"৳"+totalSell.toLocaleString()} sub="Sum of sell prices"                    color="#059669" icon="💰" T={T}/>
            <StatCard label="Gross Profit"    value={"৳"+profit.toLocaleString()}     sub={`${margin}% margin`}                   color="#D97706" icon="📈" T={T}/>
            <StatCard label="Products"        value={products.length}                  sub={`${products.reduce((a,p)=>a+Object.keys(p.variants).length,0)} variants`} color="#A855F7" icon="🔢" T={T}/>
          </div>

          {/* Export CTA */}
          <div style={{ background:"linear-gradient(135deg,#059669,#0D9488)", borderRadius:"12px", padding:"16px 20px", marginBottom:"18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:"14px", fontWeight:800, color:"#fff", marginBottom:"4px" }}>📊 Export Batch for Agent (XLSX)</div>
              <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.8)" }}>
                4 sheets: Agent_Order_Summary (1 row/product) · Variant_Details · Order_Breakdown · ReadMe
              </div>
            </div>
            <button onClick={handleExport} disabled={exporting}
              style={{ background:"#fff", border:"none", color:"#059669", borderRadius:"9px", padding:"11px 22px", fontSize:"13px", fontWeight:800, cursor:exporting?"not-allowed":"pointer", flexShrink:0, marginLeft:"20px", opacity:exporting?0.7:1 }}>
              ⬇ Download XLSX
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"9px", padding:"3px", border:`1px solid ${T.border}`, width:"fit-content", marginBottom:"14px" }}>
            {[["summary","📋 Agent Summary (Sheet 1)"],["variants","🔢 Variant Details (Sheet 2)"],["orders","📦 Order Breakdown (Sheet 3)"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{ padding:"7px 16px", borderRadius:"7px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:700, background:tab===id?"#A855F720":"transparent", color:tab===id?"#A855F7":T.textMuted }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── SHEET 1: Agent Summary ── */}
          {tab === "summary" && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              <div style={{ padding:"11px 16px", borderBottom:`1px solid ${T.border}`, background:"#A855F710" }}>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#A855F7" }}>Agent_Order_Summary — One row per product · Agent fills in CNY pricing</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>Same product across multiple orders is aggregated into one row with combined qty</div>
              </div>
              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 180px 60px 130px 100px", padding:"8px 14px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                {["Product ID","Product Name","Variants Summary","Total Qty","Source Link","Buy Price (BDT)"].map((h,i)=>(
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</div>
                ))}
              </div>
              {products.map((p, i) => {
                const variants = Object.values(p.variants);
                const totalQtyP = variants.reduce((a,v)=>a+v.qty,0);
                const variantSummary = variants.map(v=>`${v.color} ${v.size}×${v.qty}`).join("; ");
                return (
                  <div key={p.productId} style={{ display:"grid", gridTemplateColumns:"90px 1fr 180px 60px 130px 100px", padding:"12px 14px", borderBottom:i<products.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ fontSize:"11px", fontFamily:"monospace", color:T.textMuted }}>{p.productId}</div>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{p.name}</div>
                      <div style={{ fontSize:"10px", fontFamily:"monospace", color:T.textMuted }}>{p.code}</div>
                    </div>
                    <div>
                      {variants.map((v,j)=>(
                        <span key={j} style={{ display:"inline-block", fontSize:"10px", fontWeight:600, padding:"1px 7px", borderRadius:"4px", background:"#A855F715", color:"#A855F7", marginRight:"4px", marginBottom:"3px" }}>
                          {v.color} {v.size}×{v.qty}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize:"15px", fontWeight:800, color:"#A855F7" }}>{totalQtyP}</div>
                    <div style={{ fontSize:"10px", color:T.accent }}>
                      {p.sourceUrl ? <a href={p.sourceUrl} style={{ color:T.accent, fontSize:"10px" }} target="_blank" rel="noreferrer">View Link ↗</a> : <span style={{ color:T.textMuted }}>—</span>}
                    </div>
                    <div style={{ fontSize:"12px", fontWeight:700, color:"#DC2626" }}>৳{p.buyPrice.toLocaleString()}/unit</div>
                  </div>
                );
              })}
              {/* Total */}
              <div style={{ display:"grid", gridTemplateColumns:"90px 1fr 180px 60px 130px 100px", padding:"10px 14px", background:T.tHead, borderTop:`2px solid ${T.border}`, alignItems:"center" }}>
                <div style={{ fontSize:"12px", fontWeight:700, color:T.text, gridColumn:"1/4" }}>Total</div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#A855F7" }}>{totalQty}</div>
                <div/>
                <div style={{ fontSize:"12px", fontWeight:800, color:"#DC2626" }}>৳{totalBuy.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* ── SHEET 2: Variant Details ── */}
          {tab === "variants" && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              <div style={{ padding:"11px 16px", borderBottom:`1px solid ${T.border}`, background:"#D9770610" }}>
                <div style={{ fontSize:"12px", fontWeight:700, color:"#D97706" }}>Variant_Details — One row per variant per order</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>Used for packing verification — match each item against the order</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"100px 1fr 90px 90px 50px 90px 110px 110px", padding:"8px 14px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
                {["Product ID","Product Name","Color","Size","Qty","Order","Buy Price","Sell Price"].map((h,i)=>(
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.4px" }}>{h}</div>
                ))}
              </div>
              {(() => {
                const rows = [];
                ORDERS.forEach(o => o.items.forEach(it => rows.push({ ...it, orderNum:o.num })));
                rows.sort((a,b)=>a.name.localeCompare(b.name)||a.color.localeCompare(b.color));
                return rows.map((it,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"100px 1fr 90px 90px 50px 90px 110px 110px", padding:"10px 14px", borderBottom:i<rows.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ fontSize:"10px", fontFamily:"monospace", color:T.textMuted }}>{it.productId}</div>
                    <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{it.name}</div>
                    <div style={{ fontSize:"11px", color:T.textMid }}>{it.color}</div>
                    <div style={{ fontSize:"11px", color:T.textMid }}>{it.size}</div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#D97706" }}>{it.qty}</div>
                    <div style={{ fontSize:"11px", fontWeight:600, color:T.accent }}>{it.orderNum}</div>
                    <div style={{ fontSize:"11px", color:"#DC2626", fontWeight:600 }}>৳{it.buyPrice.toLocaleString()}</div>
                    <div style={{ fontSize:"11px", color:"#059669", fontWeight:600 }}>৳{it.sellPrice.toLocaleString()}</div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* ── SHEET 3: Order Breakdown ── */}
          {tab === "orders" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {ORDERS.map(o => {
                const sc = STATUS_COLOR[o.status]||"#64748B";
                return (
                  <div key={o.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"11px", overflow:"hidden" }}>
                    <div style={{ padding:"11px 16px", background:sc+"10", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                        <span style={{ fontSize:"13px", fontWeight:800, color:"#A855F7" }}>{o.num}</span>
                        <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", background:sc+"25", color:sc }}>{o.status.toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize:"13px", fontWeight:700, color:o.codDue>0?"#D97706":"#059669" }}>
                        {o.codDue>0?`COD ৳${o.codDue.toLocaleString()}`:"Paid"}
                      </span>
                    </div>
                    <div style={{ padding:"11px 16px" }}>
                      <div style={{ fontSize:"13px", fontWeight:700, color:T.text, marginBottom:"2px" }}>{o.customer}</div>
                      <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"10px" }}>📞 {o.phone} · 📍 {o.address}</div>
                      {o.items.map((it,j)=>(
                        <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:T.bg, borderRadius:"6px", marginBottom:"4px" }}>
                          <div>
                            <span style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{it.name}</span>
                            <span style={{ fontSize:"11px", color:T.textMuted }}> · {it.color} / {it.size} × {it.qty}</span>
                          </div>
                          <span style={{ fontSize:"12px", fontWeight:700, color:"#059669" }}>৳{(it.sellPrice*it.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* XLSX Sheet map */}
          <div style={{ marginTop:"16px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"16px 20px" }}>
            <div style={{ fontSize:"12px", fontWeight:700, color:T.text, marginBottom:"10px" }}>📁 Generated XLSX File Structure</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px" }}>
              {[
                ["Sheet 1","Agent_Order_Summary","1 row per product · variants summarized · agent fills CNY price","#A855F7"],
                ["Sheet 2","Variant_Details","1 row per variant per order · sorted by product name","#D97706"],
                ["Sheet 3","Order_Breakdown","Per-order packing slips · customer + address + items + COD","#059669"],
                ["Sheet 4","ReadMe","Instructions + CNY→BDT rate + batch info","#6366F1"],
              ].map(([sheet,title,desc,color])=>(
                <div key={sheet} style={{ padding:"11px 13px", background:color+"08", border:`1px solid ${color}25`, borderRadius:"9px" }}>
                  <div style={{ fontSize:"9px", fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>{sheet}</div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.text, marginBottom:"4px" }}>{title}</div>
                  <div style={{ fontSize:"10px", color:T.textMuted, lineHeight:"1.5" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}










