import { buildCustomerTimeline, toCustomerStatus } from "./order-lifecycle";
import type { LifecycleOrder } from "./order-lifecycle";

type AdminOrderItem = {
  name: string;
  [key: string]: unknown;
};

type TrackingItem = AdminOrderItem & {
  img: string;
  bg: string;
};

type TrackingConfig = {
  deliveryInsideDhaka?: number;
  deliveryOutsideDhaka?: number;
};

type AdminTrackingOrder = LifecycleOrder & {
  num?: string;
  customer?: string;
  phone?: string;
  area?: string;
  items?: AdminOrderItem[];
  consId?: string;
  advance?: number;
  discount?: number;
  discType?: string;
  pay?: string;
  payStatus?: string;
};

type TrackingPayload = {
  num: string;
  type: string;
  status: string;
  customer: string;
  phone: string;
  area: string;
  placedAt: string;
  items: TrackingItem[];
  delivery: number;
  advance: number;
  discount: number;
  discType: string;
  payMethod: string;
  payStatus: string;
  customerNote: string;
  preorderEta: string;
  courierName: string;
  trackingId: string;
  timeline: ReturnType<typeof buildCustomerTimeline>;
};

const ITEM_VISUALS: Record<string, { img: string; bg: string }> = {
  "Leather Tote Bag": { img: "🛍️", bg: "#92400E" },
  "High Ankle Converse": { img: "👟", bg: "#1E40AF" },
  "Canvas Backpack": { img: "🎒", bg: "#065F46" },
  "Silver Bracelet": { img: "📿", bg: "#6B21A8" },
  "Quilted Shoulder Bag": { img: "👜", bg: "#9D174D" },
  "Platform Sneakers": { img: "👠", bg: "#7C3AED" },
  "Embroidered Clutch": { img: "👝", bg: "#B91C1C" },
  "Ankle Strap Heels": { img: "🥿", bg: "#B45309" },
};

function isDhaka(area: unknown): boolean {
  return String(area || "").toLowerCase().includes("dhaka");
}

function maskPhone(phone: unknown): string {
  return String(phone || "");
}

function buildTrackingId(order: AdminTrackingOrder): string {
  if (order.consId) {
    return order.consId;
  }

  const compact = String(order.num || "").replace(/[^0-9A-Za-z]/g, "");
  return `TRK-${compact || "UNKNOWN"}`;
}

function shouldShowShipmentDetails(order: AdminTrackingOrder): boolean {
  const customerStatus = toCustomerStatus(order.status);
  const isShippedStage = ["Shipped", "Out for Delivery", "Delivered"].includes(customerStatus);
  return Boolean(order.consId) && isShippedStage;
}

function extractPreorderEta(order: AdminTrackingOrder): string {
  const directEta = String((order as { eta?: unknown }).eta || "").trim();
  if (directEta) {
    return directEta;
  }

  const note = String(order.customerNote || "");
  const etaMatch = note.match(/\bETA\b\s*[:\-]?\s*([^\n.]+)/i);
  if (etaMatch?.[1]) {
    return etaMatch[1].trim();
  }

  const arrivalMatch = note.match(/estimated\s+arrival\s*[:\-]?\s*([^\n.]+)/i);
  if (arrivalMatch?.[1]) {
    return arrivalMatch[1].trim();
  }

  return "";
}

function toPlacedAt(dateText: unknown): string {
  const value = String(dateText || "");
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeItems(items: AdminOrderItem[] = []): TrackingItem[] {
  return items.map((item) => {
    const visual = ITEM_VISUALS[item.name] || { img: "📦", bg: "#475569" };
    return {
      ...item,
      img: visual.img,
      bg: visual.bg,
    };
  });
}

function mapAdminOrderToTracking(order: AdminTrackingOrder, config: TrackingConfig = {}): TrackingPayload {
  const deliveryInsideDhaka = config.deliveryInsideDhaka ?? 80;
  const deliveryOutsideDhaka = config.deliveryOutsideDhaka ?? 150;
  const showShipmentDetails = shouldShowShipmentDetails(order);

  return {
    num: String(order.num || ""),
    type: String(order.type || "stock"),
    status: toCustomerStatus(order.status),
    customer: String(order.customer || ""),
    phone: maskPhone(order.phone),
    area: String(order.area || ""),
    placedAt: toPlacedAt(order.date),
    items: normalizeItems(order.items || []),
    delivery: isDhaka(order.area) ? deliveryInsideDhaka : deliveryOutsideDhaka,
    advance: order.advance || 0,
    discount: order.discount || 0,
    discType: order.discType || "flat",
    payMethod: order.pay || "COD",
    payStatus: order.payStatus || "pending",
    customerNote: order.customerNote || "",
    preorderEta: order.type === "preorder" ? extractPreorderEta(order) : "",
    courierName: showShipmentDetails ? "Pathao" : "",
    trackingId: showShipmentDetails ? buildTrackingId(order) : "",
    timeline: buildCustomerTimeline(order),
  };
}

export { mapAdminOrderToTracking };
export type { AdminOrderItem, AdminTrackingOrder, TrackingConfig, TrackingItem, TrackingPayload };

