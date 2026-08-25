export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getLiveBrand } from "@/lib/brands";
import { liveCatalog } from "@/lib/catalog";
import { buildBrandCatalogPdf } from "@/lib/brand-catalog";
import { rateLimit, tooMany } from "@/lib/rate-limit";

const SAFE_SLUG = /^[a-z0-9-]+$/i;

/**
 * Public, visitor-facing branded catalog PDF for one brand:
 * GET /api/documents/brand-catalog?slug=3m
 */
export async function GET(req: Request) {
  const rl = rateLimit(req, "brand-catalog-pdf", 10, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug || !SAFE_SLUG.test(slug)) {
    return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
  }

  const brand = await getLiveBrand(slug);
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const catalog = await liveCatalog();
  const products = catalog.filter((p) => p.brand === brand.name);

  const buffer = await buildBrandCatalogPdf(brand, products);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-brand-${slug}-catalog.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
