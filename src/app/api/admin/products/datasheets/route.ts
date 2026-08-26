import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { liveCatalog } from "@/lib/catalog";
import { buildBrandedDatasheetPdf } from "@/lib/branded-datasheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseSkusFromUrl(url: URL): string[] | null {
  const raw =
    url.searchParams.get("skus") ??
    url.searchParams.get("sku") ??
    url.searchParams.get("skus[]");
  if (!raw) {
    // also support repeated ?skus=a&skus=b (URLSearchParams.getAll)
    const all = url.searchParams.getAll("skus").flatMap((v) => v.split(","));
    const cleaned = all.map((s) => s.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parseSkusFromBody(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const fromSkus = b.skus ?? b.sku ?? b.ids;
  if (Array.isArray(fromSkus)) {
    const cleaned = fromSkus.map((s) => String(s).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }
  if (typeof fromSkus === "string") {
    const parts = fromSkus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : null;
  }
  return null;
}

async function buildPdf(skus: string[] | null): Promise<{ buffer: Buffer; count: number; filtered: boolean }> {
  const catalog = await liveCatalog();

  let products = catalog;
  let filtered = false;

  if (skus && skus.length > 0) {
    const wanted = new Set(skus.map((s) => s.toLowerCase()));
    products = catalog.filter(
      (p) =>
        wanted.has(p.sku.toLowerCase()) ||
        wanted.has(p.slug.toLowerCase()) ||
        wanted.has(p.id.toLowerCase())
    );
    filtered = true;
  }

  // Deterministic order: by category then name so the merged doc is scannable.
  products = [...products].sort((a, b) => {
    const c = a.categoryName.localeCompare(b.categoryName);
    if (c !== 0) return c;
    return a.name.localeCompare(b.name);
  });

  if (products.length === 0) {
    throw new Error("No products matched the selection.");
  }

  // Compact: one downscaled photo per product, no gallery grid — keeps the
  // merged PDF a downloadable size (185 full-res photos ≈ 225 MB otherwise).
  const buffer = await buildBrandedDatasheetPdf(products, { compact: true });

  return { buffer, count: products.length, filtered };
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(req.url);
  const skus = parseSkusFromUrl(url);

  try {
    const { buffer, count, filtered } = await buildPdf(skus);

    const date = new Date().toISOString().slice(0, 10);
    const suffix = filtered ? `${count}-selected` : `${count}-all`;
    const filename = `kimsafety-datasheets-${suffix}-${date}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate PDF";
    const status = msg.includes("No products") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // empty body -> treat as "all"
  }

  const skus = parseSkusFromBody(body) ?? parseSkusFromUrl(new URL(req.url));

  try {
    const { buffer, count, filtered } = await buildPdf(skus);

    const date = new Date().toISOString().slice(0, 10);
    const suffix = filtered ? `${count}-selected` : `${count}-all`;
    const filename = `kimsafety-datasheets-${suffix}-${date}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate PDF";
    const status = msg.includes("No products") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
