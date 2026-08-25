import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getAllSettings } from "@/lib/db";
import { readLogoBytes, getLogoSize, DEFAULT_LOGO } from "@/lib/logo";
import { readPublicFile } from "@/lib/file-store";
import { productImages } from "@/lib/data/product-images";
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
} from "@/lib/pdf-engine";
import type { Brand, Product } from "@/lib/types";

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

/** Hard cap removed — the catalog always includes every product passed in. */

export type BrandCatalogMeta = {
  /** Small label above the brand name (default: "AUTHORIZED BRAND"). */
  eyebrow?: string;
  /** Footer left label (default: `Brand catalog · {brand.name}`). */
  footerLabel?: string;
  /**
   * Skip the hero-section brand LOGO and tagline line (title stays). Used by
   * the full-catalog variant where the pseudo-brand mirrors the site itself,
   * so its logo/tagline would just duplicate the letterhead above.
   */
  hideBrandLogoAndTagline?: boolean;
};

/**
 * Branded, letterhead-quality catalog PDF for one brand: cover section with the
 * brand logo/name/tagline followed by a compact product list (thumbnail, name,
 * SKU, price, stock) with links back to each product page.
 */
export async function buildBrandCatalogPdf(
  brand: Brand,
  productsRaw: Product[],
  meta?: BrandCatalogMeta
): Promise<Buffer> {
  const products = [...productsRaw].sort((a, b) => b.sold - a.sold);

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
      .text(meta?.footerLabel ?? `Brand catalog · ${brand.name}`, padR - 260, pageH - 48, { width: 260, align: "right" });
    pdf
      .font("Helvetica")
      .fontSize(7)
      .fillColor(SOFT)
      .text(`Date: ${fmtDate(new Date())}`, padR - 260, pageH - 37, { width: 260, align: "right" });
  };
  pdf.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Letterhead ---- (site logo + tagline always shown; width measured so text never overlaps)
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
  let logoWidth = 0;
  if (logoBuf && isSupportedImage(logoBuf)) {
    try {
      pdf.image(logoBuf, padL, 30, { height: 50 });
    } catch {}
    const size = getLogoSize(logoBuf!);
    logoWidth = size ? Math.round((size.width / size.height) * 50) : 50 * 3.34;
  }
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

  // ---- Section head ----
  // Full-catalog variant (meta.hideBrandLogoAndTagline): divider sits directly
  // under the letterhead, followed only by the catalog title — no second
  // logo/tagline block. Brand catalogs keep the full hero (logo, eyebrow,
  // name, tagline) with the divider below it.
  const hideHero = meta?.hideBrandLogoAndTagline === true;

  if (!hideHero) {
    // Divider sits directly under the letterhead, ABOVE the logo/title/tagline.
    pdf.rect(padL, y, BODY_W, 1.5).fill(SAFETY);
    y += 20;

    const brandBuf = await readPublicFile(brand.image);
    let heroTextX = padL;
    const heroH = 72;
    if (brandBuf && isSupportedImage(brandBuf)) {
      const boxW = 300;
      const boxH = 60;
      const dims = getLogoSize(brandBuf);
      // Placed size = box scaled to the logo's true ratio (fit math), so text
      // starts right after the drawn edge. Floats, no rounding skew.
      let placedW = boxW;
      let placedH = boxH;
      if (dims && dims.width > 0 && dims.height > 0) {
        const scale = Math.min(boxW / dims.width, boxH / dims.height);
        placedW = dims.width * scale;
        placedH = dims.height * scale;
      }
      safeImage(pdf, brandBuf!, padL, y + (heroH - placedH) / 2, {
        fit: [placedW, placedH],
        align: "left",
        valign: "middle",
      });
      heroTextX = padL + placedW + 18;
    }
    // Text block top-aligns with the hero, tight against the logo.
    pdf.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text(meta?.eyebrow ?? "AUTHORIZED BRAND", heroTextX, y);
    pdf.font("Helvetica-Bold").fontSize(22).fillColor(NAVY);
    const nameH = pdf.heightOfString(brand.name, { width: padR - heroTextX });
    pdf.text(brand.name, heroTextX, y + 11, { width: padR - heroTextX });
    pdf
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(GRAY)
      .text(`${brand.tagline || "Genuine safety equipment"}${brand.origin ? ` · ${brand.origin}` : ""}`, heroTextX, y + 11 + nameH + 3, {
        width: padR - heroTextX,
      });
    y = Math.max(y + 11 + nameH + 21, y + heroH + 4);
  } else {
    // Divider above the title, then the title alone — no logo/tagline.
    pdf.rect(padL, y, BODY_W, 1.5).fill(SAFETY);
    y += 24;
    pdf.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text(meta?.eyebrow ?? "PRODUCT CATALOG", padL, y);
    y += 32;
  }

  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(NAVY)
    .text(`${products.length} certified product${products.length === 1 ? "" : "s"}`, padL, y, { width: 300 });
  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(`Generated ${fmtDate(new Date())} — prices in KES incl. 16% VAT`, padR - 280, y, { width: 280, align: "right" });
  y += 22;

  // ---- Product list ----
  if (products.length === 0) {
    ensure(60);
    pdf
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor(GRAY)
      .text(`No ${brand.name} products are currently listed online — contact us for the full range and pricing.`, padL, y, {
        width: BODY_W,
      });
    y += 40;
  }

  for (const p of products) {
    const thumb = 56;
    const adminProduct = p as Product & { image?: string; gallery?: string[] };
    const candidates = [
      adminProduct.image,
      ...(adminProduct.gallery ?? []),
      productImages[p.sku],
      `/images/products/${p.sku}.jpg`,
    ].filter((u): u is string => typeof u === "string" && !!u);

    let thumbBuf: Buffer | undefined;
    for (const cand of candidates.slice(0, 3)) {
      const buf = await readPublicFile(cand);
      if (buf && isSupportedImage(buf)) {
        thumbBuf = buf;
        break;
      }
    }

    pdf.font("Helvetica-Bold").fontSize(11);
    const nameW = BODY_W - thumb - 14;
    const nameH = pdf.heightOfString(p.name, { width: nameW });
    const rowH = Math.max(thumb + 8, nameH + 42);

    ensure(rowH + 10);

    if (thumbBuf) {
      pdf.rect(padL, y, thumb, thumb).lineWidth(1).strokeColor("#E2E8F0").stroke();
      try {
        // fit keeps the photo's aspect ratio inside the square box (no stretch).
        pdf.image(thumbBuf, padL, y, { fit: [thumb, thumb], align: "center", valign: "center" });
      } catch {}
    }

    const tx = padL + thumb + 14;
    const productUrl = `${"https://" + COMPANY.website}/product/${p.slug ?? p.sku}`;
    pdf.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(p.name, tx, y + 2, {
      width: nameW,
      link: productUrl,
    });
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GRAY)
      .text(`SKU ${p.sku} · ${p.categoryName}${p.brand ? ` · ${p.brand}` : ""}`, tx, y + 2 + nameH + 3, { width: nameW });
    pdf.font("Helvetica-Bold").fontSize(11).fillColor(GREEN).text(`KES ${p.price.toLocaleString()}`, tx, y + 2 + nameH + 15, {
      width: 150,
    });
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor(GRAY)
      .text(
        p.stock > 0 ? `${p.stock.toLocaleString()} in stock · same-day Nairobi dispatch` : "Out of stock — restock on request",
        tx + 155,
        y + 4 + nameH + 16,
        { width: nameW - 155 }
      );

    y += rowH;
    pdf.moveTo(padL, y).lineTo(padR, y).lineWidth(0.75).strokeColor("#E5E7EB").stroke();
    y += 12;
  }

  // ---- Closing CTA ----
  ensure(200);
  pdf.rect(padL, y, 3, 72).fill(GREEN);
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
  pdf.text(`Ordering ${brand.name} from KimSafety`, padL + 14, y + 4, { width: BODY_W - 30 });
  pdf.font("Helvetica").fontSize(11).fillColor(INK);
  pdf.text(
    `Every item is genuine, certified and quality-inspected at our Nairobi warehouse. For bulk pricing, quotations or certificates of conformance, contact our team at ${COMPANY.phone} or ${COMPANY.email}.`,
    padL + 14,
    y + 22,
    { width: BODY_W - 30 }
  );
  const brandsUrl = `https://${COMPANY.website}/brands/${brand.slug}`;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY);
  pdf.text(COMPANY.website + "/brands/" + brand.slug, padL + 14, y + 56, { width: BODY_W - 30, link: brandsUrl });
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
