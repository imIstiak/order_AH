import { useEffect, useState } from "react";
import { mapAdminOrderToTracking } from "./core/tracking-adapter";
import type { TrackingPayload } from "./core/tracking-adapter";
import { loadOrderCollection, ORDERS_UPDATED_EVENT, syncOrderCollectionFromServer } from "./core/order-store";

const DEFAULT_ORDER_LIST: any[] = [];

const buildOrdersMap = (orders: any[]): Record<string, TrackingPayload> => (
  Object.fromEntries(
    (Array.isArray(orders) ? orders : []).map((order) => {
      const trackingOrder = mapAdminOrderToTracking(order);
      return [trackingOrder.num, trackingOrder];
    })
  ) as Record<string, TrackingPayload>
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
  const [order, setOrder] = useState<TrackingPayload | null>(null);
  const [error, setError] = useState("");
  const [ordersMap, setOrdersMap] = useState<Record<string, TrackingPayload>>(() =>
    buildOrdersMap(loadOrderCollection(DEFAULT_ORDER_LIST as any[]))
  );

  useEffect(() => {
    let cancelled = false;

    const refreshFromLocal = () => {
      if (cancelled) return;
      const localOrders = loadOrderCollection(DEFAULT_ORDER_LIST as any[]);
      setOrdersMap(buildOrdersMap(localOrders as any[]));
    };

    refreshFromLocal();

    const hydrate = async () => {
      const synced = await syncOrderCollectionFromServer(DEFAULT_ORDER_LIST as any[]);
      if (cancelled) return;
      setOrdersMap(buildOrdersMap(synced as any[]));
    };
    void hydrate();

    window.addEventListener(ORDERS_UPDATED_EVENT, refreshFromLocal as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(ORDERS_UPDATED_EVENT, refreshFromLocal as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex < 0) {
      setOrder(null);
      setError("Invalid invoice link. Please use the link sent by the seller.");
      return;
    }

    const params = new URLSearchParams(hash.slice(qIndex + 1));
    const orderParam = (params.get("order") || "").trim();
    if (!orderParam) {
      setOrder(null);
      setError("Invalid invoice link. Order number is missing.");
      return;
    }

    const key = orderParam.startsWith("#") ? orderParam : `#${orderParam}`;
    const found = ordersMap[key];
    if (found) {
      setOrder(found);
      setError("");
    } else {
      setOrder(null);
      setError("No order found for " + key + ". Please check and try again.");
    }
  }, [ordersMap]);

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}>

      {/* Header */}
      <div style={{ padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:"18px", fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>
          🛍️ ShopAdmin
        </div>
        <a href="#/track" style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", textDecoration:"none" }}>← Track Page</a>
      </div>

      {/* Hero section */}
      <div style={{ textAlign:"center", padding:"40px 24px 36px" }}>
        <div style={{ fontSize:"40px", marginBottom:"12px" }}>📦</div>
        <h1 style={{ margin:"0 0 8px", fontSize:"28px", fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>Order Invoice</h1>
        <p style={{ margin:"0 0 28px", fontSize:"14px", color:"rgba(255,255,255,0.65)", lineHeight:"1.6" }}>
          This customer link is public and permanent. Open it anytime to see order status, delivery details, product details, and payment breakdown.
        </p>
      </div>

      {/* Results */}
      <div style={{ padding:"0 20px 40px" }}>
        {error && (
          <div style={{ maxWidth:"480px", margin:"0 auto", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"12px", padding:"16px 20px", textAlign:"center" }}>
            <div style={{ fontSize:"24px", marginBottom:"8px" }}>🔍</div>
            <div style={{ fontSize:"14px", fontWeight:600, color:"#FCA5A5", marginBottom:"4px" }}>Unable to open invoice</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)" }}>{error}</div>
          </div>
        )}
        {order && <OrderCard order={order}/>}
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"20px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>© 2025 ShopAdmin · Ladies Fashion BD</div>
      </div>
    </div>
  );
}






