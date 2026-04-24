export const config = { runtime: "nodejs" };

import { requireAuth } from "./_auth.js";
import { getAppState, setAppState } from "./_rest.js";

// Derive category tree from products array
function buildCatTree(products: any[]): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  for (const p of products) {
    const cat = String(p.category || "Uncategorized");
    const sub = String(p.subCategory || "");
    if (!tree[cat]) tree[cat] = [];
    if (sub && sub !== cat && !tree[cat].includes(sub)) tree[cat].push(sub);
  }
  return tree;
}

async function readProducts(): Promise<any[]> {
  const { value } = await getAppState("products");
  return Array.isArray(value) ? value : [];
}

async function writeProducts(products: any[]): Promise<void> {
  await setAppState("products", products);
}

function buildProduct(body: any, id: string): object {
  return {
    id,
    name: String(body.name || "").trim(),
    price: Number(body.price) || 0,
    costPrice: Number(body.costPrice) || 0,
    category: String(body.category || "Uncategorized"),
    subCategory: String(body.subCategory || ""),
    img: body.img || "🛍️",
    bg: body.bg || "#334155",
    status: String(body.status || "active") === "inactive" ? "inactive" : "active",
    featuredPhoto: String(body.featuredPhoto || ""),
    sourceLink: String(body.sourceLink || ""),
    sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ["Free"],
    colors: Array.isArray(body.colors) && body.colors.length ? body.colors : ["Default"],
    stock: body.stock && typeof body.stock === "object" ? body.stock : {},
    variantPhotos:
      body.variantPhotos && typeof body.variantPhotos === "object" ? body.variantPhotos : {},
    descBlocks:
      Array.isArray(body.descBlocks) && body.descBlocks.length
        ? body.descBlocks
        : [{ type: "text", value: "" }],
    onSale: Boolean(body.onSale),
    salePrice: Number(body.salePrice) || 0,
    saleFrom: String(body.saleFrom || ""),
    saleTo: String(body.saleTo || ""),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    if (req.method === "GET") {
      if (!requireAuth(req, res)) return;
      const products = await readProducts();
      return res.status(200).json({ products, catTree: buildCatTree(products) });
    }

    if (req.method === "DELETE") {
      if (!requireAuth(req, res)) return;
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing product id." });
      const products = await readProducts();
      const updated = products.filter((p: any) => String(p.id || "") !== id);
      await writeProducts(updated);
      return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireAuth(req, res)) return;
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Product name is required." });

    const isNew = req.method === "POST";
    const id = isNew
      ? `prd-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      : String(body.id || "").trim();

    const product = buildProduct(body, id);
    const products = await readProducts();

    let updated: any[];
    if (isNew) {
      updated = [product, ...products];
    } else {
      const idx = products.findIndex((p: any) => String(p.id || "") === id);
      if (idx >= 0) {
        updated = [...products];
        updated[idx] = product;
      } else {
        updated = [product, ...products];
      }
    }

    await writeProducts(updated);
    return res.status(200).json({ products: updated, catTree: buildCatTree(updated) });
  } catch (error: any) {
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error: isDev ? (error?.message || "Products API failed.") : "An internal error occurred.",
    });
  }
}
