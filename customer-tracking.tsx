import { useEffect, useState } from "react";
import { mapAdminOrderToTracking } from "./core/tracking-adapter";
import type { TrackingPayload } from "./core/tracking-adapter";
import { loadOrderCollection } from "./core/order-store";

// ── MOCK ORDER DATA ───────────────────────────────────────────────────────
const ADMIN_ORDERS = {
  "#1001": {
    num:"#1001", type:"stock", status:"Shipped",
    customer:"Fatima Akter", phone:"01712345678", area:"Dhaka / Dhanmondi",
    date:"2025-04-17T10:30:00+06:00",
    items:[{ name:"Leather Tote Bag", size:"M", color:"Black", qty:1, price:2500 }],
    advance:0, discount:0, discType:"flat",
    pay:"COD", payStatus:"pending",
    customerNote:"",
    consId:"PT-2025-8821",
    issue:null,
  },
  "#1002": {
    num:"#1002", type:"preorder", status:"Ordered Supplier",
    customer:"Rahela Khanam", phone:"01812345678", area:"Dhaka / Uttara",
    date:"2025-04-14T14:15:00+06:00",
    items:[{ name:"High Ankle Converse", size:"38", color:"White", qty:1, price:3200 }],
    advance:800, discount:0, discType:"flat",
    pay:"bKash", payStatus:"verified",
    customerNote:"Ordered from supplier. Expected to arrive in Bangladesh by May 14. We will notify you at every step.",
    consId:null,
    issue:null,
  },
  "#1004": {
    num:"#1004", type:"preorder", status:"Delayed",
    customer:"Sabrina Islam", phone:"01612345678", area:"Sylhet / Zindabazar",
    date:"2025-04-10T16:00:00+06:00",
    items:[{ name:"Silver Bracelet", size:"Free", color:"Silver", qty:1, price:1800 }],
    advance:500, discount:0, discType:"flat",
    pay:"Manual bKash", payStatus:"verified",
    customerNote:"We sincerely apologise for the delay. Your item has been slightly delayed in shipping. New estimated arrival: May 20. Thank you for your patience.",
    consId:null,
    issue:"Shipment delayed by supplier",
  },
  "#1005": {
    num:"#1005", type:"stock", status:"Delivered",
    customer:"Mithila Rahman", phone:"01512345678", area:"Dhaka / Mirpur",
    date:"2025-04-09T11:00:00+06:00",
    items:[{ name:"Quilted Shoulder Bag", size:"S", color:"Beige", qty:1, price:3500 }],
    advance:0, discount:200, discType:"flat",
    pay:"COD", payStatus:"collected",
    customerNote:"",
    consId:"PT-2025-7741",
    issue:null,
  },
};

const persistedOrders = loadOrderCollection(Object.values(ADMIN_ORDERS));

const ORDERS = Object.fromEntries(
  persistedOrders.map((order) => {
    const trackingOrder = mapAdminOrderToTracking(order);
    return [trackingOrder.num, trackingOrder];
  })
);

const isDhaka = (a) => a.toLowerCase().includes("dhaka");
const calcDue = (o) => {
  const sub = o.items.reduce((s,i) => s + i.price*i.qty, 0);
  const disc = o.discType==="pct" ? Math.round(sub*o.discount/100) : o.discount;
  return Math.max(0, sub - disc + o.delivery - o.advance);
};

const normalizeVariationValue = (value) => {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "free") return "";
  return text;
};

const formatItemVariation = (item) => {
  const parts = [];
  const size = normalizeVariationValue(item.size ?? item.variantSize ?? item.variationSize);
  const color = normalizeVariationValue(item.color ?? item.variantColor ?? item.variationColor);
  const variant = normalizeVariationValue(item.variant ?? item.variantName ?? item.variation ?? item.variationName);

  if (size) parts.push(`Size ${size}`);
  if (color) parts.push(`Color ${color}`);
  if (variant) parts.push(`Variant ${variant}`);

  return parts.join(" | ") || "Standard";
};

const STATUS_COLORS = {
  "Delivered":        "#059669",
  "Shipped":          "#2563EB",
  "Out for Delivery": "#0D9488",
  "Ordered Supplier": "#D97706",
  "In Transit":       "#D97706",
  "Arrived Bangladesh":"#A855F7",
  "Delayed":          "#DC2626",
  "Confirmed":        "#059669",
  "Packed":           "#059669",
  "Advance Confirmed":"#6366F1",
};
const getStatusColor = (s) => STATUS_COLORS[s] || "#6366F1";

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SearchBox({ value, onChange, onSearch }) {
  return (
    <div style={{ display:"flex", gap:"10px", maxWidth:"560px", width:"100%" }}>
      <input value={value} onChange={onChange}
        onKeyDown={e => e.key==="Enter" && onSearch()}
        placeholder="Enter order number or phone number"
        style={{ flex:1, padding:"13px 16px", borderRadius:"10px", border:"1.5px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"14px", outline:"none", fontFamily:"inherit", backdropFilter:"blur(8px)" }}/>
      <button onClick={onSearch}
        style={{ background:"#fff", color:"#1a1a2e", border:"none", borderRadius:"10px", padding:"13px 22px", fontSize:"14px", fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
        Search
      </button>
    </div>
  );
}

function OrderTimeline({ timeline, type }) {
  const lastDone = timeline.reduce((last, s, i) => s.done ? i : last, -1);
  return (
    <div style={{ position:"relative" }}>
      {timeline.map((step, i) => {
        const isLast = i === timeline.length - 1;
        const isCurrent = i === lastDone;
        const color = step.isIssue ? "#DC2626" : step.done ? getStatusColor(step.status) : "#CBD5E1";
        const textColor = step.done ? (step.isIssue ? "#DC2626" : "#0F172A") : "#94A3B8";
        return (
          <div key={i} style={{ display:"flex", gap:"14px", position:"relative" }}>
            {/* Line */}
            {!isLast && (
              <div style={{ position:"absolute", left:"13px", top:"26px", bottom:"-4px", width:"2px", background:step.done?"#E2E8F0":"#E2E8F0", zIndex:0 }}/>
            )}
            {/* Dot */}
            <div style={{ flexShrink:0, zIndex:1, marginTop:"4px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:step.done?(step.isIssue?"#EF4444":color):"#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", border:`3px solid ${step.done?(step.isIssue?"#EF4444":color):"#CBD5E1"}`, boxShadow:isCurrent?`0 0 0 4px ${color}30`:"none" }}>
                {step.done ? (step.isIssue ? "!" : "✓") : ""}
              </div>
            </div>
            {/* Content */}
            <div style={{ flex:1, paddingBottom:"20px" }}>
              <div style={{ fontSize:"13px", fontWeight:isCurrent?800:600, color:textColor, marginBottom:"2px" }}>{step.status}</div>
              {step.time && <div style={{ fontSize:"11px", color:"#94A3B8", marginBottom:step.note?"4px":"0" }}>{step.time}</div>}
              {step.note && <div style={{ fontSize:"12px", color:step.isIssue?"#EF4444":"#475569", lineHeight:"1.5", background:step.isIssue?"#FEF2F2":"#F8FAFC", padding:"8px 12px", borderRadius:"8px", marginTop:"4px" }}>{step.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const subtotal = order.items.reduce((s,i) => s+i.price*i.qty, 0);
  const discAmt  = order.discType==="pct" ? Math.round(subtotal*order.discount/100) : order.discount;
  const due      = calcDue(order);
  const isDelivered = order.status === "Delivered";
  const isDelayed   = order.status === "Delayed";
  const statusColor = getStatusColor(order.status);

  const downloadInvoice = () => {
    if (typeof window === "undefined") return;
    const lines = [
      `Invoice: ${order.num}`,
      `Customer: ${order.customer}`,
      `Phone: ${order.phone}`,
      `Area: ${order.area}`,
      `Status: ${order.status}`,
      `Placed: ${order.placedAt}`,
      "",
      "Items:",
      ...order.items.map((it) => `- ${it.name} (${formatItemVariation(it)}) x${it.qty} = ৳${(it.price * it.qty).toLocaleString()}`),
      "",
      `Subtotal: ৳${subtotal.toLocaleString()}`,
      `${discAmt > 0 ? `Discount: -৳${discAmt.toLocaleString()}` : "Discount: ৳0"}`,
      `Delivery: ৳${order.delivery.toLocaleString()}`,
      `Advance Paid: -৳${order.advance.toLocaleString()}`,
      `COD Due: ৳${due.toLocaleString()}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.num.replace(/[^0-9A-Za-z]/g, "")}-invoice.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth:"680px", margin:"0 auto", width:"100%" }}>

      {/* Status banner */}
      <div style={{ borderRadius:"14px", padding:"20px 24px", marginBottom:"16px", background: isDelivered ? "linear-gradient(135deg,#059669,#10B981)" : isDelayed ? "linear-gradient(135deg,#DC2626,#EF4444)" : "linear-gradient(135deg,#6366F1,#8B5CF6)", color:"#fff" }}>
        <div style={{ fontSize:"12px", fontWeight:600, opacity:0.85, marginBottom:"6px" }}>Order {order.num}</div>
        <div style={{ fontSize:"24px", fontWeight:800, marginBottom:"4px" }}>{order.status}</div>
        <div style={{ fontSize:"13px", opacity:0.85 }}>
          {order.type === "preorder" ? "⏳ Pre-Order" : "📦 Stock Order"} · Placed {order.placedAt}
        </div>
        {order.type === "preorder" && order.preorderEta && (
          <div style={{ marginTop:"8px", fontSize:"12px", opacity:0.92 }}>
            📅 Pre-Order ETA: <strong>{order.preorderEta}</strong>
          </div>
        )}
        {order.customerNote && (
          <div style={{ marginTop:"12px", background:"rgba(255,255,255,0.15)", borderRadius:"9px", padding:"10px 14px", fontSize:"12px", lineHeight:"1.6" }}>
            {order.customerNote}
          </div>
        )}
        {order.courierName && order.trackingId && (
          <div style={{ marginTop:"10px", fontSize:"12px", opacity:0.9 }}>
            🚚 {order.courierName} · Tracking ID: <strong>{order.trackingId}</strong>
          </div>
        )}
        <div style={{ marginTop:"12px", display:"flex", justifyContent:"flex-end" }}>
          <button onClick={downloadInvoice} style={{ background:"#fff", color:"#1a1a2e", border:"none", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", fontWeight:800, cursor:"pointer" }}>⬇ Download Invoice</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>

        {/* Products */}
        <div style={{ background:"#fff", borderRadius:"12px", padding:"18px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"12px" }}>Products</div>
          {order.items.map((it,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:i<order.items.length-1?"10px":"0" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"9px", background:it.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{it.img}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:700, color:"#0F172A" }}>{it.name}</div>
                <div style={{ fontSize:"11px", color:"#64748B" }}>{formatItemVariation(it)} × {it.qty}</div>
              </div>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#0F172A" }}>৳{(it.price*it.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Payment summary */}
        <div style={{ background:"#fff", borderRadius:"12px", padding:"18px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"12px" }}>Payment Summary</div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}><span style={{ fontSize:"12px", color:"#64748B" }}>Products</span><span style={{ fontSize:"12px", color:"#334155" }}>৳{subtotal.toLocaleString()}</span></div>
          {discAmt > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}><span style={{ fontSize:"12px", color:"#059669" }}>Discount</span><span style={{ fontSize:"12px", color:"#059669" }}>- ৳{discAmt.toLocaleString()}</span></div>}
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}><span style={{ fontSize:"12px", color:"#64748B" }}>Delivery</span><span style={{ fontSize:"12px", color:"#64748B" }}>৳{order.delivery}</span></div>
          {order.advance > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}><span style={{ fontSize:"12px", color:"#059669" }}>Advance Paid</span><span style={{ fontSize:"12px", color:"#059669" }}>- ৳{order.advance.toLocaleString()}</span></div>}
          <div style={{ height:"1px", background:"#E2E8F0", margin:"10px 0" }}/>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:"14px", fontWeight:700, color: isDelivered && order.payStatus==="collected" ? "#059669" : "#D97706" }}>
              {isDelivered && order.payStatus==="collected" ? "✓ Payment Collected" : "COD Due on Delivery"}
            </span>
            <span style={{ fontSize:"18px", fontWeight:800, color: isDelivered && order.payStatus==="collected" ? "#059669" : "#D97706" }}>
              {isDelivered && order.payStatus==="collected" ? "Paid" : `৳${due.toLocaleString()}`}
            </span>
          </div>
          <div style={{ marginTop:"8px", padding:"8px 12px", background: order.payStatus==="verified"||order.payStatus==="collected" ? "#05996910":"#F59E0B10", borderRadius:"7px" }}>
            <div style={{ fontSize:"11px", color: order.payStatus==="verified"||order.payStatus==="collected" ? "#059669":"#D97706", fontWeight:600 }}>
              {order.payMethod} · {order.payStatus==="collected"?"Payment collected":order.payStatus==="verified"?"Advance verified":"Cash on delivery"}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div style={{ background:"#fff", borderRadius:"12px", padding:"16px 20px", marginBottom:"12px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:"14px" }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>📍</div>
        <div>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"3px" }}>Delivery Address</div>
          <div style={{ fontSize:"13px", fontWeight:700, color:"#0F172A" }}>{order.customer}</div>
          <div style={{ fontSize:"12px", color:"#475569" }}>{order.phone}</div>
          <div style={{ fontSize:"12px", color:"#64748B" }}>{order.area} · {isDhaka(order.area)?"Inside Dhaka":"Outside Dhaka"}</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background:"#fff", borderRadius:"12px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:"12px", fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"16px" }}>Order Timeline</div>
        <OrderTimeline timeline={order.timeline} type={order.type}/>
      </div>

      {/* Need help */}
      <div style={{ marginTop:"12px", textAlign:"center", padding:"16px", background:"rgba(255,255,255,0.6)", borderRadius:"12px", backdropFilter:"blur(8px)" }}>
        <div style={{ fontSize:"12px", color:"#475569", marginBottom:"10px" }}>Need help with your order?</div>
        <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
          <a href="tel:01XXXXXXXXX" style={{ display:"flex", alignItems:"center", gap:"6px", background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:"8px", padding:"9px 16px", fontSize:"12px", fontWeight:600, color:"#334155", textDecoration:"none" }}>
            📞 Call Us
          </a>
          <a href="https://wa.me/01XXXXXXXXX" style={{ display:"flex", alignItems:"center", gap:"6px", background:"#25D366", border:"none", borderRadius:"8px", padding:"9px 16px", fontSize:"12px", fontWeight:600, color:"#fff", textDecoration:"none" }}>
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<TrackingPayload | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const findOrder = (rawQuery: string): TrackingPayload | null => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return null;

    const orderKey = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (ORDERS[orderKey]) return ORDERS[orderKey];

    const qDigits = trimmed.replace(/\D/g, "");
    if (!qDigits) return null;

    return Object.values(ORDERS).find((candidate: any) => String(candidate.phone || "").replace(/\D/g, "").includes(qDigits)) || null;
  };

  const handleSearch = () => {
    const found = findOrder(query);
    setSearched(true);
    if (found) {
      setOrder(found);
      setError("");
    } else {
      setOrder(null);
      setError("No order found. Please check order number or phone number.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex < 0) return;

    const params = new URLSearchParams(hash.slice(qIndex + 1));
    const orderParam = (params.get("order") || "").trim();
    if (!orderParam) return;

    const normalized = orderParam.startsWith("#") ? orderParam : `#${orderParam}`;
    setQuery(normalized);
    const found = findOrder(normalized);
    setSearched(true);
    if (found) {
      setOrder(found);
      setError("");
    } else {
      setOrder(null);
      setError("No order found for " + normalized + ". Please check and try again.");
    }
  }, []);

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}>

      {/* Header */}
      <div style={{ padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:"18px", fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>
          🛍️ ShopAdmin
        </div>
        <a href="/" style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", textDecoration:"none" }}>← Back to Shop</a>
      </div>

      {/* Hero section */}
      <div style={{ textAlign:"center", padding:"40px 24px 36px" }}>
        <div style={{ fontSize:"40px", marginBottom:"12px" }}>📦</div>
        <h1 style={{ margin:"0 0 8px", fontSize:"28px", fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>Track Your Order</h1>
        <p style={{ margin:"0 0 28px", fontSize:"14px", color:"rgba(255,255,255,0.65)", lineHeight:"1.6" }}>
          Search by order number or phone number to see order status, delivery details, product details, and payment breakdown.
        </p>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <SearchBox value={query} onChange={e => setQuery(e.target.value)} onSearch={handleSearch}/>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding:"0 20px 40px" }}>
        {error && searched && (
          <div style={{ maxWidth:"480px", margin:"0 auto", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"12px", padding:"16px 20px", textAlign:"center" }}>
            <div style={{ fontSize:"24px", marginBottom:"8px" }}>🔍</div>
            <div style={{ fontSize:"14px", fontWeight:600, color:"#FCA5A5", marginBottom:"4px" }}>Order not found</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)" }}>{error}</div>
          </div>
        )}
        {order && <OrderCard order={order}/>}
        {!searched && (
          <div style={{ maxWidth:"680px", margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginTop:"8px" }}>
              {[
                ["📦","Track Status","See where your order is in real time"],
                ["💵","Payment Info","View your COD amount and payment status"],
                ["📞","Get Support","Contact us directly from the tracking page"],
              ].map(([icon,title,desc]) => (
                <div key={title} style={{ background:"rgba(255,255,255,0.07)", backdropFilter:"blur(8px)", borderRadius:"12px", padding:"18px", textAlign:"center", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize:"26px", marginBottom:"8px" }}>{icon}</div>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#fff", marginBottom:"4px" }}>{title}</div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", lineHeight:"1.5" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"20px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>© 2025 ShopAdmin · Ladies Fashion BD</div>
      </div>
    </div>
  );
}






