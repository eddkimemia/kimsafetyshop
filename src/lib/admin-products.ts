import { products, normalizeDownloads, type Download } from "@/lib/data/products";
import { listAdminProducts } from "@/lib/db";

export async function mergedCatalog(): Promise<Record<string, unknown>[]> {
  const rows = await listAdminProducts();
  const overrides = rows.reduce<Record<string, { data: unknown; isStatic: boolean }>>((acc, row) => {
    const data = JSON.parse(String(row.data)) as { sku: string; static?: boolean };
    acc[data.sku] = { data, isStatic: Boolean(data.static) };
    return acc;
  }, {});

  const merged = products.map((p) => {
    const override = overrides[p.sku];
    const base = override ? { ...p, ...(override.data as Record<string, unknown>) } : p;
    return { ...base, downloads: normalizeDownloads((base as { downloads?: unknown }).downloads as Download[] | undefined) };
  });

  const custom = rows
    .filter((row) => !(JSON.parse(String(row.data)) as { static?: boolean }).static)
    .map((row) => {
      const data = JSON.parse(String(row.data)) as Record<string, unknown>;
      return { ...data, downloads: normalizeDownloads(data.downloads as Download[] | undefined) };
    });

  return [...merged, ...custom];
}
