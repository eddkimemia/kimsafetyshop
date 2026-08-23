export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCachedAdminRows } from "@/lib/catalog";

/**
 * Client-side image overrides for the storefront. Served fresh on every request
 * — the underlying admin rows are already cached in-process for 5s (and busted
 * by invalidateCatalogCache() on every admin save), so this endpoint must NOT
 * add its own longer TTL: a module-level cache here is what made edited product
 * photos keep showing the old picture for minutes.
 */
export async function GET() {
  const images: Record<string, string> = {};
  const galleries: Record<string, string[]> = {};
  const rows = (await getCachedAdminRows()) ?? [];
  for (const row of rows) {
    const data = JSON.parse(String(row.data)) as { sku?: string; image?: string; gallery?: string[] };
    if (!data?.sku) continue;
    // Accept local public paths and absolute external URLs alike — admins can
    // paste an https:// product photo just as well as upload one.
    if (typeof data.image === "string" && isValidImagePath(data.image)) {
      images[data.sku] = data.image;
    }
    const gallery = (Array.isArray(data.gallery) ? data.gallery : []).filter((p): p is string =>
      typeof p === "string" && isValidImagePath(p)
    );
    if (gallery.length > 0) galleries[data.sku] = gallery;
  }
  return NextResponse.json(
    { images, galleries },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function isValidImagePath(path: string): boolean {
  return path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://");
}
