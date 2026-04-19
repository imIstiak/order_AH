type LifecycleTimelineEvent = {
  status: string;
  at?: string;
  note?: string;
};

type LifecycleOrder = {
  type?: string;
  status?: string;
  issue?: string;
  customerNote?: string;
  updatedAt?: string;
  date?: string;
  timelineEvents?: LifecycleTimelineEvent[];
};

type CustomerTimelineStep = {
  status: string;
  done: boolean;
  time: string;
  note: string;
  isIssue: boolean;
};

const ADMIN_TO_CUSTOMER_STATUS: Record<string, string> = {
  "Placed": "Order Placed",
  "Confirmed": "Confirmed",
  "Advance Paid": "Advance Confirmed",
  "Pend. Verify": "Advance Confirmed",
  "Ordered Supplier": "Ordered Supplier",
  "In Transit": "In Transit",
  "Arrived BD": "Arrived Bangladesh",
  "Packed": "Packed",
  "Shipped": "Shipped",
  "Out for Delivery": "Out for Delivery",
  "Delivered": "Delivered",
  "Delayed": "Delayed",
  "Cancelled": "Delayed",
  "Returned": "Delivered",
  "Refunded": "Delivered",
};

const STOCK_TIMELINE: string[] = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const PREORDER_TIMELINE: string[] = [
  "Order Placed",
  "Advance Confirmed",
  "Ordered Supplier",
  "In Transit",
  "Arrived Bangladesh",
  "Shipped",
  "Delivered",
];

function toDisplayTime(dateText: string | null | undefined): string {
  if (!dateText) {
    return "";
  }

  // Uses browser locale; deterministic formatting can be moved to backend later.
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return String(dateText);
  }

  return parsed.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toCustomerStatus(adminStatus: string | null | undefined): string {
  const key = String(adminStatus || "");
  return ADMIN_TO_CUSTOMER_STATUS[key] || "Order Placed";
}

function buildCustomerTimeline(order: LifecycleOrder): CustomerTimelineStep[] {
  const isPreorder = order.type === "preorder";
  const template = isPreorder ? PREORDER_TIMELINE : STOCK_TIMELINE;
  const events: LifecycleTimelineEvent[] = Array.isArray(order.timelineEvents) ? order.timelineEvents : [];
  const status = toCustomerStatus(order.status);
  const currentIndex = template.indexOf(status);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const eventByStep = events.reduce<Record<string, LifecycleTimelineEvent>>((acc, event) => {
    const mapped = toCustomerStatus(event.status);
    acc[mapped] = event;
    return acc;
  }, {});

  const currentPublicNote = String(order.customerNote || "");

  return template.map((step, idx) => {
    const done = idx <= safeIndex;
    const isIssue = step === "Delayed" && Boolean(order.issue);
    const stepEvent = eventByStep[step];

    return {
      status: step,
      done,
      time: done && stepEvent ? toDisplayTime(stepEvent.at) : done && idx === safeIndex ? toDisplayTime(order.updatedAt || order.date) : "",
      note: String((isIssue || idx === safeIndex) ? currentPublicNote : ""),
      isIssue,
    };
  });
}

export { ADMIN_TO_CUSTOMER_STATUS, toCustomerStatus, buildCustomerTimeline };
export type { CustomerTimelineStep, LifecycleOrder, LifecycleTimelineEvent };

