import { useState, type ReactNode } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import AdminSidebar from "./core/admin-sidebar";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1", tHead:"rgba(255,255,255,0.025)", rowHover:"rgba(255,255,255,0.03)" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1", tHead:"rgba(0,0,0,0.03)", rowHover:"rgba(0,0,0,0.025)" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const ROLES = {
  admin: {
    label:"Admin",
    color:"#6366F1",
    permissions:["View Dashboard","Manage Orders","Manage Products","Manage Customers","View Analytics","Manage Coupons","Manage Settings","Manage Team","View Remittance","Process Refunds"],
  },
  agent: {
    label:"Agent",
    color:"#059669",
    permissions:["View Dashboard","Create Orders","Update Order Status","View Customers","View Products"],
  },
  viewer: {
    label:"Viewer",
    color:"#D97706",
    permissions:["View Dashboard","View Orders","View Products","View Customers"],
  },
};

      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{ name: "Istiak", role: "Admin", avatar: "IS", color: "#6366F1" }}
        onNavigateLabel={(_, i) => setNav(i)}
      />
];

const ALL_PERMISSIONS = [
  ["View Dashboard",       "See revenue, stats and action items"],
  ["Create Orders",        "Create new orders from admin panel"],
  ["Update Order Status",  "Change order status and add notes"],
  ["Manage Orders",        "Full order management incl. delete"],
  ["View Products",        "Browse product catalog"],
  ["Manage Products",      "Add, edit and delete products"],
  ["View Customers",       "View customer list and profiles"],
  ["Manage Customers",     "Edit customer data, flag, blacklist"],
  ["View Analytics",       "Access analytics and reports"],
  ["Manage Coupons",       "Create and manage discount codes"],
  ["View Remittance",      "View COD remittance tracker"],
  ["Manage Settings",      "Change system settings"],
  ["Manage Team",          "Add, remove, change team roles"],
  ["Process Refunds",      "Issue refunds and cancel orders"],
];

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function Avatar({ initials, color, size }) {
  const sz = size || 40;
  return (
    <div style={{ width:sz, height:sz, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:sz*0.32, fontWeight:800, flexShrink:0, letterSpacing:"0.5px" }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role, T }) {
  const r = ROLES[role];
  return <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:r.color+"18", color:r.color }}>{r.label}</span>;
}

function StatusDot({ status }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:status==="active"?"#059669":"#64748B" }}/>
      <span style={{ fontSize:"11px", color:status==="active"?"#059669":"#64748B", fontWeight:600 }}>{status==="active"?"Active":"Inactive"}</span>
    </div>
  );
}

function SL({ c, T, req }) {
  return <div style={{ fontSize:"11px", fontWeight:600, color:T.text, marginBottom:"5px" }}>{c}{req&&<span style={{ color:"#EF4444", marginLeft:"3px" }}>*</span>}</div>;
}

function Inp({ value, onChange, placeholder = "", T, type = "text" }: { value: any; onChange: (e: any) => void; placeholder?: string; T: any; type?: string }) {
  const [f,setF] = useState(false);
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"12px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" }}/>;
}

type TeamMember = (typeof INIT_TEAM)[number];

// ── MEMBER DETAIL PANEL ───────────────────────────────────────────────────
function MemberPanel({ member, onClose, onUpdate, onRemove, T }) {
  const [role,   setRole]   = useState(member.role);
  const [status, setStatus] = useState(member.status);
  const [saved,  setSaved]  = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showResetConfirm,  setShowResetConfirm]  = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const save = () => {
    onUpdate({ ...member, role, status });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const roleInfo = ROLES[role];

  return (
    <div style={{ width:"380px", background:T.sidebar, borderLeft:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      {/* Header */}
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Team Member</span>
        <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer" }}>✕</button>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"18px" }}>

        {/* Identity */}
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"18px", padding:"14px", background:T.bg, borderRadius:"10px" }}>
          <Avatar initials={member.avatar} color={member.avatarColor} size={52}/>
          <div>
            <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"3px" }}>{member.name}</div>
            <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"5px" }}>📧 {member.email}</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>📞 {member.phone}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"16px" }}>
          {[
            ["Total Orders",   member.ordersHandled,                              T.accent],
            ["This Month",     member.ordersThisMonth,                            "#0D9488"],
            ["Revenue (Month)","৳"+member.revenueThisMonth.toLocaleString(),     "#059669"],
            ["Avg Response",   member.avgResponseTime,                            "#D97706"],
          ].map(([label,val,color]) => (
            <div key={label} style={{ background:T.bg, borderRadius:"8px", padding:"10px 12px" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:"4px" }}>{label}</div>
              <div style={{ fontSize:"16px", fontWeight:800, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Role */}
        <div style={{ marginBottom:"14px" }}>
          <SL c="Role" T={T} req/>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {Object.entries(ROLES).map(([id, r]) => (
              <div key={id} onClick={() => setRole(id)}
                style={{ padding:"11px 13px", borderRadius:"9px", border:`2px solid ${role===id?r.color:T.border}`, background:role===id?r.color+"10":T.bg, cursor:"pointer", transition:"all 0.12s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" }}>
                  <span style={{ fontSize:"13px", fontWeight:700, color:role===id?r.color:T.text }}>{r.label}</span>
                  <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:`2px solid ${role===id?r.color:T.border}`, background:role===id?r.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {role===id && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#fff" }}/>}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
                  {r.permissions.slice(0,4).map(p => (
                    <span key={p} style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"3px", background:role===id?r.color+"15":T.tHead, color:role===id?r.color:T.textMuted }}>✓ {p}</span>
                  ))}
                  {r.permissions.length > 4 && (
                    <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"3px", color:T.textMuted }}>+{r.permissions.length-4} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status toggle */}
        <div style={{ marginBottom:"16px" }}>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"10px 13px", background:status==="active"?"#05996910":T.bg, borderRadius:"9px", border:`1px solid ${status==="active"?"#05996930":T.border}` }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>Account Active</div>
              <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>Inactive members cannot log in</div>
            </div>
            <div onClick={() => setStatus(p => p==="active"?"inactive":"active")}
              style={{ width:"38px", height:"22px", borderRadius:"22px", background:status==="active"?"#059669":"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ width:"18px", height:"18px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:status==="active"?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
            </div>
          </label>
        </div>

        <button onClick={save}
          style={{ width:"100%", background:saved?"#059669":T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px", fontSize:"13px", fontWeight:700, cursor:"pointer", marginBottom:"14px", transition:"background 0.2s" }}>
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>

        {/* Danger zone */}
        <div style={{ border:`1px solid #EF444430`, borderRadius:"10px", padding:"14px", marginBottom:"16px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#DC2626", marginBottom:"10px" }}>⚠ Danger Zone</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {/* Reset password */}
            {!showResetConfirm ? (
              <button onClick={() => setShowResetConfirm(true)}
                style={{ background:"transparent", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"7px", padding:"9px 14px", fontSize:"12px", fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                🔑 Send Password Reset Link
              </button>
            ) : resetDone ? (
              <div style={{ padding:"9px 14px", background:"#05996910", borderRadius:"7px", fontSize:"12px", color:"#059669", fontWeight:600 }}>
                ✓ Reset link sent to {member.email}
              </div>
            ) : (
              <div style={{ background:"#EF444410", borderRadius:"7px", padding:"10px 12px" }}>
                <div style={{ fontSize:"11px", color:"#DC2626", marginBottom:"8px" }}>Send reset link to {member.email}?</div>
                <div style={{ display:"flex", gap:"7px" }}>
                  <button onClick={() => { setShowResetConfirm(false); }} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"7px", fontSize:"11px", cursor:"pointer" }}>Cancel</button>
                  <button onClick={() => { setResetDone(true); setShowResetConfirm(false); }} style={{ flex:1, background:"#EF4444", border:"none", color:"#fff", borderRadius:"6px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Send Link</button>
                </div>
              </div>
            )}

            {/* Remove member */}
            {!showRemoveConfirm ? (
              <button onClick={() => setShowRemoveConfirm(true)}
                style={{ background:"transparent", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"7px", padding:"9px 14px", fontSize:"12px", fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                🗑 Remove from Team
              </button>
            ) : (
              <div style={{ background:"#EF444410", borderRadius:"7px", padding:"10px 12px" }}>
                <div style={{ fontSize:"11px", color:"#DC2626", marginBottom:"8px" }}>Remove {member.name} from the team? They will lose all access.</div>
                <div style={{ display:"flex", gap:"7px" }}>
                  <button onClick={() => setShowRemoveConfirm(false)} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"7px", fontSize:"11px", cursor:"pointer" }}>Cancel</button>
                  <button onClick={() => { onRemove(member.id); }} style={{ flex:1, background:"#EF4444", border:"none", color:"#fff", borderRadius:"6px", padding:"7px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Remove</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>Recent Activity</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            {member.recentActivity.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:"10px", padding:"8px 0", borderBottom:i<member.recentActivity.length-1?`1px solid ${T.border}`:"none" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:T.accent, flexShrink:0, marginTop:"5px" }}/>
                <div>
                  <div style={{ fontSize:"12px", color:T.text }}>{a.action}</div>
                  <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px" }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INVITE MODAL ─────────────────────────────────────────────────────────
function InviteModal({ onInvite, onClose, T }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role,  setRole]  = useState("agent");
  const [done,  setDone]  = useState(false);

  const canSend = name.trim() && email.trim() && phone.trim();

  const handle = () => {
    if (!canSend) return;
    const initials = name.trim().split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
    const colors   = ["#6366F1","#059669","#D97706","#0D9488","#A855F7"];
    onInvite({
      id: "t"+Date.now(), name:name.trim(), email:email.trim(), phone:phone.trim(),
      role, status:"active", joinedAt:"17 Apr 2025", lastActive:"Never",
      ordersHandled:0, ordersThisMonth:0, revenueThisMonth:0, avgResponseTime:"—",
      avatar:initials, avatarColor:colors[Math.floor(Math.random()*colors.length)],
      recentActivity:[{ action:"Account created", time:"17 Apr, just now" }],
    });
    setDone(true);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} onClick={onClose}/>
      <div style={{ position:"relative", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"14px", width:"460px", maxWidth:"95vw", zIndex:1, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.3)" }}>

        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"14px", fontWeight:800, color:T.text }}>Add Team Member</span>
          <button onClick={onClose} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"6px", padding:"4px 9px", cursor:"pointer" }}>✕</button>
        </div>

        {done ? (
          <div style={{ padding:"40px 30px", textAlign:"center" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:T.text, marginBottom:"6px" }}>Invitation Sent!</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginBottom:"20px" }}>A login link has been sent to <strong>{email}</strong>. They can set their password and start using the system.</div>
            <button onClick={onClose} style={{ background:T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"10px 26px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding:"20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
              <div style={{ gridColumn:"1/-1" }}>
                <SL c="Full Name" T={T} req/>
                <Inp value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Nadia Islam" T={T}/>
              </div>
              <div>
                <SL c="Email Address" T={T} req/>
                <Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="nadia@gmail.com" T={T} type="email"/>
              </div>
              <div>
                <SL c="Phone Number" T={T} req/>
                <Inp value={phone} onChange={e=>setPhone(e.target.value)} placeholder="01XXXXXXXXX" T={T}/>
              </div>
            </div>

            <div style={{ marginBottom:"16px" }}>
              <SL c="Role" T={T} req/>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                {Object.entries(ROLES).map(([id, r]) => (
                  <div key={id} onClick={() => setRole(id)}
                    style={{ padding:"10px 13px", borderRadius:"9px", border:`2px solid ${role===id?r.color:T.border}`, background:role===id?r.color+"10":T.bg, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:700, color:role===id?r.color:T.text }}>{r.label}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"2px" }}>{r.permissions.slice(0,3).join(", ")}{r.permissions.length>3?" & more":""}</div>
                    </div>
                    <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:`2px solid ${role===id?r.color:T.border}`, background:role===id?r.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {role===id && <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#fff" }}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:"10px 13px", background:T.bg, borderRadius:"8px", marginBottom:"16px", fontSize:"11px", color:T.textMuted }}>
              📧 An invitation email with login instructions will be sent to the address above.
            </div>

            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={onClose} style={{ flex:1, background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handle} disabled={!canSend}
                style={{ flex:2, background:canSend?T.accent:T.bg, border:`1px solid ${canSend?T.accent:T.border}`, color:canSend?"#fff":T.textMuted, borderRadius:"9px", padding:"10px", fontSize:"13px", fontWeight:700, cursor:canSend?"pointer":"not-allowed" }}>
                ✉ Send Invitation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PERMISSIONS TABLE ─────────────────────────────────────────────────────
function PermissionsTable({ T }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:T.text }}>Role Permissions</div>
        <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>What each role can do in the system</div>
      </div>
      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 90px", padding:"9px 16px", background:T.tHead, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ fontSize:"12px", fontWeight:700, color:T.textMuted, textTransform:"uppercase" }}>Permission</div>
        {Object.values(ROLES).map(r => (
          <div key={r.label} style={{ fontSize:"12px", fontWeight:700, color:r.color, textTransform:"uppercase", textAlign:"center" }}>{r.label}</div>
        ))}
      </div>
      {ALL_PERMISSIONS.map(([perm, desc], i) => (
        <div key={perm} style={{ display:"grid", gridTemplateColumns:"1fr 90px 90px 90px", padding:"9px 16px", borderBottom:i<ALL_PERMISSIONS.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}
          onMouseEnter={e=>e.currentTarget.style.background=T.rowHover}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div>
            <div style={{ fontSize:"12px", fontWeight:600, color:T.text }}>{perm}</div>
            <div style={{ fontSize:"10px", color:T.textMuted }}>{desc}</div>
          </div>
          {Object.values(ROLES).map(r => (
            <div key={r.label} style={{ textAlign:"center" }}>
              {r.permissions.includes(perm)
                ? <span style={{ fontSize:"14px", color:r.color }}>✓</span>
                : <span style={{ fontSize:"14px", color:T.border }}>—</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [dark, setDark]         = useState(false);
  const T = dark ? DARK : LIGHT;
  const [nav, setNav]           = useState(10);
  const [team, setTeam]         = useState(INIT_TEAM);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [tab, setTab]           = useState("members"); // members | permissions

  const handleUpdate = (updated) => {
    setTeam(p => p.map(m => m.id === updated.id ? updated : m));
    setSelected(updated);
  };

  const handleRemove = (id) => {
    setTeam(p => p.filter(m => m.id !== id));
    setSelected(null);
  };

  const handleInvite = (newMember) => {
    setTeam(p => [...p, newMember]);
    setShowInvite(false);
  };

  const active   = team.filter(m => m.status==="active").length;
  const inactive = team.filter(m => m.status==="inactive").length;

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>

      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{ name: "Istiak", role: "Admin", avatar: "IS", color: "#6366F1" }}
        onNavigateLabel={(_, i) => setNav(i)}
      />

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>Team Management</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>{active} active · {inactive} inactive · {team.length} total</div>
          </div>
          <button onClick={() => setShowInvite(true)}
            style={{ background:T.accent, color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"7px" }}>
            + Add Team Member
          </button>
        </div>

        {/* Content + optional panel */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }}>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"3px", background:T.surface, borderRadius:"9px", padding:"3px", border:`1px solid ${T.border}`, width:"fit-content", marginBottom:"16px" }}>
              {[["members","👥 Members"],["permissions","🔐 Role Permissions"]].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ padding:"7px 18px", borderRadius:"7px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:700, background:tab===id?T.accent+"20":"transparent", color:tab===id?T.accent:T.textMuted }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Members tab */}
            {tab === "members" && (
              <>
                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"16px" }}>
                  {([
                    ["Team Size",      team.length,      "#6366F1","👥"],
                    ["Active",         active,            "#059669","🟢"],
                    ["Orders (Month)", team.reduce((a,b)=>a+b.ordersThisMonth,0), "#0D9488","📦"],
                    ["Revenue (Month)","৳"+team.reduce((a,b)=>a+b.revenueThisMonth,0).toLocaleString(), "#D97706","💰"],
                  ] as Array<[string, ReactNode, string, string]>).map(([label,val,color,icon]) => (
                    <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"14px 16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                        <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.4px" }}>{label}</div>
                        <span style={{ fontSize:"16px" }}>{icon}</span>
                      </div>
                      <div style={{ fontSize:"22px", fontWeight:800, color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Member cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"12px" }}>
                  {team.map(member => {
                    const r = ROLES[member.role];
                    const isSelected = selected?.id === member.id;
                    return (
                      <div key={member.id} onClick={() => setSelected(isSelected ? null : member)}
                        style={{ background:T.surface, border:`1.5px solid ${isSelected?r.color:T.border}`, borderRadius:"12px", padding:"16px", cursor:"pointer", transition:"border-color 0.15s" }}
                        onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.borderColor=r.color+"60"; }}
                        onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.borderColor=T.border; }}>

                        {/* Top row */}
                        <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"12px" }}>
                          <div style={{ position:"relative" }}>
                            <Avatar initials={member.avatar} color={member.avatarColor} size={44}/>
                            <div style={{ position:"absolute", bottom:"1px", right:"1px", width:"11px", height:"11px", borderRadius:"50%", background:member.status==="active"?"#059669":"#64748B", border:`2px solid ${T.surface}` }}/>
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"14px", fontWeight:800, color:T.text, marginBottom:"3px" }}>{member.name}</div>
                            <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                              <RoleBadge role={member.role} T={T}/>
                              <StatusDot status={member.status}/>
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div style={{ marginBottom:"12px" }}>
                          <div style={{ fontSize:"11px", color:T.textMuted, marginBottom:"2px" }}>📧 {member.email}</div>
                          <div style={{ fontSize:"11px", color:T.textMuted }}>📞 {member.phone}</div>
                        </div>

                        {/* Stats mini */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"12px" }}>
                          {[["Orders",member.ordersThisMonth+" mo",T.accent],["Revenue","৳"+(member.revenueThisMonth/1000).toFixed(0)+"k","#059669"],["Resp.",member.avgResponseTime,"#D97706"]].map(([l,v,c])=>(
                            <div key={l} style={{ background:T.bg, borderRadius:"7px", padding:"7px 9px" }}>
                              <div style={{ fontSize:"10px", color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.3px", marginBottom:"2px" }}>{l}</div>
                              <div style={{ fontSize:"13px", fontWeight:800, color:c }}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Last active */}
                        <div style={{ fontSize:"10px", color:T.textMuted }}>
                          🕐 Last active: <span style={{ color:T.textMid, fontWeight:600 }}>{member.lastActive}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add member card */}
                  <div onClick={() => setShowInvite(true)}
                    style={{ background:T.surface, border:`2px dashed ${T.border}`, borderRadius:"12px", padding:"16px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"180px", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accent+"06";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surface;}}>
                    <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:T.accent+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", marginBottom:"10px" }}>+</div>
                    <div style={{ fontSize:"13px", fontWeight:700, color:T.accent, marginBottom:"4px" }}>Add Team Member</div>
                    <div style={{ fontSize:"11px", color:T.textMuted, textAlign:"center" }}>Invite a new agent or admin</div>
                  </div>
                </div>
              </>
            )}

            {/* Permissions tab */}
            {tab === "permissions" && <PermissionsTable T={T}/>}

          </div>

          {/* Member detail panel */}
          {selected && tab==="members" && (
            <MemberPanel
              key={selected.id}
              member={team.find(m=>m.id===selected.id)||selected}
              onClose={() => setSelected(null)}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              T={T}
            />
          )}
        </div>
      </div>

      {showInvite && <InviteModal onInvite={handleInvite} onClose={() => setShowInvite(false)} T={T}/>}
    </div>
  );
}









