import { useEffect, useState, type CSSProperties } from "react";
import { clearSession, loadSession, saveSession } from "./core/auth-session";
import { getDashboardHashByRole } from "./core/nav-routes";

const DARK  = { bg:"#0D0F14", surface:"#161820", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#FFFFFF", ib:"rgba(0,0,0,0.1)", accent:"#6366F1" };

// Mock credentials — in real system these come from DB
type RoleId = "admin" | "agent" | "product-uploader";

type Account = {
  email: string;
  password: string;
  name: string;
  role: RoleId;
  avatar: string;
  color: string;
};

const ACCOUNTS: Account[] = [
  { email:"istiakshaharia77@gmail.com", password:"admin123", name:"Istiak Shaharia", role:"admin",  avatar:"IS", color:"#6366F1" },
  { email:"rafi.ahmed@gmail.com",       password:"agent123", name:"Rafi Ahmed",      role:"agent",  avatar:"RA", color:"#059669" },
  { email:"mitu.akter@gmail.com",       password:"agent123", name:"Mitu Akter",      role:"agent",  avatar:"MA", color:"#D97706" },
  { email:"uploader@shopadmin.com",      password:"upload123", name:"Product Uploader", role:"product-uploader", avatar:"PU", color:"#0EA5E9" },
];

const ROLE_INFO: Record<RoleId, { label: string; color: string; icon: string; access: string }> = {
  admin: { label:"Admin",  color:"#6366F1", icon:"🛡️", access:"Full access — all pages" },
  agent: { label:"Agent",  color:"#059669", icon:"👤", access:"Orders, customers, create orders" },
  "product-uploader": { label:"Product Uploader", color:"#0EA5E9", icon:"🧾", access:"Products only — full upload/edit access" },
};

const LOGIN_GUARD_KEY = "shopadmin.login.guard.v1";
const MAX_FAILED_ATTEMPTS = 5;
const CAPTCHA_AFTER = 3;
const LOCK_MINUTES = 10;

// ── SCREENS ───────────────────────────────────────────────────────────────
// screen: "login" | "forgot" | "reset_sent" | "success"

export default function LoginPage() {
  const isLocal = typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname);
  const [dark,      setDark]      = useState(false);
  const T = dark ? DARK : LIGHT;
  const [screen,    setScreen]    = useState<"login" | "forgot" | "reset_sent" | "success">("login");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [loggedIn,  setLoggedIn]  = useState<Account | null>(null); // account object after login
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErr,   setForgotErr]   = useState("");
  const [emailFocus,  setEmailFocus]  = useState(false);
  const [passFocus,   setPassFocus]   = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");

  const refreshCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaInput("");
  };

  useEffect(() => {
    const session = loadSession();
    if (!session || !session.user || !session.user.email) {
      return;
    }

    const sessionEmail = session.user.email;
    if (!sessionEmail) {
      clearSession();
      return;
    }

    const existingAccount = ACCOUNTS.find(
      (account) => account.email.toLowerCase() === sessionEmail.toLowerCase()
    );

    if (!existingAccount) {
      clearSession();
      return;
    }

    window.location.hash = getDashboardHashByRole(existingAccount.role);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGIN_GUARD_KEY);
      if (!raw) {
        refreshCaptcha();
        return;
      }
      const parsed = JSON.parse(raw);
      setFailedAttempts(Number(parsed.failedAttempts) || 0);
      setLockedUntil(Number(parsed.lockedUntil) || 0);
      refreshCaptcha();
    } catch {
      refreshCaptcha();
    }
  }, []);

  const persistGuard = (nextFailedAttempts: number, nextLockedUntil: number) => {
    setFailedAttempts(nextFailedAttempts);
    setLockedUntil(nextLockedUntil);
    try {
      localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify({ failedAttempts: nextFailedAttempts, lockedUntil: nextLockedUntil }));
    } catch {
      // Ignore storage runtime errors.
    }
  };

  // Detect role as user types email
  const matchedAccount = ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
  const detectedRole   = matchedAccount ? ROLE_INFO[matchedAccount.role] : null;

  const handleLogin = () => {
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const now = Date.now();
    if (lockedUntil > now) {
      const remainingMinutes = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
      setError(`Too many failed attempts. Try again in ${remainingMinutes} minute(s).`);
      return;
    }

    if (failedAttempts >= CAPTCHA_AFTER) {
      const expected = captchaA + captchaB;
      if (parseInt(captchaInput, 10) !== expected) {
        setError("Please solve the security check correctly.");
        refreshCaptcha();
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      const account = ACCOUNTS.find(a => a.email.toLowerCase()===normalizedEmail && a.password===password);
      if (account) {
        if (remember) {
          saveSession({
            user: {
              email: account.email,
              name: account.name,
              role: account.role,
              avatar: account.avatar,
              color: account.color,
            },
            createdAt: new Date().toISOString(),
          }, true);
        } else {
          saveSession({
            user: {
              email: account.email,
              name: account.name,
              role: account.role,
              avatar: account.avatar,
              color: account.color,
            },
            createdAt: new Date().toISOString(),
          }, false);
        }
        persistGuard(0, 0);
        refreshCaptcha();
        setLoggedIn(account);
        window.location.hash = getDashboardHashByRole(account.role);
      } else {
        const nextFailed = failedAttempts + 1;
        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          const nextLockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
          persistGuard(0, nextLockedUntil);
          setError(`Too many failed attempts. Login is locked for ${LOCK_MINUTES} minutes.`);
        } else {
          persistGuard(nextFailed, 0);
          const attemptsLeft = MAX_FAILED_ATTEMPTS - nextFailed;
          setError(`Incorrect email or password. ${attemptsLeft} attempt(s) left.`);
        }
        refreshCaptcha();
      }
      setLoading(false);
    }, 1200);
  };

  const handleForgot = () => {
    setForgotErr("");
    if (!forgotEmail.trim()) { setForgotErr("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim().toLowerCase())) { setForgotErr("Please enter a valid email address."); return; }
    const exists = ACCOUNTS.find(a => a.email.toLowerCase()===forgotEmail.toLowerCase().trim());
    if (!exists) { setForgotErr("No account found with this email address."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setScreen("reset_sent"); }, 1000);
  };

  const IS = (focused: boolean): CSSProperties => ({
    background:T.input, border:`1.5px solid ${focused?T.accent:T.ib}`, borderRadius:"10px",
    color:T.text, padding:"12px 14px", fontSize:"14px", outline:"none",
    width:"100%", boxSizing:"border-box", fontFamily:"inherit",
  });

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (screen === "success" && loggedIn) {
    const role = ROLE_INFO[loggedIn.role];
    const dashboardHash = getDashboardHashByRole(loggedIn.role);
    return (
      <div style={{ minHeight:"100vh", background:dark?"#0D0F14":"linear-gradient(160deg,#EEF2FF 0%,#F1F5F9 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"20px", padding:"44px 40px", width:"400px", maxWidth:"94vw", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.1)" }}>
          <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:loggedIn.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"24px", fontWeight:800, margin:"0 auto 18px", boxShadow:`0 8px 24px ${loggedIn.color}40` }}>
            {loggedIn.avatar}
          </div>
          <div style={{ fontSize:"12px", fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>Welcome back</div>
          <div style={{ fontSize:"22px", fontWeight:800, color:T.text, marginBottom:"6px" }}>{loggedIn.name}</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:role.color+"15", border:`1px solid ${role.color}30`, borderRadius:"20px", padding:"5px 14px", marginBottom:"24px" }}>
            <span style={{ fontSize:"14px" }}>{role.icon}</span>
            <span style={{ fontSize:"12px", fontWeight:700, color:role.color }}>{role.label}</span>
            <span style={{ fontSize:"11px", color:T.textMuted }}>· {role.access}</span>
          </div>
          <div style={{ height:"1px", background:T.border, marginBottom:"24px" }}/>
          <button onClick={() => { window.location.hash = dashboardHash; }} style={{ width:"100%", background:T.accent, border:"none", color:"#fff", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:800, cursor:"pointer", marginBottom:"12px" }}>
            Go to Dashboard →
          </button>
          <button onClick={() => { clearSession(); setScreen("login"); setLoggedIn(null); setEmail(""); setPassword(""); }}
            style={{ background:"transparent", border:"none", color:T.textMuted, fontSize:"12px", cursor:"pointer" }}>
            Not {loggedIn.name.split(" ")[0]}? Sign in as different user
          </button>
        </div>
      </div>
    );
  }

  // ── RESET SENT SCREEN ───────────────────────────────────────────────────
  if (screen === "reset_sent") {
    return (
      <div style={{ minHeight:"100vh", background:dark?"#0D0F14":"linear-gradient(160deg,#EEF2FF 0%,#F1F5F9 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"20px", padding:"44px 40px", width:"400px", maxWidth:"94vw", textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>📧</div>
          <div style={{ fontSize:"20px", fontWeight:800, color:T.text, marginBottom:"8px" }}>Check Your Email</div>
          <div style={{ fontSize:"13px", color:T.textMuted, lineHeight:"1.7", marginBottom:"28px" }}>
            We sent a password reset link to<br/>
            <strong style={{ color:T.text }}>{forgotEmail}</strong><br/>
            Click the link in the email to reset your password.
          </div>
          <div style={{ padding:"12px 16px", background:T.accent+"08", border:`1px solid ${T.accent}20`, borderRadius:"10px", fontSize:"12px", color:T.textMuted, marginBottom:"24px", lineHeight:"1.6" }}>
            Didn't receive the email? Check your spam folder or contact your admin.
          </div>
          <button onClick={() => { setScreen("login"); setForgotEmail(""); }}
            style={{ width:"100%", background:T.accent, border:"none", color:"#fff", borderRadius:"12px", padding:"13px", fontSize:"14px", fontWeight:700, cursor:"pointer" }}>
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── FORGOT PASSWORD SCREEN ──────────────────────────────────────────────
  if (screen === "forgot") {
    return (
      <div style={{ minHeight:"100vh", background:dark?"#0D0F14":"linear-gradient(160deg,#EEF2FF 0%,#F1F5F9 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"20px", padding:"44px 40px", width:"420px", maxWidth:"94vw", boxShadow:"0 24px 64px rgba(0,0,0,0.1)" }}>
          <button onClick={() => setScreen("login")} style={{ background:"transparent", border:"none", color:T.textMuted, fontSize:"13px", cursor:"pointer", padding:0, marginBottom:"20px", display:"flex", alignItems:"center", gap:"5px" }}>
            ← Back to login
          </button>
          <div style={{ fontSize:"24px", fontWeight:800, color:T.text, marginBottom:"6px" }}>Reset Password</div>
          <div style={{ fontSize:"13px", color:T.textMuted, marginBottom:"28px", lineHeight:"1.6" }}>
            Enter your email address and we'll send you a link to reset your password.
          </div>

          <div style={{ marginBottom:"16px" }}>
            <label style={{ fontSize:"12px", fontWeight:600, color:T.text, display:"block", marginBottom:"7px" }}>Email Address</label>
            <input value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="your@email.com"
              onKeyDown={e=>e.key==="Enter"&&handleForgot()} type="email"
              style={{ ...IS(false), fontSize:"14px" }}/>
            {forgotErr && <div style={{ fontSize:"12px", color:"#DC2626", marginTop:"6px" }}>⚠ {forgotErr}</div>}
          </div>

          <button onClick={handleForgot} disabled={loading}
            style={{ width:"100%", background:loading?"#CBD5E1":T.accent, border:"none", color:loading?"#94A3B8":"#fff", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </div>
      </div>
    );
  }

  // ── LOGIN SCREEN ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:dark?"#0D0F14":"linear-gradient(160deg,#EEF2FF 0%,#F1F5F9 100%)", display:"flex", fontFamily:"system-ui,sans-serif", position:"relative" }}>

      {/* Dark mode toggle */}
      <button onClick={() => setDark(!dark)}
        style={{ position:"absolute", top:"20px", right:"20px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"8px", padding:"7px 12px", cursor:"pointer", color:T.textMid, fontSize:"12px", fontWeight:600, display:"flex", alignItems:"center", gap:"7px", zIndex:10 }}>
        <span>{dark?"🌙":"☀️"}</span>
        <div style={{ width:"28px", height:"16px", background:dark?"#6366F1":"#CBD5E1", borderRadius:"16px", position:"relative" }}>
          <div style={{ width:"12px", height:"12px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:dark?"14px":"2px", transition:"left 0.2s" }}/>
        </div>
      </button>

      {/* Left panel — branding */}
      <div style={{ flex:1, background:dark?"#111318":"linear-gradient(160deg,#6366F1 0%,#4F46E5 100%)", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px", position:"relative", overflow:"hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:"-80px", right:"-80px", width:"320px", height:"320px", borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
        <div style={{ position:"absolute", bottom:"-60px", left:"-60px", width:"260px", height:"260px", borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:"32px", fontWeight:900, color:"#fff", marginBottom:"8px", letterSpacing:"-0.5px" }}>
            ShopAdmin
          </div>
          <div style={{ fontSize:"15px", color:"rgba(255,255,255,0.7)", marginBottom:"48px" }}>
            Ladies Fashion BD — Admin Panel
          </div>

          {/* Feature list */}
          {[
            ["📦","Order Management","Create, track and manage all orders in one place"],
            ["🛍️","Product Catalog","Manage products, stock levels, pricing and photos"],
            ["📊","Revenue Dashboard","Track COD, remittance, revenue and profit daily"],
            ["🚴","Pathao Integration","Auto-create shipments and track settlements"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display:"flex", gap:"14px", marginBottom:"22px" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{icon}</div>
              <div>
                <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"3px" }}>{title}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", lineHeight:"1.5" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ width:"480px", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", flexShrink:0 }}>
        <div style={{ width:"100%", maxWidth:"380px" }}>

          {/* Logo */}
          <div style={{ marginBottom:"36px" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px", boxShadow:"0 8px 20px rgba(99,102,241,0.35)" }}>
              <span style={{ fontSize:"22px" }}>🛍️</span>
            </div>
            <div style={{ fontSize:"26px", fontWeight:800, color:T.text, marginBottom:"6px", letterSpacing:"-0.5px" }}>Welcome back</div>
            <div style={{ fontSize:"14px", color:T.textMuted }}>Sign in to your admin account</div>
          </div>

          {/* Role preview — appears when email matches */}
          {detectedRole && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:detectedRole.color+"10", border:`1px solid ${detectedRole.color}25`, borderRadius:"10px", marginBottom:"16px" }}>
              <span style={{ fontSize:"18px" }}>{detectedRole.icon}</span>
              <div>
                <div style={{ fontSize:"12px", fontWeight:700, color:detectedRole.color }}>{detectedRole.label} Account Detected</div>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"1px" }}>{detectedRole.access}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding:"11px 14px", background:"#EF444412", border:"1px solid #EF444430", borderRadius:"10px", fontSize:"13px", color:"#DC2626", marginBottom:"16px", display:"flex", alignItems:"center", gap:"8px" }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"12px", fontWeight:600, color:T.text, display:"block", marginBottom:"7px" }}>Email Address</label>
            <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} placeholder="your@email.com"
              onFocus={()=>setEmailFocus(true)} onBlur={()=>setEmailFocus(false)}
              onKeyDown={e=>e.key==="Enter"&&document.getElementById("passInput")?.focus()}
              type="email" autoComplete="email"
              style={{ ...IS(emailFocus) }}/>
          </div>

          {/* Password */}
          <div style={{ marginBottom:"8px" }}>
            <label style={{ fontSize:"12px", fontWeight:600, color:T.text, display:"block", marginBottom:"7px" }}>Password</label>
            <div style={{ position:"relative" }}>
              <input id="passInput" value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                placeholder="Enter your password" type={showPass?"text":"password"} autoComplete="current-password"
                onFocus={()=>setPassFocus(true)} onBlur={()=>setPassFocus(false)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ ...IS(passFocus), paddingRight:"46px" }}/>
              <button onClick={()=>setShowPass(p=>!p)}
                style={{ position:"absolute", right:"13px", top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"16px", padding:"2px" }}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer" }}>
              <div onClick={()=>setRemember(p=>!p)}
                style={{ width:"18px", height:"18px", borderRadius:"5px", border:`1.5px solid ${remember?T.accent:T.ib}`, background:remember?T.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {remember && <span style={{ color:"#fff", fontSize:"11px", fontWeight:800 }}>✓</span>}
              </div>
              <span style={{ fontSize:"13px", color:T.textMid }}>Remember me</span>
            </label>
            <button onClick={()=>{setScreen("forgot");setForgotEmail(email);setForgotErr("");}}
              style={{ background:"transparent", border:"none", color:T.accent, fontSize:"13px", fontWeight:600, cursor:"pointer", padding:0 }}>
              Forgot password?
            </button>
          </div>

          {/* Login button */}
          {failedAttempts >= CAPTCHA_AFTER && (
            <div style={{ marginBottom:"14px", padding:"10px 12px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"10px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:T.text, marginBottom:"6px" }}>Security Check</div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ fontSize:"14px", fontWeight:800, color:T.text }}>{captchaA} + {captchaB} =</div>
                <input value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Answer" style={{ ...IS(false), width:"120px", padding:"8px 10px", fontSize:"13px" }} />
                <button onClick={refreshCaptcha} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:"7px", padding:"7px 9px", cursor:"pointer", color:T.textMuted, fontSize:"11px" }}>Refresh</button>
              </div>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading || lockedUntil > Date.now()}
            style={{ width:"100%", background:(loading || lockedUntil > Date.now())?"#CBD5E1":T.accent, border:"none", color:(loading || lockedUntil > Date.now())?"#94A3B8":"#fff", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:800, cursor:(loading || lockedUntil > Date.now())?"not-allowed":"pointer", transition:"all 0.15s", boxShadow:(loading || lockedUntil > Date.now())?"none":"0 4px 16px rgba(99,102,241,0.35)", marginBottom:"20px" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          {isLocal && (
            <>
              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                <div style={{ flex:1, height:"1px", background:T.border }}/>
                <span style={{ fontSize:"11px", color:T.textMuted }}>test accounts</span>
                <div style={{ flex:1, height:"1px", background:T.border }}/>
              </div>

              {/* Quick fill test accounts */}
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                {ACCOUNTS.map(a => (
                  <button key={a.email} onClick={() => { setEmail(a.email); setPassword(a.password); setError(""); }}
                    style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 13px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:"9px", cursor:"pointer", textAlign:"left", transition:"border-color 0.1s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=a.color+"60"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:a.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11px", fontWeight:800, flexShrink:0 }}>{a.avatar}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"12px", fontWeight:700, color:T.text }}>{a.name}</div>
                      <div style={{ fontSize:"10px", color:T.textMuted }}>{a.email}</div>
                    </div>
                    <span style={{ fontSize:"12px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:ROLE_INFO[a.role].color+"18", color:ROLE_INFO[a.role].color }}>{ROLE_INFO[a.role].label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop:"24px", textAlign:"center", fontSize:"11px", color:T.textMuted }}>
            ShopAdmin · Little Things · Ladies Fashion BD
          </div>
        </div>
      </div>
    </div>
  );
}










