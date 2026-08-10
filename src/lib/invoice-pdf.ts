import PDFDocument from "pdfkit";
import { getAllSettings } from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { join } from "path";
import fs from "fs";

export type InvoiceOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment: string;
  paid: number;
  created_at: string;
};

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const EMERALD = "#059669";
const GRAY = "#6B7280";
const LIGHT = "#F3F4F6";

const FALLBACK_COMPANY = {
  name: "KimSafety Ltd",
  address: "KimSafety House, Enterprise Road,\nIndustrial Area, Nairobi, Kenya",
  phone: "+254 715135141",
  email: "sales@kimsafety.co.ke",
  website: "www.kimsafety.co.ke",
};

const paymentLabel: Record<string, string> = {
  mpesa: "M-Pesa",
  card: "Card (Paystack)",
  po: "Purchase Order (30-day terms)",
};

const fmt = (n: number) =>
  "KES " + Math.round(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(n: number) {
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function buildInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  const s = await getAllSettings();
  const COMPANY = {
    name: s.site_name || FALLBACK_COMPANY.name,
    address: s.address || FALLBACK_COMPANY.address,
    phone: s.phone || FALLBACK_COMPANY.phone,
    email: s.email || FALLBACK_COMPANY.email,
    website: FALLBACK_COMPANY.website,
  };

  const items = JSON.parse(order.items) as { productId: string; qty: number; price?: number }[];
  const rows = (await Promise.all(items.map(async (i) => {
      const p = await liveGetProduct(i.productId);
      return { name: p?.name ?? i.productId, qty: i.qty, price: p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0) };
    }))).filter((r) => r.qty > 0);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 20, left: 50, right: 50 },
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));

  const paid = order.paid === 1;
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
      .text("Thank you for your business", padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("Certified safety equipment · KEBS compliant stock", padR - 250, pageH - 37, { width: 250, align: "right" });
    doc
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("E&OE · Goods remain property of KimSafety Ltd until paid in full", padR - 250, pageH - 29, { width: 250, align: "right" });
  };
  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Header: logo + INVOICE (page 1 only) ----
  const logoPath = join(process.cwd(), "public", s.logo || "/images/logo/logoy.jpg");
  const logoH = 62;
  if (fs.existsSync(logoPath)) doc.image(logoPath, padL, 32, { height: logoH });
  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(NAVY)
    .text("INVOICE", padR - 220, 34, { width: 220, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GRAY)
    .text(`Invoice #${order.id}`, padR - 220, 68, { width: 220, align: "right" });
  doc
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Issued: ${new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 220,
      82,
      { width: 220, align: "right" }
    );

  // ---- From / Bill to ----
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

  const billX = pageW / 2 - 10;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text("BILL TO", billX, 110);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(
      `${order.name}\n${order.address}\n${order.phone} · ${order.email}`,
      billX,
      124,
      { width: padR - billX, lineGap: 2 }
    );

  // ---- Meta line ----
  const metaY = 178;
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("PAYMENT METHOD", padL, metaY, { width: 100 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#374151")
    .text(`  ${paymentLabel[order.payment] ?? order.payment}`, padL + 100, metaY, { width: 160 });
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("STATUS", 330, metaY, { width: 60 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(paid ? EMERALD : "#DC2626")
    .text(`  ${paid ? "Paid in full" : "Payment due"}`, 390, metaY, { width: 70 });
  if (!paid) {
    const due = new Date(order.created_at);
    due.setDate(due.getDate() + 30);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(GRAY)
      .text("DUE", padR - 82, metaY, { width: 32 });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#374151")
      .text(
        due.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
        padR - 50,
        metaY,
        { width: 50, align: "right" }
      );
  }

  // ---- PAID / UNPAID banner ----
  const bannerY = 196;
  doc.roundedRect(padL, bannerY, padR - padL, 26, 6).fill(paid ? "#ECFDF5" : "#FEF2F2");
  doc.roundedRect(padL, bannerY, padR - padL, 26, 6).lineWidth(1.5).stroke(paid ? EMERALD : "#DC2626");
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(paid ? EMERALD : "#DC2626")
    .text(paid ? "PAID IN FULL" : "UNPAID — PAYMENT DUE", padL, bannerY + 5.5, { width: padR - padL, align: "center" });

  // ---- Items table (paginated: rows flow onto new pages, never split mid-row) ----
  const col = { item: padL, qty: 330, unit: 370, amount: 460 };
  const colW = { item: col.qty - padL - 20, qty: 40, unit: 90, amount: padR - col.amount - 20 };
  const tableTop = 236; // first page: below the header blocks
  const tableTopNext = 40; // continuation pages: start right below the top bar
  const rowH = 30;
  const usableBottom = pageH - 20 - 80; // reserve space for totals + footer
  const drawTableHeader = (top: number) => {
    doc.rect(padL, top, padR - padL, 22).fill(NAVY);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#FFFFFF");
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
    doc.text(money(row.price), col.unit + 8, y + 9, { width: colW.unit });
    doc.font("Helvetica-Bold").text(money(row.price * row.qty), col.amount + 8, y + 9, { width: colW.amount });
    y += rowH;
  });

  doc.moveTo(padL, y).lineTo(padR, y).lineWidth(1).strokeColor("#E5E7EB").stroke();

  // ---- Totals (moved to a fresh page if they would not fit) ----
  if (y + 160 > usableBottom) {
    doc.addPage();
    y = tableTopNext + 10;
  }
  const totalX = 300;
  const totalW = padR - totalX;
  let ty = y + 14;
  const totalRow = (label: string, value: string, bold = false, color = "#374151") => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor(color)
      .text(label, totalX + 12, ty, { width: 140 });
    doc.text(value, totalX + 152, ty, { width: totalW - 164, align: "right" });
    ty += 17;
  };
  const fullPrice = order.subtotal + order.discount;
  totalRow("Subtotal (full price)", fmt(fullPrice));
  if (order.discount > 0) totalRow("Discount", `-${fmt(order.discount)}`, false, EMERALD);
  totalRow("Delivery", order.shipping === 0 ? "FREE" : fmt(order.shipping));
  doc.rect(totalX, ty + 2, totalW, 30).fill(NAVY);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#FFFFFF")
    .text("TOTAL (incl. 16% VAT)", totalX + 12, ty + 9, { width: 140 });
  doc.text(fmt(order.total), totalX + 152, ty + 9, { width: totalW - 164, align: "right" });
  ty += 46;

  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      paid
        ? "This invoice has been settled in full. Thank you for choosing KimSafety."
        : "Payment is due within 30 days of the invoice date. Approved corporate accounts only.",
      totalX,
      ty,
      { width: totalW }
    );

  // ---- Stamp on the last page, above the footer ----
  const stampPath = join(process.cwd(), "public", "images", "logo", "stamp.png");
  if (fs.existsSync(stampPath)) {
    const stampW = 185;
    const range = doc.bufferedPageRange();
    doc.switchToPage(range.count - 1);
    const stampBuf = fs.readFileSync(stampPath);
    const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
    const stampY = pageH - 66 - 24 - stampH;
    doc.image(stampPath, padR - stampW, stampY, { width: stampW });
    const dateStr = new Date(order.created_at)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#DC2626")
      .text(dateStr, padR - stampW, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
  }

  // ---- Footer drawn on every page via pageAdded handler ----
  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
