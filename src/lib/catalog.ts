import { products, normalizeDownloads } from "@/lib/data/products";
import { listAdminProducts } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Product } from "@/lib/types";

function mergedCatalog(): Product[] {
  const overrides = new Map<string, Record<string, unknown>>();
  const customs: Record<string, unknown>[] = [];
  for (const row of listAdminProducts()) {
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

  return [...merged, ...customProducts.map((p) => ({ ...p, downloads: normalizeDownloads(p.downloads) }))];
}

export function liveCatalog(): Product[] {
  return mergedCatalog();
}

export function liveGetProduct(id: string): Product | undefined {
  return mergedCatalog().find((p) => p.id === id);
}

export function liveGetBySlug(slug: string): Product | undefined {
  return mergedCatalog().find((p) => p.slug === slug || p.sku === slug || p.id === slug);
}

export function liveRelatedFor(product: Product, count = 8): Product[] {
  const list = mergedCatalog();
  const sameCat = list.filter((p) => p.category === product.category && p.id !== product.id);
  const sameBrand = list.filter(
    (p) => p.brand === product.brand && p.id !== product.id && !sameCat.includes(p)
  );
  const others = list.filter(
    (p) => !sameCat.includes(p) && !sameBrand.includes(p) && p.id !== product.id
  );
  return [...sameCat, ...sameBrand, ...others].slice(0, count);
}
