import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getSupplierOrder, getAllSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { join } from "path";
import fs from "fs";

export const runtime = "nodejs";

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const GRAY = "#6B7280";
const LIGHT = "#F3F4F6";

const FALLBACK_COMPANY = {
  name: "KimSafety Ltd",
  address: "KimSafety House, Enterprise Road,\nIndustrial Area, Nairobi, Kenya",
  phone: "+254 715135141",
  email: "sales@kimsafety.co.ke",
  website: "www.kimsafety.co.ke",
};

const fmt = (n: number) =>
  "KES " + Math.round(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const s = getAllSettings();
  const COMPANY = {
    name: s.site_name || FALLBACK_COMPANY.name,
    address: s.address || FALLBACK_COMPANY.address,
    phone: s.phone || FALLBACK_COMPANY.phone,
    email: s.purchases_email || FALLBACK_COMPANY.email,
    website: FALLBACK_COMPANY.website,
  };

  const po = getSupplierOrder(params.id);
  if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

  const items = JSON.parse(po.items) as { name: string; qty: number; unitPrice: number }[];
  const rows = items.filter((i) => i.qty > 0);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 20, left: 50, right: 50 },
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const padL = 50;
  const padR = pageW - 50;

  // ---- Page chrome (top bar + footer) drawn on EVERY page ----
  const drawPageChrome = () => {
    doc.rect(0, 0, pageW, 12).fill(NAVY);
    doc.rect(0, 12, pageW, 3).fill(SAFETY);
    doc.rect(0, pageH - 66, pageW, 66).fill(NAVY);
    doc.rect(0, pageH - 69, pageW, 3).fill(SAFETY);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#FFFFFF")
      .text(COMPANY.name, padL, pageH - 48, { width: 300 });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#C7D2E0")
      .text(COMPANY.address.replace(/\n/g, " "), padL, pageH - 38, { width: 360 });
    doc
      .fontSize(7.5)
      .fillColor("#93A5BE")
      .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, padL, pageH - 30, { width: 360 });
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#C7D2E0")
      .text(`Purchase order ${po.id}`, padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("For internal use and supplier records", padR - 250, pageH - 37, { width: 250, align: "right" });
    doc
      .fontSize(7)
      .fillColor("#93A5BE")
      .text(`Status: ${po.status}`, padR - 250, pageH - 29, { width: 250, align: "right" });
  };
  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Header: logo + PURCHASE ORDER (page 1 only) ----
  const logoPath = join(process.cwd(), "public", s.logo || "/images/logo/logoy.jpg");
  const logoH = 62;
  if (fs.existsSync(logoPath)) doc.image(logoPath, padL, 32, { height: logoH });
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(NAVY)
    .text("PURCHASE ORDER", padR - 260, 36, { width: 260, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GRAY)
    .text(po.id, padR - 260, 66, { width: 260, align: "right" });
  doc
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Issued: ${new Date(po.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 260,
      80,
      { width: 260, align: "right" }
    );

  // ---- From / Bill to ----
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text("FROM", padL, 110);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(`${COMPANY.name}\n${COMPANY.address}\n${COMPANY.phone} · ${COMPANY.email}`, padL, 124, { width: 240, lineGap: 2 });

  const billX = pageW / 2 - 10;
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text("TO / SUPPLIER", billX, 110);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(
      [
        po.supplier,
        po.contact_name ?? "",
        po.phone ?? "",
        po.email ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
      billX,
      124,
      { width: 240, lineGap: 2 }
    );

  // ---- Meta strip ----
  const metaY = 196;
  doc.rect(padL, metaY, padR - padL, 26).fill(NAVY);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor("#FFFFFF")
    .text(`Expected delivery: ${po.expected_date ? new Date(po.expected_date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "To be agreed"}`, padL + 14, metaY + 9, { width: 320 });
  doc.text(`Status: ${po.status}`, padR - 190, metaY + 9, { width: 180, align: "right" });

  // ---- Items table (paginated) ----
  const col = { item: padL, qty: 330, unit: 370, amount: 460 };
  const colW = { item: col.qty - padL - 20, qty: 40, unit: 90, amount: padR - col.amount - 20 };
  const tableTop = 236;
  const tableTopNext = 40;
  const rowH = 30;
  const usableBottom = pageH - 20 - 80;
  const drawTableHeader = (top: number) => {
    doc.rect(padL, top, padR - padL, 22).fill(NAVY);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#FFFFFF");
    doc.text("ITEM", col.item + 8, top + 7, { width: colW.item });
    doc.text("QTY", col.qty + 8, top + 7, { width: colW.qty });
    doc.text("UNIT PRICE", col.unit + 8, top + 7, { width: colW.unit });
    doc.text("AMOUNT", col.amount + 8, top + 7, { width: colW.amount });
  };
  drawTableHeader(tableTop);

  let y = tableTop + 22;
  rows.forEach((row, i) => {
    if (y + rowH > usableBottom) {
      doc.addPage();
      drawTableHeader(tableTopNext);
      y = tableTopNext + 22;
    }
    if (i % 2 === 1) doc.rect(padL, y, padR - padL, rowH).fill(LIGHT);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#1F2937")
      .text(row.name, col.item + 8, y + 8, { width: colW.item, height: rowH - 8, ellipsis: true });
    doc.text(String(row.qty), col.qty + 8, y + 9, { width: colW.qty });
    doc.text(fmt(row.unitPrice), col.unit + 8, y + 9, { width: colW.unit });
    doc.font("Helvetica-Bold").text(fmt(row.unitPrice * row.qty), col.amount + 8, y + 9, { width: colW.amount });
    y += rowH;
  });

  doc.moveTo(padL, y).lineTo(padR, y).lineWidth(1).strokeColor("#E5E7EB").stroke();

  // ---- Totals ----
  if (y + 160 > usableBottom) {
    doc.addPage();
    y = tableTopNext + 10;
  }
  const totalX = 300;
  const totalW = padR - totalX;
  let ty = y + 14;
  const totalRow = (label: string, value: string, bold = false, color = "#374151") => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(color);
    doc.text(label, totalX + 12, ty, { width: 140 });
    doc.text(value, totalX + 152, ty, { width: totalW - 164, align: "right" });
    ty += 17;
  };
  totalRow("Subtotal", fmt(po.subtotal));
  if (po.shipping > 0) totalRow("Delivery / freight", fmt(po.shipping));
  doc.rect(totalX, ty + 2, totalW, 30).fill(NAVY);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF");
  doc.text("TOTAL", totalX + 12, ty + 9, { width: 140 });
  doc.text(fmt(po.total), totalX + 152, ty + 9, { width: totalW - 164, align: "right" });
  ty += 46;

  if (po.notes) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(8.5)
      .fillColor(GRAY)
      .text(`Notes: ${po.notes}`, totalX, ty, { width: totalW });
    ty += 20;
  }

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      "Please acknowledge receipt of this purchase order. Deliver goods to KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya.",
      totalX,
      ty,
      { width: totalW }
    );

  // ---- Stamp on the last page, above the footer ----
  const stampPath = join(process.cwd(), "public", "images", "logo", "stamp.png");
  if (fs.existsSync(stampPath)) {
    const stampW = 150;
    const stampY = pageH - 66 - 118;
    const range = doc.bufferedPageRange();
    doc.switchToPage(range.count - 1);
    const stampBuf = fs.readFileSync(stampPath);
    const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
    doc.image(stampPath, padR - stampW, stampY, { width: stampW });
    const dateStr = new Date(po.created_at)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    doc
      .font("Courier-Bold")
      .fontSize(11)
      .fillColor("#DC2626")
      .text(dateStr, padR - stampW, stampY + (stampH - 13) / 2, { width: stampW, align: "center" });
  }

  doc.end();
  const pdf = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-supplier-po-${po.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
