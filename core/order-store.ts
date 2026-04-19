const ORDER_STORAGE_KEY = "shopadmin.orders.v1";

type TimelineEvent = {
  status: string;
  at: string;
  note: string;
  actor: string;
};

type StoreOrder = {
  status?: string;
  date?: string;
  customerNote?: string;
  updatedAt?: string;
  timelineEvents?: TimelineEvent[];
  [key: string]: unknown;
};

type HydratedOrder = StoreOrder & {
  updatedAt: string;
  timelineEvents: TimelineEvent[];
};

function toIsoFromDateText(dateText: unknown): string {
  if (!dateText) {
    return new Date().toISOString();
  }

  const dateString = String(dateText);

  // Existing seed uses YYYY-MM-DD, keep a stable default time in local TZ.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(`${dateString}T10:00:00+06:00`).toISOString();
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function ensureTimeline(order: StoreOrder): TimelineEvent[] {
  const baseline = Array.isArray(order.timelineEvents) ? order.timelineEvents.slice() : [];

  if (!baseline.length) {
    baseline.push({
      status: order.status || "Placed",
      at: toIsoFromDateText(order.date),
      note: String(order.customerNote || ""),
      actor: "seed",
    });
  }

  return baseline;
}

function hydrateOrder(order: StoreOrder): HydratedOrder {
  return {
    ...order,
    updatedAt: order.updatedAt || toIsoFromDateText(order.date),
    timelineEvents: ensureTimeline(order),
  };
}

function loadOrderCollection(seedOrders: StoreOrder[] = []): HydratedOrder[] {
  if (typeof window === "undefined") {
    return seedOrders.map(hydrateOrder);
  }

  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) {
      return seedOrders.map(hydrateOrder);
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return seedOrders.map(hydrateOrder);
    }

    if (parsed.length === 0) {
      return seedOrders.map(hydrateOrder);
    }

    return parsed.map((order) => hydrateOrder(order as StoreOrder));
  } catch {
    return seedOrders.map(hydrateOrder);
  }
}

function saveOrderCollection(orders: HydratedOrder[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

function appendTimelineEvent(order: StoreOrder, status: string, note?: string, actor?: string): HydratedOrder {
  const event: TimelineEvent = {
    status,
    at: new Date().toISOString(),
    note: note || "",
    actor: actor || "admin",
  };

  return {
    ...order,
    status,
    updatedAt: event.at,
    timelineEvents: [...ensureTimeline(order), event],
  };
}

export {
  ORDER_STORAGE_KEY,
  loadOrderCollection,
  saveOrderCollection,
  appendTimelineEvent,
};
export type { HydratedOrder, StoreOrder, TimelineEvent };

