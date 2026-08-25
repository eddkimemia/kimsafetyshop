import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getAllSettings } from "@/lib/db";
import { readLogoBytes, getLogoSize, DEFAULT_LOGO } from "@/lib/logo";
import { readPublicFile } from "@/lib/file-store";
import { sanitizeGuideHtml } from "@/lib/knowledge";
import { guideFallbackSections } from "@/lib/data/guide-fallback";
import {
  NAVY,
  SAFETY,
  GREEN,
  GRAY,
  INK,
  LIGHT,
  SOFT,
  isSupportedImage,
  safeImage,
  createTextEngine,
  htmlToBlocks,
} from "@/lib/pdf-engine";

const COMPANY = {
  name: "KimSafety Kenya Ltd",
  address: "KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya",
  phone: "+254 715 135 141",
  email: "sales@kimsafety.co.ke",
  website: "www.kimsafety.co.ke",
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const fmtShortDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

export type GuidePdfInput = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  image?: string;
  content?: string;
};

/**
 * Branded, letterhead-quality PDF for a knowledge-center guide: cover image,
 * excerpt, full rich-text body (editor content, or the shared fallback
 * sections when the guide has none), closing CTA and stamp.
 */
export async function buildGuidePdf(guide: GuidePdfInput): Promise<Buffer> {
  const pdf = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 20, left: 50, right: 50 },
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  pdf.on("data", (c: Buffer) => chunks.push(c));

  const pageW = pdf.page.width;
  const pageH = pdf.page.height;
  const padL = 50;
  const padR = pageW - 50;
  const BODY_W = padR - padL;
  const usableBottom = pageH - 66;

  let y = 132;

  const ensure = (h: number) => {
    if (y + h > usableBottom) {
      pdf.addPage();
      y = 56;
      return true;
    }
    return false;
  };

  const drawPageChrome = () => {
    pdf.rect(0, 0, pageW, 12).fill(NAVY);
    pdf.rect(0, 12, pageW, 3).fill(SAFETY);
    pdf.rect(0, pageH - 66, pageW, 66).fill(NAVY);
    pdf.rect(0, pageH - 69, pageW, 3).fill(SAFETY);
    pdf.font("Helvetica-Bold").fontSize(8.5).fillColor("#FFFFFF").text(COMPANY.name, padL, pageH - 48, { width: 300 });
    pdf.font("Helvetica").fontSize(7.5).fillColor(LIGHT).text(COMPANY.address, padL, pageH - 38, { width: 360 });
    pdf
      .fontSize(7.5)
      .fillColor(SOFT)
      .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, padL, pageH - 30, { width: 360 });
    pdf
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(LIGHT)
      .text("Knowledge Center · Safety Guide", padR - 260, pageH - 48, { width: 260, align: "right" });
    pdf
      .font("Helvetica")
      .fontSize(7)
      .fillColor(SOFT)
      .text(`Date: ${fmtDate(new Date())}`, padR - 260, pageH - 37, { width: 260, align: "right" });
  };
  pdf.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Letterhead ----
  const settings = await getAllSettings().catch(() => null);
  let logoBuf = await readLogoBytes(settings?.logo as string | undefined);
  if (logoBuf && !isSupportedImage(logoBuf)) {
    try {
      const fb = await readLogoBytes(DEFAULT_LOGO);
      if (fb && isSupportedImage(fb)) logoBuf = fb;
      else logoBuf = undefined;
    } catch {
      logoBuf = undefined;
    }
  }
  if (logoBuf && isSupportedImage(logoBuf)) {
    try {
      pdf.image(logoBuf, padL, 30, { height: 50 });
    } catch {}
  }
  // Measure the logo's real width so the text block never overlaps it.
  const size = logoBuf ? getLogoSize(logoBuf) : null;
  const logoWidth = size ? Math.round((size.width / size.height) * 50) : 50 * 3.34;
  const textLeft = padL + Math.max(logoWidth, 140) + 14;
  const tagline = settings?.tagline || "";
  if (tagline) {
    pdf.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text(tagline, textLeft, 34, { width: padR - textLeft });
  }
  pdf.font("Helvetica").fontSize(10).fillColor(NAVY).text(COMPANY.address, textLeft, 52, { width: padR - textLeft });
  pdf
    .fontSize(10)
    .fillColor(NAVY)
    .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, textLeft, 66, { width: padR - textLeft });
  pdf.rect(padL, 118, BODY_W, 1.5).fill(SAFETY);

  // ---- Eyebrow + category ----
  pdf.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text("KNOWLEDGE CENTER — SAFETY GUIDE", padL, y);
  y += 15;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY).text((guide.category || "Guide").toUpperCase(), padL, y);
  y += 18;

  // ---- Title ----
  pdf.font("Helvetica-Bold").fontSize(22).fillColor(NAVY);
  const titleH = pdf.heightOfString(guide.title, { width: BODY_W });
  pdf.text(guide.title, padL, y, { width: BODY_W });
  y += titleH + 8;

  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(`${guide.readTime || "5 min read"} · Updated ${fmtDate(new Date())} · By the KimSafety HSE Team`, padL, y, {
      width: BODY_W,
    });
  y += 24;

  // ---- Cover image ----
  if (guide.image) {
    const coverBuf = await readPublicFile(guide.image);
    if (isSupportedImage(coverBuf)) {
      ensure(230);
      try {
        pdf.image(coverBuf!, padL, y, { fit: [BODY_W, 210], align: "center", valign: "center" });
      } catch {}
      pdf.rect(padL, y, BODY_W, 210).lineWidth(1).strokeColor("#E2E8F0").stroke();
      y += 224;
    }
  }

  // ---- Excerpt (quote block) ----
  if (guide.excerpt?.trim()) {
    pdf.font("Helvetica-Oblique").fontSize(11).fillColor(INK);
    const exLines = Math.ceil(pdf.widthOfString(guide.excerpt.trim(), { width: BODY_W - 28 }) / (BODY_W - 28)) || 1;
    const exH = Math.max(1, exLines) * 16;
    ensure(exH + 20);
    pdf.rect(padL, y, 3, exH).fill(SAFETY);
    pdf.text(guide.excerpt.trim(), padL + 14, y, { width: BODY_W - 28, lineGap: 3 });
    y += exH + 14;
  }

  // ---- Body ----
  const engine = createTextEngine(pdf, { padL, BODY_W, usableBottom, yRef: { get value() { return y; }, set value(v: number) { y = v; } } });

  const hasEditorContent = Boolean(guide.content?.trim());
  if (hasEditorContent) {
    for (const block of htmlToBlocks(sanitizeGuideHtml(guide.content ?? ""))) {
      engine.drawBlock(block);
    }
  } else {
    for (const section of guideFallbackSections()) {
      engine.sectionHeading(section.heading);
      engine.drawBlock({ kind: "p", runs: [{ text: section.body }] });
      if (section.points) {
        for (const pt of section.points) engine.drawBlock({ kind: "bullet", runs: [{ text: pt }] });
      }
      if (section.table && section.table.length > 1) {
        const cols = section.table[0].length;
        const colW = BODY_W / cols;
        const rowH = 20;
        ensure(rowH * section.table.length + 6);
        // header
        pdf.rect(padL, y, BODY_W, rowH).fill(NAVY);
        pdf.font("Helvetica-Bold").fontSize(7.5).fillColor("white");
        section.table[0].forEach((h, ci) => {
          pdf.text(h.toUpperCase(), padL + ci * colW + 6, y + 6, { width: colW - 12 });
        });
        y += rowH;
        section.table.slice(1).forEach((row, ri) => {
          ensure(rowH);
          const bg = ri % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
          pdf.rect(padL, y, BODY_W, rowH).fill(bg);
          row.forEach((cell, ci) => {
            pdf.font(ci === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(ci === 0 ? NAVY : INK);
            pdf.text(cell || "—", padL + ci * colW + 6, y + 6, { width: colW - 12 });
          });
          y += rowH;
        });
        y += 12;
      }
    }
  }

  // ---- Closing CTA ----
  ensure(200);
  y += 8;
  pdf.rect(padL, y, 3, 72).fill(GREEN);
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
  pdf.text("Need certified equipment to implement this?", padL + 14, y + 4, { width: BODY_W - 30 });
  pdf.font("Helvetica").fontSize(11).fillColor(INK);
  pdf.text(
    `Our specialists will help you select the right products and pricing for your team. Call ${COMPANY.phone} or email ${COMPANY.email}.`,
    padL + 14,
    y + 22,
    { width: BODY_W - 30 }
  );
  const guideUrl = `https://${COMPANY.website}/knowledge/${guide.slug}`;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY);
  pdf.text(COMPANY.website + "/knowledge/" + guide.slug, padL + 14, y + 56, { width: BODY_W - 30, link: guideUrl });
  y += 86;

  // ---- Stamp on the last page ----
  const stampPath = path.join(process.cwd(), "public", "images", "logo", "stamp.png");
  if (fs.existsSync(stampPath)) {
    try {
      const stampW = 185;
      const stampBuf = fs.readFileSync(stampPath);
      if (!isSupportedImage(stampBuf)) throw new Error("Unsupported stamp image");
      let stampH = 80;
      try {
        stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
      } catch {}
      const stampY = pageH - 66 - 24 - stampH;
      const range = pdf.bufferedPageRange();
      pdf.switchToPage(range.count - 1);
      safeImage(pdf, stampBuf, padR - stampW, stampY, { width: stampW });
      pdf
        .font("Courier-Bold")
        .fontSize(14)
        .fillColor("#DC2626")
        .text(fmtShortDate(new Date()), padR - stampW, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
    } catch {}
  }

  pdf.end();
  const buffer = await new Promise<Buffer>((resolve) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
  });
  return buffer;
}
