import { products, normalizeDownloads } from "@/lib/data/products";
import { productInCategory } from "@/lib/data/catalog";
import { listAdminProducts } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Product } from "@/lib/types";

// The admin product table only changes on admin edits. Caching it with a short
// TTL cuts the repeated remote-DB round trips per page render (each serverless
// cold start has to open a fresh TLS connection to the hosted Postgres), which
// caused product/category pages to error on first load then work on retry.
const CATALOG_TTL_MS = 20 * 1000;
const DB_FAIL_TTL_MS = 10 * 1000;
let cachedAdminRows: { at: number; rows: Awaited<ReturnType<typeof listAdminProducts>> } | null = null;
let lastDbFailAt = 0;

export async function getCachedAdminRows(): Promise<Awaited<ReturnType<typeof listAdminProducts>> | null> {
  const now = Date.now();
  if (cachedAdminRows && now - cachedAdminRows.at < CATALOG_TTL_MS) return cachedAdminRows.rows;
  // After a failure, back off briefly so an overloaded DB is not hammered.
  if (now - lastDbFailAt < DB_FAIL_TTL_MS) return null;
  try {
    const rows = await listAdminProducts();
    cachedAdminRows = { at: now, rows };
    return rows;
  } catch (err) {
    lastDbFailAt = Date.now();
    console.error("[catalog] admin rows fetch failed, serving static catalog:", (err as Error).message);
    return null;
  }
}

export function invalidateCatalogCache() {
  cachedAdminRows = null;
  lastDbFailAt = 0;
}

async function mergedCatalog(): Promise<Product[]> {
  const rows = (await getCachedAdminRows()) ?? [];
  const overrides = new Map<string, Record<string, unknown>>();
  const customs: Record<string, unknown>[] = [];
  for (const row of rows) {
    const data = JSON.parse(String(row.data)) as Record<string, unknown> & { sku: string; static?: boolean };
    if (data.static) overrides.set(data.sku, data);
    else customs.push(data);
  }

  const merged = products.map((p) => {
    const override = overrides.get(p.sku);
    const base = override ? { ...p, ...override } : p;
    return { ...base, downloads: normalizeDownloads(base.downloads) };
  });

  const customProducts: Product[] = customs.map((c) => ({
    id: `custom-${c.sku}`,
    slug: typeof c.slug === "string" && c.slug ? c.slug : slugify(String(c.name ?? c.sku)),
    sku: String(c.sku),
    name: String(c.name ?? c.sku),
    brand: String(c.brand ?? "KimSafety"),
    category: String(c.category ?? "industrial-safety"),
    categoryName: String(c.categoryName ?? "Industrial Safety"),
    categories: Array.isArray(c.categories) ? (c.categories as string[]) : undefined,
    price: Number(c.price ?? 0),
    oldPrice: typeof c.oldPrice === "number" ? c.oldPrice : undefined,
    stock: Number(c.stock ?? 0),
    lowStockAt: Number(c.lowStockAt ?? 10),
    rating: Number(c.rating ?? 4.5),
    reviews: Number(c.reviews ?? 0),
    sold: Number(c.sold ?? 0),
    tags: Array.isArray(c.tags) ? (c.tags as string[]) : ["safety"],
    description: String(c.description ?? ""),
    features: Array.isArray(c.features) ? (c.features as string[]) : [],
    specs: [],
    bulk: [],
    downloads: [],
    ...(c as Partial<Product>),
  }));

  return shuffle([...merged, ...customProducts.map((p) => ({ ...p, downloads: normalizeDownloads(p.downloads) }))]);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function liveCatalog(): Promise<Product[]> {
  return mergedCatalog();
}

export async function liveGetProduct(id: string): Promise<Product | undefined> {
  return (await mergedCatalog()).find((p) => p.id === id);
}

export async function liveGetBySlug(slug: string): Promise<Product | undefined> {
  return (await mergedCatalog()).find((p) => p.slug === slug || p.sku === slug || p.id === slug);
}

export async function liveRelatedFor(product: Product, count = 8): Promise<Product[]> {
  const list = await mergedCatalog();
  const sameCat = list.filter(
    (p) => p.id !== product.id && (productInCategory(p, product.category) || (product.categories ?? []).some((c) => productInCategory(p, c)))
  );
  const sameBrand = list.filter(
    (p) => p.brand === product.brand && p.id !== product.id && !sameCat.includes(p)
  );
  const others = list.filter(
    (p) => !sameCat.includes(p) && !sameBrand.includes(p) && p.id !== product.id
  );
  return [...sameCat, ...sameBrand, ...others].slice(0, count);
}
