import { useState, type CSSProperties, type ReactNode } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";

type Source = "facebook" | "instagram" | "whatsapp" | "website" | "phone";
type ReminderType = "first" | "second";
type ReminderChannel = "sms" | "whatsapp";
type ReminderStatus = "read" | "delivered" | "failed";
type CartStatus = "new" | "reminded" | "reminded_twice" | "converted" | "expired";
type FilterMode = "all" | "active" | "converted" | "new" | "reminded";

type CartItem = {
  name: string;
  variant: string;
  qty: number;
  price: number;
  img: string;
  bg: string;
};

type Reminder = {
  type: ReminderType;
  channel: ReminderChannel;
  sentAt: string;
  status: ReminderStatus;
};

type Cart = {
  id: string;
  customer: string;
  phone: string;
  source: Source;
  abandonedAt: string;
  minutesAgo: number;
  cartValue: number;
  items: CartItem[];
  reminders: Reminder[];
  status: CartStatus;
  converted: boolean;
  couponSent: string | null;
  orderId?: string;
};

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV: Array<[string, string]> = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const SRC_ICON: Record<Source, string> = { facebook:"📘", instagram:"📸", whatsapp:"💬", website:"🌐", phone:"📞" };

const INIT_CARTS: Cart[] = [
  {
    id:"ac1", customer:"Dilruba Hossain", phone:"01488888888", source:"instagram",
    abandonedAt:"17 Apr 2026, 11:30 AM", minutesAgo:90, cartValue:7300,
    items:[
      { name:"Quilted Shoulder Bag", variant:"M - Pink",   qty:1, price:3500, img:"👜", bg:"#9D174D" },
      { name:"Silver Bracelet",      variant:"Free - Gold",qty:1, price:1800, img:"📿", bg:"#6B21A8" },
      { name:"Platform Sneakers",    variant:"38 - White", qty:1, price:2000, img:"👠", bg:"#7C3AED" },
    ],
    reminders:[], status:"new", converted:false, couponSent:null,
  },
  {
    id:"ac2", customer:"Sadia Begum",     phone:"01611112222", source:"facebook",
    abandonedAt:"17 Apr 2026, 9:00 AM",  minutesAgo:210, cartValue:3500,
    items:[
      { name:"Leather Tote Bag", variant:"M - Black", qty:1, price:3500, img:"🛍️", bg:"#92400E" },
    ],
    reminders:[
      { type:"first", channel:"sms", sentAt:"17 Apr, 10:00 AM", status:"delivered" },
    ], status:"reminded", converted:false, couponSent:null,
  },
  {
    id:"ac3", customer:"Farida Khanam",   phone:"01722223333", source:"website",
    abandonedAt:"16 Apr 2026, 6:00 PM",  minutesAgo:1080, cartValue:5700,
    items:[
      { name:"Ankle Strap Heels",   variant:"37 - Nude", qty:1, price:2800, img:"🥿", bg:"#B45309" },
      { name:"Gold Chain Necklace", variant:"Free - Gold",qty:1, price:2100, img:"💛", bg:"#92400E" },
      { name:"Canvas Backpack",     variant:"M - Olive",  qty:1, price:800,  img:"🎒", bg:"#065F46" },
    ],
    reminders:[
      { type:"first",  channel:"sms",      sentAt:"16 Apr, 7:00 PM",  status:"delivered" },
      { type:"second", channel:"whatsapp", sentAt:"17 Apr, 7:00 AM",  status:"read"      },
    ], status:"reminded_twice", converted:false, couponSent:"COMEBACK10",
  },
  {
    id:"ac4", customer:"Nasrin Sultana",  phone:"01833334444", source:"facebook",
    abandonedAt:"16 Apr 2026, 2:00 PM",  minutesAgo:1440, cartValue:2200,
    items:[
      { name:"Embroidered Clutch", variant:"Free - Blue", qty:1, price:2200, img:"👝", bg:"#B91C1C" },
    ],
    reminders:[
      { type:"first",  channel:"sms",  sentAt:"16 Apr, 3:00 PM",  status:"delivered" },
      { type:"second", channel:"sms",  sentAt:"17 Apr, 3:00 AM",  status:"failed"    },
    ], status:"reminded_twice", converted:false, couponSent:"COMEBACK10",
  },
  {
    id:"ac5", customer:"Tania Akter",     phone:"01944445555", source:"instagram",
    abandonedAt:"15 Apr 2026, 8:00 PM",  minutesAgo:2160, cartValue:6300,
    items:[
      { name:"Leather Tote Bag",      variant:"L - Brown",  qty:1, price:2500, img:"🛍️", bg:"#92400E" },
      { name:"High Ankle Converse",   variant:"38 - White", qty:1, price:3200, img:"👟", bg:"#1E40AF" },
      { name:"Silver Bracelet",       variant:"Free - Silver",qty:1,price:600, img:"📿", bg:"#6B21A8" },
    ],
    reminders:[
      { type:"first",  channel:"whatsapp", sentAt:"15 Apr, 9:00 PM",  status:"read"      },
      { type:"second", channel:"whatsapp", sentAt:"16 Apr, 9:00 AM",  status:"delivered" },
    ], status:"converted", converted:true, couponSent:"COMEBACK10", orderId:"#1014",
  },
  {
    id:"ac6", customer:"Rupa Islam",      phone:"01755556666", source:"website",
    abandonedAt:"14 Apr 2026, 4:00 PM",  minutesAgo:3000, cartValue:3800,
    items:[
      { name:"Platform Sneakers", variant:"37 - Black", qty:1, price:3800, img:"👠", bg:"#7C3AED" },
    ],
    reminders:[
      { type:"first",  channel:"sms",      sentAt:"14 Apr, 5:00 PM",  status:"delivered" },
      { type:"second", channel:"whatsapp", sentAt:"15 Apr, 5:00 AM",  status:"read"      },
    ], status:"converted", converted:true, couponSent:null, orderId:"#1009",
  },
  {
    id:"ac7", customer:"Mina Begum",      phone:"01666667777", source:"facebook",
    abandonedAt:"13 Apr 2026, 10:00 AM", minutesAgo:4200, cartValue:1800,
    items:[
      { name:"Woven Raffia Bag", variant:"S - Natural", qty:1, price:1800, img:"🧺", bg:"#78350F" },
    ],
    reminders:[
      { type:"first",  channel:"sms", sentAt:"13 Apr, 11:00 AM", status:"delivered" },
      { type:"second", channel:"sms", sentAt:"14 Apr, 11:00 AM", status:"delivered" },
    ], status:"expired", converted:false, couponSent:"COMEBACK10",
  },
];

const STATUS_MAP: Record<CartStatus, { label: string; color: string; bg: string; icon: string }> = {
  new:             { label:"New",             color:"#6366F1", bg:"#6366F115", icon:"🆕" },
  reminded:        { label:"1st Reminder Sent",color:"#D97706",bg:"#F59E0B15", icon:"📲" },
  reminded_twice:  { label:"2nd Reminder Sent",color:"#A855F7",bg:"#A855F715", icon:"📲📲" },
  converted:       { label:"Converted ✓",     color:"#059669", bg:"#10B98115", icon:"✅" },
  expired:         { label:"Expired",          color:"#64748B", bg:"#64748B15", icon:"⏰" },
};

const formatAge = (mins: number) => {
  if (mins < 60)    return `${mins}m ago`;
  if (mins < 1440)  return `${Math.round(mins/60)}h ago`;
  return `${Math.round(mins/1440)}d ago`;
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SL({ c, T }: { c: ReactNode; T: any }) {
  return <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px" }}>{c}</div>;
}

function StatusBadge({ status }: { status: CartStatus }) {
  const s = STATUS_MAP[status] || STATUS_MAP.new;
  return <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:s.bg, color:s.color }}>{s.label}</span>;
}

function ReminderDot({ reminder }: { reminder: Reminder }) {
  const color = reminder.status==="read"?"#059669":reminder.status==="delivered"?"#2563EB":reminder.status==="failed"?"#DC2626":"#D97706";
  const icon  = reminder.channel==="whatsapp"?"💬":"📲";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"10px" }}>
      <span>{icon}</span>
      <span style={{ color, fontWeight:600 }}>{reminder.status}</span>
    </div>
  );
}

// Cart detail panel
function CartPanel({ cart, onClose, onSendReminder, onMarkConverted, T }: { cart: Cart; onClose: () => void; onSendReminder: (id: string, channel: ReminderChannel, coupon: string | null) => void; onMarkConverted: (id: string) => void; T: any }) {
  const [sending,  setSending]  = useState(false);
  const [channel,  setChannel]  = useState<ReminderChannel>("sms");
  const [msg,      setMsg]      = useState("");
  const [coupon,   setCoupon]   = useState("COMEBACK10");
  const [withCoupon, setWithCoupon] = useState(false);
  const [sent,     setSent]     = useState(false);

  const reminderNum = cart.reminders.length + 1;
  const defaultMsg  = reminderNum === 1
    ? `Hi ${cart.customer.split(" ")[0]}! You left some items in your cart. Complete your order here: yourshop.com/cart`
    : `Hi ${cart.customer.split(" ")[0]}! Your cart is still waiting 🛍️${withCoupon?` Use code ${coupon} for 10% off!`:""} yourshop.com/cart`;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      onSendReminder(cart.id, channel, withCoupon ? coupon : null);
      setSending(false); setSent(true);
    }, 1000);
  };

  const TA: CSSProperties = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:"80px" };
  const status = STATUS_MAP[cart.status] || STATUS_MAP.new;

  return (
    <div style={{ width:"380px", background:T.sidebar, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Cart Details</span>
        <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer" }}>✕</button>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"16px" }}>

        {/* Customer */}
        <div style={{ background:T.bg, borderRadius:"10px", padding:"12px 14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"15px", fontWeight:800, color:T.text, marginBottom:"3px" }}>{cart.customer}</div>
          <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"6px" }}>📞 {cart.phone} · {SRC_ICON[cart.source]} {cart.source}</div>
          <div style={{ display:"flex", gap:"7px", alignItems:"center" }}>
            <StatusBadge status={cart.status}/>
            <span style={{ fontSize:"11px", color:T.textMuted }}>{cart.abandonedAt}</span>
          </div>
          {cart.converted && <div style={{ marginTop:"8px", fontSize:"11px", color:"#059669", fontWeight:600 }}>✅ Converted → Order {cart.orderId}</div>}
        </div>

        {/* Cart items */}
        <div style={{ marginBottom:"14px" }}>
          <SL c="Cart Items" T={T}/>
          {cart.items.map((it,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", marginBottom:"6px" }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"7px", background:it.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{it.img}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{it.name}</div>
                <div style={{ fontSize:"10px", color:T.textMuted }}>{it.variant} × {it.qty}</div>
              </div>
              <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>৳{it.price.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", background:T.accent+"08", border:`1px solid ${T.accent}20`, borderRadius:"8px" }}>
            <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Cart Total</span>
            <span style={{ fontSize:"15px", fontWeight:800, color:T.accent }}>৳{cart.cartValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Reminder history */}
        {cart.reminders.length > 0 && (
          <div style={{ marginBottom:"14px" }}>
            <SL c="Reminder History" T={T}/>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {cart.reminders.map((r,i) => (
                <div key={i} style={{ padding:"9px 12px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{i===0?"1st Reminder":"2nd Reminder"}</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>{r.sentAt}</div>
                  </div>
                  <ReminderDot reminder={r}/>
                </div>
              ))}
              {cart.couponSent && (
                <div style={{ padding:"7px 12px", background:"#6366F115", border:"1px solid #6366F125", borderRadius:"7px", fontSize:"11px", color:"#6366F1", fontWeight:600 }}>
                  🎁 Coupon sent: {cart.couponSent}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send reminder */}
        {!cart.converted && cart.status !== "expired" && cart.reminders.length < 2 && (
          <div style={{ marginBottom:"14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"14px" }}>
            <SL c={`Send ${reminderNum === 1 ? "1st" : "2nd"} Reminder`} T={T}/>

            {/* Channel */}
            <div style={{ display:"flex", gap:"7px", marginBottom:"10px" }}>
              {([["sms","📲 SMS"],["whatsapp","💬 WhatsApp"]] as Array<[ReminderChannel, string]>).map(([id,label]) => (
                <button key={id} onClick={() => setChannel(id)}
                  style={{ flex:1, padding:"8px", borderRadius:"8px", border:`1.5px solid ${channel===id?(id==="whatsapp"?"#25D366":"#6366F1"):T.border}`, background:channel===id?(id==="whatsapp"?"#25D36615":"#6366F115"):T.bg, color:channel===id?(id==="whatsapp"?"#25D366":"#6366F1"):T.textMuted, fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Coupon toggle for 2nd reminder */}
            {reminderNum === 2 && (
              <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"9px 11px", background:withCoupon?"#6366F108":T.surface, borderRadius:"8px", border:`1px solid ${withCoupon?"#6366F130":T.border}`, marginBottom:"10px" }}>
                <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>Include discount coupon ({coupon})</div>
                <div onClick={() => setWithCoupon(p=>!p)}
                  style={{ width:"34px", height:"20px", borderRadius:"20px", background:withCoupon?T.accent:"#CBD5E1", position:"relative", flexShrink:0 }}>
                  <div style={{ width:"16px", height:"16px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:withCoupon?"16px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </label>
            )}

            {/* Message preview */}
            <div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"5px" }}>Message preview:</div>
            <textarea value={msg || defaultMsg} onChange={e=>setMsg(e.target.value)} style={TA}/>
            <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"4px", marginBottom:"10px" }}>{(msg||defaultMsg).length} characters</div>

            {sent ? (
              <div style={{ padding:"10px 14px", background:"#05996915", border:"1px solid #05996930", borderRadius:"8px", fontSize:"12px", color:"#059669", fontWeight:600, textAlign:"center" }}>
                ✓ Reminder sent successfully!
              </div>
            ) : (
              <button onClick={handleSend} disabled={sending}
                style={{ width:"100%", background:sending?T.bg:T.accent, border:`1px solid ${sending?T.border:T.accent}`, color:sending?T.textMuted:"#fff", borderRadius:"8px", padding:"10px", fontSize:"12px", fontWeight:700, cursor:sending?"not-allowed":"pointer" }}>
                {sending ? "Sending..." : `Send via ${channel==="whatsapp"?"WhatsApp":"SMS"}`}
              </button>
            )}
          </div>
        )}

        {/* Mark as converted */}
        {!cart.converted && (
          <button onClick={() => onMarkConverted(cart.id)}
            style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            ✓ Mark as Manually Converted
          </button>
        )}
      </div>
    </div>
  );
}

// ── BULK SEND MODAL ───────────────────────────────────────────────────────
function BulkSendModal({ count, onSend, onClose, T }: { count: number; onSend: (channel: ReminderChannel, msg: string, coupon: string | null) => void; onClose: () => void; T: any }) {
  const [channel,    setChannel]    = useState<ReminderChannel>("sms");
  const [msg,        setMsg]        = useState("Hi! You left items in your cart 🛍️ Complete your order here: yourshop.com/cart");
  const [withCoupon, setWithCoupon] = useState(false);
  const [coupon,     setCoupon]     = useState("COMEBACK10");
  const [sending,    setSending]    = useState(false);
  const [done,       setDone]       = useState(false);

  const fullMsg = withCoupon ? msg.replace("yourshop.com/cart", `Use code ${coupon} for 10% off! yourshop.com/cart`) : msg;

  const handle = () => {
    setSending(true);
    setTimeout(() => { setDone(true); setSending(false); }, 1200);
  };

  const TA: CSSProperties = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", minHeight:"90px" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:"500px", maxWidth:"95vw", zIndex:1, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>

        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>Send Bulk Reminder</div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>Sending to <strong style={{ color:T.accent }}>{count} customers</strong></div>
          </div>
          <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer" }}>✕</button>
        </div>

        {done ? (
          <div style={{ padding:"40px 30px", textAlign:"center" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"6px" }}>Reminders Sent!</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"20px" }}>Successfully sent via {channel==="whatsapp"?"WhatsApp":"SMS"} to {count} customers.</div>
            <button onClick={() => { onSend(channel, msg, withCoupon?coupon:null); }}
              style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"10px 26px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding:"20px" }}>
            {/* Channel */}
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"11px", fontWeight:600, color:T.text, marginBottom:"8px" }}>Send Via</div>
              <div style={{ display:"flex", gap:"8px" }}>
                {([["sms","📲 SMS","#6366F1"],["whatsapp","💬 WhatsApp","#25D366"]] as Array<[ReminderChannel, string, string]>).map(([id,label,color])=>(
                  <button key={id} onClick={() => setChannel(id)}
                    style={{ flex:1, padding:"10px", borderRadius:"9px", border:`2px solid ${channel===id?color:T.border}`, background:channel===id?color+"12":T.bg, color:channel===id?color:T.textMuted, fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo code toggle */}
            <div style={{ marginBottom:"14px" }}>
              <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"11px 13px", background:withCoupon?T.accent+"08":T.bg, borderRadius:"9px", border:`1px solid ${withCoupon?T.accent+"30":T.border}` }}>
                <div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>Include Promo Code</div>
                  <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>Add a discount code to increase conversion</div>
                </div>
                <div onClick={() => setWithCoupon(p=>!p)}
                  style={{ width:"38px", height:"22px", borderRadius:"22px", background:withCoupon?T.accent:"#CBD5E1", position:"relative", flexShrink:0 }}>
                  <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:withCoupon?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
                </div>
              </label>
              {withCoupon && (
                <div style={{ marginTop:"8px", display:"flex", gap:"8px", padding:"10px 13px", background:T.accent+"06", border:`1px solid ${T.accent}20`, borderRadius:"9px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"10px", color:T.textMuted, marginBottom:"4px" }}>Coupon Code</div>
                    <input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())}
                      style={{ background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"7px", color:T.accent, padding:"7px 11px", fontSize:"13px", fontWeight:800, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"monospace", letterSpacing:"1px" }}/>
                  </div>
                  <div style={{ textAlign:"center", paddingTop:"18px" }}>
                    <div style={{ fontSize:"22px", fontWeight:800, color:"#059669" }}>10% OFF</div>
                    <div style={{ fontSize:"10px", color:T.textMuted }}>discount</div>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"11px", fontWeight:600, color:T.text, marginBottom:"6px" }}>Message</div>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} style={TA}/>
              <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"4px" }}>{fullMsg.length} characters{channel==="sms"?` · ~${Math.ceil(fullMsg.length/160)} SMS per person`:""}</div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom:"16px", padding:"12px 14px", background:channel==="whatsapp"?"#25D36608":"#6366F108", border:`1px solid ${channel==="whatsapp"?"#25D36620":"#6366F120"}`, borderRadius:"9px" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:600, marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Preview</div>
              <div style={{ fontSize:"12px", color:T.textMid, lineHeight:"1.6" }}>{fullMsg}</div>
            </div>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={onClose} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handle} disabled={sending}
                style={{ flex:2, background:sending?T.bg:T.accent, border:`1px solid ${sending?T.border:T.accent}`, color:sending?T.textMuted:"#fff", borderRadius:"9px", padding:"10px", fontSize:"13px", fontWeight:700, cursor:sending?"not-allowed":"pointer" }}>
                {sending ? "Sending..." : `📤 Send to ${count} Customers`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function AbandonedCartPage() {
  const [dark, setDark]         = useState(false);
  const T = dark ? DARK : LIGHT;
  const [carts, setCarts]       = useState<Cart[]>(INIT_CARTS);
  const [selected, setSelected] = useState<Cart | null>(null);
  const [filter, setFilter]     = useState<FilterMode>("all");
  const [search, setSearch]     = useState("");
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

  const filtered = carts.filter(c => {
    if (filter === "active"    && (c.converted || c.status==="expired")) return false;
    if (filter === "converted" && !c.converted) return false;
    if (filter === "new"       && c.status !== "new") return false;
    if (filter === "reminded"  && !c.status.startsWith("reminded")) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.customer.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    }
    return true;
  });

  const [bulkSelected, setBulkSelected]   = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const actionable = filtered.filter(c => !c.converted && c.status!=="expired" && c.reminders.length < 2);
  const toggleBulk = (id: string) => setBulkSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const allSelected = actionable.length > 0 && actionable.every(c => bulkSelected.includes(c.id));
  const toggleAll   = () => setBulkSelected(allSelected ? [] : actionable.map(c=>c.id));

  const handleBulkSend = (channel: ReminderChannel, msg: string, coupon: string | null) => {
    setCarts(p => p.map(c => {
      if (!bulkSelected.includes(c.id)) return c;
      const newReminder: Reminder = { type:c.reminders.length===0?"first":"second", channel, sentAt:"Just now", status:"delivered" };
      const newStatus   = c.reminders.length === 0 ? "reminded" : "reminded_twice";
      return { ...c, reminders:[...c.reminders, newReminder], status:newStatus, couponSent:coupon||c.couponSent };
    }));
    setBulkSelected([]);
    setShowBulkModal(false);
  };

  const handleSendReminder = (id: string, channel: ReminderChannel, coupon: string | null) => {
    setCarts(p => p.map(c => {
      if (c.id !== id) return c;
      const newReminder: Reminder = { type:c.reminders.length===0?"first":"second", channel, sentAt:"Just now", status:"delivered" };
      const newStatus   = c.reminders.length === 0 ? "reminded" : "reminded_twice";
      return { ...c, reminders:[...c.reminders, newReminder], status:newStatus, couponSent:coupon||c.couponSent };
    }));
    const updated = carts.find(c=>c.id===id);
    if (updated) setSelected({ ...updated });
  };

  const handleMarkConverted = (id: string) => {
    setCarts(p => p.map(c => c.id===id ? { ...c, converted:true, status:"converted" } : c));
    setSelected(null);
  };

  // Stats
  const total      = carts.length;
  const active     = carts.filter(c => !c.converted && c.status!=="expired").length;
  const converted  = carts.filter(c => c.converted).length;
  const totalValue = carts.filter(c=>!c.converted&&c.status!=="expired").reduce((a,b)=>a+b.cartValue,0);
  const convRate   = total > 0 ? Math.round(converted/total*100) : 0;
  const recoveredVal = carts.filter(c=>c.converted).reduce((a,b)=>a+b.cartValue,0);

  const STATS = [
    { label:"Active Carts",      value:active,                                  sub:"Need follow-up",           color:"#D97706", icon:"🛒" },
    { label:"Total Value",       value:"৳"+totalValue.toLocaleString(),         sub:"Revenue at risk",           color:"#DC2626", icon:"💸" },
    { label:"Converted",         value:converted,                                sub:`${convRate}% conversion rate`, color:"#059669", icon:"✅" },
    { label:"Revenue Recovered", value:"৳"+recoveredVal.toLocaleString(),       sub:"From converted carts",      color:"#059669", icon:"💰" },
    { label:"Reminders Sent",    value:carts.reduce((a,b)=>a+b.reminders.length,0), sub:"Total across all carts", color:"#6366F1", icon:"📲" },
    { label:"Awaiting 1st Reminder", value:carts.filter(c=>c.status==="new"&&!c.converted).length, sub:"Not yet contacted", color:"#A855F7", icon:"⏳" },
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
        badgeByLabel={active > 0 ? { Abandoned: { text: String(active), background: "#D9770618", color: "#D97706" } } : undefined}
        onLogout={handleSignOut}
      />

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 18px", gap:"10px", flexShrink:0 }}>
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:"12px" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customer name or phone..."
              style={{ width:"100%", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 10px 7px 30px", color:T.text, fontSize:"12px", outline:"none", boxSizing:"border-box" }}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", padding:"6px 12px", background:"#D9770612", border:"1px solid #D9770625", borderRadius:"8px" }}>
            <span style={{ fontSize:"12px" }}>⚙️</span>
            <span style={{ fontSize:"11px", color:"#D97706", fontWeight:600 }}>Auto-reminders: ON</span>
          </div>
        </div>

        {/* Content + panel */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>

            {/* Title */}
            <div style={{ marginBottom:"14px" }}>
              <h1 style={{ margin:0, fontSize:"16px", fontWeight:800, color:T.text }}>Abandoned Carts</h1>
              <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"3px" }}>Customers who added items but didn't complete their order</div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"8px", marginBottom:"14px" }}>
              {STATS.map((s,i) => (
                <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"11px 12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{s.label}</div>
                    <span style={{ fontSize:"15px" }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize:"18px", fontWeight:800, color:s.color, marginBottom:"2px" }}>{s.value}</div>
                  <div style={{ fontSize:"10px", color:T.textMuted }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center" }}>
              <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}` }}>
                {([["all","All"],["active","Active"],["new","New"],["reminded","Reminded"],["converted","Converted"]] as Array<[FilterMode, string]>).map(([id,label]) => (
                  <button key={id} onClick={() => setFilter(id)}
                    style={{ padding:"5px 12px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:filter===id?T.accent+"18":"transparent", color:filter===id?T.accent:T.textMuted }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft:"auto", fontSize:"11px", color:T.textMuted }}>Showing {filtered.length} of {carts.length}</div>
            </div>

            {/* Bulk action toolbar */}
            {bulkSelected.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px", background:T.accent+"0A", border:`1px solid ${T.accent}25`, borderRadius:"10px", marginBottom:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ width:"18px", height:"18px", borderRadius:"4px", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:"#fff", fontSize:"11px", fontWeight:800 }}>✓</span>
                  </div>
                  <span style={{ fontSize:"13px", fontWeight:700, color:T.accent }}>{bulkSelected.length} selected</span>
                </div>
                <div style={{ height:"16px", width:"1px", background:T.border }}/>
                <span style={{ fontSize:"11px", color:T.textMuted }}>
                  Cart value: <strong style={{ color:T.text }}>৳{carts.filter(c=>bulkSelected.includes(c.id)).reduce((a,b)=>a+b.cartValue,0).toLocaleString()}</strong>
                </span>
                <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
                  <button onClick={() => setBulkSelected([])}
                    style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"7px", padding:"6px 12px", fontSize:"11px", cursor:"pointer" }}>
                    Clear
                  </button>
                  <button onClick={() => setShowBulkModal(true)}
                    style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"7px", padding:"7px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
                    📤 Send Reminder to {bulkSelected.length}
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"40px 240px 120px 110px 130px 90px minmax(220px,1fr) 90px", padding:"9px 16px", background:T.tHead, borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                {/* Select all checkbox */}
                <div onClick={toggleAll}
                  style={{ width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${allSelected?T.accent:T.border}`, background:allSelected?T.accent:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {allSelected && <span style={{ color:"#fff", fontSize:"10px", fontWeight:800 }}>✓</span>}
                  {!allSelected && bulkSelected.length>0 && <span style={{ color:T.accent, fontSize:"10px", fontWeight:800 }}>—</span>}
                </div>
                {["Customer","Abandoned","Cart Value","Products","Source","Status / Reminders",""].map((h,i) => (
                  <div key={i} style={{ fontSize:"10px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{h}</div>
                ))}
              </div>

              {filtered.map((c, i) => {
                const isPanelOpen  = selected?.id === c.id;
                const isBulkChecked = bulkSelected.includes(c.id);
                const status = STATUS_MAP[c.status] || STATUS_MAP.new;
                const needsAction = !c.converted && c.status!=="expired" && c.reminders.length < 2;
                return (
                  <div key={c.id}
                    style={{ display:"grid", gridTemplateColumns:"40px 240px 120px 110px 130px 90px minmax(220px,1fr) 90px", padding:"11px 16px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer", background:isPanelOpen?T.accent+"06":isBulkChecked?T.accent+"04":"transparent", transition:"background 0.1s" }}
                    onClick={() => setSelected(isPanelOpen ? null : c)}
                    onMouseEnter={e=>{ if(!isPanelOpen) e.currentTarget.style.background=T.rowHover; }}
                    onMouseLeave={e=>{ if(!isPanelOpen) e.currentTarget.style.background=isBulkChecked?T.accent+"04":"transparent"; }}>

                    {/* Checkbox */}
                    <div onClick={e=>{ e.stopPropagation(); if(needsAction) toggleBulk(c.id); }}
                      style={{ width:"16px", height:"16px", borderRadius:"4px", border:`1.5px solid ${isBulkChecked?T.accent:T.border}`, background:isBulkChecked?T.accent:"transparent", cursor:needsAction?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", opacity:needsAction?1:0.3 }}>
                      {isBulkChecked && <span style={{ color:"#fff", fontSize:"10px", fontWeight:800 }}>✓</span>}
                    </div>

                    {/* Customer */}
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                        <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>{c.customer}</span>
                        {needsAction && <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#D97706", display:"inline-block", flexShrink:0 }}/>}
                      </div>
                      <div style={{ fontSize:"11px", color:T.textMuted }}>{c.phone}</div>
                    </div>

                    {/* Abandoned */}
                    <div>
                      <div style={{ fontSize:"11px", fontWeight:600, color:T.text }}>{formatAge(c.minutesAgo)}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{c.abandonedAt.split(",")[0]}</div>
                    </div>

                    {/* Value */}
                    <div style={{ fontSize:"14px", fontWeight:800, color:T.accent }}>৳{c.cartValue.toLocaleString()}</div>

                    {/* Products */}
                    <div style={{ display:"flex", gap:"3px" }}>
                      {c.items.slice(0,3).map((it,j) => (
                        <div key={j} style={{ width:"26px", height:"26px", borderRadius:"6px", background:it.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px" }}>{it.img}</div>
                      ))}
                      {c.items.length > 3 && <div style={{ width:"26px", height:"26px", borderRadius:"6px", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:T.textMuted, border:`1px solid ${T.border}` }}>+{c.items.length-3}</div>}
                    </div>

                    {/* Source */}
                    <div style={{ fontSize:"15px" }}>{SRC_ICON[c.source]}</div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={c.status}/>
                      {c.reminders.length > 0 && (
                        <div style={{ display:"flex", gap:"4px", marginTop:"4px" }}>
                          {c.reminders.map((r,j) => <ReminderDot key={j} reminder={r}/>)}
                        </div>
                      )}
                      {c.couponSent && <div style={{ fontSize:"9px", color:"#6366F1", marginTop:"3px", fontWeight:600 }}>🎁 {c.couponSent}</div>}
                    </div>

                    {/* Action */}
                    <div onClick={e=>e.stopPropagation()}>
                      {needsAction && !isPanelOpen && (
                        <button onClick={() => setSelected(c)}
                          style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"6px", padding:"5px 10px", fontSize:"12px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                          Send →
                        </button>
                      )}
                      {c.converted && <span style={{ fontSize:"11px", color:"#059669", fontWeight:600 }}>✅ {c.orderId}</span>}
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div style={{ padding:"36px", textAlign:"center", color:T.textMuted, fontSize:"12px" }}>
                  No abandoned carts match your filter.
                </div>
              )}
            </div>

          </div>

          {/* Detail panel */}
          {selected && (
            <CartPanel
              key={selected.id}
              cart={carts.find(c=>c.id===selected.id)||selected}
              onClose={() => setSelected(null)}
              onSendReminder={handleSendReminder}
              onMarkConverted={handleMarkConverted}
              T={T}
            />
          )}
        </div>
      </div>

      {showBulkModal && (
        <BulkSendModal
          count={bulkSelected.length}
          onSend={handleBulkSend}
          onClose={() => setShowBulkModal(false)}
          T={T}
        />
      )}
    </div>
  );
}










