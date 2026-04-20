import { useEffect, useRef, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import AdminSidebar from "./core/admin-sidebar";
import { loadSession } from "./core/auth-session";
import { loadAppState, saveAppState } from "./core/app-state-client";

const DARK  = { bg:"#0D0F14", surface:"#161820", sidebar:"#111318", border:"rgba(255,255,255,0.07)", text:"#E2E8F0", textMid:"#94A3B8", textMuted:"#475569", input:"#0D0F14", ib:"rgba(255,255,255,0.09)", accent:"#6366F1" };
const LIGHT = { bg:"#F1F5F9", surface:"#FFFFFF", sidebar:"#FFFFFF", border:"rgba(0,0,0,0.08)", text:"#0F172A", textMid:"#334155", textMuted:"#64748B", input:"#FFFFFF", ib:"rgba(0,0,0,0.1)", accent:"#6366F1" };

const NAV = [["▦","Dashboard"],["≡","Orders"],["📦","Batches"],["⏳","Pre-Orders"],["⬡","Products"],["◉","Customers"],["⊡","Abandoned"],["◈","Coupons"],["$","Remittance"],["⌗","Analytics"],["⚙","Settings"]];

const TABS = [
  { id:"general",   icon:"🏪", label:"General"       },
  { id:"delivery",  icon:"🚚", label:"Delivery"       },
  { id:"payment",   icon:"💳", label:"bKash & Nagad"  },
  { id:"api-health",icon:"🩺", label:"API Health"     },
  { id:"preorder",  icon:"⏳", label:"Pre-Order"      },
  { id:"sms",       icon:"📲", label:"SMS"            },
  { id:"whatsapp",  icon:"💬", label:"WhatsApp"       },
  { id:"pathao",    icon:"🚴", label:"Pathao API"     },
  { id:"hours",     icon:"🕐", label:"Store Hours"    },
  { id:"returns",   icon:"↩️", label:"Return Policy"  },
  { id:"abandoned", icon:"⊡", label:"Abandoned Cart"  },
];

const DAYS = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];

function normalizeBdPhoneInput(value: string): string {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

function isValidBdPhone(value: string): boolean {
  return /^01\d{9}$/.test(String(value || ""));
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function SL({ c, T, req = false, sub = "" }: { c: ReactNode; T: any; req?: boolean; sub?: string }) {
  return (
    <div style={{ marginBottom:"6px" }}>
      <div style={{ fontSize:"12px", color:T.text, fontWeight:600 }}>
        {c}{req && <span style={{ color:"#EF4444", marginLeft:"3px" }}>*</span>}
      </div>
      {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
    </div>
  );
}

function Inp({ value, onChange, placeholder = "", T, type = "text", style, disabled = false }: { value: any; onChange: (e: any) => void; placeholder?: string; T: any; type?: string; style?: CSSProperties; disabled?: boolean }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", opacity:disabled?0.5:1, ...(style||{}) }}/>
  );
}

function Textarea({ value, onChange, placeholder = "", T, rows = 4 }: { value: any; onChange: (e: any) => void; placeholder?: string; T: any; rows?: number }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", resize:"vertical" }}/>
  );
}

function Sel({ value, onChange, children, T }: { value: any; onChange: (e: any) => void; children: ReactNode; T: any }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ background:T.input, border:`1.5px solid ${f?T.accent:T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", cursor:"pointer", fontFamily:"inherit" }}>
      {children}
    </select>
  );
}

function Toggle({ val, set, label, sub = "", T }: { val: boolean; set: Dispatch<SetStateAction<boolean>>; label: string; sub?: string; T: any }) {
  return (
    <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"12px 14px", background:T.bg, borderRadius:"9px", border:`1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize:"13px", fontWeight:600, color:T.text }}>{label}</div>
        {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
      </div>
      <div onClick={() => set(p => !p)}
        style={{ width:"42px", height:"24px", borderRadius:"24px", background:val?T.accent:"#CBD5E1", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ width:"20px", height:"20px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:val?"20px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
      </div>
    </label>
  );
}

function Card({ title, sub = "", icon, children, T }: { title: string; sub?: string; icon?: string; children: ReactNode; T: any }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"12px", overflow:"hidden", marginBottom:"16px" }}>
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {icon && <span style={{ fontSize:"18px" }}>{icon}</span>}
          <div>
            <div style={{ fontSize:"14px", fontWeight:700, color:T.text }}>{title}</div>
            {sub && <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"2px" }}>{sub}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding:"18px" }}>{children}</div>
    </div>
  );
}

function Row({ children, cols = "1fr 1fr", gap = "14px" }: { children: ReactNode; cols?: string; gap?: string; T?: any }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:cols, gap, marginBottom:"14px" }}>
      {children}
    </div>
  );
}

function ApiField({ label, value, onChange, placeholder = "", T, masked = false }: { label: string; value: string; onChange: (e: any) => void; placeholder?: string; T: any; masked?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <SL c={label} T={T}/>
      <div style={{ position:"relative" }}>
        <input type={masked && !show ? "password" : "text"} value={value} onChange={onChange} placeholder={placeholder}
          style={{ background:T.input, border:`1.5px solid ${T.ib}`, borderRadius:"8px", color:T.text, padding:"9px 40px 9px 12px", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"monospace" }}/>
        {masked && (
          <button onClick={() => setShow(p => !p)}
            style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:T.textMuted, cursor:"pointer", fontSize:"14px" }}>
            {show ? "🙈" : "👁"}
          </button>
        )}
      </div>
    </div>
  );
}

function SaveBtn({ onSave = async () => {}, T }: { onSave?: () => Promise<void> | void; T: any }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handle = async () => {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(String(err?.message || "Save failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
      <button onClick={handle}
        style={{ background:saved?"#059669":saving?"#475569":T.accent, border:"none", color:"#fff", borderRadius:"9px", padding:"11px 28px", fontSize:"13px", fontWeight:700, cursor:saving?"not-allowed":"pointer", transition:"background 0.2s" }}>
        {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>
      {error && <div style={{ fontSize:"11px", color:"#DC2626" }}>{error}</div>}
    </div>
  );
}

function InfoBanner({ text, color, T }: { text: string; color: string; T: any }) {
  return (
    <div style={{ padding:"10px 14px", background:color+"10", border:`1px solid ${color}25`, borderRadius:"8px", fontSize:"12px", color, lineHeight:"1.6", marginBottom:"14px" }}>
      {text}
    </div>
  );
}

// ── SETTINGS SECTIONS ─────────────────────────────────────────────────────

function GeneralSettings({ T }: { T: any }) {
  const [storeName,  setStoreName]  = useState("ShopAdmin");
  const [tagline,    setTagline]    = useState("Ladies Fashion BD");
  const [email,      setEmail]      = useState("admin@yourshop.com");
  const [phone,      setPhone]      = useState("");
  const [whatsapp,   setWhatsapp]   = useState("");
  const [address,    setAddress]    = useState("");
  const [currency,   setCurrency]   = useState("BDT");
  const [domain,     setDomain]     = useState("yourshop.com");
  const [logoUrl,    setLogoUrl]    = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement | null>(null);
  const phoneInvalid = phone.length > 0 && !isValidBdPhone(phone);
  const whatsappInvalid = whatsapp.length > 0 && !isValidBdPhone(whatsapp);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.general", {
        storeName: "ShopAdmin",
        tagline: "Ladies Fashion BD",
        email: "admin@yourshop.com",
        phone: "",
        whatsapp: "",
        address: "",
        currency: "BDT",
        domain: "yourshop.com",
        logoUrl: "",
      });
      if (cancelled) return;
      setStoreName(String(data.storeName || "ShopAdmin"));
      setTagline(String(data.tagline || "Ladies Fashion BD"));
      setEmail(String(data.email || "admin@yourshop.com"));
      setPhone(String(data.phone || ""));
      setWhatsapp(String(data.whatsapp || ""));
      setAddress(String(data.address || ""));
      setCurrency(String(data.currency || "BDT"));
      setDomain(String(data.domain || "yourshop.com"));
      setLogoUrl(String(data.logoUrl || ""));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadLogo = async (file: File | null) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read logo file."));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/r2-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "image/png", dataUrl, folder: "shop-logo" }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Logo upload failed.");
      const nextUrl = String(payload?.url || "");
      if (!nextUrl) throw new Error("Upload did not return logo URL.");
      setLogoUrl(nextUrl);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    await saveAppState("settings.general", {
      storeName,
      tagline,
      email,
      phone,
      whatsapp,
      address,
      currency,
      domain,
      logoUrl,
    });
  };
  return (
    <div>
      <Card title="Store Identity" icon="🏪" T={T}>
        <Row T={T}>
          <div><SL c="Store Name" T={T} req/><Inp value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Your store name" T={T}/></div>
          <div><SL c="Tagline" T={T}/><Inp value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="e.g. Ladies Fashion BD" T={T}/></div>
        </Row>
        <div style={{ marginBottom:"14px" }}>
          <SL c="Store Logo" T={T} sub="Shown on website header, invoices, and receipts"/>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"64px", height:"64px", borderRadius:"12px", background:"linear-gradient(135deg,#6366F1,#A855F7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0, overflow:"hidden" }}>
              {logoUrl ? <img src={logoUrl} alt="Store logo" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : "🛍️"}
            </div>
            <button onClick={() => logoRef.current?.click()} style={{ background:T.accent+"15", border:`1px solid ${T.accent}30`, color:T.accent, borderRadius:"8px", padding:"9px 16px", fontSize:"12px", fontWeight:700, cursor:uploadingLogo?"not-allowed":"pointer" }}>{uploadingLogo ? "Uploading..." : "Upload Logo"}</button>
            <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => uploadLogo(e.target.files?.[0] ?? null)} />
            <span style={{ fontSize:"11px", color:T.textMuted }}>PNG or JPG, max 2MB, recommended 200×200px</span>
          </div>
        </div>
        <Row T={T}>
          <div><SL c="Website Domain" T={T}/><Inp value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourshop.com" T={T}/></div>
          <div><SL c="Currency" T={T}/><Sel value={currency} onChange={e=>setCurrency(e.target.value)} T={T}><option value="BDT">BDT — Bangladeshi Taka (৳)</option><option value="USD">USD — US Dollar ($)</option></Sel></div>
        </Row>
      </Card>

      <Card title="Contact Information" icon="📞" T={T} sub="Shown to customers and used for notifications">
        <Row T={T}>
          <div><SL c="Contact Email" T={T}/><Inp value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@yourshop.com" T={T} type="email"/></div>
          <div>
            <SL c="Contact Phone" T={T}/>
            <Inp value={phone} onChange={e=>setPhone(normalizeBdPhoneInput(e.target.value))} placeholder="01XXXXXXXXX" T={T}/>
            {phoneInvalid && <div style={{ marginTop:"6px", fontSize:"11px", color:"#DC2626" }}>Enter a valid Bangladesh phone number (11 digits, starts with 01).</div>}
          </div>
        </Row>
        <Row T={T}>
          <div>
            <SL c="WhatsApp Business Number" T={T}/>
            <Inp value={whatsapp} onChange={e=>setWhatsapp(normalizeBdPhoneInput(e.target.value))} placeholder="01XXXXXXXXX" T={T}/>
            {whatsappInvalid && <div style={{ marginTop:"6px", fontSize:"11px", color:"#DC2626" }}>Enter a valid Bangladesh phone number (11 digits, starts with 01).</div>}
          </div>
          <div><SL c="Store / Warehouse Address" T={T}/><Inp value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full address" T={T}/></div>
        </Row>
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function DeliverySettings({ T }: { T: any }) {
  const [inDhaka,   setInDhaka]   = useState("80");
  const [outDhaka,  setOutDhaka]  = useState("150");
  const [freeOver,  setFreeOver]  = useState("");
  const [freeShip,  setFreeShip]  = useState(false);
  const [codNote,   setCodNote]   = useState("Please keep the exact amount ready at the time of delivery.");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.delivery", {
        inDhaka: "80",
        outDhaka: "150",
        freeOver: "",
        freeShip: false,
        codNote: "Please keep the exact amount ready at the time of delivery.",
      });
      if (cancelled) return;
      setInDhaka(String(data.inDhaka || "80"));
      setOutDhaka(String(data.outDhaka || "150"));
      setFreeOver(String(data.freeOver || ""));
      setFreeShip(Boolean(data.freeShip));
      setCodNote(String(data.codNote || "Please keep the exact amount ready at the time of delivery."));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.delivery", { inDhaka, outDhaka, freeOver, freeShip, codNote });
  };
  return (
    <div>
      <InfoBanner text="💡 These delivery charges are the single source of truth — they apply across the admin panel, website checkout, and all COD calculations automatically." color="#6366F1" T={T}/>

      <Card title="Delivery Charges" icon="🚚" T={T}>
        <Row T={T}>
          <div>
            <SL c="Inside Dhaka (BDT)" T={T} req sub="Applied to all orders in Dhaka city"/>
            <Inp value={inDhaka} onChange={e=>setInDhaka(e.target.value)} placeholder="80" T={T} type="number"/>
            <div style={{ marginTop:"6px", padding:"8px 12px", background:"#05996910", borderRadius:"7px", fontSize:"12px", color:"#059669", fontWeight:600 }}>
              🟢 Inside Dhaka — Customer pays ৳{inDhaka||0} delivery
            </div>
          </div>
          <div>
            <SL c="Outside Dhaka (BDT)" T={T} req sub="Applied to all orders outside Dhaka"/>
            <Inp value={outDhaka} onChange={e=>setOutDhaka(e.target.value)} placeholder="150" T={T} type="number"/>
            <div style={{ marginTop:"6px", padding:"8px 12px", background:"#D9770610", borderRadius:"7px", fontSize:"12px", color:"#D97706", fontWeight:600 }}>
              🟡 Outside Dhaka — Customer pays ৳{outDhaka||0} delivery
            </div>
          </div>
        </Row>
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={freeShip} set={setFreeShip} label="Free Shipping Over a Minimum Order" sub="If enabled, orders above the threshold get free delivery" T={T}/>
          {freeShip && (
            <div style={{ marginTop:"10px" }}>
              <SL c="Free Shipping Minimum Order Amount (BDT)" T={T}/>
              <Inp value={freeOver} onChange={e=>setFreeOver(e.target.value)} placeholder="e.g. 3000 — orders above this get free delivery" T={T} type="number"/>
            </div>
          )}
        </div>
        <div>
          <SL c="COD Note for Customers" T={T} sub="Shown on the checkout page and order confirmation"/>
          <Textarea value={codNote} onChange={e=>setCodNote(e.target.value)} T={T} rows={2}/>
        </div>
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function PaymentSettings({ T }: { T: any }) {
  const [bkashNum,    setBkashNum]    = useState("");
  const [bkashType,   setBkashType]   = useState("personal");
  const [bkashNote,   setBkashNote]   = useState("Send payment to bKash number below and use your Order ID as the reference.");
  const [nagadNum,    setNagadNum]    = useState("");
  const [nagadNote,   setNagadNote]   = useState("");
  const [bkashApiKey, setBkashApiKey] = useState("");
  const [bkashAppKey, setBkashAppKey] = useState("");
  const [bkashSecret, setBkashSecret] = useState("");
  const [bkashApiEnabled, setBkashApiEnabled] = useState(false);
  const bkashNumInvalid = bkashNum.length > 0 && !isValidBdPhone(bkashNum);
  const nagadNumInvalid = nagadNum.length > 0 && !isValidBdPhone(nagadNum);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.payment", {
        bkashNum: "",
        bkashType: "personal",
        bkashNote: "Send payment to bKash number below and use your Order ID as the reference.",
        nagadNum: "",
        nagadNote: "",
        bkashApiKey: "",
        bkashAppKey: "",
        bkashSecret: "",
        bkashApiEnabled: false,
      });
      if (cancelled) return;
      setBkashNum(String(data.bkashNum || ""));
      setBkashType(String(data.bkashType || "personal"));
      setBkashNote(String(data.bkashNote || "Send payment to bKash number below and use your Order ID as the reference."));
      setNagadNum(String(data.nagadNum || ""));
      setNagadNote(String(data.nagadNote || ""));
      setBkashApiKey(String(data.bkashApiKey || ""));
      setBkashAppKey(String(data.bkashAppKey || ""));
      setBkashSecret(String(data.bkashSecret || ""));
      setBkashApiEnabled(Boolean(data.bkashApiEnabled));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.payment", {
      bkashNum,
      bkashType,
      bkashNote,
      nagadNum,
      nagadNote,
      bkashApiKey,
      bkashAppKey,
      bkashSecret,
      bkashApiEnabled,
    });
  };
  return (
    <div>
      <Card title="Manual bKash" icon="💳" T={T} sub="Customer sends payment manually, agent verifies TxID">
        <Row T={T}>
          <div>
            <SL c="bKash Number" T={T} req/>
            <Inp value={bkashNum} onChange={e=>setBkashNum(normalizeBdPhoneInput(e.target.value))} placeholder="01XXXXXXXXX" T={T}/>
            {bkashNumInvalid && <div style={{ marginTop:"6px", fontSize:"11px", color:"#DC2626" }}>bKash number must be 11 digits and start with 01.</div>}
          </div>
          <div>
            <SL c="Account Type" T={T}/>
            <Sel value={bkashType} onChange={e=>setBkashType(e.target.value)} T={T}>
              <option value="personal">Personal</option>
              <option value="merchant">Merchant</option>
              <option value="agent">Agent</option>
            </Sel>
          </div>
        </Row>
        <div>
          <SL c="Payment Instruction for Customers" T={T} sub="Shown on the payment page and order confirmation"/>
          <Textarea value={bkashNote} onChange={e=>setBkashNote(e.target.value)} T={T} rows={2}/>
        </div>
      </Card>

      <Card title="bKash API (Automatic Payment Verification)" icon="⚡" T={T} sub="Payments verified automatically via webhook — no manual TxID check needed">
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={bkashApiEnabled} set={setBkashApiEnabled} label="Enable bKash API Integration" sub="When enabled, online payments are verified automatically" T={T}/>
        </div>
        {bkashApiEnabled && (
          <div>
            <InfoBanner text="⚠ Keep these credentials private. Never share them publicly. Get them from the bKash merchant portal." color="#D97706" T={T}/>
            <Row T={T}>
              <ApiField label="App Key" value={bkashAppKey} onChange={e=>setBkashAppKey(e.target.value)} placeholder="bKash App Key" T={T} masked/>
              <ApiField label="App Secret" value={bkashSecret} onChange={e=>setBkashSecret(e.target.value)} placeholder="bKash App Secret" T={T} masked/>
            </Row>
            <ApiField label="API Key" value={bkashApiKey} onChange={e=>setBkashApiKey(e.target.value)} placeholder="bKash API Key" T={T} masked/>
          </div>
        )}
      </Card>

      <Card title="Nagad" icon="📱" T={T}>
        <div>
          <SL c="Nagad Number" T={T}/>
          <Inp value={nagadNum} onChange={e=>setNagadNum(normalizeBdPhoneInput(e.target.value))} placeholder="01XXXXXXXXX" T={T}/>
          {nagadNumInvalid && <div style={{ marginTop:"6px", fontSize:"11px", color:"#DC2626" }}>Nagad number must be 11 digits and start with 01.</div>}
        </div>
        <div style={{ marginTop:"14px" }}>
          <SL c="Payment Instruction for Customers" T={T}/>
          <Textarea value={nagadNote} onChange={e=>setNagadNote(e.target.value)} placeholder="e.g. Send payment to Nagad number and use your Order ID as reference." T={T} rows={2}/>
        </div>
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function PreOrderSettings({ T }: { T: any }) {
  const [defaultETA,     setDefaultETA]     = useState("30");
  const [advancePct,     setAdvancePct]     = useState("20");
  const [advanceType,    setAdvanceType]    = useState("pct");
  const [advanceFlat,    setAdvanceFlat]    = useState("500");
  const [orderNote,      setOrderNote]      = useState("This is a pre-order item. Expected delivery in approximately 30 days after order confirmation.");
  const [delayNote,      setDelayNote]      = useState("Your order has been slightly delayed. We apologise for the inconvenience and will update you soon.");
  const [arrivalNote,    setArrivalNote]    = useState("Great news! Your order has arrived in Bangladesh and will be dispatched shortly.");
  const [autoNotify,     setAutoNotify]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.preorder", {
        defaultETA: "30",
        advancePct: "20",
        advanceType: "pct",
        advanceFlat: "500",
        orderNote: "This is a pre-order item. Expected delivery in approximately 30 days after order confirmation.",
        delayNote: "Your order has been slightly delayed. We apologise for the inconvenience and will update you soon.",
        arrivalNote: "Great news! Your order has arrived in Bangladesh and will be dispatched shortly.",
        autoNotify: true,
      });
      if (cancelled) return;
      setDefaultETA(String(data.defaultETA || "30"));
      setAdvancePct(String(data.advancePct || "20"));
      setAdvanceType(String(data.advanceType || "pct"));
      setAdvanceFlat(String(data.advanceFlat || "500"));
      setOrderNote(String(data.orderNote || "This is a pre-order item. Expected delivery in approximately 30 days after order confirmation."));
      setDelayNote(String(data.delayNote || "Your order has been slightly delayed. We apologise for the inconvenience and will update you soon."));
      setArrivalNote(String(data.arrivalNote || "Great news! Your order has arrived in Bangladesh and will be dispatched shortly."));
      setAutoNotify(Boolean(data.autoNotify));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.preorder", {
      defaultETA,
      advancePct,
      advanceType,
      advanceFlat,
      orderNote,
      delayNote,
      arrivalNote,
      autoNotify,
    });
  };
  return (
    <div>
      <Card title="Default Pre-Order Settings" icon="⏳" T={T} sub="These defaults apply to all pre-orders unless overridden per product">
        <Row T={T}>
          <div>
            <SL c="Default ETA (days)" T={T} req sub="Shown to customer at order time"/>
            <Inp value={defaultETA} onChange={e=>setDefaultETA(e.target.value)} placeholder="30" T={T} type="number"/>
            <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"5px" }}>Customer sees: "Expected delivery in {defaultETA} days"</div>
          </div>
          <div>
            <SL c="Advance Payment Requirement" T={T} req sub="How much advance customers must pay"/>
            <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
              <div style={{ display:"flex", gap:"2px", background:T.bg, borderRadius:"8px", padding:"3px", border:`1px solid ${T.border}`, flexShrink:0 }}>
                {[["pct","% of total"],["flat","৳ flat amount"]].map(([id,label]) => (
                  <button key={id} onClick={() => setAdvanceType(id)}
                    style={{ padding:"6px 11px", borderRadius:"6px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:600, background:advanceType===id?T.accent+"20":"transparent", color:advanceType===id?T.accent:T.textMuted }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {advanceType === "pct"
              ? <Inp value={advancePct} onChange={e=>setAdvancePct(e.target.value)} placeholder="e.g. 20" T={T} type="number"/>
              : <Inp value={advanceFlat} onChange={e=>setAdvanceFlat(e.target.value)} placeholder="e.g. 500" T={T} type="number"/>}
            <div style={{ fontSize:"11px", color:"#6366F1", marginTop:"5px", fontWeight:600 }}>
              {advanceType==="pct" ? `Customer pays ${advancePct}% upfront` : `Customer pays ৳${advanceFlat} upfront`}
            </div>
          </div>
        </Row>
        <div>
          <Toggle val={autoNotify} set={setAutoNotify} label="Auto-notify customers on status changes" sub="Send SMS/WhatsApp automatically when pre-order status updates" T={T}/>
        </div>
      </Card>

      <Card title="Pre-Order Customer Messages" icon="📢" T={T} sub="Default messages shown on tracking page at each stage">
        <div style={{ marginBottom:"14px" }}>
          <SL c="Order Confirmation Message" T={T}/>
          <Textarea value={orderNote} onChange={e=>setOrderNote(e.target.value)} T={T} rows={2}/>
        </div>
        <div style={{ marginBottom:"14px" }}>
          <SL c="Delay Notification Message" T={T}/>
          <Textarea value={delayNote} onChange={e=>setDelayNote(e.target.value)} T={T} rows={2}/>
        </div>
        <div>
          <SL c="Arrived in Bangladesh Message" T={T}/>
          <Textarea value={arrivalNote} onChange={e=>setArrivalNote(e.target.value)} T={T} rows={2}/>
        </div>
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function SmsSettings({ T }: { T: any }) {
  const [provider,   setProvider]   = useState("sslwireless");
  const [apiKey,     setApiKey]     = useState("");
  const [senderId,   setSenderId]   = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [tplOrder,   setTplOrder]   = useState("Your order {order_id} has been confirmed. COD due: ৳{cod_amount}. Track: {tracking_link}");
  const [tplShipped, setTplShipped] = useState("Your order {order_id} has been shipped and is on its way. Track: {tracking_link}");
  const [tplDeliver, setTplDeliver] = useState("Your order {order_id} has been delivered. Thank you for shopping with us!");
  const [tplPreConf, setTplPreConf] = useState("Your pre-order {order_id} is confirmed! Expected delivery in {eta_days} days. We'll update you at each step.");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.sms", {
        provider: "sslwireless",
        apiKey: "",
        senderId: "",
        smsEnabled: true,
        tplOrder: "Your order {order_id} has been confirmed. COD due: ৳{cod_amount}. Track: {tracking_link}",
        tplShipped: "Your order {order_id} has been shipped and is on its way. Track: {tracking_link}",
        tplDeliver: "Your order {order_id} has been delivered. Thank you for shopping with us!",
        tplPreConf: "Your pre-order {order_id} is confirmed! Expected delivery in {eta_days} days. We'll update you at each step.",
      });
      if (cancelled) return;
      setProvider(String(data.provider || "sslwireless"));
      setApiKey(String(data.apiKey || ""));
      setSenderId(String(data.senderId || ""));
      setSmsEnabled(Boolean(data.smsEnabled));
      setTplOrder(String(data.tplOrder || "Your order {order_id} has been confirmed. COD due: ৳{cod_amount}. Track: {tracking_link}"));
      setTplShipped(String(data.tplShipped || "Your order {order_id} has been shipped and is on its way. Track: {tracking_link}"));
      setTplDeliver(String(data.tplDeliver || "Your order {order_id} has been delivered. Thank you for shopping with us!"));
      setTplPreConf(String(data.tplPreConf || "Your pre-order {order_id} is confirmed! Expected delivery in {eta_days} days. We'll update you at each step."));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.sms", {
      provider,
      apiKey,
      senderId,
      smsEnabled,
      tplOrder,
      tplShipped,
      tplDeliver,
      tplPreConf,
    });
  };
  return (
    <div>
      <Card title="SMS Provider" icon="📲" T={T}>
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={smsEnabled} set={setSmsEnabled} label="Enable SMS Notifications" sub="Send SMS to customers on order updates" T={T}/>
        </div>
        {smsEnabled && (
          <>
            <div style={{ marginBottom:"14px" }}>
              <SL c="SMS Provider" T={T} req/>
              <Sel value={provider} onChange={e=>setProvider(e.target.value)} T={T}>
                <option value="sslwireless">SSL Wireless</option>
                <option value="muthofun">Muthofun</option>
                <option value="alpha">Alpha Net</option>
                <option value="boom">BoomCast</option>
              </Sel>
            </div>
            <Row T={T}>
              <ApiField label="API Key / Username" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Your API key" T={T} masked/>
              <div>
                <SL c="Sender ID" T={T} sub="Your approved sender name (e.g. SHOPBD)"/>
                <Inp value={senderId} onChange={e=>setSenderId(e.target.value)} placeholder="e.g. SHOPBD" T={T}/>
              </div>
            </Row>
          </>
        )}
      </Card>

      {smsEnabled && (
        <Card title="SMS Templates" icon="✉️" T={T} sub="Use {order_id}, {cod_amount}, {tracking_link}, {eta_days} as dynamic variables">
          <InfoBanner text="Variables in curly braces {} are replaced automatically with real order data when SMS is sent." color="#6366F1" T={T}/>
          {([
            ["Order Confirmed", tplOrder, setTplOrder],
            ["Order Shipped", tplShipped, setTplShipped],
            ["Order Delivered", tplDeliver, setTplDeliver],
            ["Pre-Order Confirmed", tplPreConf, setTplPreConf],
          ] as Array<[string, string, Dispatch<SetStateAction<string>>]>).map(([label, val, set]) => (
            <div key={label} style={{ marginBottom:"14px" }}>
              <SL c={label} T={T}/>
              <Textarea value={val} onChange={e=>set(e.target.value)} T={T} rows={2}/>
              <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"4px" }}>{val.length} characters · ~{Math.ceil(val.length/160)} SMS</div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function WhatsAppSettings({ T }: { T: any }) {
  const [enabled,    setEnabled]    = useState(false);
  const [token,      setToken]      = useState("");
  const [phoneId,    setPhoneId]    = useState("");
  const [businessId, setBusinessId] = useState("");
  const [tplOrder,   setTplOrder]   = useState("Hello {customer_name}! Your order *{order_id}* is confirmed ✅\n\nTotal: ৳{total}\nCOD due: ৳{cod_amount}\n\nTrack your order: {tracking_link}");
  const [tplShipped, setTplShipped] = useState("Hello {customer_name}! Your order *{order_id}* is on its way 🚚\n\nTrack here: {tracking_link}");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.whatsapp", {
        enabled: false,
        token: "",
        phoneId: "",
        businessId: "",
        tplOrder: "Hello {customer_name}! Your order *{order_id}* is confirmed ✅\n\nTotal: ৳{total}\nCOD due: ৳{cod_amount}\n\nTrack your order: {tracking_link}",
        tplShipped: "Hello {customer_name}! Your order *{order_id}* is on its way 🚚\n\nTrack here: {tracking_link}",
      });
      if (cancelled) return;
      setEnabled(Boolean(data.enabled));
      setToken(String(data.token || ""));
      setPhoneId(String(data.phoneId || ""));
      setBusinessId(String(data.businessId || ""));
      setTplOrder(String(data.tplOrder || "Hello {customer_name}! Your order *{order_id}* is confirmed ✅\n\nTotal: ৳{total}\nCOD due: ৳{cod_amount}\n\nTrack your order: {tracking_link}"));
      setTplShipped(String(data.tplShipped || "Hello {customer_name}! Your order *{order_id}* is on its way 🚚\n\nTrack here: {tracking_link}"));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.whatsapp", { enabled, token, phoneId, businessId, tplOrder, tplShipped });
  };
  return (
    <div>
      <Card title="WhatsApp Business API (Meta Cloud)" icon="💬" T={T}>
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={enabled} set={setEnabled} label="Enable WhatsApp Notifications" sub="Send WhatsApp messages via Meta Cloud API" T={T}/>
        </div>
        {enabled && (
          <>
            <InfoBanner text="⚠ You need a verified Meta Business account and WhatsApp Business API access to use this feature. Get credentials from Meta Business Manager." color="#D97706" T={T}/>
            <div style={{ marginBottom:"14px" }}>
              <ApiField label="Access Token (Permanent)" value={token} onChange={e=>setToken(e.target.value)} placeholder="EAAxxxxxxx..." T={T} masked/>
            </div>
            <Row T={T}>
              <ApiField label="Phone Number ID" value={phoneId} onChange={e=>setPhoneId(e.target.value)} placeholder="1234567890" T={T} masked/>
              <ApiField label="WhatsApp Business Account ID" value={businessId} onChange={e=>setBusinessId(e.target.value)} placeholder="9876543210" T={T} masked/>
            </Row>
          </>
        )}
      </Card>

      {enabled && (
        <Card title="Message Templates" icon="✉️" T={T} sub="Use {customer_name}, {order_id}, {total}, {cod_amount}, {tracking_link}">
          <InfoBanner text="WhatsApp requires pre-approved message templates for business accounts. These templates must match what's approved in your Meta Business account." color="#6366F1" T={T}/>
          {([["Order Confirmed ✅", tplOrder, setTplOrder],["Order Shipped 🚚", tplShipped, setTplShipped]] as Array<[string, string, Dispatch<SetStateAction<string>>]>).map(([label,val,set]) => (
            <div key={label} style={{ marginBottom:"14px" }}>
              <SL c={label} T={T}/>
              <Textarea value={val} onChange={e=>set(e.target.value)} T={T} rows={4}/>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function PathaoSettings({ T }: { T: any }) {
  const [enabled,   setEnabled]   = useState(false);
  const [clientId,  setClientId]  = useState("");
  const [secret,    setSecret]    = useState("");
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [storeId,   setStoreId]   = useState("");
  const [sandbox,   setSandbox]   = useState(true);
  const [autoShip,  setAutoShip]  = useState(false);
  const [pickupHub, setPickupHub] = useState("");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.pathao", {
        enabled: false,
        clientId: "",
        secret: "",
        username: "",
        password: "",
        storeId: "",
        sandbox: true,
        autoShip: false,
        pickupHub: "",
      });
      if (cancelled) return;
      setEnabled(Boolean(data.enabled));
      setClientId(String(data.clientId || ""));
      setSecret(String(data.secret || ""));
      setUsername(String(data.username || ""));
      setPassword(String(data.password || ""));
      setStoreId(String(data.storeId || ""));
      setSandbox(Boolean(data.sandbox));
      setAutoShip(Boolean(data.autoShip));
      setPickupHub(String(data.pickupHub || ""));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.pathao", {
      enabled,
      clientId,
      secret,
      username,
      password,
      storeId,
      sandbox,
      autoShip,
      pickupHub,
    });
  };
  return (
    <div>
      <Card title="Pathao Courier API" icon="🚴" T={T} sub="Auto-create shipments, fetch delivery areas, and track orders via Pathao">
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={enabled} set={setEnabled} label="Enable Pathao Integration" sub="Connect your Pathao merchant account" T={T}/>
        </div>
        {enabled && (
          <>
            <div style={{ marginBottom:"14px" }}>
              <Toggle val={sandbox} set={setSandbox} label="Sandbox Mode (Testing)" sub="Use Pathao sandbox for testing — switch off for live orders" T={T}/>
            </div>
            {!sandbox && <InfoBanner text="⚠ You are in LIVE mode. Shipments created here will be real Pathao orders." color="#DC2626" T={T}/>}
            <Row T={T}>
              <ApiField label="Client ID" value={clientId} onChange={e=>setClientId(e.target.value)} placeholder="Pathao Client ID" T={T} masked/>
              <ApiField label="Client Secret" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="Pathao Client Secret" T={T} masked/>
            </Row>
            <Row T={T}>
              <div><SL c="Merchant Username (Email)" T={T}/><Inp value={username} onChange={e=>setUsername(e.target.value)} placeholder="your@email.com" T={T} type="email"/></div>
              <ApiField label="Merchant Password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" T={T} masked/>
            </Row>
            <Row T={T}>
              <div><SL c="Store ID" T={T} sub="Your Pathao merchant store ID"/><Inp value={storeId} onChange={e=>setStoreId(e.target.value)} placeholder="e.g. 12345" T={T}/></div>
              <div><SL c="Pickup Hub Address" T={T} sub="Where Pathao picks up your parcels"/><Inp value={pickupHub} onChange={e=>setPickupHub(e.target.value)} placeholder="Your warehouse address" T={T}/></div>
            </Row>
            <Toggle val={autoShip} set={setAutoShip} label="Auto-create Pathao shipment when order is marked 'Packed'" sub="Automatically sends packed orders to Pathao without manual action" T={T}/>
          </>
        )}
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function StoreHoursSettings({ T }: { T: any }) {
  const initHours = DAYS.reduce<Record<string, { open: boolean; from: string; to: string }>>((acc, d) => ({
    ...acc,
    [d]: { open: d !== "Friday", from: "10:00", to: "22:00" }
  }), {});
  const [hours, setHours] = useState(initHours);
  const setDay = (day: string, field: "open" | "from" | "to", val: boolean | string) => setHours((p) => ({ ...p, [day]: { ...p[day], [field]: val } }));
  const timeInput: CSSProperties = { background:"transparent", border:`1px solid ${T.border}`, borderRadius:"6px", color:T.text, padding:"6px 9px", fontSize:"12px", outline:"none", fontFamily:"inherit", width:"100px" };

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.hours", initHours);
      if (cancelled) return;
      if (data && typeof data === "object") {
        setHours(data as any);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.hours", hours);
  };
  return (
    <div>
      <Card title="Business Hours" icon="🕐" T={T} sub="Shown to customers on your website. Order processing follows these hours.">
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {DAYS.map(day => (
            <div key={day} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"10px 14px", background:T.bg, borderRadius:"9px", border:`1px solid ${T.border}` }}>
              <div style={{ width:"100px", fontSize:"13px", fontWeight:600, color:T.text }}>{day}</div>
              <label style={{ display:"flex", alignItems:"center", gap:"6px", cursor:"pointer" }}>
                <div onClick={() => setDay(day, "open", !hours[day].open)}
                  style={{ width:"36px", height:"20px", borderRadius:"20px", background:hours[day].open?T.accent:"#CBD5E1", position:"relative", transition:"background 0.2s", cursor:"pointer" }}>
                  <div style={{ width:"16px", height:"16px", background:"#fff", borderRadius:"50%", position:"absolute", top:"2px", left:hours[day].open?"18px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
                <span style={{ fontSize:"12px", color:hours[day].open?"#059669":T.textMuted, fontWeight:600 }}>{hours[day].open ? "Open" : "Closed"}</span>
              </label>
              {hours[day].open && (
                <>
                  <span style={{ fontSize:"12px", color:T.textMuted }}>From</span>
                  <input type="time" value={hours[day].from} onChange={e=>setDay(day,"from",e.target.value)} style={timeInput}/>
                  <span style={{ fontSize:"12px", color:T.textMuted }}>to</span>
                  <input type="time" value={hours[day].to} onChange={e=>setDay(day,"to",e.target.value)} style={timeInput}/>
                </>
              )}
              {!hours[day].open && <span style={{ fontSize:"11px", color:T.textMuted, fontStyle:"italic" }}>No orders processed on this day</span>}
            </div>
          ))}
        </div>
      </Card>
      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function ReturnSettings({ T }: { T: any }) {
  const [returnEnabled,  setReturnEnabled]  = useState(true);
  const [returnDays,     setReturnDays]     = useState("7");
  const [exchangeOnly,   setExchangeOnly]   = useState(false);
  const [refundMethod,   setRefundMethod]   = useState("bkash");
  const [conditions,     setConditions]     = useState("Items must be unused, unworn, and in original packaging. Tags must be attached. Sale items are not eligible for returns.");
  const [process,        setProcess]        = useState("Contact us via WhatsApp or phone within the return window. We will arrange pickup or ask you to ship the item back.");
  const [noReturn,       setNoReturn]       = useState("Sale/discounted items\nUnderwear and swimwear\nPersonalised or custom orders");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.returns", {
        returnEnabled: true,
        returnDays: "7",
        exchangeOnly: false,
        refundMethod: "bkash",
        conditions: "Items must be unused, unworn, and in original packaging. Tags must be attached. Sale items are not eligible for returns.",
        process: "Contact us via WhatsApp or phone within the return window. We will arrange pickup or ask you to ship the item back.",
        noReturn: "Sale/discounted items\nUnderwear and swimwear\nPersonalised or custom orders",
      });
      if (cancelled) return;
      setReturnEnabled(Boolean(data.returnEnabled));
      setReturnDays(String(data.returnDays || "7"));
      setExchangeOnly(Boolean(data.exchangeOnly));
      setRefundMethod(String(data.refundMethod || "bkash"));
      setConditions(String(data.conditions || ""));
      setProcess(String(data.process || ""));
      setNoReturn(String(data.noReturn || ""));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.returns", {
      returnEnabled,
      returnDays,
      exchangeOnly,
      refundMethod,
      conditions,
      process,
      noReturn,
    });
  };
  return (
    <div>
      <Card title="Return & Exchange Policy" icon="↩️" T={T}>
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={returnEnabled} set={setReturnEnabled} label="Accept Returns & Exchanges" sub="If disabled, 'No Returns' is shown on your website" T={T}/>
        </div>
        {returnEnabled && (
          <>
            <Row T={T}>
              <div>
                <SL c="Return Window (days)" T={T} req sub="How many days after delivery a return can be requested"/>
                <Inp value={returnDays} onChange={e=>setReturnDays(e.target.value)} placeholder="7" T={T} type="number"/>
              </div>
              <div>
                <SL c="Refund Method" T={T}/>
                <Sel value={refundMethod} onChange={e=>setRefundMethod(e.target.value)} T={T}>
                  <option value="bkash">bKash refund</option>
                  <option value="nagad">Nagad refund</option>
                  <option value="store_credit">Store credit</option>
                  <option value="exchange_only">Exchange only — no refund</option>
                </Sel>
              </div>
            </Row>
            <div style={{ marginBottom:"14px" }}>
              <Toggle val={exchangeOnly} set={setExchangeOnly} label="Exchange Only (No Refunds)" sub="Customers can only exchange items, not get money back" T={T}/>
            </div>
          </>
        )}
      </Card>

      {returnEnabled && (
        <Card title="Policy Text" icon="📄" T={T} sub="This text is shown on your website's return policy page">
          <div style={{ marginBottom:"14px" }}>
            <SL c="Return Conditions" T={T}/>
            <Textarea value={conditions} onChange={e=>setConditions(e.target.value)} T={T} rows={3}/>
          </div>
          <div style={{ marginBottom:"14px" }}>
            <SL c="Return Process" T={T}/>
            <Textarea value={process} onChange={e=>setProcess(e.target.value)} T={T} rows={3}/>
          </div>
          <div>
            <SL c="Non-Returnable Items (one per line)" T={T}/>
            <Textarea value={noReturn} onChange={e=>setNoReturn(e.target.value)} T={T} rows={3}/>
          </div>
        </Card>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

function AbandonedCartSettings({ T }: { T: any }) {
  const [enabled,   setEnabled]   = useState(true);
  const [delay,     setDelay]     = useState("60");
  const [reminder2, setReminder2] = useState(true);
  const [delay2,    setDelay2]    = useState("24");
  const [channel,   setChannel]   = useState("sms");
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoCode,    setPromoCode]    = useState("");
  const [promoDisc,    setPromoDisc]    = useState("10");
  const [msg1, setMsg1] = useState("Hi {customer_name}! You left something in your cart 🛍️ Complete your order here: {cart_link}");
  const [msg2, setMsg2] = useState("Hi {customer_name}! Your cart is still waiting. Here's a special discount just for you: {promo_code} — {cart_link}");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const data = await loadAppState("settings.abandoned", {
        enabled: true,
        delay: "60",
        reminder2: true,
        delay2: "24",
        channel: "sms",
        promoEnabled: false,
        promoCode: "",
        promoDisc: "10",
        msg1: "Hi {customer_name}! You left something in your cart 🛍️ Complete your order here: {cart_link}",
        msg2: "Hi {customer_name}! Your cart is still waiting. Here's a special discount just for you: {promo_code} — {cart_link}",
      });
      if (cancelled) return;
      setEnabled(Boolean(data.enabled));
      setDelay(String(data.delay || "60"));
      setReminder2(Boolean(data.reminder2));
      setDelay2(String(data.delay2 || "24"));
      setChannel(String(data.channel || "sms"));
      setPromoEnabled(Boolean(data.promoEnabled));
      setPromoCode(String(data.promoCode || ""));
      setPromoDisc(String(data.promoDisc || "10"));
      setMsg1(String(data.msg1 || ""));
      setMsg2(String(data.msg2 || ""));
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    await saveAppState("settings.abandoned", {
      enabled,
      delay,
      reminder2,
      delay2,
      channel,
      promoEnabled,
      promoCode,
      promoDisc,
      msg1,
      msg2,
    });
  };
  return (
    <div>
      <Card title="Abandoned Cart Recovery" icon="⊡" T={T} sub="Automatically follow up with customers who added items but didn't complete their order">
        <div style={{ marginBottom:"14px" }}>
          <Toggle val={enabled} set={setEnabled} label="Enable Abandoned Cart Recovery" sub="Send automated reminders to recover lost orders" T={T}/>
        </div>
        {enabled && (
          <>
            <Row T={T}>
              <div>
                <SL c="Send First Reminder After (minutes)" T={T} sub="How long after cart abandonment to send first message"/>
                <Inp value={delay} onChange={e=>setDelay(e.target.value)} placeholder="60" T={T} type="number"/>
                <div style={{ fontSize:"11px", color:T.textMuted, marginTop:"5px" }}>First reminder sent {delay} minutes after abandonment</div>
              </div>
              <div>
                <SL c="Send Via" T={T}/>
                <Sel value={channel} onChange={e=>setChannel(e.target.value)} T={T}>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="both">SMS + WhatsApp</option>
                </Sel>
              </div>
            </Row>

            <div style={{ marginBottom:"14px" }}>
              <Toggle val={reminder2} set={setReminder2} label="Send a Second Reminder" sub="A follow-up message after the first" T={T}/>
            </div>
            {reminder2 && (
              <div style={{ marginBottom:"14px" }}>
                <SL c="Second Reminder After (hours)" T={T}/>
                <Inp value={delay2} onChange={e=>setDelay2(e.target.value)} placeholder="24" T={T} type="number" style={{ maxWidth:"160px" }}/>
              </div>
            )}
          </>
        )}
      </Card>

      {enabled && (
        <>
          <Card title="Promo Code for Second Reminder" icon="🎁" T={T}>
            <div style={{ marginBottom:"14px" }}>
              <Toggle val={promoEnabled} set={setPromoEnabled} label="Include a Discount Code in Second Reminder" sub="Incentivise customers to complete their purchase" T={T}/>
            </div>
            {promoEnabled && (
              <Row T={T}>
                <div><SL c="Promo Code" T={T}/><Inp value={promoCode} onChange={e=>setPromoCode(e.target.value)} placeholder="e.g. COMEBACK10" T={T}/></div>
                <div><SL c="Discount (%)" T={T}/><Inp value={promoDisc} onChange={e=>setPromoDisc(e.target.value)} placeholder="10" T={T} type="number"/></div>
              </Row>
            )}
          </Card>

          <Card title="Message Templates" icon="✉️" T={T} sub="Use {customer_name}, {cart_link}, {promo_code}, {discount}">
            <div style={{ marginBottom:"14px" }}>
              <SL c="First Reminder Message" T={T}/>
              <Textarea value={msg1} onChange={e=>setMsg1(e.target.value)} T={T} rows={3}/>
            </div>
            {reminder2 && (
              <div>
                <SL c="Second Reminder Message" T={T}/>
                <Textarea value={msg2} onChange={e=>setMsg2(e.target.value)} T={T} rows={3}/>
              </div>
            )}
          </Card>
        </>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end" }}><SaveBtn onSave={handleSave} T={T}/></div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;
  const [activeTab, setActiveTab] = useState("general");
  const [nav, setNav] = useState(10);
  const sessionUser = loadSession()?.user;

  const renderTab = () => {
    switch(activeTab) {
      case "general":   return <GeneralSettings T={T}/>;
      case "delivery":  return <DeliverySettings T={T}/>;
      case "payment":   return <PaymentSettings T={T}/>;
      case "preorder":  return <PreOrderSettings T={T}/>;
      case "sms":       return <SmsSettings T={T}/>;
      case "whatsapp":  return <WhatsAppSettings T={T}/>;
      case "pathao":    return <PathaoSettings T={T}/>;
      case "hours":     return <StoreHoursSettings T={T}/>;
      case "returns":   return <ReturnSettings T={T}/>;
      case "abandoned": return <AbandonedCartSettings T={T}/>;
      default:          return null;
    }
  };

  const activeLabel = TABS.find(t => t.id === activeTab)?.label || "Settings";

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, fontFamily:"system-ui,sans-serif", color:T.text, overflow:"hidden" }}>

      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{
          name: sessionUser?.name || "Admin",
          role: sessionUser?.role === "agent" ? "Agent" : "Super Admin",
          avatar: sessionUser?.avatar || "A",
          color: sessionUser?.color || "linear-gradient(135deg,#6366F1,#A855F7)",
        }}
        onNavigateLabel={(_, i) => setNav(i)}
      />

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:"52px", background:T.sidebar, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 20px", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:"15px", fontWeight:800, color:T.text }}>Settings</div>
            <div style={{ fontSize:"11px", color:T.textMuted }}>{activeLabel}</div>
          </div>
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Settings tab sidebar */}
          <div style={{ width:"200px", background:T.sidebar, borderRight:`1px solid ${T.border}`, padding:"10px 8px", flexShrink:0, overflowY:"auto" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => {
                if (tab.id === "api-health") {
                  navigateByAdminNavLabel("API Health");
                  return;
                }
                setActiveTab(tab.id);
              }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"9px", padding:"9px 10px", borderRadius:"8px", border:"none", cursor:"pointer", marginBottom:"2px", background:activeTab===tab.id?T.accent+"18":"transparent", color:activeTab===tab.id?T.accent:T.textMuted, textAlign:"left", transition:"all 0.12s" }}>
                <span style={{ fontSize:"15px", width:"18px", textAlign:"center", flexShrink:0 }}>{tab.icon}</span>
                <span style={{ fontSize:"12px", fontWeight:activeTab===tab.id?700:400 }}>{tab.label}</span>
                {activeTab===tab.id && <div style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:T.accent, flexShrink:0 }}/>}
              </button>
            ))}
          </div>

          {/* Settings content */}
          <div style={{ flex:1, overflow:"auto", padding:"24px" }}>
            <div style={{ maxWidth:"720px" }}>
              <div style={{ marginBottom:"20px" }}>
                <h2 style={{ margin:0, fontSize:"18px", fontWeight:800, color:T.text }}>
                  {TABS.find(t => t.id === activeTab)?.icon} {activeLabel}
                </h2>
              </div>
              {renderTab()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}









