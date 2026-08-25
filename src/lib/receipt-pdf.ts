import PDFDocument from "pdfkit";
import fs from "fs";
import { join } from "path";
import { getAllSettings } from "@/lib/db";
import { readLogoBytes } from "@/lib/logo";
import type { InvoiceOrder } from "@/lib/invoice-pdf";

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const EMERALD = "#059669";
const GRAY = "#6B7280";

const FALLBACK_COMPANY = {
  name: "KimSafety Ltd",
  address: "KimSafety House, Enterprise Road,\nIndustrial Area, Nairobi, Kenya",
  phone: "+254 715135141",
  email: "sales@kimsafety.co.ke",
};

export const paymentLabel: Record<string, string> = {
  mpesa: "M-Pesa",
  card: "Card (Paystack)",
  po: "Purchase Order (30-day terms)",
};

const fmt = (n: number) =>
  "KES " + Math.round(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(n: number) {
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function chunkToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunkToWords(n % 100) : "");
}

function amountInWords(amount: number): string {
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  const groups: [number, string][] = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
  ];
  let rest = whole;
  const parts: string[] = [];
  for (const [value, label] of groups) {
    const count = Math.floor(rest / value);
    if (count > 0) {
      parts.push(`${chunkToWords(count)} ${label}`);
      rest -= count * value;
    }
  }
  if (rest > 0 || parts.length === 0) parts.push(chunkToWords(rest));
  let out = `Kenya Shillings ${parts.join(" ")}`;
  if (cents > 0) out += ` and ${cents}/100`;
  return out + " Only";
}

/**
 * Official payment receipt for a PAID order. Issued alongside the paid tax
 * invoice — attached to the "payment received" email and downloadable from
 * /api/orders/[id]/receipt.
 */
export async function buildReceiptPdf(order: InvoiceOrder): Promise<Buffer> {
  const s = await getAllSettings();
  const COMPANY = {
    name: s.site_name || FALLBACK_COMPANY.name,
    address: s.address || FALLBACK_COMPANY.address,
    phone: s.phone || FALLBACK_COMPANY.phone,
    email: s.email || FALLBACK_COMPANY.email,
  };

  // REAL gateway transaction code only (e.g. TB17CVOCY9 for M-Pesa, Paystack transaction ID).
  // No fallback to checkout ID / initialization reference.
  const txnId =
    order.payment === "mpesa"
      ? order.mpesa_transaction_id
      : order.payment === "card"
        ? order.paystack_transaction_id
        : order.payment === "po"
          ? order.po_ref
          : null;

  // Paid timestamp: the issued date of the confirmed transaction.
  const paidAt = new Date(order.created_at);

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

  // ---- Page chrome ----
  const drawPageChrome = () => {
    doc.rect(0, 0, pageW, 12).fill(NAVY);
    doc.rect(0, 12, pageW, 3).fill(SAFETY);
    doc.rect(0, pageH - 66, pageW, 66).fill(NAVY);
    doc.rect(0, pageH - 69, pageW, 3).fill(SAFETY);
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#FFFFFF").text(COMPANY.name, padL, pageH - 48, { width: 300 });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#C7D2E0")
      .text(COMPANY.address.replace(/\n/g, " "), padL, pageH - 38, { width: 360 });
    doc
      .fontSize(7.5)
      .fillColor("#93A5BE")
      .text(`${COMPANY.phone} · ${COMPANY.email} · www.kimsafety.co.ke`, padL, pageH - 30, { width: 360 });
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#C7D2E0")
      .text("Thank you for your business", padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("Keep this receipt for your records", padR - 250, pageH - 37, { width: 250, align: "right" });
  };
  drawPageChrome();

  // ---- Header: logo + OFFICIAL RECEIPT ----
  const logoBuf = await readLogoBytes(s.logo);
  if (logoBuf) doc.image(logoBuf, padL, 32, { height: 62 });
  doc
    .font("Helvetica-Bold")
    .fontSize(26)
    .fillColor(EMERALD)
    .text("RECEIPT", padR - 220, 36, { width: 220, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(GRAY).text(`Receipt #${order.id}`, padR - 220, 66, { width: 220, align: "right" });
  doc
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Issued: ${paidAt.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 220,
      80,
      { width: 220, align: "right" }
    );

  // ---- Received from ----
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text("RECEIVED FROM", padL, 112);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(`${order.name}${order.company ? ` (${order.company})` : ""}\n${order.address}\n${order.phone} · ${order.email}`, padL, 126, {
      width: 260,
      lineGap: 2,
    });

  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text("BEING PAYMENT FOR", 330, 112);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(
      `Invoice ${order.id} dated ${new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}\nCertified safety equipment (incl. 16% VAT)`,
      330,
      126,
      { width: padR - 330, lineGap: 2 }
    );

  // ---- Amount box ----
  const boxTop = 190;
  doc.roundedRect(padL, boxTop, padR - padL, 74, 8).fillAndStroke("#ECFDF5", EMERALD);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text("AMOUNT RECEIVED", padL + 18, boxTop + 12);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(EMERALD).text(fmt(order.total), padL + 18, boxTop + 28);
  doc
    .font("Helvetica-Oblique")
    .fontSize(8.5)
    .fillColor("#374151")
    .text(amountInWords(order.total), padL + 18, boxTop + 58, { width: padR - padL - 36 });

  // ---- Payment details ----
  const rows: [string, string][] = [
    ["Payment method", paymentLabel[order.payment] ?? order.payment],
    ...(order.payment_phone ? [["Paid via", order.payment_phone] as [string, string]] : []),
    ["Transaction reference", txnId || "—"],
    ["Invoice total", fmt(order.total)],
    ["Balance due", "KES 0.00 — settled in full"],
  ];
  let ry = boxTop + 98;
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text("PAYMENT DETAILS", padL, ry);
  ry += 16;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 1) doc.rect(padL, ry - 3, padR - padL, 18).fill("#F9FAFB");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text(label, padL + 6, ry + 2, { width: 200 });
    doc
      .font(value.startsWith("KES 0.00") ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor(value.startsWith("KES 0.00") ? EMERALD : "#1F2937")
      .text(value, padL + 210, ry + 2, { width: padR - padL - 216 });
    ry += 18;
  });

  // ---- Note + stamp ----
  ry += 14;
  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      "This receipt confirms full settlement of the above invoice. Goods remain property of KimSafety Ltd until paid in full. This document was generated electronically and is valid without signature.",
      padL,
      ry,
      { width: padR - padL - 200 }
    );

  const stampPath = join(process.cwd(), "public", "images", "logo", "stamp.png");
  if (fs.existsSync(stampPath)) {
    try {
      const stampW = 185;
      const stampBuf = fs.readFileSync(stampPath);
      const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
      const stampY = pageH - 66 - 24 - stampH;
      doc.image(stampBuf, padR - stampW, stampY, { width: stampW });
      const dateStr = paidAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
      doc
        .font("Courier-Bold")
        .fontSize(14)
        .fillColor("#DC2626")
        .text(dateStr, padR - stampW, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
    } catch {
      // stamp is decorative — never fail the receipt over it
    }
  }

  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

// Re-exported convenience for callers that only need the money formatter.
export { money as receiptMoney };
