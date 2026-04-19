const BATCHES_KEY = "shopadmin.batches.v1";
const SELECTED_BATCH_KEY = "shopadmin.batches.selected.v1";

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

const MOCK_ORDERS: BatchOrder[] = [
  {
    id: "o1",
    num: "#1001",
    customer: "Fatima Akter",
    phone: "01711111111",
    address: "House 12, Road 5, Dhanmondi, Dhaka",
    codDue: 4300,
    status: "confirmed",
    items: [
      { productId: "P001", name: "Leather Tote Bag", code: "LTB-001", color: "Black", size: "M", qty: 1, buyPrice: 1400, sellPrice: 2500, sourceUrl: "https://aliexpress.com/item/LTB001" },
      { productId: "P003", name: "Silver Bracelet", code: "SB-003", color: "Silver", size: "Free", qty: 1, buyPrice: 600, sellPrice: 1800, sourceUrl: "" },
    ],
  },
  {
    id: "o2",
    num: "#1002",
    customer: "Rahela Khanam",
    phone: "01722222222",
    address: "Flat 3B, Road 10, Uttara Sector 7, Dhaka",
    codDue: 2400,
    status: "shipped",
    items: [
      { productId: "P002", name: "High Ankle Converse", code: "HAC-002", color: "White", size: "38", qty: 1, buyPrice: 1600, sellPrice: 3200, sourceUrl: "https://aliexpress.com/item/HAC002" },
    ],
  },
  {
    id: "o3",
    num: "#1003",
    customer: "Sabrina Islam",
    phone: "01633333333",
    address: "Zindabazar Chairman Bari, Sylhet",
    codDue: 5200,
    status: "confirmed",
    items: [
      { productId: "P004", name: "Quilted Shoulder Bag", code: "QSB-004", color: "Pink", size: "M", qty: 2, buyPrice: 1800, sellPrice: 3500, sourceUrl: "https://aliexpress.com/item/QSB004" },
    ],
  },
  {
    id: "o4",
    num: "#1004",
    customer: "Mithila Rahman",
    phone: "01544444444",
    address: "Block C, Mirpur 12, Dhaka",
    codDue: 5900,
    status: "pending",
    items: [
      { productId: "P005", name: "Platform Sneakers", code: "PS-005", color: "Black", size: "37", qty: 1, buyPrice: 1900, sellPrice: 3800, sourceUrl: "https://aliexpress.com/item/PS005" },
      { productId: "P007", name: "Gold Chain Necklace", code: "GCN-007", color: "Gold", size: "Free", qty: 1, buyPrice: 700, sellPrice: 2100, sourceUrl: "" },
    ],
  },
  {
    id: "o5",
    num: "#1005",
    customer: "Taslima Begum",
    phone: "01355555555",
    address: "House 4, Road 9, Banani, Dhaka",
    codDue: 0,
    status: "delivered",
    items: [
      { productId: "P001", name: "Leather Tote Bag", code: "LTB-001", color: "Brown", size: "L", qty: 1, buyPrice: 1400, sellPrice: 2500, sourceUrl: "https://aliexpress.com/item/LTB001" },
      { productId: "P002", name: "High Ankle Converse", code: "HAC-002", color: "White", size: "39", qty: 1, buyPrice: 1600, sellPrice: 3200, sourceUrl: "https://aliexpress.com/item/HAC002" },
    ],
  },
  {
    id: "o6",
    num: "#1006",
    customer: "Parvin Sultana",
    phone: "01566666666",
    address: "Nasirabad, Chattogram",
    codDue: 4800,
    status: "shipped",
    items: [
      { productId: "P002", name: "High Ankle Converse", code: "HAC-002", color: "White", size: "39", qty: 1, buyPrice: 1600, sellPrice: 3200, sourceUrl: "https://aliexpress.com/item/HAC002" },
      { productId: "P006", name: "Canvas Backpack", code: "CB-006", color: "Navy", size: "L", qty: 1, buyPrice: 900, sellPrice: 2400, sourceUrl: "" },
    ],
  },
  {
    id: "o7",
    num: "#1007",
    customer: "Kohinoor Begum",
    phone: "01677777777",
    address: "Tongi, Gazipur",
    codDue: 3500,
    status: "confirmed",
    items: [
      { productId: "P004", name: "Quilted Shoulder Bag", code: "QSB-004", color: "Beige", size: "S", qty: 1, buyPrice: 1800, sellPrice: 3500, sourceUrl: "https://aliexpress.com/item/QSB004" },
    ],
  },
  {
    id: "o8",
    num: "#1008",
    customer: "Nasreen Akter",
    phone: "01499999999",
    address: "Badda, Dhaka",
    codDue: 3800,
    status: "pending",
    items: [
      { productId: "P005", name: "Platform Sneakers", code: "PS-005", color: "White", size: "38", qty: 1, buyPrice: 1900, sellPrice: 3800, sourceUrl: "https://aliexpress.com/item/PS005" },
    ],
  },
  {
    id: "o9",
    num: "#1009",
    customer: "Shirin Akter",
    phone: "01112345678",
    address: "Tongi, Gazipur",
    codDue: 2550,
    status: "cancelled",
    items: [
      { productId: "P006", name: "Canvas Backpack", code: "CB-006", color: "Tan", size: "L", qty: 1, buyPrice: 900, sellPrice: 2400, sourceUrl: "" },
    ],
  },
  {
    id: "o10",
    num: "#1010",
    customer: "Kohinoor Begum",
    phone: "01987654321",
    address: "Mohammadpur, Dhaka",
    codDue: 8580,
    status: "ordered supplier",
    items: [
      { productId: "P005", name: "Platform Sneakers", code: "PS-005", color: "Black", size: "39", qty: 1, buyPrice: 1900, sellPrice: 3800, sourceUrl: "https://aliexpress.com/item/PS005" },
      { productId: "P008", name: "Ankle Strap Heels", code: "ASH-008", color: "Nude", size: "37", qty: 2, buyPrice: 1100, sellPrice: 2800, sourceUrl: "" },
    ],
  },
];

const INIT_BATCHES: BatchRecord[] = [
  { id: "b1", batchCode: "BATCH-4421", batchName: "Ali Express Restock April W3", note: "Urgent pre-orders - source from Ali Express Store #4421", orderIds: ["o1", "o2", "o3"], createdAt: "17 Apr 2026, 10:00 AM", createdBy: "Istiak" },
  { id: "b2", batchCode: "BATCH-8812", batchName: "Regular Stock Orders", note: "Regular stock orders - pack and ship today", orderIds: ["o4", "o5"], createdAt: "16 Apr 2026, 3:30 PM", createdBy: "Rafi" },
  { id: "b3", batchCode: "BATCH-3301", batchName: "Mixed Restock Batch", note: "", orderIds: ["o6", "o7", "o8"], createdAt: "15 Apr 2026, 11:00 AM", createdBy: "Mitu" },
];

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
    return INIT_BATCHES;
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

function listAvailableOrders(): BatchOrder[] {
  return MOCK_ORDERS;
}

function listBatches(): BatchRecord[] {
  return readBatchesFromStorage();
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

export {
  assignOrdersToBatch,
  createBatch,
  getOrderBatchMembership,
  getSelectedBatchId,
  listAvailableOrders,
  listBatches,
  selectBatch,
};
export type { BatchMembershipEntry, BatchOrder, BatchOrderItem, BatchRecord, CreateBatchPayload };


