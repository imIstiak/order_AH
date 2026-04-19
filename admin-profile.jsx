import { useState, useRef } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession } from "./core/auth-session";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const TABS = [
  { id:"profile",  icon:"👤", label:"Profile Info"            },
  { id:"password", icon:"🔑", label:"Change Password"         },
  { id:"notifs",   icon:"🔔", label:"Notification Preferences" },
];

const LOGIN_HISTORY = [
  { device:"Chrome on Windows", ip:"103.124.x.x", location:"Dhaka, BD", time:"Today, 10:30 AM",    current:true  },
  { device:"Chrome on Android", ip:"103.124.x.x", location:"Dhaka, BD", time:"Yesterday, 8:15 PM", current:false },
  { device:"Safari on iPhone",  ip:"202.51.x.x",  location:"Dhaka, BD", time:"16 Apr, 3:00 PM",    current:false },
  { device:"Chrome on Windows", ip:"103.124.x.x", location:"Dhaka, BD", time:"15 Apr, 11:00 AM",   current:false },
];

// ── HELPERS ───────────────────────────────────────────────────────────────

function SL({ c, T, req, sub }) {
  return (
    <div style={{ marginBottom:"6px" }}>
      <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{c}{req&&<span style={{ color:"#EF4444", marginLeft:"3px" }}>*</span>}</div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"1px" }}>{sub}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, T, type, disabled }) {
  const [f,setF] = useState(false);
  return (
    <input type={type||"text"} value={value} onChange={onChange} placeholder={placeholder} disabled={!!disabled}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f&&!disabled?T.accent:T.ib}`, borderRadius:"9px", color:T.text, padding:"10px 13px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", opacity:disabled?0.5:1 }}/>
  );
}

function Card({ title, sub, children, T }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", marginBottom:"16px" }}>
      {title && (
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"14px", fontWeight:700, color:T.text }}>{title}</div>
          {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
        </div>
      )}
      <div style={{ padding:"20px" }}>{children}</div>
    </div>
  );
}

function Toggle({ val, set, label, sub, T }) {
  return (
    <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"11px 14px", background:val?T.accent+"08":T.bg, borderRadius:"9px", border:`1px solid ${val?T.accent+"25":T.border}`, marginBottom:"8px" }}>
      <div>
        <div style={{ fontSize:"13px", fontWeight:600, color:T.text }}>{label}</div>
        {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
      </div>
      <div onClick={() => set(p=>!p)}
        style={{ width:"40px", height:"23px", borderRadius:"23px", background:val?T.accent:"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0, marginLeft:"12px" }}>
        <div style={{ width:"19px", height:"19px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:val?"19px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
      </div>
    </label>
  );
}

function SaveBtn({ onSave, T }) {
  const [saved, setSaved] = useState(false);
  const handle = () => { onSave?.(); setSaved(true); setTimeout(()=>setSaved(false), 2200); };
  return (
    <button onClick={handle}
      style={{ background:saved?"#059669":T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px 28px", fontSize:"13px", fontWeight:700, cursor:"pointer", transition:"background 0.2s" }}>
      {saved ? "✓ Saved!" : "Save Changes"}
    </button>
  );
}

// ── AVATAR SECTION ────────────────────────────────────────────────────────
function AvatarSection({ name, role, avatarUrl, onUpload, T }) {
  const fileRef = useRef(null);
  const initials = name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const handleFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => onUpload(e.target.result);
    r.readAsDataURL(file);
  };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:avatarUrl?"transparent":"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", boxShadow:"0 4px 16px rgba(99,102,241,0.25)" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <span style={{ color:"#fff", fontSize:"26px", fontWeight:800 }}>{initials}</span>}
        </div>
        <div onClick={() => fileRef.current?.click()}
          style={{ position:"absolute", bottom:"2px", right:"2px", width:"24px", height:"24px", borderRadius:"50%", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:`2px solid ${T.surface}` }}>
          <span style={{ fontSize:"11px", color:"#fff" }}>✏</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e => { if(e.target.files[0]) handleFile(e.target.files[0]); e.target.value=""; }}/>
      </div>
      <div>
        <div style={{ fontSize:"20px", fontWeight:800, color:T.text, marginBottom:"4px" }}>{name}</div>
        <span style={{ fontSize:"12px", fontWeight:700, background:T.accent+"15", color:T.accent, padding:"3px 12px", borderRadius:"20px", border:`1px solid ${T.accent}25` }}>{role}</span>
        <div style={{ marginTop:"10px", display:"flex", gap:"8px" }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:"7px", padding:"6px 14px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            Upload Photo
          </button>
          {avatarUrl && (
            <button onClick={() => onUpload("")}
              style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"7px", padding:"6px 14px", fontSize:"12px", cursor:"pointer" }}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PROFILE TAB ───────────────────────────────────────────────────────────
function ProfileTab({ T }) {
  const [name,      setName]      = useState("Istiak Shaharia");
  const [email,     setEmail]     = useState("istiakshaharia77@gmail.com");
  const [phone,     setPhone]     = useState("01755070168");
  const [whatsapp,  setWhatsapp]  = useState("01755070168");
  const [bio,       setBio]       = useState("Store owner & admin. Managing Little Things — Ladies Fashion BD.");
  const [avatarUrl, setAvatarUrl] = useState("");
  const TA = { background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"9px", color:T.text, padding:"10px 13px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", resize:"none", fontFamily:"inherit", minHeight:"80px" };

  return (
    <>
      <Card T={T}>
        <AvatarSection name={name} role="Admin" avatarUrl={avatarUrl} onUpload={setAvatarUrl} T={T}/>
      </Card>

      <Card title="Personal Information" T={T}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"14px" }}>
          <div>
            <SL c="Full Name" T={T} req/>
            <Inp value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" T={T}/>
          </div>
          <div>
            <SL c="Role" T={T} sub="Contact admin to change your role"/>
            <Inp value="Admin" T={T} disabled/>
          </div>
          <div>
            <SL c="Email Address" T={T} req sub="Used for login and system notifications"/>
            <Inp value={email} onChange={e=>setEmail(e.target.value)} T={T} type="email"/>
          </div>
          <div>
            <SL c="Phone Number" T={T} req/>
            <Inp value={phone} onChange={e=>setPhone(e.target.value)} T={T}/>
          </div>
          <div>
            <SL c="WhatsApp Number" T={T} sub="For order alerts on WhatsApp"/>
            <Inp value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} T={T}/>
          </div>
        </div>
        <div style={{ marginBottom:"16px" }}>
          <SL c="Bio (optional)" T={T}/>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} style={TA}/>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <SaveBtn T={T}/>
        </div>
      </Card>

      <Card title="Recent Login Activity" sub="Your last 4 sign-ins" T={T}>
        {LOGIN_HISTORY.map((l,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 0", borderBottom:i<LOGIN_HISTORY.length-1?`1px solid ${T.border}`:"none" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"9px", background:T.bg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
              {l.device.includes("Android")||l.device.includes("iPhone")?"📱":"💻"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"2px" }}>
                <span style={{ fontSize:"13px", fontWeight:600, color:T.text }}>{l.device}</span>
                {l.current && <span style={{ fontSize:"9px", fontWeight:700, background:"#10B98115", color:"#059669", padding:"1px 7px", borderRadius:"4px" }}>CURRENT</span>}
              </div>
              <div style={{ fontSize:"11px", color:T.textMuted }}>{l.location} · {l.ip} · {l.time}</div>
            </div>
            {!l.current && (
              <button style={{ background:"#EF444412", border:"1px solid #EF444425", color:"#DC2626", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>Revoke</button>
            )}
          </div>
        ))}
      </Card>
    </>
  );
}

// ── PASSWORD TAB ──────────────────────────────────────────────────────────
function PasswordTab({ T }) {
  const [current,   setCurrent]  = useState("");
  const [newPass,   setNewPass]  = useState("");
  const [confirm,   setConfirm]  = useState("");
  const [showCur,   setShowCur]  = useState(false);
  const [showNew,   setShowNew]  = useState(false);
  const [showCon,   setShowCon]  = useState(false);
  const [done,      setDone]     = useState(false);
  const [error,     setError]    = useState("");

  const strength      = !newPass?0:newPass.length<6?1:newPass.length<10?2:/[A-Z]/.test(newPass)&&/[0-9]/.test(newPass)?4:3;
  const strLabel      = ["","Weak","Fair","Good","Strong"];
  const strColor      = ["","#DC2626","#D97706","#6366F1","#059669"];
  const strWidth      = ["0%","25%","50%","75%","100%"];

  const handle = () => {
    setError("");
    if (!current)          { setError("Please enter your current password."); return; }
    if (newPass.length < 8){ setError("New password must be at least 8 characters."); return; }
    if (newPass !== confirm){ setError("New passwords do not match."); return; }
    if (current !== "admin123"){ setError("Current password is incorrect."); return; }
    setDone(true); setCurrent(""); setNewPass(""); setConfirm("");
    setTimeout(() => setDone(false), 3000);
  };

  const PassInp = ({ value, onChange, placeholder, show, setShow }) => {
    const [f,setF] = useState(false);
    return (
      <div style={{ position:"relative" }}>
        <input type={show?"text":"password"} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"9px", color:T.text, padding:"10px 42px 10px 13px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" }}/>
        <button onClick={()=>setShow(p=>!p)}
          style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"16px" }}>
          {show?"🙈":"👁"}
        </button>
      </div>
    );
  };

  return (
    <Card title="Change Password" sub="Use at least 8 characters with letters, numbers and symbols" T={T}>
      {error && <div style={{ padding:"10px 14px", background:"#EF444412", border:"1px solid #EF444430", borderRadius:"9px", fontSize:"13px", color:"#DC2626", marginBottom:"14px" }}>⚠ {error}</div>}
      {done  && <div style={{ padding:"10px 14px", background:"#05996912", border:"1px solid #05996930", borderRadius:"9px", fontSize:"13px", color:"#059669", marginBottom:"14px" }}>✓ Password changed successfully!</div>}

      <div style={{ marginBottom:"14px" }}>
        <SL c="Current Password" T={T} req/>
        <PassInp value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Enter current password" show={showCur} setShow={setShowCur}/>
      </div>

      <div style={{ height:"1px", background:T.border, margin:"16px 0" }}/>

      <div style={{ marginBottom:"14px" }}>
        <SL c="New Password" T={T} req/>
        <PassInp value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Minimum 8 characters" show={showNew} setShow={setShowNew}/>
        {newPass && (
          <div style={{ marginTop:"8px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
              <span style={{ fontSize:"11px", color:T.textMuted }}>Password strength</span>
              <span style={{ fontSize:"12px", fontWeight:700, color:strColor[strength] }}>{strLabel[strength]}</span>
            </div>
            <div style={{ height:"5px", background:T.border, borderRadius:"5px" }}>
              <div style={{ height:"5px", width:strWidth[strength], background:strColor[strength], borderRadius:"5px", transition:"all 0.3s" }}/>
            </div>
            <div style={{ display:"flex", gap:"7px", marginTop:"8px", flexWrap:"wrap" }}>
              {[["8+ chars",newPass.length>=8],["Uppercase",/[A-Z]/.test(newPass)],["Number",/[0-9]/.test(newPass)],["Symbol",/[^A-Za-z0-9]/.test(newPass)]].map(([label,met])=>(
                <span key={label} style={{ fontSize:"10px", fontWeight:600, padding:"2px 8px", borderRadius:"4px", background:met?"#05996912":"transparent", border:`1px solid ${met?"#05996930":T.border}`, color:met?"#059669":T.textMuted }}>
                  {met?"✓":"○"} {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom:"20px" }}>
        <SL c="Confirm New Password" T={T} req/>
        <PassInp value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter new password" show={showCon} setShow={setShowCon}/>
        {confirm && newPass && (
          <div style={{ fontSize:"11px", marginTop:"5px", color:confirm===newPass?"#059669":"#DC2626", fontWeight:600 }}>
            {confirm===newPass?"✓ Passwords match":"✗ Passwords do not match"}
          </div>
        )}
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={handle}
          style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px 28px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
          Update Password
        </button>
      </div>
    </Card>
  );
}

// ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────
function NotificationsTab({ T }) {
  const [emailNotifs,   setEmail]   = useState(true);
  const [whatsNotifs,   setWhats]   = useState(true);
  const [smsNotifs,     setSms]     = useState(false);
  const [browserNotifs, setBrowser] = useState(true);
  const [newOrder,      setNewOrder]= useState(true);
  const [orderStatus,   setOrderSt] = useState(true);
  const [payVerify,     setPayVer]  = useState(true);
  const [orderIssue,    setIssue]   = useState(true);
  const [orderCancel,   setCancel]  = useState(true);
  const [lowStock,      setLow]     = useState(true);
  const [outStock,      setOut]     = useState(true);
  const [preArrive,     setArrive]  = useState(true);
  const [preDelay,      setDelay]   = useState(true);
  const [remittance,    setRemit]   = useState(true);
  const [overdue,       setOverdue] = useState(true);

  const Sec = ({ title, children }) => (
    <div style={{ marginBottom:"20px" }}>
      <div style={{ fontSize:"12px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"10px", paddingBottom:"6px", borderBottom:`1px solid ${T.border}` }}>{title}</div>
      {children}
    </div>
  );

  return (
    <>
      <Card title="Notification Channels" sub="How you want to receive notifications" T={T}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
          {[
            ["📧 Email",    "Send to registered email",         emailNotifs,  setEmail  ],
            ["💬 WhatsApp", "Send to WhatsApp number",          whatsNotifs,  setWhats  ],
            ["📲 SMS",      "Send SMS to phone number",          smsNotifs,    setSms    ],
            ["🔔 Browser",  "Desktop / browser notifications",  browserNotifs,setBrowser],
          ].map(([label,sub,val,set])=>(
            <label key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"12px 14px", background:val?T.accent+"08":T.bg, borderRadius:"9px", border:`1px solid ${val?T.accent+"25":T.border}` }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:600, color:T.text }}>{label}</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"1px" }}>{sub}</div>
              </div>
              <div onClick={()=>set(p=>!p)}
                style={{ width:"38px", height:"22px", borderRadius:"22px", background:val?T.accent:"#CBD5E1", position:"relative", flexShrink:0, marginLeft:"10px" }}>
                <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:val?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card title="What to Notify Me About" T={T}>
        <Sec title="Orders">
          <Toggle val={newOrder}  set={setNewOrder} label="New Order Placed"               sub="Alert when a new order comes in"                  T={T}/>
          <Toggle val={orderStatus} set={setOrderSt} label="Order Status Changes"          sub="When status is updated by any agent"              T={T}/>
          <Toggle val={payVerify} set={setPayVer}   label="Pending Payment Verification"   sub="bKash TxID needs manual review"                  T={T}/>
          <Toggle val={orderIssue} set={setIssue}   label="Order Issues Flagged"           sub="When an agent flags a problem on an order"        T={T}/>
          <Toggle val={orderCancel} set={setCancel} label="Order Cancelled / Returned"     sub="Customer cancels or returns"                      T={T}/>
        </Sec>
        <Sec title="Inventory">
          <Toggle val={lowStock} set={setLow} label="Low Stock Warning"  sub="Variation drops to 2 or fewer units"  T={T}/>
          <Toggle val={outStock} set={setOut} label="Out of Stock Alert" sub="Variation hits 0 units"                T={T}/>
        </Sec>
        <Sec title="Pre-Orders">
          <Toggle val={preArrive} set={setArrive} label="Pre-Order Arrived in BD" sub="Item marked as arrived Bangladesh"      T={T}/>
          <Toggle val={preDelay}  set={setDelay}  label="Pre-Order Delayed"       sub="When a pre-order is marked as delayed"  T={T}/>
        </Sec>
        <Sec title="Finance">
          <Toggle val={remittance} set={setRemit}  label="Pathao Settlement Received" sub="New COD remittance recorded"              T={T}/>
          <Toggle val={overdue}    set={setOverdue} label="Overdue Remittance Alert"  sub="Orders pending 3+ days without settlement" T={T}/>
        </Sec>
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <SaveBtn T={T}/>
        </div>
      </Card>
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [dark, setDark]       = useState(false);
  const T = dark ? DARK : LIGHT;
  const [nav, setNav]         = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigateByAdminNavLabel("Dashboard");
  };

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>

      {/* Sidebar */}
      <div style={{ width:"236px", background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 15px 13px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"17px", fontWeight:800, color:T.accent, letterSpacing:"0.2px" }}>ShopAdmin</div>
          <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px", fontWeight:600 }}>LADIES FASHION BD</div>
        </div>
        <div style={{ padding:"10px 8px", flex:1 }}>
          {NAV.map(([icon, label], i) => {
            const activeMain = nav===i;
            const activeTeam = window.location.hash === "#/admin/team";
            const activeProfile = window.location.hash === "#/admin/profile";
            return (
              <div key={i}>
                <button onClick={() => { setNav(i); navigateByAdminNavLabel(label); }}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"1px", background:activeMain?T.accent+"18":"transparent", color:activeMain?T.accent:T.textMuted, textAlign:"left" }}>
                  <span style={{ fontSize:"13px", width:"18px", textAlign:"center" }}>{icon}</span>
                  <span style={{ fontSize:"13px", fontWeight:activeMain?700:500 }}>{label}</span>
                </button>
                {label === "Settings" && (activeMain || activeTeam || activeProfile) && (
                  <div style={{ marginLeft:"20px", marginBottom:"5px", display:"flex", flexDirection:"column", gap:"3px" }}>
                    <button onClick={() => navigateByAdminNavLabel("Team")}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 9px", borderRadius:"8px", border:"none", cursor:"pointer", background:activeTeam?T.accent+"18":"transparent", color:activeTeam?T.accent:T.textMuted, textAlign:"left" }}>
                      <span style={{ fontSize:"11px" }}>👥</span>
                      <span style={{ fontSize:"11px", fontWeight:activeTeam?700:500 }}>Team</span>
                    </button>
                    <button onClick={() => navigateByAdminNavLabel("Profile")}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 9px", borderRadius:"8px", border:"none", cursor:"pointer", background:activeProfile?T.accent+"18":"transparent", color:activeProfile?T.accent:T.textMuted, textAlign:"left" }}>
                      <span style={{ fontSize:"11px" }}>👤</span>
                      <span style={{ fontSize:"11px", fontWeight:activeProfile?700:500 }}>Profile</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding:"11px 12px", borderTop:`1px solid ${T.border}` }}>
          <button onClick={() => setDark(!dark)}
            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"8px 10px", cursor:"pointer", color:T.textMid, fontSize:"12px", fontWeight:600, marginBottom:"10px" }}>
            <span>{dark?"🌙 Dark":"☀️ Light"}</span>
            <div style={{ width:"30px", height:"16px", background:dark?"#6366F1":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
              <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"16px":"2px", transition:"left 0.2s" }}/>
            </div>
          </button>
          {/* Sidebar avatar — highlighted since we're on profile */}
          <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"7px", padding:"7px 8px", background:T.accent+"10", border:`1px solid ${T.accent}20`, borderRadius:"8px", cursor:"pointer", textAlign:"left" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>IS</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"12px", fontWeight:700, color:T.accent }}>Istiak Shaharia</div>
              <div style={{ fontSize:"10px", color:T.textMuted }}>Admin · Profile</div>
            </div>
          </button>
          <button onClick={handleSignOut}
            style={{ width:"100%", marginTop:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", background:"#EF444410", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"9px", padding:"9px 10px", cursor:"pointer", fontSize:"12px", fontWeight:700 }}>
            <span>↩</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 22px", flexShrink:0 }}>
          <button onClick={handleBack} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"7px", padding:"5px 12px", fontSize:"12px", color:T.textMuted, cursor:"pointer", marginRight:"12px" }}>← Back</button>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>My Profile</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>Manage your account settings and preferences</div>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Tab sidebar */}
          <div style={{ width:"210px", background:T.sidebar, borderRight:`1px solid ${T.border}`, padding:"14px 10px", flexShrink:0 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"9px", border:"none", cursor:"pointer", marginBottom:"4px", background:activeTab===tab.id?T.accent+"18":"transparent", color:activeTab===tab.id?T.accent:T.textMuted, textAlign:"left", transition:"all 0.1s" }}>
                <span style={{ fontSize:"16px" }}>{tab.icon}</span>
                <span style={{ fontSize:"12px", fontWeight:activeTab===tab.id?700:400 }}>{tab.label}</span>
                {activeTab===tab.id && <div style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:T.accent }}/>}
              </button>
            ))}
            <div style={{ height:"1px", background:T.border, margin:"12px 0" }}/>
            <button onClick={handleSignOut} style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"9px", border:"none", cursor:"pointer", background:"transparent", color:"#DC2626", textAlign:"left" }}>
              <span style={{ fontSize:"16px" }}>🚪</span>
              <span style={{ fontSize:"12px", fontWeight:600 }}>Sign Out</span>
            </button>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflow:"auto", padding:"24px 28px" }}>
            <div style={{ maxWidth:"700px" }}>
              {activeTab === "profile"  && <ProfileTab T={T}/>}
              {activeTab === "password" && <PasswordTab T={T}/>}
              {activeTab === "notifs"   && <NotificationsTab T={T}/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}