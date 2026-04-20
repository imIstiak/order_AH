import { useEffect, useMemo, useState, type ReactNode } from "react";
import AdminSidebar from "./core/admin-sidebar";
import { clearSession, loadSession } from "./core/auth-session";
import { navigateByAdminNavLabel } from "./core/nav-routes";
import { loadAppState, saveAppState } from "./core/app-state-client";

type Theme = {
  bg: string;
  surface: string;
  sidebar: string;
  border: string;
  text: string;
  textMid: string;
  textMuted: string;
  accent: string;
  tHead: string;
  rowHover: string;
};

const LIGHT: Theme = {
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  sidebar: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textMid: "#334155",
  textMuted: "#64748B",
  accent: "#6366F1",
  tHead: "#F8FAFC",
  rowHover: "#F8FAFC",
};

const DARK: Theme = {
  bg: "#0B1020",
  surface: "#111827",
  sidebar: "#0F172A",
  border: "#243244",
  text: "#E2E8F0",
  textMid: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#818CF8",
  tHead: "#1E293B",
  rowHover: "#172132",
};

const NAV = [
  "Dashboard",
  "Order Management",
  "Products",
  "Customers",
  "Coupons",
  "Batches",
  "Remittance",
  "Settings",
  "Profile",
  "Team",
] as const;

type RoleKey = "admin" | "agent" | "viewer";
type MemberStatus = "active" | "inactive";

type TeamActivity = {
  action: string;
  time: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleKey;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  ordersHandled: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  avgResponseTime: string;
  avatar: string;
  avatarColor: string;
  recentActivity: TeamActivity[];
};

const ROLES: Record<RoleKey, { label: string; color: string; permissions: string[] }> = {
  admin: {
    label: "Admin",
    color: "#6366F1",
    permissions: ["Manage users", "Manage orders", "Manage products", "View analytics", "Manage settings"],
  },
  agent: {
    label: "Agent",
    color: "#059669",
    permissions: ["Manage orders", "View customers", "View products"],
  },
  viewer: {
    label: "Viewer",
    color: "#D97706",
    permissions: ["View dashboard", "View reports"],
  },
};

const ALL_PERMISSIONS: Array<[string, string]> = [
  ["Manage users", "Invite/remove team members and adjust role"],
  ["Manage orders", "Create and update orders"],
  ["Manage products", "Create and edit products"],
  ["View analytics", "Access analytics pages"],
  ["Manage settings", "Change system configuration"],
  ["View customers", "Access customer profiles"],
  ["View products", "View product catalog only"],
  ["View dashboard", "Read-only dashboard access"],
  ["View reports", "Read-only reporting access"],
];

const INIT_TEAM: TeamMember[] = [
  {
    id: "t-admin-1",
    name: "Istiak Rahman",
    email: "istiak@shopadmin.test",
    phone: "01700000000",
    role: "admin",
    status: "active",
    joinedAt: "03 Mar 2025",
    lastActive: "Today, 10:41 AM",
    ordersHandled: 132,
    ordersThisMonth: 41,
    revenueThisMonth: 467200,
    avgResponseTime: "4m",
    avatar: "IR",
    avatarColor: "#6366F1",
    recentActivity: [
      { action: "Updated order workflow", time: "Today, 09:50 AM" },
      { action: "Approved coupon edits", time: "Yesterday" },
    ],
  },
  {
    id: "t-agent-1",
    name: "Nadia Islam",
    email: "nadia@shopadmin.test",
    phone: "01800000000",
    role: "agent",
    status: "active",
    joinedAt: "19 Feb 2025",
    lastActive: "Today, 09:22 AM",
    ordersHandled: 98,
    ordersThisMonth: 36,
    revenueThisMonth: 313600,
    avgResponseTime: "7m",
    avatar: "NI",
    avatarColor: "#059669",
    recentActivity: [
      { action: "Resolved pending order", time: "Today, 09:10 AM" },
      { action: "Called customer", time: "Yesterday" },
    ],
  },
  {
    id: "t-viewer-1",
    name: "Fahim Hasan",
    email: "fahim@shopadmin.test",
    phone: "01900000000",
    role: "viewer",
    status: "inactive",
    joinedAt: "08 Jan 2025",
    lastActive: "10 days ago",
    ordersHandled: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    avgResponseTime: "-",
    avatar: "FH",
    avatarColor: "#D97706",
    recentActivity: [{ action: "Account deactivated", time: "10 days ago" }],
  },
];

const TEAM_STATE_KEY = "team.members";

function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "999px",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.max(11, Math.floor(size * 0.32))}px`,
        fontWeight: 800,
      }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: RoleKey }) {
  const cfg = ROLES[role];
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color: cfg.color,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}33`,
        borderRadius: "999px",
        padding: "2px 7px",
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }: { status: MemberStatus }) {
  const active = status === "active";
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, color: active ? "#059669" : "#64748B" }}>
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  T,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  T: Theme;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "5px", fontWeight: 700 }}>{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: "8px",
          border: `1px solid ${T.border}`,
          background: T.bg,
          color: T.text,
          fontSize: "12px",
        }}
      />
    </div>
  );
}

function PermissionsTable({ T }: { T: Theme }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>Role Permissions</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", padding: "9px 16px", background: T.tHead, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: 700, textTransform: "uppercase" }}>Permission</div>
        {(["admin", "agent", "viewer"] as RoleKey[]).map((role) => (
          <div key={role} style={{ fontSize: "11px", textAlign: "center", color: ROLES[role].color, fontWeight: 700 }}>
            {ROLES[role].label}
          </div>
        ))}
      </div>
      {ALL_PERMISSIONS.map(([permission, description], idx) => (
        <div
          key={permission}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 90px 90px",
            padding: "9px 16px",
            borderBottom: idx < ALL_PERMISSIONS.length - 1 ? `1px solid ${T.border}` : "none",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: T.text }}>{permission}</div>
            <div style={{ fontSize: "10px", color: T.textMuted }}>{description}</div>
          </div>
          {(["admin", "agent", "viewer"] as RoleKey[]).map((role) => (
            <div key={role} style={{ textAlign: "center", color: ROLES[role].permissions.includes(permission) ? ROLES[role].color : T.border }}>
              {ROLES[role].permissions.includes(permission) ? "✓" : "-"}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MemberPanel({
  member,
  onClose,
  onUpdate,
  onRemove,
  T,
}: {
  member: TeamMember;
  onClose: () => void;
  onUpdate: (member: TeamMember) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
  T: Theme;
}) {
  const [draft, setDraft] = useState(member);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(member);
  }, [member]);

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    const ok = await onUpdate(draft);
    setSaving(false);
    if (!ok) {
      setError("Save failed. Please try again.");
    }
  };

  const removeMember = async () => {
    if (!window.confirm(`Remove ${member.name} from team?`)) {
      return;
    }
    setSaving(true);
    setError(null);
    const ok = await onRemove(member.id);
    setSaving(false);
    if (ok) {
      onClose();
      return;
    }
    setError("Removal failed. Please try again.");
  };

  return (
    <div style={{ width: "340px", borderLeft: `1px solid ${T.border}`, background: T.surface, padding: "14px", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: T.text }}>Member Details</div>
        <button onClick={onClose} style={{ border: `1px solid ${T.border}`, background: T.bg, color: T.textMuted, borderRadius: "7px", padding: "3px 8px", cursor: "pointer" }}>
          Close
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Avatar initials={member.avatar} color={member.avatarColor} size={40} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>{member.name}</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
            <RoleBadge role={member.role} />
            <StatusDot status={member.status} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <LabeledInput label="Name" value={draft.name} onChange={(value) => setDraft((prev) => ({ ...prev, name: value }))} T={T} />
        <LabeledInput label="Email" value={draft.email} onChange={(value) => setDraft((prev) => ({ ...prev, email: value }))} T={T} type="email" />
        <LabeledInput label="Phone" value={draft.phone} onChange={(value) => setDraft((prev) => ({ ...prev, phone: value }))} T={T} />

        <div>
          <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "5px", fontWeight: 700 }}>Role</div>
          <select
            value={draft.role}
            onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value as RoleKey }))}
            style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: "12px" }}
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "5px", fontWeight: 700 }}>Status</div>
          <select
            value={draft.status}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as MemberStatus }))}
            style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: "12px" }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && <div style={{ marginTop: "10px", fontSize: "11px", color: "#DC2626" }}>{error}</div>}

      <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
        <button
          onClick={saveChanges}
          disabled={saving}
          style={{ flex: 1, borderRadius: "8px", border: "none", padding: "9px 10px", background: saving ? "#94A3B8" : T.accent, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={removeMember}
          disabled={saving}
          style={{ borderRadius: "8px", border: "none", padding: "9px 10px", background: "#DC2626", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
        >
          Remove
        </button>
      </div>

      <div style={{ marginTop: "14px", borderTop: `1px solid ${T.border}`, paddingTop: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: T.textMuted, marginBottom: "6px" }}>Recent Activity</div>
        {member.recentActivity.map((activity) => (
          <div key={`${activity.action}-${activity.time}`} style={{ fontSize: "11px", color: T.textMid, marginBottom: "5px" }}>
            • {activity.action} · {activity.time}
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteModal({ onClose, onInvite, T }: { onClose: () => void; onInvite: (member: TeamMember) => Promise<boolean>; T: Theme }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RoleKey>("agent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 1 && email.includes("@") && phone.trim().length > 5;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    const initials = name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((chunk) => chunk[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const palette = ["#6366F1", "#059669", "#D97706", "#0D9488", "#A855F7"];
    const newMember: TeamMember = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      status: "active",
      joinedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      lastActive: "Never",
      ordersHandled: 0,
      ordersThisMonth: 0,
      revenueThisMonth: 0,
      avgResponseTime: "-",
      avatar: initials || "TM",
      avatarColor: palette[Math.floor(Math.random() * palette.length)],
      recentActivity: [{ action: "Account invited", time: "Just now" }],
    };

    setSaving(true);
    setError(null);
    const ok = await onInvite(newMember);
    setSaving(false);
    if (ok) {
      onClose();
      return;
    }
    setError("Invitation failed to save. Try again.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div style={{ position: "relative", width: "460px", maxWidth: "95vw", background: T.surface, borderRadius: "12px", border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: T.text }}>Invite Team Member</div>
          <button onClick={onClose} style={{ border: `1px solid ${T.border}`, borderRadius: "7px", background: T.bg, color: T.textMuted, padding: "3px 8px", cursor: "pointer" }}>
            Close
          </button>
        </div>

        <div style={{ padding: "14px 16px", display: "grid", gap: "10px" }}>
          <LabeledInput label="Full Name" value={name} onChange={setName} T={T} />
          <LabeledInput label="Email" value={email} onChange={setEmail} T={T} type="email" />
          <LabeledInput label="Phone" value={phone} onChange={setPhone} T={T} />

          <div>
            <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "5px", fontWeight: 700 }}>Role</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px" }}>
              {(["admin", "agent", "viewer"] as RoleKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  style={{
                    border: `1px solid ${role === key ? ROLES[key].color : T.border}`,
                    background: role === key ? `${ROLES[key].color}15` : T.bg,
                    color: role === key ? ROLES[key].color : T.textMid,
                    borderRadius: "8px",
                    padding: "8px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {ROLES[key].label}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ fontSize: "11px", color: "#DC2626" }}>{error}</div>}

          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button onClick={onClose} style={{ flex: 1, borderRadius: "8px", border: `1px solid ${T.border}`, background: T.bg, color: T.textMuted, padding: "9px 10px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit || saving}
              style={{
                flex: 2,
                borderRadius: "8px",
                border: "none",
                background: canSubmit && !saving ? T.accent : "#94A3B8",
                color: "#fff",
                padding: "9px 10px",
                cursor: canSubmit && !saving ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {saving ? "Saving..." : "Send Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;
  const [tab, setTab] = useState<"members" | "permissions">("members");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const session = loadSession();
  const userName = session?.user?.name || "Admin";
  const userRole = session?.user?.role || "admin";
  const userAvatar = userName
    .split(" ")
    .map((chunk) => chunk[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const stored = await loadAppState<TeamMember[]>(TEAM_STATE_KEY, []);
        if (!mounted) {
          return;
        }
        setTeam(Array.isArray(stored) ? stored : []);
      } catch {
        if (mounted) {
          setError("Could not load team state from database.");
          setTeam([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const commitTeam = async (next: TeamMember[]): Promise<boolean> => {
    const previous = team;
    setTeam(next);
    setError(null);
    try {
      await saveAppState(TEAM_STATE_KEY, next);
      return true;
    } catch {
      setTeam(previous);
      setError("Database save failed. Your changes were not persisted.");
      return false;
    }
  };

  const handleUpdate = async (member: TeamMember) => {
    const next = team.map((entry) => (entry.id === member.id ? member : entry));
    const ok = await commitTeam(next);
    if (ok) {
      setSelected(member);
    }
    return ok;
  };

  const handleRemove = async (id: string) => {
    const next = team.filter((entry) => entry.id !== id);
    const ok = await commitTeam(next);
    if (ok) {
      setSelected(null);
    }
    return ok;
  };

  const handleInvite = async (member: TeamMember) => {
    const next = [...team, member];
    return commitTeam(next);
  };

  const totals = useMemo(() => {
    const active = team.filter((member) => member.status === "active").length;
    const inactive = team.filter((member) => member.status === "inactive").length;
    const ordersMonth = team.reduce((sum, member) => sum + member.ordersThisMonth, 0);
    const revenueMonth = team.reduce((sum, member) => sum + member.revenueThisMonth, 0);
    return { active, inactive, ordersMonth, revenueMonth };
  }, [team]);

  const stats: Array<[string, ReactNode, string, string]> = [
    ["Team Size", team.length, "#6366F1", "👥"],
    ["Active", totals.active, "#059669", "🟢"],
    ["Orders (Month)", totals.ordersMonth, "#0D9488", "📦"],
    ["Revenue (Month)", `৳${totals.revenueMonth.toLocaleString()}`, "#D97706", "💰"],
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      <AdminSidebar
        T={T}
        dark={dark}
        setDark={setDark}
        navItems={NAV}
        user={{ name: userName, role: userRole, avatar: userAvatar, color: "#6366F1" }}
        onNavigateLabel={(label) => navigateByAdminNavLabel(label)}
        onLogout={() => {
          clearSession();
          window.location.hash = "#/admin/login";
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: "52px", background: T.sidebar, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: T.text }}>Team Management</div>
            <div style={{ fontSize: "11px", color: T.textMuted }}>
              {totals.active} active · {totals.inactive} inactive · {team.length} total
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{ border: "none", borderRadius: "8px", background: T.accent, color: "#fff", fontSize: "12px", fontWeight: 700, padding: "8px 14px", cursor: "pointer" }}
          >
            + Add Team Member
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
            {error && <div style={{ marginBottom: "12px", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: "9px", padding: "9px 12px", fontSize: "12px", fontWeight: 600 }}>{error}</div>}

            <div style={{ display: "flex", gap: "3px", border: `1px solid ${T.border}`, borderRadius: "9px", background: T.surface, padding: "3px", width: "fit-content", marginBottom: "16px" }}>
              <button
                onClick={() => setTab("members")}
                style={{ border: "none", borderRadius: "7px", background: tab === "members" ? `${T.accent}20` : "transparent", color: tab === "members" ? T.accent : T.textMuted, fontSize: "12px", fontWeight: 700, padding: "7px 15px", cursor: "pointer" }}
              >
                Members
              </button>
              <button
                onClick={() => setTab("permissions")}
                style={{ border: "none", borderRadius: "7px", background: tab === "permissions" ? `${T.accent}20` : "transparent", color: tab === "permissions" ? T.accent : T.textMuted, fontSize: "12px", fontWeight: 700, padding: "7px 15px", cursor: "pointer" }}
              >
                Role Permissions
              </button>
            </div>

            {tab === "permissions" && <PermissionsTable T={T} />}

            {tab === "members" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "14px" }}>
                  {stats.map(([label, value, color, icon]) => (
                    <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "13px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div style={{ fontSize: "10px", color: T.textMuted, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
                        <span>{icon}</span>
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: color as string }}>{value}</div>
                    </div>
                  ))}
                </div>

                {loading ? (
                  <div style={{ fontSize: "12px", color: T.textMuted }}>Loading team from database...</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
                    {team.map((member) => {
                      const roleColor = ROLES[member.role].color;
                      const selectedMember = selected?.id === member.id;
                      return (
                        <div
                          key={member.id}
                          onClick={() => setSelected(selectedMember ? null : member)}
                          style={{
                            background: T.surface,
                            border: `1.5px solid ${selectedMember ? roleColor : T.border}`,
                            borderRadius: "12px",
                            padding: "14px",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px" }}>
                            <Avatar initials={member.avatar} color={member.avatarColor} size={42} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: 800, color: T.text }}>{member.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                <RoleBadge role={member.role} />
                                <StatusDot status={member.status} />
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "3px" }}>📧 {member.email}</div>
                          <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "10px" }}>📞 {member.phone}</div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                            <div style={{ background: T.bg, borderRadius: "7px", padding: "7px" }}>
                              <div style={{ fontSize: "10px", color: T.textMuted }}>Orders</div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: T.accent }}>{member.ordersThisMonth}</div>
                            </div>
                            <div style={{ background: T.bg, borderRadius: "7px", padding: "7px" }}>
                              <div style={{ fontSize: "10px", color: T.textMuted }}>Revenue</div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#059669" }}>৳{Math.round(member.revenueThisMonth / 1000)}k</div>
                            </div>
                            <div style={{ background: T.bg, borderRadius: "7px", padding: "7px" }}>
                              <div style={{ fontSize: "10px", color: T.textMuted }}>Avg Resp</div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#D97706" }}>{member.avgResponseTime}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div
                      onClick={() => setShowInvite(true)}
                      style={{
                        background: T.surface,
                        border: `2px dashed ${T.border}`,
                        borderRadius: "12px",
                        minHeight: "165px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "42px", height: "42px", borderRadius: "999px", background: `${T.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px", fontSize: "22px", color: T.accent }}>
                        +
                      </div>
                      <div style={{ fontSize: "12px", color: T.accent, fontWeight: 700 }}>Invite Team Member</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selected && tab === "members" && (
            <MemberPanel member={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onRemove={handleRemove} T={T} />
          )}
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} T={T} />}
    </div>
  );
}
