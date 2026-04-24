export const config = { runtime: "nodejs" };

import { requireAuth } from "./_auth.js";
import { getAppState, setAppState, nextOrderNumber } from "./_rest.js";

function normalizeOrders(raw: unknown): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => (row && typeof row === "object" ? row : {}));
}

async function readOrders(): Promise<any[]> {
  const { value } = await getAppState("orders");
  return normalizeOrders(value);
}

async function writeOrders(orders: any[]): Promise<void> {
  await setAppState("orders", normalizeOrders(orders));
}

function matchesRef(order: any, ref: string): boolean {
  const orderNum = String(order.num || "");
  const withHash = ref.startsWith("#") ? ref : `#${ref}`;
  const withoutHash = ref.startsWith("#") ? ref.slice(1) : ref;

  if (orderNum === ref || orderNum === withHash || orderNum === withoutHash) {
    return true;
  }

  // Phone-based lookup: require exact digit match (min 6 digits)
  const refDigits = ref.replace(/\D/g, "");
  if (refDigits.length >= 6) {
    const orderPhone = String(order.phone || "").replace(/\D/g, "");
    if (orderPhone && orderPhone === refDigits) {
      return true;
    }
  }

  return false;
}

function sanitizeForPublic(order: any): object {
  const inDhaka = String(order.area || "").toLowerCase().includes("dhaka");
  const delivery = inDhaka ? 80 : 150;
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce(
    (s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 1),
    0
  );
  const discAmt =
    order.discType === "pct"
      ? Math.round((subtotal * (Number(order.discount) || 0)) / 100)
      : Number(order.discount) || 0;
  const codDue = Math.max(0, subtotal - discAmt + delivery - (Number(order.advance) || 0));

  const safeItems = items.map((item: any) => ({
    name: item.name ?? "",
    qty: item.qty ?? 1,
    price: item.price ?? 0,
    size: item.size,
    color: item.color,
    variant: item.variant,
    variantSize: item.variantSize,
    variantColor: item.variantColor,
    variantName: item.variantName,
    variationSize: item.variationSize,
    variationColor: item.variationColor,
    variationName: item.variationName,
    variation: item.variation,
  }));

  const safeTimeline = Array.isArray(order.timelineEvents)
    ? order.timelineEvents.map((e: any) => ({
        status: e.status ?? "",
        at: e.at ?? "",
        note: e.note ?? "",
      }))
    : [];

  return {
    num: order.num,
    status: order.status,
    type: order.type,
    date: order.date,
    updatedAt: order.updatedAt,
    customer: order.customer,
    area: order.area,
    items: safeItems,
    customerNote: order.customerNote,
    timelineEvents: safeTimeline,
    eta: order.eta,
    consId: order.consId,
    discType: order.discType,
    discount: order.discount,
    pay: order.pay,
    payStatus: order.payStatus,
    codDue,
    // Deliberately excluded: phone, advance, agent, internalNote, fraudRating
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const ref = typeof req.query?.ref === "string" ? req.query.ref.trim() : "";

      // Public lookup by order ref — returns sanitized data only
      if (ref) {
        const orders = await readOrders();
        const found = orders.find((o: any) => matchesRef(o, ref));
        if (!found) return res.status(404).json({ error: "Order not found." });
        return res.status(200).json({ order: sanitizeForPublic(found) });
      }

      // Full order list — admin only
      if (!requireAuth(req, res)) return;
      const orders = await readOrders();
      return res.status(200).json({ orders });
    }

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;
      const orders = normalizeOrders(req.body?.orders);
      await writeOrders(orders);
      return res.status(200).json({ ok: true, orders });
    }

    if (req.method === "POST") {
      if (!requireAuth(req, res)) return;
      const incoming = req.body?.order;
      if (!incoming || typeof incoming !== "object") {
        return res.status(400).json({ error: "Missing order payload." });
      }

      // Assign atomic order number from DB sequence
      const seqNum = await nextOrderNumber();
      const assignedNum = seqNum ? `#${seqNum}` : (incoming.num || `#${Date.now()}`);
      const orderWithNum = { ...incoming, num: assignedNum };

      const orders = await readOrders();
      const updated = [orderWithNum, ...orders];
      await writeOrders(updated);
      return res.status(200).json({ ok: true, order: orderWithNum, orders: updated });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error: isDev ? (error?.message || "Orders API failed.") : "An internal error occurred.",
    });
  }
}
