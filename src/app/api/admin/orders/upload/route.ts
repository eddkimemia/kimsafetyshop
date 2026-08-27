import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getOrderById, setOrderDeliveryNote, setOrderKraInvoice } from "@/lib/db";
import { deleteStoredFile, saveStoredFile, sniffType } from "@/lib/file-store";
import { sendKraInvoiceEmail } from "@/lib/mailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { PDFDocument as PdfLibDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeOrderFilename(orderId: string, type: "delivery_note" | "kra_invoice", ext: string) {
  const suffix = type === "delivery_note" ? "delivery-note" : "kra-invoice";
  // Include timestamp so replacing a file yields a new URL and bypasses browser/CDN cache (documents route is no-store, but unique URL is extra safety).
  return `${orderId}-${suffix}-${Date.now().toString(36)}${ext}`;
}

async function imageToPdfBuffer(imageBuf: Buffer): Promise<Buffer> {
  // Convert a signed delivery note image (jpg/png/webp) into a PDF so the
  // order always stores a PDF for consistency. Uses pdfkit — the image is
  // scaled to fit A4 with margins.
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margins: { top: 36, bottom: 36, left: 36, right: 36 } });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      // Try to place image full-page; pdfkit handles jpg/png natively.
      // WebP needs sharp conversion to jpeg first.
      doc.image(imageBuf, 36, 36, {
        fit: [doc.page.width - 72, doc.page.height - 72],
        align: "center",
        valign: "center",
      });
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function maybeConvertWebp(buf: Buffer): Promise<Buffer> {
  const kind = sniffType(buf);
  if (kind === "webp") {
    try {
      const sharp = (await import("sharp")).default;
      return await sharp(buf).jpeg({ quality: 88 }).toBuffer();
    } catch {
      return buf;
    }
  }
  return buf;
}

async function stampPdfBuffer(pdfBuffer: Buffer, orderCreatedAt?: string): Promise<Buffer> {
  try {
    const stampPath = path.join(process.cwd(), "public", "images", "logo", "stamp.png");
    if (!fs.existsSync(stampPath)) return pdfBuffer;
    const stampBytes = fs.readFileSync(stampPath);
    const pdfDoc = await PdfLibDocument.load(pdfBuffer);
    const stampImage = await pdfDoc.embedPng(stampBytes);
    const pages = pdfDoc.getPages();
    if (pages.length === 0) return pdfBuffer;
    // Mirror the exact stamping used in invoice/delivery-note PDFs (src/lib/invoice-pdf.ts, delivery-note route):
    // stamp 185pt wide, placed above the 66pt footer with 24pt gap, right-aligned.
    // In pdfkit: stampX = pageW - 50 - 185, stampY = pageH - 66 - 24 - stampH (from top).
    // In pdf-lib (bottom-origin): x = width - 50 - 185, y = 66 + 24 = 90 from bottom.
    const lastPage = pages[pages.length - 1];
    const { width } = lastPage.getSize();
    const stampW = 185;
    const stampH = stampW * (stampImage.height / stampImage.width);
    const stampX = width - 50 - stampW;
    const stampY = 66 + 24; // 90pt above bottom, just above footer
    lastPage.drawImage(stampImage, {
      x: stampX,
      y: stampY,
      width: stampW,
      height: stampH,
    });
    // Date centred over the stamp — same Courier-Bold 14 red as other documents
    try {
      const font = await pdfDoc.embedFont(StandardFonts.CourierBold);
      const base = orderCreatedAt ? new Date(orderCreatedAt) : new Date();
      const dateStr = base
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase();
      const fontSize = 14;
      const textWidth = font.widthOfTextAtSize(dateStr, fontSize);
      lastPage.drawText(dateStr, {
        x: stampX + (stampW - textWidth) / 2,
        y: stampY + (stampH - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(0.86, 0.15, 0.15),
        opacity: 1,
      });
    } catch {}
    const out = await pdfDoc.save();
    return Buffer.from(out);
  } catch (e) {
    console.error("[upload] stampPdf failed, serving original", (e as Error).message);
    return pdfBuffer;
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file") as File | null;
  const orderId = String(form.get("orderId") ?? form.get("id") ?? "").trim();
  const type = String(form.get("type") ?? "").trim() as "delivery_note" | "kra_invoice";

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  if (type !== "delivery_note" && type !== "kra_invoice") {
    return NextResponse.json({ error: "type must be delivery_note or kra_invoice" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (buf.length > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 400 });
  }

  const kind = sniffType(buf);
  const isPdf = kind === "pdf";
  const isImage = kind === "jpg" || kind === "png" || kind === "webp";

  if (!isPdf && !isImage) {
    return NextResponse.json({ error: "Only PDF, JPG, PNG or WEBP allowed" }, { status: 400 });
  }

  // KRA invoice prefers PDF, but images are accepted and converted too.
  let pdfBuffer: Buffer;
  let filename: string;

  if (isPdf) {
    pdfBuffer = buf;
    filename = safeOrderFilename(orderId, type, ".pdf");
  } else {
    // Image → PDF conversion for delivery notes (and optionally KRA)
    const imgBuf = await maybeConvertWebp(buf);
    try {
      pdfBuffer = await imageToPdfBuffer(imgBuf);
    } catch (e) {
      console.error("[upload] image→pdf failed", e);
      return NextResponse.json({ error: "Failed to convert image to PDF" }, { status: 500 });
    }
    filename = safeOrderFilename(orderId, type, ".pdf");
  }

  // KRA invoices are stamped with the company seal before saving (same seal/date as invoices)
  if (type === "kra_invoice") {
    pdfBuffer = await stampPdfBuffer(pdfBuffer, order.created_at);
  }

  // Store in DB-backed file store
  await saveStoredFile(filename, pdfBuffer, "application/pdf");

  // Also mirror to public/uploads/documents for local dev inspection
  try {
    const fs2 = await import("fs");
    const path2 = await import("path");
    const dir = path2.join(process.cwd(), "public", "uploads", "documents");
    fs2.mkdirSync(dir, { recursive: true });
    fs2.writeFileSync(path2.join(dir, filename), pdfBuffer);
  } catch {}

  const publicPath = `/uploads/documents/${filename}`;

  if (type === "delivery_note") {
    await setOrderDeliveryNote(orderId, publicPath);
    // Clean up previous file so DB doesn't accumulate orphans; best-effort.
    if (order.delivery_note_file) {
      const old = path.basename(order.delivery_note_file);
      if (old !== filename) {
        try {
          await deleteStoredFile(old);
        } catch {}
        try {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", "documents", old));
        } catch {}
      }
    }
  } else {
    await setOrderKraInvoice(orderId, publicPath);
    if (order.kra_invoice_file) {
      const old = path.basename(order.kra_invoice_file);
      if (old !== filename) {
        try {
          await deleteStoredFile(old);
        } catch {}
        try {
          fs.unlinkSync(path.join(process.cwd(), "public", "uploads", "documents", old));
        } catch {}
      }
    }
    // Auto-send the stamped KRA invoice to the customer
    try {
      await sendKraInvoiceEmail({
        to: order.email,
        name: order.name,
        orderId: order.id,
        pdf: pdfBuffer,
      });
    } catch (e) {
      console.error(`[upload] KRA email failed for ${orderId}:`, (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true, file: publicPath, filename });
}
