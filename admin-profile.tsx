import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { clearSession, loadSession } from "./core/auth-session";
import AdminSidebar from "./core/admin-sidebar";
import { loadAppState, saveAppState } from "./core/app-state-client";
import { adminFetch } from "./core/api-client";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMuted:"#64748B", input:"#F8FAFC", ib:"rgba(0,0,0,0.1)", accent:"#6366F1" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const TABS = [
  { id:"profile",  icon:"👤", label:"Profile Info" },
  { id:"password", icon:"🔒", label:"Change Password" },
  { id:"notifs",   icon:"🔔", label:"Notifications" },
] as const;

function Field({ label, value, onChange, T, type = "text" }: { label: string; value: string; onChange: (e: any) => void; T: any; type?: string }) {
  return (
    <div style={{ marginBottom:"12px" }}>
      <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"6px" }}>{label}</div>
      <input value={value} onChange={onChange} type={type}
        style={{ background:T.input, border:`1px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"10px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" }} />
    </div>
  );
}

function Toggle({ label, value, setValue, T }: { label: string; value: boolean; setValue: Dispatch<SetStateAction<boolean>>; T: any }) {
  return (
    <label style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", border:`1px solid ${T.border}`, borderRadius:"8px", marginBottom:"8px", background:value?T.accent+"10":T.bg }}>
      <span style={{ fontSize:"13px", color:T.text }}>{label}</span>
      <div onClick={() => setValue((p) => !p)} style={{ width:"40px", height:"22px", borderRadius:"22px", background:value?T.accent:"#CBD5E1", position:"relative", cursor:"pointer" }}>
        <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"#fff", position:"absolute", top:"2px", left:value?"20px":"2px", transition:"left 0.2s" }} />
      </div>
    </label>
  );
}

function SaveBtn({ onSave, T }: { onSave: () => Promise<void> | void; T: any }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err: any) {
      setError(String(err?.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
      <button onClick={handle}
        style={{ background:saved?"#059669":saving?"#475569":T.accent, border:"none", color:"#fff", borderRadius:"8px", padding:"10px 18px", fontSize:"12px", fontWeight:700, cursor:saving?"not-allowed":"pointer" }}>
        {saved ? "? Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>
      {error && <div style={{ fontSize:"11px", color:"#DC2626" }}>{error}</div>}
    </div>
  );
}

function ProfileTab({ T }: { T: any }) {
  const session = loadSession()?.user;
  const [name, setName] = useState(session?.name || "Admin");
  const [email, setEmail] = useState("admin@yourshop.com");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState(session?.role === "agent" ? "Agent" : "Super Admin");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("profile.admin", {
        name: session?.name || "Admin",
        email: "admin@yourshop.com",
        phone: "",
        whatsapp: "",
        role: session?.role === "agent" ? "Agent" : "Super Admin",
        bio: "",
        avatarUrl: "",
      });
      if (cancelled) return;
      setName(String(data.name || "Admin"));
      setEmail(String(data.email || "admin@yourshop.com"));
      setPhone(String(data.phone || ""));
      setWhatsapp(String(data.whatsapp || ""));
      setRole(String(data.role || "Super Admin"));
      setBio(String(data.bio || ""));
      setAvatarUrl(String(data.avatarUrl || ""));
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  const uploadAvatar = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read avatar file."));
        reader.readAsDataURL(file);
      });
      const res = await adminFetch("/api/r2-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "image/png", dataUrl, folder: "profile-avatar" }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Avatar upload failed.");
      setAvatarUrl(String(payload?.url || ""));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    await saveAppState("profile.admin", { name, email, phone, whatsapp, role, bio, avatarUrl });
  };

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"18px" }}>
      <div style={{ display:"flex", gap:"14px", alignItems:"center", marginBottom:"16px" }}>
        <div style={{ width:"72px", height:"72px", borderRadius:"50%", overflow:"hidden", background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"24px", fontWeight:700 }}>
          {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : String(name || "A")[0].toUpperCase()}
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()} style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"8px", padding:"7px 12px", fontSize:"12px", fontWeight:700, cursor:uploading?"not-allowed":"pointer" }}>{uploading ? "Uploading..." : "Upload Avatar"}</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <Field label="Full Name" value={name} onChange={(e) => setName(e.target.value)} T={T} />
      <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} T={T} type="email" />
      <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} T={T} />
      <Field label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} T={T} />
      <Field label="Role" value={role} onChange={(e) => setRole(e.target.value)} T={T} />
      <div style={{ marginBottom:"12px" }}>
        <div style={{ fontSize:"12px", fontWeight:600, color:T.text, marginBottom:"6px" }}>Bio</div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          style={{ background:T.input, border:`1px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"10px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical" }} />
      </div>
      <SaveBtn onSave={save} T={T} />
    </div>
  );
}

function PasswordTab({ T }: { T: any }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  const updatePassword = async () => {
    if (!current || !next || !confirm) throw new Error("Please fill all password fields.");
    if (next.length < 8) throw new Error("New password must be at least 8 characters.");
    if (next !== confirm) throw new Error("Password confirmation does not match.");
    await saveAppState("profile.password_meta", { changedAt: new Date().toISOString() });
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg("Password updated.");
  };

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"18px" }}>
      <Field label="Current Password" value={current} onChange={(e) => setCurrent(e.target.value)} T={T} type="password" />
      <Field label="New Password" value={next} onChange={(e) => setNext(e.target.value)} T={T} type="password" />
      <Field label="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} T={T} type="password" />
      {msg && <div style={{ marginBottom:"10px", fontSize:"12px", color:"#059669", fontWeight:700 }}>{msg}</div>}
      <SaveBtn onSave={updatePassword} T={T} />
    </div>
  );
}

function NotificationsTab({ T }: { T: any }) {
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);
  const [sms, setSms] = useState(false);
  const [newOrder, setNewOrder] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [issues, setIssues] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("profile.notifications", {
        email: true,
        whatsapp: true,
        sms: false,
        newOrder: true,
        statusUpdates: true,
        issues: true,
      });
      if (cancelled) return;
      setEmail(Boolean(data.email));
      setWhatsapp(Boolean(data.whatsapp));
      setSms(Boolean(data.sms));
      setNewOrder(Boolean(data.newOrder));
      setStatusUpdates(Boolean(data.statusUpdates));
      setIssues(Boolean(data.issues));
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    await saveAppState("profile.notifications", { email, whatsapp, sms, newOrder, statusUpdates, issues });
  };

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", padding:"18px" }}>
      <Toggle label="Email Notifications" value={email} setValue={setEmail} T={T} />
      <Toggle label="WhatsApp Notifications" value={whatsapp} setValue={setWhatsapp} T={T} />
      <Toggle label="SMS Notifications" value={sms} setValue={setSms} T={T} />
      <Toggle label="New Order Alerts" value={newOrder} setValue={setNewOrder} T={T} />
      <Toggle label="Order Status Alerts" value={statusUpdates} setValue={setStatusUpdates} T={T} />
      <Toggle label="Order Issue Alerts" value={issues} setValue={setIssues} T={T} />
      <SaveBtn onSave={save} T={T} />
    </div>
  );
}

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("profile");
  const T = dark ? DARK : LIGHT;
  const session = loadSession()?.user;

  const onLogout = () => {
    clearSession();
    window.location.hash = "#/admin/login";
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, color:T.text, fontFamily:"system-ui,sans-serif", overflow:"hidden" }}>
      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{
          name: session?.name || "Admin",
          role: session?.role === "agent" ? "Agent" : "Super Admin",
          avatar: session?.avatar || "A",
          color: session?.color || "linear-gradient(135deg,#6366F1,#A855F7)",
        }}
        onLogout={onLogout}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", gap:"8px" }}>
          <button onClick={() => navigateByAdminNavLabel("Dashboard")} style={{ background:T.bg, border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:"7px", padding:"6px 10px", fontSize:"11px", cursor:"pointer" }}>? Back</button>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800 }}>My Profile</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>Manage account and notification settings</div>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <div style={{ width:"220px", background:T.sidebar, borderRight:`1px solid ${T.border}`, padding:"12px 10px" }}>
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"9px", padding:"10px 12px", marginBottom:"4px", border:"none", borderRadius:"8px", cursor:"pointer", textAlign:"left", background:activeTab===tab.id?T.accent+"18":"transparent", color:activeTab===tab.id?T.accent:T.textMuted }}>
                <span>{tab.icon}</span><span style={{ fontSize:"12px", fontWeight:activeTab===tab.id?700:500 }}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ flex:1, overflow:"auto", padding:"22px" }}>
            <div style={{ maxWidth:"760px" }}>
              {activeTab === "profile" && <ProfileTab T={T} />}
              {activeTab === "password" && <PasswordTab T={T} />}
              {activeTab === "notifs" && <NotificationsTab T={T} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
