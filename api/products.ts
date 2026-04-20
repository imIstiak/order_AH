export const config = { runtime: "nodejs" };
import { getDb } from "./_db.js";

function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function parseMeta(description: string | null) {
  if (!description) return { descBlocks: [{ type: "text", value: "" }], variantPhotos: {}, onSale: false, salePrice: 0, saleFrom: "", saleTo: "" };
  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object") {
      return {
        descBlocks: Array.isArray(parsed.descBlocks) && parsed.descBlocks.length ? parsed.descBlocks : [{ type: "text", value: "" }],
        variantPhotos: parsed.variantPhotos && typeof parsed.variantPhotos === "object" ? parsed.variantPhotos : {},
        onSale: Boolean(parsed.onSale),
        salePrice: Number(parsed.salePrice) || 0,
        saleFrom: String(parsed.saleFrom || ""),
        saleTo: String(parsed.saleTo || ""),
      };
    }
  } catch {
    // plain text legacy
  }
  return { descBlocks: [{ type: "text", value: String(description) }], variantPhotos: {}, onSale: false, salePrice: 0, saleFrom: "", saleTo: "" };
}

async function nextCategorySlug(pool: any, name: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await pool.query(`select 1 from categories where slug = $1 limit 1`, [candidate]);
    if (!existing.rows.length) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function findOrCreateCategory(pool: any, rawName: string, parentId: string | null) {
  const name = String(rawName || "").trim();
  if (!name) return null;

  const existing = parentId
    ? await pool.query(
        `select id from categories where lower(name) = lower($1) and parent_id = $2 limit 1`,
        [name, parentId]
      )
    : await pool.query(
        `select id from categories where lower(name) = lower($1) and parent_id is null limit 1`,
        [name]
      );

  if (existing.rows[0]?.id) return existing.rows[0].id;

  const slug = await nextCategorySlug(pool, name);
  const inserted = parentId
    ? await pool.query(`insert into categories (name, slug, parent_id) values ($1, $2, $3) returning id`, [name, slug, parentId])
    : await pool.query(`insert into categories (name, slug, parent_id) values ($1, $2, null) returning id`, [name, slug]);

  return inserted.rows[0]?.id || null;
}

async function resolveCategoryId(pool: any, body: any) {
  const category = String(body?.category || "").trim();
  const subCategory = String(body?.subCategory || "").trim();

  if (!category) return null;

  const parentId = await findOrCreateCategory(pool, category, null);
  if (!parentId) return null;

  const loweredSub = subCategory.toLowerCase();
  if (!subCategory || loweredSub === "default" || loweredSub === "free" || loweredSub === category.toLowerCase()) {
    return parentId;
  }

  const childId = await findOrCreateCategory(pool, subCategory, parentId);
  return childId || parentId;
}

async function fetchPayload(pool: any) {
  const productsRes = await pool.query(`
    select p.id, p.name, p.status, p.buy_price, p.sell_price, p.source_url, p.image_url, p.description,
      c.name as category_name, c.parent_id, cp.name as parent_category_name
    from products p
    left join categories c on c.id = p.category_id
    left join categories cp on cp.id = c.parent_id
    order by p.created_at asc
  `);

  const ids = productsRes.rows.map((r: any) => r.id);
  const variantsRes = ids.length
    ? await pool.query(`select product_id, size, color, stock_qty from product_variants where product_id = any($1::uuid[])`, [ids])
    : { rows: [] };

  const catRows = await pool.query(`
    select c.name, c.parent_id, p.name as parent_name
    from categories c
    left join categories p on p.id = c.parent_id
  `);

  const tree: Record<string, string[]> = {};
  for (const row of catRows.rows) {
    if (!row.parent_id) tree[row.name] = tree[row.name] || [];
  }
  for (const row of catRows.rows) {
    if (row.parent_id && row.parent_name) {
      tree[row.parent_name] = tree[row.parent_name] || [];
      if (!tree[row.parent_name].includes(row.name)) tree[row.parent_name].push(row.name);
    }
  }

  const map = new Map<string, any[]>();
  for (const v of variantsRes.rows as any[]) {
    const list = map.get(v.product_id) || [];
    list.push(v);
    map.set(v.product_id, list);
  }

  const products = productsRes.rows.map((row: any) => {
    const variants = map.get(row.id) || [];
    const sizes = Array.from(new Set(variants.map((v: any) => String(v.size || "Free"))));
    const colors = Array.from(new Set(variants.map((v: any) => String(v.color || "Default"))));
    const stock: Record<string, number> = {};
    for (const v of variants) stock[`${String(v.size || "Free")}-${String(v.color || "Default")}`] = Number(v.stock_qty) || 0;

    const meta = parseMeta(row.description);
    const category = row.parent_category_name || row.category_name || "Uncategorized";
    const subCategory = row.parent_category_name ? row.category_name : "";

    return {
      id: row.id,
      name: row.name,
      price: Number(row.sell_price) || 0,
      costPrice: Number(row.buy_price) || 0,
      category,
      subCategory,
      img: "🛍️",
      bg: "#334155",
      status: row.status === "inactive" ? "inactive" : "active",
      featuredPhoto: row.image_url || "",
      sourceLink: row.source_url || "",
      sizes: sizes.length ? sizes : ["Free"],
      colors: colors.length ? colors : ["Default"],
      stock,
      variantPhotos: meta.variantPhotos,
      descBlocks: meta.descBlocks,
      onSale: meta.onSale,
      salePrice: meta.salePrice,
      saleFrom: meta.saleFrom,
      saleTo: meta.saleTo,
    };
  });

  return { products, catTree: tree };
}

export default async function handler(req: any, res: any) {
  try {
    const pool = await getDb();

    if (req.method === "GET") {
      const payload = await fetchPayload(pool);
      return res.status(200).json(payload);
    }

    if (req.method === "DELETE") {
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing product id." });
      await pool.query("delete from products where id = $1", [id]);
      return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Product name is required." });
    }

    const meta = JSON.stringify({
      descBlocks: Array.isArray(body.descBlocks) && body.descBlocks.length ? body.descBlocks : [{ type: "text", value: "" }],
      variantPhotos: body.variantPhotos && typeof body.variantPhotos === "object" ? body.variantPhotos : {},
      onSale: Boolean(body.onSale),
      salePrice: Number(body.salePrice) || 0,
      saleFrom: String(body.saleFrom || ""),
      saleTo: String(body.saleTo || ""),
    });

    const sellPrice = Number(body.price) || 0;
    const buyPrice = Number(body.costPrice) || 0;
    const status = String(body.status || "active") === "inactive" ? "inactive" : "active";
    const sourceUrl = String(body.sourceLink || "");
    const imageUrl = String(body.featuredPhoto || "");
    const categoryId = await resolveCategoryId(pool, body);
    const uniq = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

    let productId = String(body.id || "").trim();
    if (req.method === "POST") {
      const inserted = await pool.query(
        `insert into products (sku, name, slug, description, source_url, image_url, status, buy_price, sell_price, category_id)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [`PRD-${uniq.toUpperCase()}`, name, `${slugify(name)}-${uniq}`, meta, sourceUrl, imageUrl, status, buyPrice, sellPrice, categoryId]
      );
      productId = inserted.rows[0].id;
    } else {
      await pool.query(
        `update products set name=$1, description=$2, source_url=$3, image_url=$4, status=$5, buy_price=$6, sell_price=$7, category_id=$8, updated_at=now() where id=$9`,
        [name, meta, sourceUrl, imageUrl, status, buyPrice, sellPrice, categoryId, productId]
      );
      await pool.query("delete from product_variants where product_id = $1", [productId]);
    }

    const sizes = Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ["Free"];
    const colors = Array.isArray(body.colors) && body.colors.length ? body.colors : ["Default"];
    const stock = body.stock && typeof body.stock === "object" ? body.stock : {};

    for (const s of sizes) {
      for (const c of colors) {
        const size = String(s || "Free");
        const color = String(c || "Default");
        const qty = Number(stock[`${size}-${color}`]) || 0;
        const sku = `VAR-${uniq}-${size}-${color}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 70);
        await pool.query(
          `insert into product_variants (product_id, size, color, sku, buy_price, sell_price, stock_qty) values ($1,$2,$3,$4,$5,$6,$7)`,
          [productId, size, color, sku, buyPrice, sellPrice, qty]
        );
      }
    }

    const payload = await fetchPayload(pool);
    return res.status(200).json(payload);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Products API failed." });
  }
}
