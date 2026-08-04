export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listAdminProducts } from "@/lib/db";

export async function GET() {
  const images: Record<string, string> = {};
  const galleries: Record<string, string[]> = {};
  for (const row of listAdminProducts()) {
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
  return NextResponse.json({ images, galleries });
}
