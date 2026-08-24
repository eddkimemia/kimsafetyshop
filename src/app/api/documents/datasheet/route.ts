import { NextResponse } from "next/server";
import { liveCatalog } from "@/lib/catalog";
import { slugify } from "@/lib/utils";
import { buildBrandedDatasheetPdf } from "@/lib/branded-datasheet";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");
  if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 });

  const product = (await liveCatalog()).find((p) => p.sku === sku || p.slug === sku || p.id === sku);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const buffer = await buildBrandedDatasheetPdf([product]);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // Use same disposition as product page docs (/api/documents/[sku]/[index]) — direct download
      "Content-Disposition": `attachment; filename="kimsafety-datasheet-${slugify(product.slug)}.pdf"`,
    },
  });
}
