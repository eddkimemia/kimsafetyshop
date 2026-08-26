export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { liveCatalog } from "@/lib/catalog";
import { buildBrandCatalogPdf } from "@/lib/brand-catalog";
import { getAllSettings } from "@/lib/db";
import { resolveLogoUrl } from "@/lib/logo";

/**
 * Admin-only branded PDF catalog of the ENTIRE live catalog.
 * GET /api/admin/products/catalog → kimsafety-product-catalog.pdf
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [settings, products] = await Promise.all([
    getAllSettings().catch(() => ({}) as Record<string, string>),
    liveCatalog(),
  ]);

  const brand = {
    slug: "kimsafety",
    name: settings.site_name?.trim() || "KimSafety",
    tagline: settings.tagline?.trim() || "Certified safety equipment in Kenya",
    origin: "Nairobi, Kenya",
    image: resolveLogoUrl(settings),
  };

  const buffer = await buildBrandCatalogPdf(brand, products, {
    eyebrow: "PRODUCT CATALOG",
    footerLabel: `Full product catalog · ${products.length} items`,
    // Letterhead already carries the site logo + tagline — drop the duplicated
    // hero-section logo/tagline below it; keep the PRODUCT CATALOG title.
    hideBrandLogoAndTagline: true,
    // Order products per category with heading rows between groups.
    groupByCategory: true,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-product-catalog.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
