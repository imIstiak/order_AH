import { useMemo, useState } from "react";
import { clearSession, loadSession } from "./core/auth-session";
import { navigateByAdminNavLabel } from "./core/nav-routes";

const DARK = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", accent:"#059669" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#F8FAFC", accent:"#059669" };

const NAV: Array<[string, string]> = [["▦", "Dashboard"], ["≡", "Orders"], ["+", "New Order"], ["◉", "Customers"], ["⬡", "Products"], ["👤", "Profile"]];

export default function AgentProfilePage() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;
  const [nav, setNav] = useState(5);

  const user = useMemo(() => {
    const sessionUser = loadSession()?.user;
    return {
      name: sessionUser?.name || "Agent User",
      email: sessionUser?.email || "agent@example.com",
      role: sessionUser?.role === "agent" ? "Agent" : "User",
      avatar: sessionUser?.avatar || "AG",
      color: sessionUser?.color || "#059669",
    };
  }, []);

  const handleSignOut = () => {
    clearSession();
    window.location.hash = "#/admin/login";
    window.dispatchEvent(new Event("hashchange"));
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>
      <div style={{ width:"236px", background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"18px 15px 13px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:"17px", fontWeight:800, color:T.accent, letterSpacing:"0.2px" }}>ShopAdmin</div>
          <div style={{ fontSize:"10px", color:T.textMuted, marginTop:"1px" }}>AGENT WORKSPACE</div>
        </div>

        <div style={{ padding:"10px 8px", flex:1 }}>
          {NAV.map(([icon, label], i) => (
            <button
              key={label}
              onClick={() => {
                setNav(i);
                navigateByAdminNavLabel(label);
              }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", border:"none", cursor:"pointer", marginBottom:"1px", background:nav===i?T.accent+"18":"transparent", color:nav===i?T.accent:T.textMuted, textAlign:"left" }}
            >
              <span style={{ fontSize:"13px", width:"18px", textAlign:"center" }}>{icon}</span>
              <span style={{ fontSize:"13px", fontWeight:nav===i?700:500 }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding:"11px 12px", borderTop:`1px solid ${T.border}` }}>
          <button
            onClick={() => setDark(!dark)}
            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bg, border:`1px solid ${T.border}`, borderRadius:"9px", padding:"8px 10px", cursor:"pointer", color:T.textMid, fontSize:"12px", fontWeight:600, marginBottom:"10px" }}
          >
            <span>{dark ? "🌙 Dark" : "☀️ Light"}</span>
            <div style={{ width:"30px", height:"16px", background:dark?"#059669":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
              <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"16px":"2px", transition:"left 0.2s" }} />
            </div>
          </button>

          <button onClick={() => navigateByAdminNavLabel("Profile")} style={{ width:"100%", display:"flex", alignItems:"center", gap:"7px", background:"transparent", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:user.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:700 }}>
              {user.avatar}
            </div>
            <div>
              <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{user.name}</div>
              <div style={{ fontSize:"10px", color:T.textMuted }}>{user.role} - Profile</div>
            </div>
          </button>

          <button onClick={handleSignOut}
            style={{ width:"100%", marginTop:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", background:"#EF444410", border:"1px solid #EF444430", color:"#DC2626", borderRadius:"9px", padding:"9px 10px", cursor:"pointer", fontSize:"12px", fontWeight:700 }}>
            <span>↩</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"22px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
          <div>
            <div style={{ fontSize:"20px", fontWeight:800, color:T.text }}>My Agent Profile</div>
            <div style={{ fontSize:"12px", color:T.textMuted, marginTop:"3px" }}>Manage your account and sign out safely.</div>
          </div>
          <button onClick={() => navigateByAdminNavLabel("Dashboard")} style={{ background:T.surface, color:T.textMid, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"8px 12px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
            Back to Dashboard
          </button>
        </div>

        <div style={{ maxWidth:"760px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"18px 20px", marginBottom:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:user.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"18px" }}>{user.avatar}</div>
            <div>
              <div style={{ fontSize:"18px", fontWeight:800, color:T.text }}>{user.name}</div>
              <div style={{ fontSize:"12px", color:T.textMid }}>{user.email}</div>
              <div style={{ display:"inline-flex", marginTop:"6px", fontSize:"12px", fontWeight:700, color:"#059669", background:"#05966918", border:"1px solid #05966930", borderRadius:"999px", padding:"3px 10px" }}>{user.role}</div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"10px 12px" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase" }}>Access</div>
              <div style={{ fontSize:"12px", color:T.text, marginTop:"4px" }}>Orders, Customers, New Order, Products</div>
            </div>
            <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"10px 12px" }}>
              <div style={{ fontSize:"10px", color:T.textMuted, fontWeight:700, textTransform:"uppercase" }}>Security</div>
              <div style={{ fontSize:"12px", color:T.text, marginTop:"4px" }}>Use Sign Out when ending your shift</div>
            </div>
          </div>

          <button onClick={handleSignOut} style={{ background:"#DC2626", border:"none", color:"#fff", borderRadius:"8px", padding:"10px 16px", fontSize:"13px", fontWeight:700, cursor:"pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
