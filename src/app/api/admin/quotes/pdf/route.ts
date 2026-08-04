import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { requireAdmin, getSessionUser } from "@/lib/api-helpers";
import { getQuoteById } from "@/lib/db";
import { join } from "path";

export const runtime = "nodejs";

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const EMERALD = "#059669";
const GRAY = "#6B7280";
const LIGHT = "#F3F4F6";

const COMPANY = {
  name: "KimSafety Ltd",
  address: "KimSafety House, Enterprise Road,\nIndustrial Area, Nairobi, Kenya",
  phone: "+254 712 345 678",
  email: "sales@kimsafety.co.ke",
  website: "www.kimsafety.co.ke",
};

const money = (n: number) =>
  n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing quote id" }, { status: 400 });

  const quote = getQuoteById(id);
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const preparedBy = me?.name ?? "KimSafety Team";

  const items = JSON.parse(quote.items) as { productId: string; name: string; qty: number; price: number }[];
  const rows = items.filter((r) => r.qty > 0);
  if (rows.length === 0) return NextResponse.json({ error: "Quote has no items" }, { status: 400 });

  const issued = new Date(quote.created_at);
  const validUntil = quote.valid_until ? new Date(quote.valid_until) : new Date(issued.getTime() + 14 * 86400000);
  const subtotal = rows.reduce((n, r) => n + r.price * r.qty, 0);

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
    doc.rect(0, pageH - 50, pageW, 50).fill(NAVY);
    doc.rect(0, pageH - 53, pageW, 3).fill(SAFETY);
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
      .text("Quotation", padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text("Certified safety equipment · KEBS compliant stock", padR - 250, pageH - 37, { width: 250, align: "right" });
    doc
      .fontSize(7)
      .fillColor("#93A5BE")
      .text(`This quotation is valid until ${validUntil.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`, padR - 250, pageH - 29, { width: 250, align: "right" });
  };
  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Header: logo + QUOTATION (page 1 only) ----
  const logoPath = join(process.cwd(), "public", "images", "logo", "logoy.jpg");
  const logoH = 62;
  doc.image(logoPath, padL, 32, { height: logoH });
  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(NAVY)
    .text("QUOTATION", padR - 220, 34, { width: 220, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(GRAY)
    .text(`Quote #${quote.id}`, padR - 220, 68, { width: 220, align: "right" });
  doc
    .fontSize(8.5)
    .fillColor(GRAY)
    .text(
      `Issued: ${issued.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 220,
      82,
      { width: 220, align: "right" }
    );
  doc
    .fontSize(8.5)
    .fillColor(EMERALD)
    .text(
      `Valid until: ${validUntil.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`,
      padR - 220,
      96,
      { width: 220, align: "right" }
    );

  // ---- From / Bill to ----
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text("FROM", padL, 118);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(`${COMPANY.name}\n${COMPANY.address}\n${COMPANY.phone} · ${COMPANY.email}`, padL, 132, { width: 240, lineGap: 2 });

  const billX = pageW / 2 - 10;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text("BILL TO", billX, 118);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#374151")
    .text(
      [quote.name, quote.company, quote.email, quote.phone].filter(Boolean).join("\n"),
      billX,
      132,
      { width: padR - billX, lineGap: 2 }
    );

  // ---- Items table (paginated: rows flow onto new pages, never split mid-row) ----
  const col = { item: padL, qty: 330, unit: 370, amount: 460 };
  const colW = { item: col.qty - padL - 20, qty: 40, unit: 90, amount: padR - col.amount - 20 };
  const tableTop = 196;
  const tableTopNext = 40;
  const rowH = 34;
  const usableBottom = pageH - 20 - 130;
  const drawTableHeader = (top: number) => {
    doc.rect(padL, top, padR - padL, 22).fill(NAVY);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor("#FFFFFF");
    doc.text("ITEM NAME", col.item + 8, top + 7, { width: colW.item });
    doc.text("QTY", col.qty + 8, top + 7, { width: colW.qty });
    doc.text("UNIT PRICE", col.unit + 8, top + 7, { width: colW.unit });
    doc.text("AMOUNT", col.amount + 8, top + 7, { width: colW.amount });
  };
  drawTableHeader(tableTop);

  let y = tableTop + 22;
  rows.forEach((row, i) => {
    const lines = Math.max(1, Math.ceil(doc.widthOfString(row.name) / colW.item) + 1);
    const rh = Math.max(rowH, lines * 12 + 6);
    if (y + rh > usableBottom) {
      doc.addPage();
      drawTableHeader(tableTopNext);
      y = tableTopNext + 22;
    }
    if (i % 2 === 1) doc.rect(padL, y, padR - padL, rh).fill(LIGHT);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#1F2937")
      .text(row.name, col.item + 8, y + 6, { width: colW.item, lineGap: 2 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#1F2937")
      .text(String(row.qty), col.qty + 8, y + (rh - 11) / 2, { width: colW.qty });
    doc.text(money(row.price), col.unit + 8, y + (rh - 11) / 2, { width: colW.unit });
    doc.font("Helvetica-Bold").text(money(row.price * row.qty), col.amount + 8, y + (rh - 11) / 2, { width: colW.amount });
    y += rh;
  });

  doc.moveTo(padL, y).lineTo(padR, y).lineWidth(1).strokeColor("#E5E7EB").stroke();

  // ---- Totals (moved to a fresh page if they would not fit) ----
  if (y + 170 > pageH - 70) {
    doc.addPage();
    y = tableTopNext + 10;
  }
  const totalX = 300;
  const totalW = padR - totalX;
  let ty = y + 14;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#374151")
    .text("Subtotal", totalX + 12, ty, { width: 140 });
  doc.text(money(subtotal), totalX + 152, ty, { width: totalW - 164, align: "right" });
  ty += 17;
  doc
    .font("Helvetica-Oblique")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Inclusive of 16% VAT where applicable", totalX + 12, ty, { width: totalW - 164 });
  ty += 26;
  doc.rect(totalX, ty + 2, totalW, 30).fill(NAVY);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#FFFFFF")
    .text("TOTAL", totalX + 12, ty + 9, { width: 140 });
  doc.text(money(subtotal), totalX + 152, ty + 9, { width: totalW - 164, align: "right" });
  ty += 46;

  if (quote.notes?.trim()) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(NAVY)
      .text("NOTES", padL, ty, { width: 200 });
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#374151")
      .text(quote.notes.trim(), padL, ty + 14, { width: padR - padL, lineGap: 2 });
    ty += 14 + Math.ceil(quote.notes.trim().length / 140) * 12 + 14;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(NAVY)
    .text(`PREPARED BY: ${preparedBy}`, padL, ty + 6, { width: padR - padL });
  const prepY = ty + 26;
  doc.rect(padL, prepY, (padR - padL) / 2 - 15, 44).lineWidth(1).strokeColor("#E5E7EB");
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("Signature & date", padL + 14, prepY + 8, { width: (padR - padL) / 2 - 43 });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(GRAY)
    .text("To accept, reply to sales@kimsafety.co.ke or contact your account manager", padL, prepY + 58, { width: padR - padL });

  // ---- Footer drawn on every page via pageAdded handler ----
  doc.end();
  const pdf = await new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-quotation-${quote.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
