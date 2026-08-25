import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getAllSettings } from "@/lib/db";
import { readLogoBytes, DEFAULT_LOGO } from "@/lib/logo";
import { readPublicFile } from "@/lib/file-store";
import { sanitizePostHtml } from "@/lib/blog";
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

export type BlogPostPdfInput = {
  slug: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  dateIso: string;
  excerpt: string;
  cover?: string;
  content?: string;
};

/**
 * Branded, letterhead-quality PDF for a blog article: cover image, excerpt,
 * full rich-text body, closing CTA linking back to the post, and stamp.
 */
export async function buildBlogPostPdf(post: BlogPostPdfInput): Promise<Buffer> {
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
      .text("Blog · News & Insights", padR - 260, pageH - 48, { width: 260, align: "right" });
    pdf
      .font("Helvetica")
      .fontSize(7)
      .fillColor(SOFT)
      .text(`Published: ${fmtDate(new Date(post.dateIso))}`, padR - 260, pageH - 37, { width: 260, align: "right" });
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
  const textLeft = padL + 160;
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
  pdf.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text("BLOG — NEWS & INSIGHTS", padL, y);
  y += 15;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY).text((post.category || "Article").toUpperCase(), padL, y);
  y += 18;

  // ---- Title ----
  pdf.font("Helvetica-Bold").fontSize(22).fillColor(NAVY);
  const titleH = pdf.heightOfString(post.title, { width: BODY_W });
  pdf.text(post.title, padL, y, { width: BODY_W });
  y += titleH + 8;

  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(`${post.author || "KimSafety Team"} · ${post.readTime || "5 min read"} · Published ${fmtDate(new Date(post.dateIso))}`, padL, y, {
      width: BODY_W,
    });
  y += 24;

  // ---- Cover image ----
  if (post.cover) {
    const coverBuf = await readPublicFile(post.cover);
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
  if (post.excerpt?.trim()) {
    pdf.font("Helvetica-Oblique").fontSize(11).fillColor(INK);
    const exLines = Math.ceil(pdf.widthOfString(post.excerpt.trim(), { width: BODY_W - 28 }) / (BODY_W - 28)) || 1;
    const exH = Math.max(1, exLines) * 16;
    ensure(exH + 20);
    pdf.rect(padL, y, 3, exH).fill(SAFETY);
    pdf.text(post.excerpt.trim(), padL + 14, y, { width: BODY_W - 28, lineGap: 3 });
    y += exH + 14;
  }

  // ---- Body ----
  const engine = createTextEngine(pdf, { padL, BODY_W, usableBottom, yRef: { get value() { return y; }, set value(v: number) { y = v; } } });

  if (post.content?.trim()) {
    for (const block of htmlToBlocks(sanitizePostHtml(post.content))) {
      engine.drawBlock(block);
    }
  } else {
    ensure(40);
    pdf.font("Helvetica-Oblique").fontSize(10).fillColor(GRAY).text("This article has no body content yet.", padL, y, { width: BODY_W });
    y += 30;
  }

  // ---- Closing CTA ----
  ensure(200);
  y += 8;
  pdf.rect(padL, y, 3, 72).fill(GREEN);
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
  pdf.text("Buying safety equipment for a team?", padL + 14, y + 4, { width: BODY_W - 30 });
  pdf.font("Helvetica").fontSize(11).fillColor(INK);
  pdf.text(
    `Get tiered bulk pricing, negotiated corporate rates and tender-ready documentation. Call ${COMPANY.phone} or email ${COMPANY.email}.`,
    padL + 14,
    y + 22,
    { width: BODY_W - 30 }
  );
  const postUrl = `https://${COMPANY.website}/blog/${post.slug}`;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY);
  pdf.text(COMPANY.website + "/blog/" + post.slug, padL + 14, y + 56, { width: BODY_W - 30, link: postUrl });
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
