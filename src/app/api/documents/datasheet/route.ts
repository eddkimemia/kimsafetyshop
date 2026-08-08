import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { liveCatalog } from "@/lib/catalog";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const NAVY = "#0F2847";
const GRAY = "#6B7280";
const LIGHT = "#F3F4F6";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku");
  if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 });

  const product = (await liveCatalog()).find((p) => p.sku === sku || p.slug === sku || p.id === sku);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 40, left: 50, right: 50 },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  doc.rect(0, 0, 595, 90).fill(NAVY);
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#FFFFFF")
    .text("KimSafety", 50, 26);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#F57C00")
    .text("Product Datasheet", 50, 54);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(NAVY)
    .text(product.name, 50, 115, { width: 495 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(
      `SKU: ${product.sku}   ·   Brand: ${product.brand}   ·   Category: ${product.categoryName}`,
      50,
      138
    );

  let y = 168;
  doc.rect(50, y, 495, 22).fill(LIGHT);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(NAVY)
    .text("Key Information", 56, y + 6);
  y += 30;
  const facts: [string, string][] = [
    ["Price", `KES ${Math.round(product.price).toLocaleString("en-KE")}`],
    ["Stock status", product.stock > 0 ? "In stock" : "Out of stock"],
  ];
  if (product.model) facts.push(["Model", product.model]);
  if (product.certification) facts.push(["Certification", product.certification]);
  if (product.standard) facts.push(["Standard", product.standard]);
  if (product.material) facts.push(["Material", product.material]);
  if (product.warranty) facts.push(["Warranty", product.warranty]);
  if (product.shelfLife) facts.push(["Shelf life", product.shelfLife]);
  for (const [label, value] of facts) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(label, 50, y, { width: 130, continued: true });
    doc.font("Helvetica").fillColor("#111827").text(value, 190, y, { width: 355 });
    y += 17;
  }

  if (product.specs.length > 0) {
    y += 10;
    doc.rect(50, y, 495, 22).fill(LIGHT);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text("Specifications", 56, y + 6);
    y += 30;
    for (const spec of product.specs.slice(0, 14)) {
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(spec.label, 50, y, { width: 170, continued: true });
      doc.font("Helvetica").fillColor("#111827").text(spec.value, 230, y, { width: 315 });
      y += 16;
    }
  }

  const desc = product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (desc) {
    y += 10;
    doc.rect(50, y, 495, 22).fill(LIGHT);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text("Description", 56, y + 6);
    y += 30;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#374151")
      .text(desc, 50, y, { width: 495, height: 120 });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(NAVY)
    .text("www.kimsafety.co.ke  ·  sales@kimsafety.co.ke  ·  +254 715 135 141", 50, 800, {
      align: "center",
    });

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="kimsafety-datasheet-${slugify(product.slug)}.pdf"`,
    },
  });
}
