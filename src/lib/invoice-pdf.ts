import PDFDocument from "pdfkit";
import { getAllSettings } from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { readLogoBytes } from "@/lib/logo";
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
  company?: string | null;
  payment_phone?: string | null;
  mpesa_transaction_id?: string | null;
  mpesa_checkout_id?: string | null;
  paystack_reference?: string | null;
  paystack_transaction_id?: string | null;
  po_ref?: string | null;
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

  const items = JSON.parse(order.items) as { productId: string; qty: number; name?: string; price?: number }[];
  // An invoice is a historical financial document: it must show the price the
  // customer actually paid (captured on the order), never today's catalog
  // price — otherwise an admin price edit would silently rewrite old invoices
  // so their lines no longer sum to the stored total.
  const rows = (await Promise.all(items.map(async (i) => {
      if (typeof i.price === "number" && i.price > 0) {
        return { name: i.name || i.productId, qty: i.qty, price: i.price };
      }
      const p = await liveGetProduct(i.productId);
      return { name: i.name || (p?.name ?? i.productId), qty: i.qty, price: p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0) };
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
  const logoBuf = await readLogoBytes(s.logo);
  const logoH = 62;
  if (logoBuf) doc.image(logoBuf, padL, 32, { height: logoH });
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
  // Paid invoices carry the gateway transaction code: the M-Pesa transaction
  // code (receipt number) captured from the STK callback, the Paystack
  // transaction ID (falling back to our initialization reference), or the
  // purchase-order reference for corporate orders.
  // For M-Pesa, the checkout ID is always known (set at STK initiation) and
  // serves as an interim reference when the gateway receipt has not yet been
  // captured (STK-query fallback carries no receipt; callback may still be
  // in-flight). Falling back to it ensures a paid invoice never prints a
  // blank "Ref" — the real receipt overwrites it when the late callback
  // backfills mpesa_transaction_id.
  const txnId = paid
    ? order.payment === "mpesa"
      ? order.mpesa_transaction_id || order.mpesa_checkout_id
      : order.payment === "card"
        ? order.paystack_transaction_id || order.paystack_reference
        : order.payment === "po"
          ? order.po_ref
          : null
    : null;
  const paymentValue = `${paymentLabel[order.payment] ?? order.payment}${txnId ? ` · Ref ${txnId}` : ""}`;
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
    .text(`  ${paymentValue}`, padL + 100, metaY, { width: 168 });
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
    // 30-day terms only apply to corporate purchase orders — everyone else pays
    // on receipt (M-Pesa/card are collected before dispatch).
    const isCorporate = order.payment === "po";
    const due = new Date(order.created_at);
    if (isCorporate) due.setDate(due.getDate() + 30);
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
        : order.payment === "po"
          ? "Payment is due within 30 days of the invoice date. Approved corporate accounts only."
          : "Payment is due on receipt of this invoice. Orders are dispatched once payment is confirmed.",
      totalX,
      ty,
      { width: totalW }
    );
  ty += 18;

  // ---- Manual payment fallback (unpaid invoices only) ----
  // Shown ONLY on unpaid invoices: if the M-Pesa STK push or card checkout
  // failed, the client can still settle the invoice manually via the Buy
  // Goods till and quote the invoice number.
  if (!paid) {
    const till = s.mpesa_till || "4178866";
    // Confirmation SMS go to the same WhatsApp number shown across the
    // storefront (Settings → whatsapp); formatted for print here.
    const waDigits = (s.whatsapp || "254715135141").replace(/\D/g, "");
    const waDisplay = `+${waDigits.slice(0, 3)} ${waDigits.slice(3)}`;
    // Payment steps render as a numbered list so customers can follow them
    // top-to-bottom without parsing arrow-separated prose.
    const steps = [
      "Open M-Pesa on your phone",
      "Choose Lipa na M-Pesa, then Buy Goods and Services",
      `Enter Till Number ${till} (KimSafety Ltd)`,
      `Enter Amount ${fmt(order.total)}`,
      `Enter "${order.id}" as the account / reference`,
      `Send the confirmation SMS to WhatsApp ${waDisplay} — we'll confirm and dispatch`,
    ];
    const boxH = 112;
    // Keep clear of the date stamp zone on the last page (bottom-right).
    if (ty + boxH > pageH - 210) {
      doc.addPage();
      ty = tableTopNext + 10;
    }
    doc.roundedRect(padL, ty, padR - padL, boxH, 6).fillAndStroke("#FFF7ED", SAFETY);
    doc
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor(NAVY)
      .text("COULDN'T PAY ONLINE? MANUAL M-PESA FALLBACK", padL + 14, ty + 8, { width: padR - padL - 28 });
    doc.font("Helvetica").fontSize(8.5).fillColor("#374151");
    let stepY = ty + 24;
    for (let i = 0; i < steps.length; i++) {
      doc.text(`${i + 1}.  ${steps[i]}`, padL + 14, stepY, { width: padR - padL - 28 });
      stepY += 14;
    }
    ty += boxH;
  }

  // ---- Stamp + till seal on the last page, above the footer ----
  const stampPath = join(process.cwd(), "public", "images", "logo", "stamp.png");
  let stampRect: { x: number; y: number; w: number; h: number } | null = null;
  if (fs.existsSync(stampPath)) {
    const stampW = 185;
    const range = doc.bufferedPageRange();
    doc.switchToPage(range.count - 1);
    const stampBuf = fs.readFileSync(stampPath);
    const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
    const stampX = padR - stampW;
    const stampY = pageH - 66 - 24 - stampH;
    doc.image(stampPath, stampX, stampY, { width: stampW });
    stampRect = { x: stampX, y: stampY, w: stampW, h: stampH };
    const dateStr = new Date(order.created_at)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
    doc
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#DC2626")
      .text(dateStr, stampX, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
  }
  // Unpaid invoices carry the M-Pesa till seal next to the stamp — it marks
  // the manual payment option described in the fallback box above.
  if (!paid) {
    const tillPath = join(process.cwd(), "public", "images", "logo", "till.png");
    if (fs.existsSync(tillPath)) {
      const tillW = 150;
      const tillBuf = fs.readFileSync(tillPath);
      const tillH = tillW * (tillBuf.readUInt32BE(20) / tillBuf.readUInt32BE(16));
      const rangeTill = doc.bufferedPageRange();
      doc.switchToPage(rangeTill.count - 1);
      const tillX = stampRect ? Math.max(padL, stampRect.x - 72 - tillW) : padR - tillW;
      // Same line as the stamp: centre both seals vertically.
      const tillY = stampRect ? stampRect.y + (stampRect.h - tillH) / 2 : pageH - 66 - 24 - tillH;
      doc.image(tillPath, tillX, tillY, { width: tillW });
    }
  }

  // ---- Footer drawn on every page via pageAdded handler ----
  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
