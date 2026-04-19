import type { Dispatch, SetStateAction } from "react";
import { getRouteForLabel, navigateByAdminNavLabel } from "./nav-routes";
import { clearSession } from "./auth-session";

type NavEntry = [string, string];

type SidebarTheme = {
  bg: string;
  sidebar: string;
  border: string;
  text: string;
  textMid: string;
  textMuted: string;
  accent: string;
};

type SidebarUser = {
  name: string;
  role: string;
  avatar: string;
  color: string;
};

type SidebarBadge = {
  text: string;
  background?: string;
  color?: string;
};

type AdminSidebarProps = {
  T: SidebarTheme;
  dark: boolean;
  setDark: Dispatch<SetStateAction<boolean>>;
  navItems: NavEntry[];
  user: SidebarUser;
  badgeByLabel?: Record<string, SidebarBadge | undefined>;
  onNavigateLabel?: (label: string, index: number) => void;
  highlightProfile?: boolean;
  onLogout?: () => void;
  showLogout?: boolean;
};

export default function AdminSidebar({
  T,
  dark,
  setDark,
  navItems,
  user,
  badgeByLabel,
  onNavigateLabel,
  highlightProfile = false,
  onLogout,
  showLogout = true,
}: AdminSidebarProps) {
  const activeTeam = window.location.hash === "#/admin/team";
  const activeProfile = window.location.hash === "#/admin/profile";
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    clearSession();
    window.location.hash = "#/admin/login";
  };

  return (
    <div style={{ width: "236px", background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "18px 15px 13px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: "17px", fontWeight: 800, color: T.accent, letterSpacing: "0.2px" }}>ShopAdmin</div>
        <div style={{ fontSize: "10px", color: T.textMuted, marginTop: "2px", fontWeight: 600 }}>LADIES FASHION BD</div>
      </div>

      <div style={{ padding: "10px 8px", flex: 1 }}>
        {navItems.map(([icon, label], i) => {
          const activeMain = window.location.hash === getRouteForLabel(label);
          const badge = badgeByLabel?.[label];

          return (
            <div key={`${label}-${i}`}>
              <button
                onClick={() => {
                  onNavigateLabel?.(label, i);
                  navigateByAdminNavLabel(label);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "1px",
                  background: activeMain ? T.accent + "18" : "transparent",
                  color: activeMain ? T.accent : T.textMuted,
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{icon}</span>
                <span style={{ fontSize: "13px", fontWeight: activeMain ? 700 : 500 }}>{label}</span>
                {badge && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: badge.background || T.accent + "18",
                      color: badge.color || T.accent,
                      fontSize: "10px",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      fontWeight: 700,
                    }}
                  >
                    {badge.text}
                  </span>
                )}
              </button>

              {label === "Settings" && (activeMain || activeTeam || activeProfile) && (
                <div style={{ marginLeft: "20px", marginBottom: "5px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <button
                    onClick={() => navigateByAdminNavLabel("Team")}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 9px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: activeTeam ? T.accent + "18" : "transparent",
                      color: activeTeam ? T.accent : T.textMuted,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>👥</span>
                    <span style={{ fontSize: "11px", fontWeight: activeTeam ? 700 : 500 }}>Team</span>
                  </button>

                  <button
                    onClick={() => navigateByAdminNavLabel("Profile")}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 9px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: activeProfile ? T.accent + "18" : "transparent",
                      color: activeProfile ? T.accent : T.textMuted,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "12px" }}>👤</span>
                    <span style={{ fontSize: "11px", fontWeight: activeProfile ? 700 : 500 }}>Profile</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "11px 12px", borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={() => setDark(!dark)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: "9px",
            padding: "8px 10px",
            cursor: "pointer",
            color: T.textMid,
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          <span>{dark ? "🌙 Dark" : "☀️ Light"}</span>
          <div style={{ width: "30px", height: "16px", background: dark ? "#6366F1" : "#CBD5E1", borderRadius: "16px", position: "relative" }}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: dark ? "16px" : "2px", transition: "left 0.2s" }} />
          </div>
        </button>

        <button
          onClick={() => navigateByAdminNavLabel("Profile")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            padding: highlightProfile ? "9px 10px" : 0,
            background: highlightProfile ? T.accent + "10" : "transparent",
            border: highlightProfile ? `1px solid ${T.accent}20` : "none",
            borderRadius: highlightProfile ? "10px" : 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: user.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
            {user.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: highlightProfile ? T.accent : T.text }}>{user.name}</div>
            <div style={{ fontSize: "10px", color: T.textMuted }}>{user.role}</div>
          </div>
        </button>

        {showLogout && (
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "#EF444410",
              border: "1px solid #EF444430",
              color: "#DC2626",
              borderRadius: "9px",
              padding: "9px 10px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>↩</span>
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
