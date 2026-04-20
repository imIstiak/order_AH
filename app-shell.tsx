import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AdminLoginPage from "./admin-login";
import AdminDashboardPage from "./admin-dashboard";
import AdminOrderManagementPage from "./admin-order-management";
import AdminProductsPage from "./admin-products";
import AdminSettingsPage from "./admin-settings";
import AdminTeamPage from "./admin-team";
import AdminCustomersPage from "./admin-customers";
import AdminCouponsPage from "./admin-coupons";
import AdminBatchesPage from "./admin-batches";
import AdminBatchDetailPage from "./admin-batch-detail";
import AdminAbandonedCartPage from "./admin-abandoned-cart";
import AdminNewOrderFormPage from "./admin-new-order-form";
import AdminPreordersPipelinePage from "./admin-preorders-pipeline";
import AdminRemittancePage from "./admin-remittance";
import AdminProfilePage from "./admin-profile";
import AdminAnalyticsPage from "./admin-analytics";
import AdminBkashVerificationPage from "./admin-bkash-verification";
import AdminOrderIssuesPage from "./admin-order-issues";
import AdminApiHealthPage from "./admin-api-health";
import AgentDashboardPage from "./agent-dashboard";
import AgentProfilePage from "./agent-profile";
import CustomerTrackingPage from "./customer-tracking";
import CustomerInvoicePage from "./customer-invoice";
import { hasRole, loadSession } from "./core/auth-session";
import type { AuthSession } from "./core/auth-session";
import { getDashboardHashByRole } from "./core/nav-routes";

type RouteMeta = {
  component: ComponentType;
  public: boolean;
  roles?: string[];
};

const ROUTES: Record<string, RouteMeta> = {
  "/": { component: AdminLoginPage, public: true },
  "/admin/login": { component: AdminLoginPage, public: true },
  "/admin/dashboard": { component: AdminDashboardPage, public: false, roles: ["admin"] },
  "/admin/orders": { component: AdminOrderManagementPage, public: false, roles: ["admin"] },
  "/admin/new-order": { component: AdminNewOrderFormPage, public: false, roles: ["admin"] },
  "/admin/preorders": { component: AdminPreordersPipelinePage, public: false, roles: ["admin"] },
  "/admin/products": { component: AdminProductsPage, public: false, roles: ["admin", "product-uploader"] },
  "/admin/customers": { component: AdminCustomersPage, public: false, roles: ["admin"] },
  "/admin/coupons": { component: AdminCouponsPage, public: false, roles: ["admin"] },
  "/admin/batches": { component: AdminBatchesPage, public: false, roles: ["admin"] },
  "/admin/batch-detail": { component: AdminBatchDetailPage, public: false, roles: ["admin"] },
  "/admin/abandoned": { component: AdminAbandonedCartPage, public: false, roles: ["admin"] },
  "/admin/remittance": { component: AdminRemittancePage, public: false, roles: ["admin"] },
  "/admin/analytics": { component: AdminAnalyticsPage, public: false, roles: ["admin"] },
  "/admin/bkash-verification": { component: AdminBkashVerificationPage, public: false, roles: ["admin"] },
  "/admin/order-issues": { component: AdminOrderIssuesPage, public: false, roles: ["admin"] },
  "/admin/api-health": { component: AdminApiHealthPage, public: false, roles: ["admin"] },
  "/admin/profile": { component: AdminProfilePage, public: false, roles: ["admin"] },
  "/admin/progfile": { component: AdminProfilePage, public: false, roles: ["admin"] },
  "/admin/settings": { component: AdminSettingsPage, public: false, roles: ["admin"] },
  "/admin/team": { component: AdminTeamPage, public: false, roles: ["admin"] },
  "/agent/dashboard": { component: AgentDashboardPage, public: false, roles: ["agent"] },
  "/agent/orders": { component: AdminOrderManagementPage, public: false, roles: ["agent"] },
  "/agent/new-order": { component: AdminNewOrderFormPage, public: false, roles: ["agent"] },
  "/agent/products": { component: AdminProductsPage, public: false, roles: ["agent"] },
  "/agent/customers": { component: AdminCustomersPage, public: false, roles: ["agent"] },
  "/agent/profile": { component: AgentProfilePage, public: false, roles: ["agent"] },
  "/track": { component: CustomerTrackingPage, public: true },
  "/customer-tracking": { component: CustomerTrackingPage, public: true },
  "/invoice": { component: CustomerInvoicePage, public: true },
  "/customer-invoice": { component: CustomerInvoicePage, public: true },
};

const DEFAULT_ROUTE = "/admin/login";

function normalizeRoute(location: Partial<Location> | null | undefined): string {
  const hashPath = String(location?.hash || "").replace(/^#/, "").split("?")[0];
  const pathname = location?.pathname || "";
  const path = (hashPath || pathname || "").split("?")[0];

  if (!path) {
    return DEFAULT_ROUTE;
  }

  return ROUTES[path] ? path : DEFAULT_ROUTE;
}

function routeAllowsSession(routeMeta: RouteMeta, session: AuthSession | null | undefined): boolean {
  if (routeMeta.public) {
    return true;
  }

  if (!session || !session.user) {
    return false;
  }

  const allowedRoles = routeMeta.roles || [];
  if (!allowedRoles.length) {
    return true;
  }

  return allowedRoles.some((role) => hasRole(session, role));
}

function AccessDenied({ session }: { session: AuthSession | null | undefined }) {
  const role = session?.user?.role === "agent" ? "agent" : session?.user?.role === "product-uploader" ? "product-uploader" : "admin";
  const dashboardHash = getDashboardHashByRole(role);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0D0F14", color: "#E2E8F0", fontFamily: "system-ui,sans-serif", padding: "24px" }}>
      <div style={{ maxWidth: "460px", textAlign: "center", background: "#161820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "28px" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "8px" }}>Access denied</div>
        <div style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "14px" }}>
          Your account does not have permission to access this page.
        </div>
        <a href={dashboardHash} style={{ color: "#6366F1", fontWeight: 700, textDecoration: "none" }}>
          Return to dashboard
        </a>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [route, setRoute] = useState(normalizeRoute(window.location));
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  useEffect(() => {
    const onRouteChange = () => {
      setRoute(normalizeRoute(window.location));
      setSession(loadSession());
    };

    window.addEventListener("hashchange", onRouteChange);
    window.addEventListener("popstate", onRouteChange);
    return () => {
      window.removeEventListener("hashchange", onRouteChange);
      window.removeEventListener("popstate", onRouteChange);
    };
  }, []);

  const routeMeta = useMemo(() => ROUTES[route] || ROUTES[DEFAULT_ROUTE], [route]);

  if ((route === "/" || route === "/admin/login") && session && session.user) {
    const role = session.user.role === "agent" ? "agent" : session.user.role === "product-uploader" ? "product-uploader" : "admin";
    const dashboardHash = getDashboardHashByRole(role);
    if (window.location.hash !== dashboardHash) {
      window.location.hash = dashboardHash;
    }
    if (role === "agent") {
      return <AgentDashboardPage />;
    }
    if (role === "product-uploader") {
      return <AdminProductsPage />;
    }
    return <AdminDashboardPage />;
  }

  if (!routeMeta.public && (!session || !session.user)) {
    if (window.location.hash !== "#/admin/login") {
      window.location.hash = "#/admin/login";
    }
    return <AdminLoginPage />;
  }

  if (!routeAllowsSession(routeMeta, session)) {
    return <AccessDenied session={session} />;
  }

  const Page = routeMeta.component;
  return <Page />;
}


