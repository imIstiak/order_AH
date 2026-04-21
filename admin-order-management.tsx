import { useEffect, useState } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { appendTimelineEvent, loadOrderCollection, persistOrderCollectionToServer, syncOrderCollectionFromServer } from "./core/order-store";
import { assignOrdersToBatch, createBatch, getOrderBatchMembership, listBatches } from "./core/batch-store";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";

// ── THEMES ──────────────────────────────────────────────────────────────────
const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", rowHover:"rgba(255,255,255,0.03)", rowSel:"rgba(99,102,241,0.08)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", rowHover:"rgba(0,0,0,0.025)", rowSel:"rgba(99,102,241,0.06)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)" };

const PRODUCT_ICONS = ["🛍️", "👟", "🎒", "📿", "👜", "👠", "👝", "🥿", "📦", "💼"];
const PRODUCT_BGS = ["#334155", "#1E40AF", "#065F46", "#6B21A8", "#9D174D", "#7C3AED", "#B91C1C", "#B45309", "#0D9488", "#92400E"];

const getProductVisual = (label) => {
  const text = String(label || "Product");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PRODUCT_ICONS.length;
  return { img: PRODUCT_ICONS[idx], bg: PRODUCT_BGS[idx] };
};

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const SC_MAP = { "Confirmed":["#10B98115","#059669"],"Advance Paid":["#6366F115","#6366F1"],"Shipped":["#3B82F615","#2563EB"],"Delayed":["#EF444415","#DC2626"],"Delivered":["#10B98115","#059669"],"Pend. Verify":["#F59E0B20","#D97706"],"Placed":["#64748B15","#64748B"],"Arrived BD":["#A855F715","#9333EA"],"Cancelled":["#EF444415","#DC2626"],"Ordered Supplier":["#F59E0B15","#D97706"],"Packed":["#14B8A615","#0D9488"],"Returned":["#F9731615","#EA580C"] };
const getSC = (s) => SC_MAP[s] || ["#64748B15","#64748B"];
const FR    = { low:["#10B98112","#059669","Low"], medium:["#F59E0B12","#D97706","Med"], high:["#EF444412","#DC2626","High"] };
const getFR = (f) => FR[f] || ["#64748B12","#64748B","—"];
const ALL_S = ["Placed","Confirmed","Advance Paid","Pend. Verify","Ordered Supplier","In Transit","Arrived BD","Packed","Shipped","Out for Delivery","Delivered","Delayed","Returned","Cancelled","Refunded"];
const SOURCES = [{id:"",label:"All Sources"},{id:"website",label:"🌐 Website"},{id:"facebook",label:"📘 Facebook"},{id:"instagram",label:"📸 Instagram"},{id:"whatsapp",label:"💬 WhatsApp"},{id:"phone",label:"📞 Phone"}];
const SRC_ICON = { website:"🌐", facebook:"📘", instagram:"📸", whatsapp:"💬", phone:"📞" };
const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];
const AGENT_NAV = [["▦","Dashboard"],["≡","Orders"],["⬡","Products"],["◉","Customers"],["+","New Order"],["👤","Profile"]];
const VIEW_ORDER_KEY = "shopadmin.viewOrder.num";

// ── HELPERS ──────────────────────────────────────────────────────────────────
const isDhaka    = (a) => a.toLowerCase().includes("dhaka");
const normalizeOrderId = (orderId) => String(orderId || "").trim().toLowerCase();
const itemsTotal = (items) => items.reduce((s, i) => s + i.price * i.qty, 0);
const applyDisc  = (sub, disc, dt) => !disc ? sub : dt === "pct" ? sub * (1 - disc / 100) : sub - disc;
const calcDue    = (o, dIn, dOut) => Math.max(0, applyDisc(itemsTotal(o.items), o.discount, o.discType) + (isDhaka(o.area) ? dIn : dOut) - o.advance);
const buildTrackingLink = () => `${window.location.origin}/#/track`;
const getPathaoDeliveryStatus = (o) => {
  if (o.status === "Delivered") return "Delivered";
  if (o.status === "Out for Delivery") return "Out for Delivery";
  if (o.status === "Shipped") return "In Transit";
  if (o.status === "Returned") return "Returned";
  if (o.status === "Cancelled") return "Cancelled";
  return "Pending Dispatch";
};
const TABLE_COLS = "32px minmax(88px,0.9fr) minmax(64px,0.6fr) minmax(44px,0.5fr) minmax(150px,1.15fr) minmax(170px,1.25fr) minmax(115px,0.95fr) minmax(110px,0.9fr) minmax(150px,1.1fr) minmax(95px,0.7fr)";

// ── SUB-COMPONENTS — defined OUTSIDE App so React doesn't recreate them ──────

function ProdImg({ label, size }) {
  const sz = size || 36;
  const p = getProductVisual(label);
  return <div style={{ width:sz, height:sz, borderRadius:"7px", background:p.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:sz * 0.48, flexShrink:0 }}>{p.img}</div>;
}

function SLabel({ c, T }) {
  return <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>{c}</div>;
}

function Box({ children, T, style }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"11px 13px", ...(style||{}) }}>{children}</div>;
}

function SMSCheck({ val, set, label, sub, T }) {
  return (
    <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", padding:"9px 11px", borderRadius:"8px", background:val ? "#EEF2FF" : T.bg, border:`1px solid ${val ? T.accent+"40" : T.border}`, userSelect:"none" }}>
      <div style={{ width:"18px", height:"18px", borderRadius:"5px", background:val ? T.accent : "transparent", border:`2px solid ${val ? T.accent : T.textMuted}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {val && <span style={{ color:"#fff", fontSize:"11px", fontWeight:800 }}>✓</span>}
      </div>
      <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ display:"none" }} />
      <div>
        <div style={{ fontSize:"12px", fontWeight:600, color:val ? T.accent : T.textMid }}>📲 {label}</div>
        <div style={{ fontSize:"10px", color:T.textMuted }}>{sub || (val ? "Customer will receive SMS" : "No SMS will be sent")}</div>
      </div>
    </label>
  );
}

function Modal({ title, onClose, width, children, T }) {
  const w = width || "500px";
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:w, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", zIndex:1, boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:T.surface, zIndex:2 }}>
          <span style={{ fontSize:"14px", fontWeight:800, color:T.text }}>{title}</span>
          <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"3px 9px", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"18px" }}>{children}</div>
      </div>
    </div>
  );
}

function PrintSlip({ order, type, dIn, dOut, T }) {
  const d = calcDue(order, dIn, dOut);
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"12px 14px", marginBottom:"10px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
        <span style={{ fontWeight:800, fontSize:"13px", color:T.text }}>{order.num}</span>
        <span style={{ fontSize:"10px", color:T.textMuted }}>{order.type === "preorder" ? "PRE-ORDER" : "STOCK ORDER"}</span>
      </div>
      <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{order.customer} · {order.phone}</div>
      <div style={{ fontSize:"11px", color:T.textMuted }}>📍 {order.area}</div>
      {type !== "label" && order.items.map((it, j) => (
        <div key={j} style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>
          • {it.name} {it.size !== "Free" ? `Sz ${it.size}` : ""} {it.color} ×{it.qty} = ৳{(it.price * it.qty).toLocaleString()}
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px", paddingTop:"6px", borderTop:`1px solid ${T.border}` }}>
        <span style={{ fontSize:"10px", color:T.textMuted }}>
          Del:৳{isDhaka(order.area) ? dIn : dOut}
          {order.discount > 0 ? ` Disc:-৳${order.discType === "pct" ? Math.round(itemsTotal(order.items) * order.discount / 100) : order.discount}` : ""}
          {order.advance > 0 ? ` Adv:৳${order.advance}` : ""}
        </span>
        <span style={{ fontSize:"13px", fontWeight:800, color:"#D97706" }}>COD: ৳{d.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;
  const [delIn,  setDelIn]  = useState(80);
  const [delOut, setDelOut] = useState(150);
  const due = (o) => calcDue(o, delIn, delOut);

  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [orders, setOrders] = useState(() => loadOrderCollection([]));
  const [ordersHydrated, setOrdersHydrated] = useState(false);
  const [tab, setTab]       = useState("all");
  const [sel, setSel]       = useState(new Set());
  const [search, setSearch] = useState("");
  const [stFilter, setStFilter]   = useState("");
  const [srcFilter, setSrcFilter] = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo,   setDateTo]     = useState("");

  // Detail
  const [detail, setDetail]     = useState(null);
  const [newSt, setNewSt]       = useState("");
  const [stNote, setStNote]     = useState("");
  const [sendSMS, setSendSMS]   = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [issueText, setIssueText] = useState("");

  // Edit
  const [editId, setEditId]       = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editAdv, setEditAdv]     = useState(0);
  const [editDisc, setEditDisc]   = useState(0);
  const [editDiscT, setEditDiscT] = useState("flat");
  const [editNote, setEditNote]   = useState("");
  const [addPid, setAddPid]       = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addSize, setAddSize]     = useState("");
  const [addColor, setAddColor]   = useState("");
  const [addQty, setAddQty]       = useState(1);

  // Bulk / Print / Settings
  const [showBS, setShowBS]     = useState(false);
  const [bSt, setBSt]           = useState("");
  const [bNote, setBNote]       = useState("");
  const [bSMS, setBSMS]         = useState(false);
  const [showBP, setShowBP]     = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchMode,    setBatchMode]    = useState("existing");
  const [batchTarget,  setBatchTarget]  = useState("");
  const [batchNote,    setBatchNote]    = useState("");
  const [batchAgentNote, setBatchAgentNote] = useState("");
  const [batchCreated, setBatchCreated] = useState(null);
  const [showSP, setShowSP]     = useState(false);
  const [pType, setPType]       = useState("slip");
  const [feedback, setFeedback] = useState("");
  const sessionUser = loadSession()?.user;
  const isAgent = sessionUser?.role === "agent";
  const navItems = (isAgent ? AGENT_NAV : NAV).filter(([, label]) => label !== "Settings");
  const userName = sessionUser?.name || "Admin";
  const userRole = sessionUser?.role === "agent" ? "Agent" : "Super Admin";
  const userAvatar = sessionUser?.avatar || "A";
  const userColor = sessionUser?.color || "#6366F1";

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
    window.dispatchEvent(new Event("hashchange"));
  };

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const synced = await syncOrderCollectionFromServer([]);
      if (cancelled) return;
      setOrders(synced as any);
      setOrdersHydrated(true);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      setCatalogError("");
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load product catalog.");
        }
        if (cancelled) return;
        const nextCatalog = Array.isArray(payload?.products)
          ? payload.products.map((p: any) => ({
              id: String(p?.id || ""),
              name: String(p?.name || "Unnamed Product"),
              price: Number(p?.price) || 0,
              sizes: Array.isArray(p?.sizes) && p.sizes.length ? p.sizes : ["Free"],
              colors: Array.isArray(p?.colors) && p.colors.length ? p.colors : ["Default"],
              img: String(p?.img || "🛍️"),
              bg: String(p?.bg || "#334155"),
            }))
          : [];
        setCatalog(nextCatalog.filter((p: any) => p.id));
      } catch (error: any) {
        if (cancelled) return;
        setCatalog([]);
        setCatalogError(String(error?.message || "Product catalog unavailable."));
      }
    };

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ordersHydrated) return;
    persistOrderCollectionToServer(orders as any);
  }, [orders, ordersHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targetOrderNum = window.sessionStorage.getItem(VIEW_ORDER_KEY);
    if (!targetOrderNum) return;

    const matched = orders.find((order) => order.num === targetOrderNum);
    if (matched) {
      openDetail(matched);
      window.sessionStorage.removeItem(VIEW_ORDER_KEY);
    }
  }, [orders]);

  const rows = orders.filter(o => {
    if (tab === "stock"    && o.type !== "stock")    return false;
    if (tab === "preorder" && o.type !== "preorder") return false;
    if (stFilter  && o.status !== stFilter)  return false;
    if (srcFilter && o.source !== srcFilter) return false;
    if (dateFrom  && o.date < dateFrom)      return false;
    if (dateTo    && o.date > dateTo)        return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesCore = o.num.includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q);
      const matchesProduct = Array.isArray(o.items) && o.items.some((item) => String(item?.name || "").toLowerCase().includes(q));
      if (!matchesCore && !matchesProduct) return false;
    }
    return true;
  });

  const toggleSel = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const toggleAll = () => sel.size === rows.length ? setSel(new Set()) : setSel(new Set(rows.map(o => o.id)));

  const openDetail = (o) => {
    setDetail({ ...o });
    setNewSt(""); setStNote(""); setSendSMS(false);
    setShowIssue(false); setIssueText("");
  };

  const openEdit = (o) => {
    setEditId(o.id);
    setEditItems(o.items.map(i => ({ ...i })));
    setEditAdv(o.advance); setEditDisc(o.discount); setEditDiscT(o.discType);
    setEditNote(o.internalNote);
    setAddSearch("");
    setAddPid(""); setAddSize(""); setAddColor(""); setAddQty(1);
  };

  const changeQty  = (idx, v) => setEditItems(p => p.map((it, i) => i === idx ? { ...it, qty: Math.max(1, parseInt(v) || 1) } : it));
  const removeItem = (idx)    => { if (editItems.length <= 1) return; setEditItems(p => p.filter((_, i) => i !== idx)); };

  const addProduct = () => {
    if (!addPid || !addSize || !addColor) return;
    const prod = catalog.find((entry) => entry.id === addPid) || null;
    if (!prod) return;
    setEditItems(p => [...p, { pid:prod.id, name:prod.name, size:addSize, color:addColor, qty:addQty, price:prod.price }]);
    setAddSearch("");
    setAddPid(""); setAddSize(""); setAddColor(""); setAddQty(1);
  };

  const saveEdit = () => {
    if (!editItems.length) return;
    if (!window.confirm("Save order changes? This will update items and pricing immediately.")) return;
    const source = orders.find((o) => o.id === editId);
    const actor = `${isAgent ? "Agent" : "Admin"} ${userName}`;
    const changes = [];

    if (source) {
      const originalItems = source.items.map((it) => `${it.pid}-${it.size}-${it.color}x${it.qty}`).join("|");
      const updatedItems = editItems.map((it) => `${it.pid}-${it.size}-${it.color}x${it.qty}`).join("|");
      if (originalItems !== updatedItems) {
        const addedItems = editItems.filter((item) => !source.items.some((prev) => prev.pid === item.pid && prev.size === item.size && prev.color === item.color));
        if (addedItems.length) {
          changes.push(`added product ${addedItems.map((item) => item.name).join(", ")}`);
        } else {
          changes.push("updated product lines");
        }
      }
      if (source.advance !== editAdv) changes.push(`advance ${source.advance} to ${editAdv}`);
      if (source.discount !== editDisc || source.discType !== editDiscT) changes.push("discount");
      if ((source.internalNote || "").trim() !== (editNote || "").trim()) changes.push("internal note");
    }

    const auditText = `[${new Date().toLocaleString()}] ${actor} edited order${changes.length ? `: ${changes.join(", ")}` : "."}`;
    const mergedInternalNote = [editNote?.trim(), auditText].filter(Boolean).join("\n");
    const upd = { items:editItems, advance:editAdv, discount:editDisc, discType:editDiscT, internalNote:mergedInternalNote };
    setOrders(p => p.map(o => o.id === editId ? { ...o, ...upd } : o));
    if (detail && detail.id === editId) setDetail(p => ({ ...p, ...upd }));
    if (source) setFeedback(`Order ${source.num} updated successfully.`);
    setEditId(null);
  };

  const doUpdate = () => {
    if (isAgent) return;
    if (!newSt) return;
    if (!detail) return;
    if (!window.confirm(`Update ${detail.num} status to ${newSt}?`)) return;

    const withStatus = appendTimelineEvent(detail, newSt, stNote, "admin-manual");
    const upd = { ...withStatus, customerNote:stNote || detail.customerNote };
    setOrders(p => p.map(o => o.id === detail.id ? upd : o));
    setFeedback(`Order ${detail.num} moved to ${newSt}.`);
    setDetail(upd); setNewSt(""); setStNote(""); setSendSMS(false);
  };

  const submitIssue = () => {
    if (!issueText.trim()) return;
    const upd = { ...detail, issue:issueText };
    setOrders(p => p.map(o => o.id === detail.id ? upd : o));
    setFeedback(`Issue flagged for ${detail.num}.`);
    setDetail(upd); setShowIssue(false); setIssueText("");
  };

  const copyTrackingLink = async () => {
    if (!detail) return;
    const link = buildTrackingLink();
    const text = `${link} (Order ${detail.num})`;
    try {
      await navigator.clipboard.writeText(text);
      window.alert(`Tracking link copied for ${detail.num}`);
    } catch {
      window.prompt("Copy tracking link", text);
    }
  };

  const sendWhatsAppUpdate = () => {
    if (!detail) return;
    const phone = detail.phone.replace(/[^0-9]/g, "");
    const link = buildTrackingLink();
    const msg = encodeURIComponent(`Assalamu Alaikum ${detail.customer}, your order ${detail.num} is being processed. Track here: ${link} (search with ${detail.num}). COD due: ৳${due(detail).toLocaleString()}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const shipViaPathao = () => {
    if (!detail) return;
    if (detail.consId) {
      window.alert(`Already shipped via Pathao. Consignment: ${detail.consId}`);
      return;
    }
    const consignment = `PA${Date.now().toString().slice(-8)}${detail.num.replace(/[^0-9]/g, "").padStart(4, "0")}`;
    const nextStatus = ["Delivered", "Cancelled", "Returned"].includes(detail.status) ? detail.status : "Shipped";
    const withStatus = appendTimelineEvent(detail, nextStatus, `Shipment created: ${consignment}`, "pathao-quick-action");
    const upd = { ...withStatus, consId:consignment };
    setOrders((p) => p.map((o) => o.id === detail.id ? upd : o));
    setDetail(upd);
    window.alert(`Shipment created. Pathao Consignment ID: ${consignment}`);
  };

  const flagCustomer = () => {
    if (!detail) return;
    if (detail.issue) {
      window.alert("This order is already flagged as an issue.");
      return;
    }
    setIssueText(`Customer follow-up required for ${detail.customer} (${detail.phone}).`);
    setShowIssue(true);
  };

  const resolveIssue = () => {
    const upd = { ...detail, issue:null };
    setOrders(p => p.map(o => o.id === detail.id ? upd : o));
    setFeedback(`Issue resolved for ${detail.num}.`);
    setDetail(upd);
  };

  const doBulk = () => {
    if (isAgent) return;
    if (!bSt) return;
    if (!sel.size) return;
    if (!window.confirm(`Update ${sel.size} selected order(s) to ${bSt}?`)) return;

    setOrders((p) =>
      p.map((o) => {
        if (!sel.has(o.id)) {
          return o;
        }

        const withStatus = appendTimelineEvent(o, bSt, bNote, "admin-bulk");
        return { ...withStatus, customerNote: bNote || o.customerNote };
      })
    );
    setFeedback(`${sel.size} order(s) updated to ${bSt}.`);
    setShowBS(false); setBSt(""); setBNote(""); setBSMS(false); setSel(new Set());
  };

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const clearFilters  = () => { setStFilter(""); setSrcFilter(""); setDateFrom(""); setDateTo(""); };

  const editOrder  = orders.find(o => o.id === editId) || null;
  const selProd    = catalog.find((entry) => entry.id === addPid) || null;
  const filteredCatalog = catalog.filter((p) => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q);
  });
  const editSub    = itemsTotal(editItems);
  const editDiscounted = applyDisc(editSub, editDisc, editDiscT);
  const editLiveDue = editOrder ? Math.max(0, editDiscounted + (isDhaka(editOrder.area) ? delIn : delOut) - editAdv) : 0;
  const selOrders  = orders.filter(o => sel.has(o.id));
  const batchOptions = listBatches();
  const batchMembership = getOrderBatchMembership(orders.map((o) => normalizeOrderId(o.id)));
  const selectedAlreadyInBatch = selOrders
    .map((order) => ({
      order,
      batches: batchMembership[normalizeOrderId(order.id)] || [],
    }))
    .filter((entry) => entry.batches.length > 0);
  const issueCount = orders.filter(o => o.issue).length;

  const resetBatchModal = () => {
    setShowAddBatch(false);
    setBatchMode("existing");
    setBatchTarget("");
    setBatchNote("");
    setBatchAgentNote("");
    setBatchCreated(null);
  };

  const stats = [
    ["Total",   orders.length, "#6366F1"],
    ["Revenue", "৳" + orders.filter(o => o.status === "Delivered").reduce((a, b) => a + itemsTotal(b.items), 0).toLocaleString(), "#059669"],
    ["To Ship", orders.filter(o => ["Confirmed","Packed"].includes(o.status)).length, "#D97706"],
    ["Verify",  orders.filter(o => o.status === "Pend. Verify").length, "#DC2626"],
    ["Issues",  issueCount, "#EF4444"],
    ["Website", orders.filter(o => o.placedBy === "customer").length, "#0D9488"],
  ];

  // Shared input style
  const IS = { background:T.input, border:`1px solid ${T.border}`, borderRadius:"7px", color:T.text, padding:"8px 11px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

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
        badgeByLabel={issueCount > 0 ? { Orders: { text: `⚠${issueCount}`, background: "#EF444420", color: "#DC2626" } } : { Orders: { text: String(orders.length) } }}
        onLogout={handleSignOut}
      />

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:"50px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 16px", gap:"10px", flexShrink:0 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:"9px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"11px" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order #, customer name or phone..."
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"6px 10px 6px 27px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }} />
          </div>
          <button onClick={() => navigateByAdminNavLabel("New Order")} style={{ background:T.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>+ New Order</button>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:"14px 16px" }}>
          {/* Title */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div>
              <h1 style={{ margin:0, fontSize:"16px", fontWeight:800, color:T.text }}>Order Management</h1>
              <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>
                Delivery — <span style={{ color:"#059669", fontWeight:600 }}>Inside Dhaka: ৳{delIn}</span> · <span style={{ color:"#D97706", fontWeight:600 }}>Outside: ৳{delOut}</span>
              </div>
            </div>
            {!isAgent && <button style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"6px 12px", color:T.textMuted, fontSize:"11px", cursor:"pointer" }}>📥 Export</button>}
          </div>

          {feedback && (
            <div style={{ marginBottom:"10px", padding:"10px 12px", borderRadius:"8px", background:"#05966915", border:"1px solid #05966930", color:"#059669", fontSize:"12px", fontWeight:700 }}>
              {feedback}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"8px", marginBottom:"12px" }}>
            {stats.map(([label, val, color], i) => (
              <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"11px 12px" }}>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"5px" }}>{label}</div>
                <div style={{ fontSize:"18px", fontWeight:800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"12px 14px", marginBottom:"10px" }}>
            <div style={{ display:"flex", gap:"8px", alignItems:"flex-end", flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>Order Type</div>
                <div style={{ display:"flex", gap:"2px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
                  {[["all","All","#6366F1"],["stock","Stock","#059669"],["preorder","Pre-Order","#D97706"]].map(([id, label, color]) => (
                    <button key={id} onClick={() => setTab(id)} style={{ padding:"5px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:tab === id ? color + "18" : "transparent", color:tab === id ? color : T.textMuted }}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ minWidth:"148px" }}>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>Status</div>
                <select value={stFilter} onChange={e => setStFilter(e.target.value)} style={{ ...IS, padding:"7px 9px" }}>
                  <option value="">All Statuses</option>
                  {ALL_S.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ minWidth:"138px" }}>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>Source</div>
                <select value={srcFilter} onChange={e => setSrcFilter(e.target.value)} style={{ ...IS, padding:"7px 9px" }}>
                  {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>Date From</div>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...IS, width:"138px", padding:"7px 9px" }} />
              </div>
              <div>
                <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"5px" }}>Date To</div>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...IS, width:"138px", padding:"7px 9px" }} />
              </div>
              {(stFilter || srcFilter || dateFrom || dateTo) && (
                <button onClick={clearFilters} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:"7px", color:T.textMuted, padding:"7px 11px", fontSize:"11px", cursor:"pointer", marginTop:"13px" }}>✕ Clear</button>
              )}
            </div>
          </div>

          {/* Bulk bar */}
          {sel.size > 0 && (
            <div style={{ background:dark ? "#1A1D2E" : "#EEF2FF", border:`1px solid ${T.accent}30`, borderRadius:"9px", padding:"8px 12px", marginBottom:"9px", display:"flex", alignItems:"center", gap:"7px", flexWrap:"wrap" }}>
              <span style={{ color:T.accent, fontWeight:700, fontSize:"12px" }}>{sel.size} selected</span>
              {!isAgent && <button onClick={() => { setBSt(""); setBNote(""); setBSMS(false); setShowBS(true); }} style={{ background:T.accent + "15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"6px", padding:"5px 10px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>✏ Change Status</button>}
              {!isAgent && <button style={{ background:"#05996915", border:"1px solid #05996930", color:"#059669", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>🚚 Bulk Ship</button>}
              <button onClick={() => { setPType("slip"); setShowBP(true); }} style={{ background:"#D9770615", border:"1px solid #D9770630", color:"#D97706", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>🖨 Print</button>
              {!isAgent && <button style={{ background:"#0D948815", border:"1px solid #0D948830", color:"#0D9488", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>📥 Export</button>}
              {!isAgent && <button onClick={() => setShowAddBatch(true)} style={{ background:"#A855F715", border:"1px solid #A855F730", color:"#A855F7", borderRadius:"6px", padding:"5px 10px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>📦 Batch Assign</button>}
              <button onClick={() => setSel(new Set())} style={{ marginLeft:"auto", background:"transparent", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"11px" }}>Clear ✕</button>
            </div>
          )}

          {/* TABLE */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"11px", overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:TABLE_COLS, padding:"8px 12px", borderBottom:`1px solid ${T.border}`, background:T.tHead }}>
              <input type="checkbox" checked={sel.size === rows.length && rows.length > 0} onChange={toggleAll} style={{ accentColor:T.accent }} />
              {["Order","Type","Src","Customer","Products","Amount","Payment","Status","Pathao Cons. ID","Fraud"].map((h, i) => (
                <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
              ))}
            </div>

            {rows.length === 0 && <div style={{ padding:"32px", textAlign:"center", color:T.textMuted, fontSize:"12px" }}>No orders match your filters.</div>}

            {rows.map((o, i) => {
              const [sBg, sText] = getSC(o.status);
              const [fBg, fText, fLabel] = getFR(o.fraud);
              const inBatches = batchMembership[normalizeOrderId(o.id)] || [];
              const isSel = sel.has(o.id);
              const rowBg = isSel ? T.rowSel : o.issue ? (dark ? "rgba(239,68,68,0.04)" : "#FFF8F8") : "transparent";
              return (
                <div key={o.id} onClick={() => openDetail(o)}
                  style={{ display:"grid", gridTemplateColumns:TABLE_COLS, padding:"9px 12px", borderBottom:`1px solid ${T.border}`, background:rowBg, cursor:"pointer", transition:"background 0.1s" }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = T.rowHover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}>

                  <div onClick={ev => { ev.stopPropagation(); toggleSel(o.id); }}>
                    <input type="checkbox" checked={isSel} onChange={() => {}} style={{ accentColor:T.accent }} />
                  </div>

                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                      <span style={{ fontSize:"12px", fontWeight:800, color:o.type === "preorder" ? "#D97706" : T.accent }}>{o.num}</span>
                      {inBatches.length > 0 && <span title={`Already in: ${inBatches.map((b) => b.batchCode).join(", ")}`} style={{ fontSize:"11px" }}>📦</span>}
                      {o.issue && <span title={o.issue}>⚠️</span>}
                    </div>
                    <span style={{ fontSize:"8px", fontWeight:700, padding:"1px 5px", borderRadius:"3px", background:o.placedBy === "customer" ? "#0D948815" : "#6366F115", color:o.placedBy === "customer" ? "#0D9488" : "#6366F1" }}>
                      {o.placedBy === "customer" ? "🌐 Web" : "👤 Agent"}
                    </span>
                  </div>

                  <div style={{ display:"flex", alignItems:"center" }}>
                    <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"4px", background:o.type === "stock" ? "#10B98115" : "#F59E0B15", color:o.type === "stock" ? "#059669" : "#D97706" }}>{o.type === "stock" ? "STOCK" : "PRE"}</span>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", fontSize:"15px" }}>{SRC_ICON[o.source] || "📦"}</div>

                  <div>
                    <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{o.customer}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{o.phone}</div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <ProdImg label={o.items[0].name} size={28} />
                    <div>
                      <div style={{ fontSize:"11px", color:T.textMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"116px" }}>
                        {o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                      </div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{o.items[0].size !== "Free" ? `Sz ${o.items[0].size} · ` : ""}{o.items[0].color} ×{o.items[0].qty}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{itemsTotal(o.items).toLocaleString()}</div>
                    {o.discount > 0 && <div style={{ fontSize:"9px", color:"#059669" }}>-{o.discType === "pct" ? `${o.discount}%` : `৳${o.discount}`}</div>}
                    <div style={{ fontSize:"9px", color:"#D97706", fontWeight:600 }}>COD ৳{due(o).toLocaleString()}</div>
                  </div>

                  <div>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"2px" }}>{o.pay}</div>
                    <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"4px", fontWeight:600,
                      background:o.payStatus === "verified" || o.payStatus === "collected" ? "#10B98115" : o.payStatus === "pending" ? "#F59E0B15" : "#EF444415",
                      color:o.payStatus === "verified" || o.payStatus === "collected" ? "#059669" : o.payStatus === "pending" ? "#D97706" : "#DC2626" }}>
                      {o.payStatus === "collected" ? "✓ Collected" : o.payStatus === "verified" ? "✓ Verified" : o.payStatus === "pending" ? "⏳ Pending" : "✗ Cancelled"}
                    </span>
                  </div>

                  <div style={{ display:"flex", alignItems:"center" }}>
                    <span style={{ fontSize:"10px", padding:"3px 7px", borderRadius:"5px", fontWeight:600, background:sBg, color:sText, whiteSpace:"nowrap" }}>{o.status}</span>
                  </div>

                  {/* Pathao Consignment ID — null until order is sent to Pathao API */}
                  <div style={{ display:"flex", alignItems:"center" }}>
                    {o.consId ? (
                      <div>
                        <div style={{ fontSize:"9px", fontFamily:"monospace", fontWeight:700, color:"#2563EB", background:"#2563EB12", border:"1px solid #2563EB25", borderRadius:"4px", padding:"2px 6px", letterSpacing:"0.3px" }}>
                          {o.consId}
                        </div>
                        <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px" }}>🚚 {getPathaoDeliveryStatus(o)}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize:"10px", color:T.textMuted }}>—</span>
                    )}
                  </div>

                  <div style={{ display:"flex", alignItems:"center" }}>
                    <span style={{ fontSize:"9px", padding:"2px 6px", borderRadius:"4px", fontWeight:600, background:fBg, color:fText }}>{fLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"9px" }}>
            <div style={{ fontSize:"11px", color:T.textMuted }}>Showing {rows.length} of {orders.length} orders</div>
            <div style={{ display:"flex", gap:"4px" }}>
              {["◀","1","2","3","▶"].map((p, i) => (
                <button key={i} style={{ background:i === 1 ? T.accent + "18" : T.surface, border:`1px solid ${i === 1 ? T.accent + "40" : T.border}`, color:i === 1 ? T.accent : T.textMuted, borderRadius:"5px", padding:"4px 9px", fontSize:"11px", cursor:"pointer" }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL PANEL */}
      {detail && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex" }} onClick={() => setDetail(null)}>
          <div style={{ flex:1, background:"rgba(0,0,0,0.3)" }} />
          <div style={{ width:"440px", background:T.sidebar, borderLeft:`1px solid ${T.border}`, overflowY:"auto" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"13px 15px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", position:"sticky", top:0, background:T.sidebar, zIndex:2 }}>
              <div>
                <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>{detail.num}</div>
                <div style={{ display:"flex", gap:"5px", marginTop:"4px" }}>
                  <span style={{ background:detail.placedBy === "customer" ? "#0D948815" : "#6366F115", color:detail.placedBy === "customer" ? "#0D9488" : "#6366F1", padding:"2px 8px", borderRadius:"4px", fontSize:"10px", fontWeight:600 }}>
                    {detail.placedBy === "customer" ? "🌐 Website Order" : "👤 Agent Entry"}
                  </span>
                  <span style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, padding:"2px 8px", borderRadius:"4px", fontSize:"10px" }}>
                    {SRC_ICON[detail.source] || "📦"} {detail.source}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", gap:"5px" }}>
                <button onClick={() => openEdit(detail)} style={{ background:"#D9770615", border:"1px solid #D9770630", color:"#D97706", borderRadius:"6px", padding:"5px 9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✏ Edit</button>
                <button onClick={() => { setPType("slip"); setShowSP(true); }} style={{ background:T.accent + "15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"6px", padding:"5px 9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>🖨</button>
                <button onClick={() => setDetail(null)} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"5px 9px", cursor:"pointer" }}>✕</button>
              </div>
            </div>

            <div style={{ padding:"13px 15px", display:"flex", flexDirection:"column", gap:"11px" }}>

              {/* Issue banner */}
              {detail.issue && (
                <div style={{ background:"#EF444410", border:"1px solid #EF444430", borderRadius:"9px", padding:"11px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                    <span style={{ color:"#DC2626", fontWeight:700, fontSize:"11px" }}>⚠️ Order Issue</span>
                    <button onClick={resolveIssue} style={{ background:"#10B98115", border:"1px solid #10B98130", color:"#059669", borderRadius:"5px", padding:"2px 9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✓ Resolved</button>
                  </div>
                  <div style={{ fontSize:"12px", color:"#EF4444", lineHeight:"1.5" }}>{detail.issue}</div>
                </div>
              )}

              {/* Status badges */}
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                <span style={{ background:detail.type === "stock" ? "#10B98115" : "#F59E0B15", color:detail.type === "stock" ? "#059669" : "#D97706", padding:"4px 10px", borderRadius:"6px", fontSize:"12px", fontWeight:700 }}>
                  {detail.type === "stock" ? "📦 STOCK" : "⏳ PRE-ORDER"}
                </span>
                {(() => { const [bg, t] = getSC(detail.status); return <span style={{ background:bg, color:t, padding:"4px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:600 }}>{detail.status}</span>; })()}
                {(() => { const [bg, t, l] = getFR(detail.fraud); return <span style={{ background:bg, color:t, padding:"4px 10px", borderRadius:"6px", fontSize:"11px", fontWeight:600 }}>🛡 {l} Risk</span>; })()}
              </div>

              {/* Order info */}
              <Box T={T}>
                <SLabel c="Order Info" T={T} />
                <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                  <div><div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"2px" }}>PLACED BY</div><div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{detail.placedBy === "customer" ? "Customer (Website)" : "Agent"}</div></div>
                  {detail.placedBy === "agent" && detail.agent !== "—" && <div><div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"2px" }}>CONFIRMED BY</div><div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{detail.agent}</div></div>}
                  <div><div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"2px" }}>DATE</div><div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{detail.date}</div></div>
                </div>
              </Box>

              {/* Customer */}
              <Box T={T}>
                <SLabel c="Customer" T={T} />
                <div style={{ fontWeight:700, color:T.text, fontSize:"13px" }}>{detail.customer}</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{detail.phone}</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>📍 {detail.area}</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{isDhaka(detail.area) ? "🟢 Inside Dhaka" : "🟡 Outside Dhaka"} · Delivery ৳{isDhaka(detail.area) ? delIn : delOut}</div>
              </Box>

              {/* Products + Payment */}
              <Box T={T}>
                <SLabel c="Products & Payment" T={T} />
                {detail.items.map((it, j) => (
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"7px 0", borderBottom:j < detail.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <ProdImg label={it.name} size={38} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{it.name}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{it.size !== "Free" ? `Sz ${it.size} · ` : ""}{it.color} × {it.qty}</div>
                    </div>
                    <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{(it.price * it.qty).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ height:"1px", background:T.border, margin:"8px 0" }} />
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:T.textMuted }}>Subtotal</span><span style={{ fontSize:"11px", color:T.textMid }}>৳{itemsTotal(detail.items).toLocaleString()}</span></div>
                {detail.discount > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontSize:"11px", color:"#059669" }}>Discount {detail.discType === "pct" ? `(${detail.discount}%)` : "(flat)"}</span>
                    <span style={{ fontSize:"11px", color:"#059669" }}>- ৳{detail.discType === "pct" ? Math.round(itemsTotal(detail.items) * detail.discount / 100) : detail.discount}</span>
                  </div>
                )}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:T.textMuted }}>Delivery</span><span style={{ fontSize:"11px", color:T.textMuted }}>৳{isDhaka(detail.area) ? delIn : delOut}</span></div>
                {detail.advance > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:"#059669" }}>Advance Paid</span><span style={{ fontSize:"11px", color:"#059669" }}>- ৳{detail.advance}</span></div>}
                <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"7px", borderTop:`1px solid ${T.border}` }}>
                  <span style={{ fontWeight:700, color:"#D97706" }}>COD Due on Delivery</span>
                  <span style={{ fontSize:"14px", fontWeight:800, color:"#D97706" }}>৳{due(detail).toLocaleString()}</span>
                </div>
              </Box>

              {/* Pend verify */}
              {detail.status === "Pend. Verify" && (
                <div style={{ background:"#FEF3C715", border:"1px solid #F59E0B30", borderRadius:"9px", padding:"11px 13px" }}>
                  <div style={{ color:"#D97706", fontWeight:700, fontSize:"11px", marginBottom:"4px" }}>⚠ Manual bKash — Pending Verification</div>
                  <div style={{ color:"#92400E", fontSize:"11px", marginBottom:"8px" }}>{detail.customerNote}</div>
                  <div style={{ display:"flex", gap:"7px" }}>
                    <button style={{ flex:1, background:"#10B98118", border:"1px solid #10B98135", color:"#059669", borderRadius:"7px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✓ Verify Payment</button>
                    <button style={{ flex:1, background:"#EF444418", border:"1px solid #EF444435", color:"#DC2626", borderRadius:"7px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✗ Reject</button>
                  </div>
                </div>
              )}

              {/* Customer note */}
              {detail.customerNote && detail.status !== "Pend. Verify" && (
                <div style={{ background:T.accent + "0A", border:`1px solid ${T.accent}20`, borderRadius:"8px", padding:"9px 12px" }}>
                  <SLabel c="📢 Customer Note (tracking page)" T={T} />
                  <div style={{ fontSize:"12px", color:T.textMid }}>{detail.customerNote}</div>
                </div>
              )}

              {/* Internal note */}
              <div style={{ background:"#F59E0B0A", border:"1px solid #F59E0B20", borderRadius:"8px", padding:"9px 12px" }}>
                <SLabel c="🔒 Internal Note (team only)" T={T} />
                <div style={{ fontSize:"12px", color:"#D97706", fontStyle:detail.internalNote ? "normal" : "italic" }}>
                  {detail.internalNote || <span style={{ color:T.textMuted }}>No internal note</span>}
                </div>
              </div>

              {/* Update status */}
              {!isAgent && (
                <Box T={T}>
                  <SLabel c="Update Order Status" T={T} />
                  <select value={newSt} onChange={e => setNewSt(e.target.value)} style={{ ...IS, marginBottom:"8px" }}>
                    <option value="">Select new status...</option>
                    {ALL_S.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <textarea value={stNote} onChange={e => setStNote(e.target.value)} placeholder="Note for customer (shown on tracking page)..."
                    style={{ ...IS, resize:"vertical", minHeight:"50px", marginBottom:"9px" }} />
                  <SMSCheck val={sendSMS} set={setSendSMS} label="Send SMS notification to customer" T={T} />
                  <button onClick={doUpdate} disabled={!newSt}
                    style={{ width:"100%", marginTop:"9px", background:newSt ? T.accent : "transparent", border:`1px solid ${newSt ? T.accent : T.border}`, color:newSt ? "#fff" : T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:700, cursor:newSt ? "pointer" : "not-allowed" }}>
                    {newSt ? `Update to "${newSt}"${sendSMS ? " & Send SMS" : ""}` : "Select a status first"}
                  </button>
                </Box>
              )}

              {/* Issue section */}
              <Box T={T} style={{ border:`1px solid ${detail.issue ? "#EF444430" : "#EF444415"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <SLabel c="⚠️ Order Issue" T={T} />
                  {!detail.issue && !showIssue && (
                    <button onClick={() => setShowIssue(true)} style={{ background:"#EF444415", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"6px", padding:"3px 9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Mark as Issue</button>
                  )}
                  {detail.issue && (
                    <button onClick={resolveIssue} style={{ background:"#10B98115", border:"1px solid #10B98130", color:"#059669", borderRadius:"6px", padding:"3px 9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>✓ Mark Resolved</button>
                  )}
                </div>
                {detail.issue && <div style={{ fontSize:"12px", color:"#EF4444", lineHeight:"1.5", marginBottom:"4px" }}>{detail.issue}</div>}
                {!detail.issue && !showIssue && <div style={{ fontSize:"11px", color:T.textMuted, fontStyle:"italic" }}>No issue flagged on this order.</div>}
                {showIssue && (
                  <div>
                    <textarea value={issueText} onChange={e => setIssueText(e.target.value)} placeholder="Describe the issue... (e.g. customer complaint, wrong product, payment dispute)"
                      style={{ ...IS, resize:"vertical", minHeight:"70px", marginBottom:"8px" }} />
                    <div style={{ display:"flex", gap:"7px" }}>
                      <button onClick={() => setShowIssue(false)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"7px", padding:"7px", fontSize:"11px", cursor:"pointer" }}>Cancel</button>
                      <button onClick={submitIssue} disabled={!issueText.trim()} style={{ flex:2, background:issueText.trim() ? "#EF4444" : "transparent", border:`1px solid ${issueText.trim() ? "#EF4444" : T.border}`, color:issueText.trim() ? "#fff" : T.textMuted, borderRadius:"7px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:issueText.trim() ? "pointer" : "not-allowed" }}>Submit Issue</button>
                    </div>
                  </div>
                )}
              </Box>

              {/* Quick actions */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px" }}>
                <button onClick={shipViaPathao} style={{ background:T.accent + "12", border:`1px solid ${T.accent}22`, color:T.accent, borderRadius:"8px", padding:"9px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>🚚 Ship via Pathao</button>
                <button onClick={copyTrackingLink} style={{ background:"#0D948812", border:"1px solid #0D948822", color:"#0D9488", borderRadius:"8px", padding:"9px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>🔗 Tracking Link</button>
                <button onClick={sendWhatsAppUpdate} style={{ background:"#05966912", border:"1px solid #05966922", color:"#059669", borderRadius:"8px", padding:"9px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>📲 Send WhatsApp</button>
                <button onClick={flagCustomer} style={{ background:"#DC262612", border:"1px solid #DC262622", color:"#DC2626", borderRadius:"8px", padding:"9px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>⚑ Flag Customer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editId && editOrder && (
        <Modal title={`Edit Order ${editOrder.num}`} onClose={() => setEditId(null)} width="560px" T={T}>
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            {/* Current items */}
            <div>
              <SLabel c="Current Products" T={T} />
              {editItems.map((it, idx) => (
                <div key={idx} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", marginBottom:"6px" }}>
                  <ProdImg label={it.name} size={36} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{it.name}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{it.size !== "Free" ? `Sz ${it.size} · ` : ""}{it.color} · ৳{it.price.toLocaleString()}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <button onClick={() => changeQty(idx, it.qty - 1)} style={{ width:"26px", height:"26px", background:T.surface, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:"6px", cursor:"pointer", fontSize:"15px", fontWeight:700, lineHeight:1 }}>−</button>
                    <span style={{ color:T.text, fontWeight:800, fontSize:"13px", minWidth:"20px", textAlign:"center" }}>{it.qty}</span>
                    <button onClick={() => changeQty(idx, it.qty + 1)} style={{ width:"26px", height:"26px", background:T.surface, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:"6px", cursor:"pointer", fontSize:"15px", fontWeight:700, lineHeight:1 }}>+</button>
                  </div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.text, minWidth:"70px", textAlign:"right" }}>৳{(it.price * it.qty).toLocaleString()}</div>
                  {editItems.length > 1 && <button onClick={() => removeItem(idx)} style={{ background:"#EF444412", border:"1px solid #EF444425", color:"#DC2626", borderRadius:"5px", padding:"4px 8px", fontSize:"11px", cursor:"pointer" }}>✕</button>}
                </div>
              ))}
            </div>

            {/* Add product */}
            <div style={{ background:T.accent + "0A", border:`1px solid ${T.accent}20`, borderRadius:"10px", padding:"14px" }}>
              <div style={{ fontSize:"12px", fontWeight:700, color:T.accent, marginBottom:"11px" }}>+ Add Another Product to This Order</div>
              <div style={{ marginBottom:"9px" }}>
                <SLabel c="Search Product" T={T} />
                <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Type product name..." style={{ ...IS, marginBottom:"8px" }} />
                {catalogError && <div style={{ marginBottom:"7px", fontSize:"11px", color:"#D97706" }}>Catalog sync warning: {catalogError}</div>}
                <SLabel c="Matching Products" T={T} />
                <div style={{ maxHeight:"150px", overflowY:"auto", border:`1px solid ${T.border}`, borderRadius:"8px", background:T.surface }}>
                  {filteredCatalog.length === 0 && <div style={{ padding:"10px 11px", fontSize:"11px", color:T.textMuted }}>No products found for "{addSearch}".</div>}
                  {filteredCatalog.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setAddPid(p.id); setAddSize(""); setAddColor(""); }}
                      style={{ width:"100%", textAlign:"left", border:"none", borderBottom:`1px solid ${T.border}`, background:addPid === p.id ? T.accent + "16" : "transparent", color:addPid === p.id ? T.accent : T.text, cursor:"pointer", padding:"9px 11px", fontSize:"12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span>{p.img} {p.name}</span>
                      <span style={{ fontWeight:700 }}>৳{p.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
                {selProd && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"8px", padding:"9px 11px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px" }}>
                    <ProdImg label={selProd.name} size={42} />
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{selProd.name}</div>
                      <div style={{ fontSize:"11px", color:T.textMuted }}>৳{selProd.price.toLocaleString()} per item</div>
                    </div>
                  </div>
                )}
              </div>
              {selProd && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 80px", gap:"9px", marginBottom:"9px" }}>
                  <div><SLabel c="Size" T={T} /><select value={addSize} onChange={e => setAddSize(e.target.value)} style={IS}><option value="">Size...</option>{selProd.sizes.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div><SLabel c="Color" T={T} /><select value={addColor} onChange={e => setAddColor(e.target.value)} style={IS}><option value="">Color...</option>{selProd.colors.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><SLabel c="Qty" T={T} /><input type="number" min="1" value={addQty} onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))} style={IS} /></div>
                </div>
              )}
              <button onClick={addProduct} disabled={!addPid || !addSize || !addColor}
                style={{ width:"100%", background:addPid && addSize && addColor ? T.accent + "22" : "transparent", border:`1px solid ${addPid && addSize && addColor ? T.accent + "50" : T.border}`, color:addPid && addSize && addColor ? T.accent : T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:700, cursor:addPid && addSize && addColor ? "pointer" : "not-allowed" }}>
                {addPid && addSize && addColor ? `+ Add to Order (৳${((selProd?.price || 0) * addQty).toLocaleString()})` : "+ Add Product to Order"}
              </button>
            </div>

            {/* Discount */}
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"12px 14px" }}>
              <SLabel c="Discount (optional)" T={T} />
              <div style={{ display:"flex", gap:"9px", alignItems:"center" }}>
                <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"7px", padding:"3px", border:`1px solid ${T.border}` }}>
                  {[["flat","৳ Flat"], ["pct","% Percent"]].map(([id, label]) => (
                    <button key={id} onClick={() => setEditDiscT(id)} style={{ padding:"5px 11px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:editDiscT === id ? "#05996920" : "transparent", color:editDiscT === id ? "#059669" : T.textMuted }}>{label}</button>
                  ))}
                </div>
                <input type="number" min="0" value={editDisc} onChange={e => setEditDisc(parseFloat(e.target.value) || 0)}
                  placeholder={editDiscT === "pct" ? "e.g. 10 for 10%" : "e.g. 100"} style={{ ...IS, width:"130px" }} />
                {editDisc > 0 && <span style={{ fontSize:"11px", color:"#059669", whiteSpace:"nowrap" }}>
                  Save ৳{editDiscT === "pct" ? Math.round(editSub * editDisc / 100) : editDisc}
                </span>}
              </div>
            </div>

            {/* Advance */}
            <div><SLabel c="Advance Paid (BDT)" T={T} /><input type="number" min="0" value={editAdv} onChange={e => setEditAdv(parseInt(e.target.value) || 0)} style={IS} /></div>

            {/* Internal note */}
            <div>
              <SLabel c="🔒 Internal Note (team only)" T={T} />
              <textarea value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Internal note for team..."
                style={{ ...IS, resize:"vertical", minHeight:"50px" }} />
            </div>

            {/* Live total */}
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"12px 14px" }}>
              <SLabel c="Updated Order Total" T={T} />
              {editItems.map((it, idx) => (
                <div key={idx} style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                  <span style={{ fontSize:"11px", color:T.textMuted }}>{it.name} ×{it.qty}</span>
                  <span style={{ fontSize:"11px", color:T.textMid }}>৳{(it.price * it.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ height:"1px", background:T.border, margin:"6px 0" }} />
              {editDisc > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:"#059669" }}>Discount{editDiscT === "pct" ? ` (${editDisc}%)` : ""}</span><span style={{ fontSize:"11px", color:"#059669" }}>- ৳{editDiscT === "pct" ? Math.round(editSub * editDisc / 100) : editDisc}</span></div>}
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:T.textMuted }}>Delivery ({isDhaka(editOrder.area) ? "Inside" : "Outside"} Dhaka)</span><span style={{ fontSize:"11px", color:T.textMuted }}>৳{isDhaka(editOrder.area) ? delIn : delOut}</span></div>
              {editAdv > 0 && <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}><span style={{ fontSize:"11px", color:"#059669" }}>Advance Paid</span><span style={{ fontSize:"11px", color:"#059669" }}>- ৳{editAdv}</span></div>}
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:"7px", borderTop:`1px solid ${T.border}` }}>
                <span style={{ fontWeight:700, color:"#D97706", fontSize:"13px" }}>New COD Due</span>
                <span style={{ fontSize:"16px", fontWeight:800, color:"#D97706" }}>৳{editLiveDue.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setEditId(null)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={saveEdit} disabled={!editItems.length} style={{ flex:2, background:editItems.length ? T.accent : "transparent", border:`1px solid ${editItems.length ? T.accent : T.border}`, color:editItems.length ? "#fff" : T.textMuted, borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:700, cursor:editItems.length ? "pointer" : "not-allowed" }}>
                Save Changes — COD ৳{editLiveDue.toLocaleString()}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK STATUS */}
      {!isAgent && showBS && (
        <Modal title={`Change Status — ${sel.size} Orders`} onClose={() => setShowBS(false)} T={T}>
          <div style={{ display:"flex", flexDirection:"column", gap:"13px" }}>
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"9px 12px" }}>
              <SLabel c="Selected Orders" T={T} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginTop:"3px" }}>
                {selOrders.map(o => <span key={o.id} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.textMid, padding:"2px 8px", borderRadius:"5px", fontSize:"11px" }}>{o.num}</span>)}
              </div>
            </div>
            <div><SLabel c="New Status" T={T} /><select value={bSt} onChange={e => setBSt(e.target.value)} style={IS}><option value="">Select status...</option>{ALL_S.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><SLabel c="Customer Note (optional)" T={T} /><textarea value={bNote} onChange={e => setBNote(e.target.value)} placeholder="Note shown on tracking page..." style={{ ...IS, resize:"vertical", minHeight:"60px" }} /></div>
            <SMSCheck val={bSMS} set={setBSMS} label={`Send SMS to all ${sel.size} customers`} sub={bSMS ? `${sel.size} customers will receive SMS` : "No SMS will be sent"} T={T} />
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setShowBS(false)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={doBulk} disabled={!bSt} style={{ flex:2, background:bSt ? T.accent : "transparent", border:`1px solid ${bSt ? T.accent : T.border}`, color:bSt ? "#fff" : T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:700, cursor:bSt ? "pointer" : "not-allowed" }}>
                {bSt ? `Update ${sel.size} Orders${bSMS ? " & Send SMS" : ""}` : "Select a status first"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK PRINT */}
      {showBP && (
        <Modal title={`Print ${sel.size} Orders`} onClose={() => setShowBP(false)} width="560px" T={T}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ display:"flex", gap:"7px" }}>
              {[["slip","📋 Order Slips","Full detail"],["label","📦 Packing Labels","Name + COD"],["invoice","🧾 Invoice","Full invoice"]].map(([id, label, desc]) => (
                <div key={id} onClick={() => setPType(id)} style={{ flex:1, background:pType === id ? T.accent + "12" : T.bg, border:`1px solid ${pType === id ? T.accent + "40" : T.border}`, borderRadius:"9px", padding:"10px", cursor:"pointer" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:pType === id ? T.accent : T.textMuted, marginBottom:"2px" }}>{label}</div>
                  <div style={{ fontSize:"10px", color:T.textMuted }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"12px", maxHeight:"280px", overflowY:"auto" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", marginBottom:"9px" }}>Preview — {sel.size} orders</div>
              {selOrders.map(o => <PrintSlip key={o.id} order={o} type={pType} dIn={delIn} dOut={delOut} T={T} />)}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setShowBP(false)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => window.print()} style={{ flex:2, background:"#D97706", border:"none", color:"#fff", borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>🖨 Print {sel.size} Order{sel.size > 1 ? "s" : ""}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* SINGLE PRINT */}
      {showSP && detail && (
        <Modal title={`Print Order ${detail.num}`} onClose={() => setShowSP(false)} width="500px" T={T}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ display:"flex", gap:"7px" }}>
              {[["slip","📋 Order Slip","Full detail"],["label","📦 Packing Label","Name + COD"],["invoice","🧾 Invoice","Full invoice"]].map(([id, label, desc]) => (
                <div key={id} onClick={() => setPType(id)} style={{ flex:1, background:pType === id ? T.accent + "12" : T.bg, border:`1px solid ${pType === id ? T.accent + "40" : T.border}`, borderRadius:"9px", padding:"9px", cursor:"pointer" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:pType === id ? T.accent : T.textMuted, marginBottom:"2px" }}>{label}</div>
                  <div style={{ fontSize:"10px", color:T.textMuted }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"12px" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", marginBottom:"9px" }}>Preview</div>
              <PrintSlip order={detail} type={pType} dIn={delIn} dOut={delOut} T={T} />
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setShowSP(false)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={() => window.print()} style={{ flex:2, background:"#D97706", border:"none", color:"#fff", borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>🖨 Print This Order</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD TO BATCH MODAL */}
      {!isAgent && showAddBatch && (
        <Modal onClose={resetBatchModal} T={T}>
          <div style={{ padding:"20px" }}>
            {!batchCreated ? (
              <>
                <div style={{ fontSize:"15px", fontWeight:800, color:T.text, marginBottom:"4px" }}>📦 Batch Assign</div>
                <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"16px" }}>{sel.size} order{sel.size>1?"s":""} selected</div>
                <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                  <button onClick={() => setBatchMode("existing")} style={{ flex:1, background:batchMode === "existing" ? "#6366F115" : T.bg, border:`1px solid ${batchMode === "existing" ? "#6366F140" : T.border}`, color:batchMode === "existing" ? T.accent : T.textMuted, borderRadius:"8px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Assign Existing</button>
                  <button onClick={() => setBatchMode("new")} style={{ flex:1, background:batchMode === "new" ? "#A855F715" : T.bg, border:`1px solid ${batchMode === "new" ? "#A855F740" : T.border}`, color:batchMode === "new" ? "#A855F7" : T.textMuted, borderRadius:"8px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Create New</button>
                </div>

                {batchMode === "existing" ? (
                  <div style={{ marginBottom:"12px" }}>
                    <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"5px" }}>Select Batch <span style={{ color:"#EF4444" }}>*</span></div>
                    <select value={batchTarget} onChange={(e) => setBatchTarget(e.target.value)} style={{ ...IS, padding:"9px 12px" }}>
                      <option value="">Choose batch...</option>
                      {batchOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.batchCode} - {b.batchName || "Untitled"}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginBottom:"12px" }}>
                    <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"5px" }}>Batch Name <span style={{ color:"#EF4444" }}>*</span></div>
                    <input value={batchNote} onChange={e=>setBatchNote(e.target.value)} placeholder="e.g. Ali Express Restock April W3"
                      style={{ ...IS, padding:"9px 12px" }}/>
                  </div>
                )}
                <div style={{ marginBottom:"12px" }}>
                  <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"5px" }}>Agent Note (optional)</div>
                  <textarea value={batchAgentNote} onChange={(e) => setBatchAgentNote(e.target.value)} placeholder="e.g. Source from Ali Express Store #4421. Check sizing carefully."
                    style={{ ...IS, padding:"9px 12px", resize:"vertical", minHeight:"64px" }}/>
                </div>
                {/* Selected order preview */}
                {selectedAlreadyInBatch.length > 0 && (
                  <div style={{ background:"#F59E0B12", border:"1px solid #F59E0B30", borderRadius:"8px", padding:"10px 12px", marginBottom:"10px" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, color:"#D97706", marginBottom:"4px" }}>⚠ Some selected orders are already in batch</div>
                    {selectedAlreadyInBatch.slice(0, 4).map((entry) => (
                      <div key={entry.order.id} style={{ fontSize:"11px", color:T.textMid, marginBottom:"2px" }}>
                        {entry.order.num} already in {entry.batches.map((b) => b.batchCode).join(", ")}
                      </div>
                    ))}
                    {selectedAlreadyInBatch.length > 4 && (
                      <div style={{ fontSize:"10px", color:T.textMuted }}>+{selectedAlreadyInBatch.length - 4} more</div>
                    )}
                  </div>
                )}
                <div style={{ background:T.bg, borderRadius:"8px", padding:"10px 12px", marginBottom:"16px", maxHeight:"140px", overflow:"auto" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"7px" }}>Orders in this batch</div>
                  {[...sel].map(id => {
                    const o = orders.find(x => x.id === id);
                    return o ? (
                      <div key={id} style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ fontSize:"12px", fontWeight:700, color:T.accent }}>{o.num}</span>
                        <span style={{ fontSize:"11px", color:T.textMuted }}>{o.customer} · COD ৳{due(o).toLocaleString()}</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={resetBatchModal} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
                  <button onClick={() => {
                    if (batchMode === "existing") {
                      if (!batchTarget) return;
                      const assigned = assignOrdersToBatch(batchTarget, [...sel].map(normalizeOrderId), batchAgentNote);
                      if (!assigned) return;
                      setBatchCreated({ code: assigned.batchCode, name: assigned.batchName || "Untitled", mode: "assigned" });
                      return;
                    }

                    if (!batchNote.trim()) return;
                    const created = createBatch({ batchName: batchNote.trim(), note: batchAgentNote, orderIds: [...sel].map(normalizeOrderId), createdBy: "Admin" });
                    setBatchCreated({ code: created.batchCode, name: created.batchName || batchNote.trim(), mode: "created" });
                  }}
                    disabled={batchMode === "existing" ? !batchTarget : !batchNote.trim()}
                    style={{ flex:2, background:(batchMode === "existing" ? !!batchTarget : !!batchNote.trim())?"#A855F7":T.bg, border:`1px solid ${(batchMode === "existing" ? !!batchTarget : !!batchNote.trim())?"#A855F7":T.border}`, color:(batchMode === "existing" ? !!batchTarget : !!batchNote.trim())?"#fff":T.textMuted, borderRadius:"8px", padding:"10px", fontSize:"13px", fontWeight:700, cursor:(batchMode === "existing" ? !!batchTarget : !!batchNote.trim())?"pointer":"not-allowed" }}>
                    {batchMode === "existing" ? "Assign to Batch" : "Create Batch"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
                <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"6px" }}>{batchCreated.mode === "assigned" ? "Batch Assigned!" : "Batch Created!"}</div>
                <div style={{ fontSize:"13px", fontWeight:700, color:"#A855F7", fontFamily:"monospace", marginBottom:"4px" }}>{batchCreated.code}</div>
                <div style={{ fontSize:"13px", color:T.textMid, marginBottom:"4px" }}>{batchCreated.name}</div>
                <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"20px" }}>{sel.size} orders added successfully</div>
                <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
                  <button onClick={() => { resetBatchModal(); setSel(new Set()); }}
                    style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"8px", padding:"9px 18px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Close</button>
                  <button onClick={() => { resetBatchModal(); setSel(new Set()); navigateByAdminNavLabel("Batches"); }}
                    style={{ background:"#A855F7", border:"none", color:"#fff", borderRadius:"8px", padding:"9px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>View Batches →</button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}










