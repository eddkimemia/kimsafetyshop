export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCachedAdminRows } from "@/lib/catalog";

const TTL_MS = 5 * 60 * 1000;

let cached: { at: number; data: { images: Record<string, string>; galleries: Record<string, string[]> } } | null = null;

export async function GET() {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    const images: Record<string, string> = {};
    const galleries: Record<string, string[]> = {};
    const rows = (await getCachedAdminRows()) ?? [];
    for (const row of rows) {
      const data = JSON.parse(String(row.data)) as { sku?: string; image?: string; gallery?: string[] };
      if (data?.sku) {
        if (typeof data.image === "string" && data.image.startsWith("/")) {
          images[data.sku] = data.image;
        }
        const gallery = (Array.isArray(data.gallery) ? data.gallery : []).filter(
          (p): p is string => typeof p === "string" && p.startsWith("/")
        );
        if (gallery.length > 0) galleries[data.sku] = gallery;
      }
    }
    cached = { at: now, data: { images, galleries } };
  }
  return NextResponse.json(cached.data);
}
