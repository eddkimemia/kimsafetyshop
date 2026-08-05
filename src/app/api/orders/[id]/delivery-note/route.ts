import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getOrderById, getAllSettings } from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";
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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const s = getAllSettings();
  const COMPANY = {
    name: s.site_name || FALLBACK_COMPANY.name,
    address: s.address || FALLBACK_COMPANY.address,
    phone: s.phone || FALLBACK_COMPANY.phone,
    email: s.email || FALLBACK_COMPANY.email,
    website: FALLBACK_COMPANY.website,
  };

  const order = getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const items = JSON.parse(order.items) as { productId: string; qty: number; price?: number }[];
  const rows = items
    .map((i) => {
      const p = liveGetProduct(i.productId);
      return { name: p?.name ?? i.productId, qty: i.qty };
    })
    .filter((r) => r.qty > 0);

  const totalUnits = rows.reduce((n, r) => n + r.qty, 0);

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
      .text("Delivery Note", padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("Certified safety equipment · KEBS compliant stock", padR - 250, pageH - 37, { width: 250, align: "right" });
    doc
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("Goods received in good condition unless noted on this note", padR - 250, pageH - 29, { width: 250, align: "right" });
  };
  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Header: logo + DELIVERY NOTE (page 1 only) ----
  const logoPath = join(process.cwd(), "public", s.logo || "/images/logo/logoy.jpg");
  const logoH = 62;
  if (fs.existsSync(logoPath)) doc.image(logoPath, padL, 32, { height: logoH });
  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(NAVY)
    .text("DELIVERY NOTE", padR - 250, 34, { width: 250, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GRAY)
    .text(`Note #${order.id}`, padR - 250, 68, { width: 250, align: "right" });
  doc
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Issued: ${new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 250,
      82,
      { width: 250, align: "right" }
    );

  // ---- From / Ship to ----
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text("FROM", padL, 110);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(`${COMPANY.name}\n${COMPANY.address}\n${COMPANY.phone} · ${COMPANY.email}`, padL, 124, { width: 240, lineGap: 2 });

  const shipX = pageW / 2 - 10;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text("SHIP TO", shipX, 110);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(
      `${order.name}\n${order.address}\n${order.phone} · ${order.email}`,
      shipX,
      124,
      { width: padR - shipX, lineGap: 2 }
    );

  // ---- Meta line ----
  const metaY = 178;
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("ORDER", padL, metaY, { width: 100 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#374151")
    .text(`  #${order.id}`, padL + 100, metaY, { width: 160 });
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("UNITS", 330, metaY, { width: 60 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#374151")
    .text(`  ${totalUnits}`, 390, metaY, { width: 70 });
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("PACKAGES", padR - 82, metaY, { width: 70 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#374151")
    .text("  ______", padR - 12, metaY, { width: 60 });

  // ---- Items table (paginated: rows flow onto new pages, never split mid-row) ----
  const col = { item: padL, qty: 330, placeholder: 370 };
  const colW = { item: col.qty - padL - 20, qty: 40, placeholder: padR - col.placeholder - 20 };
  const tableTop = 236; // first page: below the header blocks
  const tableTopNext = 40; // continuation pages: start right below the top bar
  const rowH = 30;
  const usableBottom = pageH - 20 - 130; // reserve space for signature blocks + footer
  const drawTableHeader = (top: number) => {
    doc.rect(padL, top, padR - padL, 22).fill(NAVY);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#FFFFFF");
    doc.text("ITEM", col.item + 8, top + 7, { width: colW.item });
    doc.text("QTY", col.qty + 8, top + 7, { width: colW.qty });
    doc.text("CONDITION", col.placeholder + 8, top + 7, { width: colW.placeholder });
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
    y += rowH;
  });

  doc.moveTo(padL, y).lineTo(padR, y).lineWidth(1).strokeColor("#E5E7EB").stroke();

  // ---- Signature blocks (moved to a fresh page if they would not fit) ----
  if (y + 150 > pageH - 70) {
    doc.addPage();
    y = tableTopNext + 10;
  }

  const boxW = (padR - padL - 30) / 2;
  let sy = y + 30;
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(NAVY)
    .text("RECEIVED BY:", padL, sy, { width: boxW });
  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(NAVY)
    .text("DELIVERED BY:", padL + boxW + 30, sy, { width: boxW });

  const sigY = sy + 34;
  doc.rect(padL, sigY, boxW, 44).lineWidth(1).strokeColor("#E5E7EB");
  doc.rect(padL + boxW + 30, sigY, boxW, 44).lineWidth(1).strokeColor("#E5E7EB");

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Signature", padL + 14, sigY + 8, { width: boxW - 28 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Signature", padL + boxW + 44, sigY + 8, { width: boxW - 28 });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Name: …………………", padL + 14, sigY + 24, { width: boxW - 28 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Name: …………………", padL + boxW + 44, sigY + 24, { width: boxW - 28 });

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Date: …………………", padL + 14, sigY + 38, { width: boxW - 28 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Date: …………………", padL + boxW + 44, sigY + 38, { width: boxW - 28 });

  sy = sigY + 58;
  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      "By signing this delivery note, the recipient confirms the goods listed above were received in good condition and in the quantities stated.",
      padL,
      sy,
      { width: padR - padL }
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
    const dateStr = new Date(order.created_at)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    doc
      .font("Courier-Bold")
      .fontSize(11)
      .fillColor("#DC2626")
      .text(dateStr, padR - stampW, stampY + (stampH - 13) / 2, { width: stampW, align: "center" });
  }

  // ---- Footer drawn on every page via pageAdded handler ----
  doc.end();
  const pdf = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-delivery-note-${order.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
