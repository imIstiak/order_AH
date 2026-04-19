import { loadSession } from "./auth-session";

type AppRole = "admin" | "agent" | "product-uploader";

const ADMIN_NAV_ROUTE_MAP: Record<string, string> = {
  Dashboard: "#/admin/dashboard",
  Orders: "#/admin/orders",
  "Pre-Orders": "#/admin/preorders",
  "New Order": "#/admin/new-order",
  Products: "#/admin/products",
  Customers: "#/admin/customers",
  Abandoned: "#/admin/abandoned",
  Coupons: "#/admin/coupons",
  Remittance: "#/admin/remittance",
  Analytics: "#/admin/analytics",
  "bKash Verification": "#/admin/bkash-verification",
  "Order Issues": "#/admin/order-issues",
  Settings: "#/admin/settings",
  Team: "#/admin/team",
  Profile: "#/admin/profile",
  Progfile: "#/admin/profile",
  Batches: "#/admin/batches",
  "Batch Detail": "#/admin/batch-detail",
};

const AGENT_NAV_ROUTE_MAP: Record<string, string> = {
  Dashboard: "#/agent/dashboard",
  Orders: "#/agent/orders",
  "New Order": "#/agent/new-order",
  Products: "#/agent/products",
  Customers: "#/agent/customers",
  Profile: "#/agent/profile",
  Progfile: "#/agent/profile",
};

const PRODUCT_UPLOADER_NAV_ROUTE_MAP: Record<string, string> = {
  Products: "#/admin/products",
};

function normalizeNavLabel(label: unknown): string {
  return String(label || "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveNavLabel(label: unknown): string | null {
  const cleaned = normalizeNavLabel(label);
  if (ADMIN_NAV_ROUTE_MAP[cleaned]) {
    return cleaned;
  }

  const lowered = cleaned.toLowerCase();
  const exact = Object.keys(ADMIN_NAV_ROUTE_MAP).find((key) => key.toLowerCase() === lowered);
  if (exact) {
    return exact;
  }

  const prefix = Object.keys(ADMIN_NAV_ROUTE_MAP).find((key) => lowered.startsWith(key.toLowerCase()));
  return prefix || null;
}

function getCurrentRole(): AppRole {
  const role = loadSession()?.user?.role;
  if (role === "product-uploader") {
    return "product-uploader";
  }
  return role === "agent" ? "agent" : "admin";
}

function getRouteMapForRole(role: AppRole): Record<string, string> {
  if (role === "agent") {
    return AGENT_NAV_ROUTE_MAP;
  }
  if (role === "product-uploader") {
    return PRODUCT_UPLOADER_NAV_ROUTE_MAP;
  }
  return ADMIN_NAV_ROUTE_MAP;
}

function getRouteForLabel(label: unknown, role?: AppRole): string | null {
  const activeRole = role || getCurrentRole();
  const resolvedLabel = resolveNavLabel(label);
  if (!resolvedLabel) {
    return null;
  }

  const primaryMap = getRouteMapForRole(activeRole);
  if (primaryMap[resolvedLabel]) {
    return primaryMap[resolvedLabel];
  }

  return ADMIN_NAV_ROUTE_MAP[resolvedLabel] || null;
}

function getDashboardHashByRole(role?: AppRole): string {
  if (role === "agent") {
    return "#/agent/dashboard";
  }
  if (role === "product-uploader") {
    return "#/admin/products";
  }
  return "#/admin/dashboard";
}

function getProfileHashByRole(role?: AppRole): string {
  return role === "agent" ? "#/agent/profile" : "#/admin/profile";
}

function navigateByAdminNavLabel(label: unknown): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hash = getRouteForLabel(label);
  if (!hash) {
    return false;
  }

  if (window.location.hash !== hash) {
    window.location.hash = hash;
    window.dispatchEvent(new Event("hashchange"));
  }
  return true;
}

export { ADMIN_NAV_ROUTE_MAP, AGENT_NAV_ROUTE_MAP, getCurrentRole, getRouteForLabel, getDashboardHashByRole, getProfileHashByRole, navigateByAdminNavLabel };


