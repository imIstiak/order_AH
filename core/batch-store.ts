import { loadOrderCollection } from "./order-store";

const BATCHES_KEY = "shopadmin.batches.v2";
const SELECTED_BATCH_KEY = "shopadmin.batches.selected.v2";

type BatchOrderItem = {
  productId: string;
  name: string;
  code: string;
  color: string;
  size: string;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  sourceUrl: string;
};

type BatchOrder = {
  id: string;
  num: string;
  customer: string;
  phone: string;
  address: string;
  codDue: number;
  status: string;
  items: BatchOrderItem[];
};

type BatchRecord = {
  id: string;
  batchCode: string;
  batchName: string;
  note: string;
  orderIds: string[];
  createdAt: string;
  createdBy: string;
};

type CreateBatchPayload = {
  batchName?: string;
  note?: string;
  orderIds?: string[];
  createdBy?: string;
};

type BatchMembershipEntry = {
  id: string;
  batchCode: string;
  batchName: string;
};

function normalizeOrderId(orderId: unknown): string {
  return String(orderId || "").trim().toLowerCase();
}

const INIT_BATCHES: BatchRecord[] = [];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function formatNow(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-GB", { month: "short" });
  const year = now.getFullYear();
  const time = now.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} ${month} ${year}, ${time}`;
}

function readBatchesFromStorage(): BatchRecord[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(BATCHES_KEY);
  if (!raw) {
    window.localStorage.setItem(BATCHES_KEY, JSON.stringify(INIT_BATCHES));
    return INIT_BATCHES;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const normalized: BatchRecord[] = parsed.map((batch) => {
        const safeBatch = batch as Partial<BatchRecord>;
        return ({
        ...batch,
        id: String(safeBatch.id || ""),
        batchCode: String(safeBatch.batchCode || ""),
        batchName: String(safeBatch.batchName || "Untitled"),
        note: String(safeBatch.note || ""),
        createdAt: String(safeBatch.createdAt || ""),
        createdBy: String(safeBatch.createdBy || "Admin"),
        orderIds: Array.isArray(safeBatch.orderIds)
          ? Array.from(new Set(safeBatch.orderIds.map(normalizeOrderId).filter(Boolean)))
          : [],
      });
      });
      window.localStorage.setItem(BATCHES_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (error) {
    // Ignore malformed storage and fall back to seeded data.
  }

  window.localStorage.setItem(BATCHES_KEY, JSON.stringify(INIT_BATCHES));
  return INIT_BATCHES;
}

function writeBatchesToStorage(batches: BatchRecord[]): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBatchOrder(order: Record<string, unknown>): BatchOrder | null {
  const id = String(order.id || "").trim();
  if (!id) {
    return null;
  }

  const num = String(order.num || id);
  const customer = String(order.customer || "Unknown Customer");
  const phone = String(order.phone || "");
  const address = String(order.address || order.area || "");
  const status = String(order.status || "pending");
  const discount = toNumber(order.discount, 0);
  const discountType = String(order.discType || "flat").toLowerCase();
  const advance = toNumber(order.advance, 0);

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items: BatchOrderItem[] = rawItems
    .map((item): BatchOrderItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      const productId = String(row.productId || row.pid || "").trim();
      const name = String(row.name || "Product");
      const qty = Math.max(1, toNumber(row.qty, 1));
      const sellPrice = toNumber(row.sellPrice, toNumber(row.price, 0));
      const buyPrice = toNumber(row.buyPrice, sellPrice);
      return {
        productId: productId || name,
        name,
        code: String(row.code || row.pid || row.productId || ""),
        color: String(row.color || ""),
        size: String(row.size || ""),
        qty,
        buyPrice,
        sellPrice,
        sourceUrl: String(row.sourceUrl || ""),
      };
    })
    .filter((item): item is BatchOrderItem => Boolean(item));

  if (!items.length) {
    return null;
  }

  const subtotal = items.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const discounted = discountType === "pct"
    ? subtotal * (1 - discount / 100)
    : subtotal - discount;
  const codDue = Math.max(0, Math.round(discounted - advance));

  return {
    id,
    num,
    customer,
    phone,
    address,
    codDue,
    status,
    items,
  };
}

function listAvailableOrders(): BatchOrder[] {
  const liveOrders = loadOrderCollection([])
    .map((order) => toBatchOrder(order as Record<string, unknown>))
    .filter((order): order is BatchOrder => Boolean(order));

  return liveOrders;
}

function listBatches(): BatchRecord[] {
  return readBatchesFromStorage();
}

function replaceBatches(batches: BatchRecord[]): BatchRecord[] {
  const next = Array.isArray(batches)
    ? batches.map((batch) => ({
      id: String(batch.id || ""),
      batchCode: String(batch.batchCode || ""),
      batchName: String(batch.batchName || "Untitled"),
      note: String(batch.note || ""),
      orderIds: Array.isArray(batch.orderIds)
        ? Array.from(new Set(batch.orderIds.map(normalizeOrderId).filter(Boolean)))
        : [],
      createdAt: String(batch.createdAt || ""),
      createdBy: String(batch.createdBy || "Admin"),
    }))
    : [];
  writeBatchesToStorage(next);
  return next;
}

function createBatch(payload: CreateBatchPayload = {}): BatchRecord {
  const orderIds = Array.isArray(payload?.orderIds)
    ? Array.from(new Set(payload.orderIds.map(normalizeOrderId).filter(Boolean)))
    : [];
  const safeNote = String(payload?.note || "").trim();
  const createdBy = payload?.createdBy || "Admin";
  const code = `BATCH-${Math.floor(1000 + Math.random() * 9000)}`;

  const created: BatchRecord = {
    id: `b${Date.now()}`,
    batchCode: code,
    batchName: payload?.batchName || `Sourcing ${code}`,
    note: safeNote,
    orderIds,
    createdAt: formatNow(),
    createdBy,
  };

  const next = [created, ...readBatchesFromStorage()];
  writeBatchesToStorage(next);
  selectBatch(created.id);
  return created;
}

function assignOrdersToBatch(batchId: string | null | undefined, orderIds?: string[], note?: string): BatchRecord | null {
  if (!batchId) {
    return null;
  }

  const incoming = Array.isArray(orderIds)
    ? Array.from(new Set(orderIds.map(normalizeOrderId).filter(Boolean)))
    : [];
  const safeNote = String(note || "").trim();

  let updatedBatch: BatchRecord | null = null;
  const next = readBatchesFromStorage().map<BatchRecord>((batch) => {
    if (batch.id !== batchId) {
      return batch;
    }

    const existingIds = Array.isArray(batch.orderIds) ? batch.orderIds.map(normalizeOrderId).filter(Boolean) : [];
    const mergedIds = Array.from(new Set([...existingIds, ...incoming]));
    const mergedNote = safeNote
      ? (batch.note ? `${batch.note} | ${safeNote}` : safeNote)
      : batch.note;

    const mergedBatch: BatchRecord = {
      ...batch,
      orderIds: mergedIds,
      note: mergedNote,
    };
    updatedBatch = mergedBatch;
    return mergedBatch;
  });

  writeBatchesToStorage(next);
  if (updatedBatch) {
    selectBatch(batchId);
  }
  return updatedBatch;
}

function getOrderBatchMembership(orderIds?: string[]): Record<string, BatchMembershipEntry[]> {
  const requested = Array.isArray(orderIds)
    ? Array.from(new Set(orderIds.map(normalizeOrderId).filter(Boolean)))
    : [];
  const set = new Set(requested);
  const membership: Record<string, BatchMembershipEntry[]> = {};

  readBatchesFromStorage().forEach((batch) => {
    const ids = Array.isArray(batch.orderIds) ? batch.orderIds.map(normalizeOrderId).filter(Boolean) : [];
    ids.forEach((id) => {
      if (!set.has(id)) {
        return;
      }
      if (!membership[id]) {
        membership[id] = [];
      }
      membership[id].push({ id: batch.id, batchCode: batch.batchCode, batchName: batch.batchName || "Untitled" });
    });
  });

  return membership;
}

function selectBatch(batchId: string | null | undefined): void {
  if (!isBrowser() || !batchId) {
    return;
  }
  window.localStorage.setItem(SELECTED_BATCH_KEY, String(batchId));
}

function getSelectedBatchId(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(SELECTED_BATCH_KEY);
}

function setSelectedBatchId(batchId: string | null): void {
  if (!isBrowser()) {
    return;
  }
  if (!batchId) {
    window.localStorage.removeItem(SELECTED_BATCH_KEY);
    return;
  }
  window.localStorage.setItem(SELECTED_BATCH_KEY, String(batchId));
}

export {
  assignOrdersToBatch,
  createBatch,
  getOrderBatchMembership,
  getSelectedBatchId,
  listAvailableOrders,
  listBatches,
  replaceBatches,
  setSelectedBatchId,
  selectBatch,
};
export type { BatchMembershipEntry, BatchOrder, BatchOrderItem, BatchRecord, CreateBatchPayload };


