import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getOrderById, setOrderDeliveryNote, setOrderKraInvoice } from "@/lib/db";
import { saveStoredFile, sniffType } from "@/lib/file-store";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeOrderFilename(orderId: string, type: "delivery_note" | "kra_invoice", ext: string) {
  const suffix = type === "delivery_note" ? "delivery-note" : "kra-invoice";
  return `${orderId}-${suffix}${ext}`;
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

  // Store in DB-backed file store
  await saveStoredFile(filename, pdfBuffer, "application/pdf");

  // Also mirror to public/uploads/documents for local dev inspection
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", "documents");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), pdfBuffer);
  } catch {}

  const publicPath = `/uploads/documents/${filename}`;

  if (type === "delivery_note") {
    await setOrderDeliveryNote(orderId, publicPath);
  } else {
    await setOrderKraInvoice(orderId, publicPath);
  }

  return NextResponse.json({ ok: true, file: publicPath, filename });
}
