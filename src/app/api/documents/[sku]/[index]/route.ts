export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { mergedCatalog } from "@/lib/admin-products";
import { htmlToBlocks, TextRun, Block } from "@/lib/html-blocks";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { productImages, productGalleries } from "@/lib/data/product-images";
import type { Product } from "@/lib/types";

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const GREEN = "#1A9A5E";
const GRAY = "#6B7280";
const INK = "#1F2937";
const LIGHT = "#C7D2E0";
const SOFT = "#93A5BE";

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

const runFont = (r: TextRun) => {
  if (r.font) return r.font;
  const n = `${r.bold ? "Bold" : ""}${r.italic ? "Oblique" : ""}`;
  return n ? `Helvetica-${n}` : "Helvetica";
};

type Token = {
  text: string;
  font: string;
  size: number;
  color: string;
  underline?: boolean;
  strike?: boolean;
};

function serverFileFor(publicPath: string | undefined): string | null {
  if (!publicPath || !publicPath.startsWith("/")) return null;
  if (publicPath.startsWith("/api/uploads/")) {
    const base = path.basename(publicPath);
    const dir = path.join(process.cwd(), "public", "images", "products");
    const direct = path.join(dir, base);
    return fs.existsSync(direct) ? direct : path.join(dir, decodeURIComponent(base));
  }
  if (publicPath.startsWith("/images/")) {
    const local = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    return fs.existsSync(local) ? local : path.join(process.cwd(), "public", publicPath.slice(1).split("/").map(decodeURIComponent).join("/"));
  }
  if (publicPath.startsWith("/documents/")) {
    const base = path.basename(publicPath);
    const dir = path.join(process.cwd(), "public", "documents");
    const direct = path.join(dir, base);
    return fs.existsSync(direct) ? direct : path.join(dir, decodeURIComponent(base));
  }
  return null;
}

function downloadFilename(sku: string, doc: { name: string; file?: string }): string {
  if (doc.file) {
    const base = path.basename(doc.file);
    return /\.\w{1,5}$/i.test(base) ? base : `${base}.pdf`;
  }
  const stem = `${sku}-${(doc.name || "document").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`;
  return `${stem}.pdf`;
}

export async function GET(_req: Request, { params }: { params: { sku: string; index: string } }) {
  const list = (await mergedCatalog()) as Product[];
  const product = list.find((p) => p.sku === params.sku || p.id === params.sku);
  const idx = Number(params.index);
  const doc = product?.downloads?.[idx];
  if (!product || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Uploaded real file takes precedence
  if (doc.file && doc.file.startsWith("/")) {
    const local = serverFileFor(doc.file);
    if (local && fs.existsSync(local)) {
      const data = fs.readFileSync(local);
      return new NextResponse(data, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename(product.sku, doc))}"`,
        },
      });
    }
  }

  // ---- Branded letterhead-quality document ----
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
  const LINE_GAP = 3;
  const lineH = (size: number) => size * 1.2 + LINE_GAP;

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
    pdf
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(LIGHT)
      .text(COMPANY.address, padL, pageH - 38, { width: 360 });
    pdf
      .fontSize(7.5)
      .fillColor(SOFT)
      .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, padL, pageH - 30, { width: 360 });
    pdf
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(LIGHT)
      .text(`Ref: ${product.sku}`, padR - 250, pageH - 48, { width: 250, align: "right" });
    pdf
      .font("Helvetica")
      .fontSize(7)
      .fillColor(SOFT)
      .text(`Date: ${fmtDate(new Date())}`, padR - 250, pageH - 37, { width: 250, align: "right" });
  };
  pdf.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Letterhead ----
  const logoPath = path.join(process.cwd(), "public", "images", "logo", "logoy.jpg");
  let logoWidth = 0;
  if (fs.existsSync(logoPath)) {
    pdf.image(logoPath, padL, 30, { height: 50 });
    logoWidth = 50 * 3.34;
  }
  const textLeft = padL + Math.max(logoWidth, 140) + 14;
  pdf.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text((await getSetting("tagline")) || DEFAULT_SETTINGS.tagline || "", textLeft, 34, { width: padR - textLeft });
  pdf
    .font("Helvetica")
    .fontSize(10)
    .fillColor(NAVY)
    .text(COMPANY.address, textLeft, 50, { width: padR - textLeft });
  pdf
    .fontSize(10)
    .fillColor(NAVY)
    .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, textLeft, 64, { width: padR - textLeft });

  pdf.rect(padL, 118, BODY_W, 1.5).fill(SAFETY);

  // ---- Meta row ----
  pdf.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text(`Ref: ${product.sku}`, padL, y, { width: 200 });
  pdf.font("Helvetica").fontSize(9).fillColor(GRAY).text(`Date: ${fmtDate(new Date())}`, padR - 220, y, { width: 220, align: "right" });
  y += 30;

  // ---- Title ----
  pdf.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text("PRODUCT DOCUMENT", padL, y);
  y += 15;
  pdf.font("Helvetica-Bold").fontSize(17).fillColor(NAVY).text(doc.name, padL, y, { width: BODY_W });
  y += 24;
  pdf.font("Helvetica-Oblique").fontSize(10.5).fillColor(GRAY).text(product.name, padL, y, { width: BODY_W });
  y += 24;

  // ---- Product image grid (3-up square) ----
  const adminProduct = product as Product & { image?: string; gallery?: string[] };
  const gridCandidates = [
    ...((adminProduct.gallery ?? []) as string[]),
    adminProduct.image,
    ...(productGalleries[product.sku] ?? []),
    productImages[product.sku],
    `/images/products/${product.sku}.jpg`,
  ].filter(
    (u): u is string =>
      typeof u === "string" && !!u && serverFileFor(u) !== null && fs.existsSync(serverFileFor(u)!)
  );
  const gallery = gridCandidates
    .filter((u, i, arr) => arr.indexOf(u) === i)
    .slice(0, 3);

  if (gallery.length > 0) {
    const gridGap = 12;
    const cellW = (BODY_W - gridGap * 2) / 3;
    ensure(cellW + 16);
    gallery.forEach((f, i) => {
      const cx = padL + i * (cellW + gridGap);
      pdf.rect(cx, y, cellW, cellW).lineWidth(1).strokeColor("#E2E8F0").stroke();
      pdf.image(serverFileFor(f)!, cx, y, { width: cellW, height: cellW });
    });
    y += cellW + 16;
  }

  // ---- Product photo (right) + summary rows ----
  let imageW = 0;
  let imageH = 0;
  const imageCandidates = [
    adminProduct.image,
    productImages[product.sku],
    `/images/products/${product.sku}.jpg`,
  ].filter(
    (u): u is string => typeof u === "string" && !!u && serverFileFor(u) !== null && fs.existsSync(serverFileFor(u)!)
  );
  for (const cand of imageCandidates) {
    const f = serverFileFor(cand);
    if (f && fs.existsSync(f)) {
      imageW = 118;
      imageH = 118;
      pdf.rect(padR - imageW, y, imageW, imageH).lineWidth(1).strokeColor("#E2E8F0").stroke();
      pdf.image(f, padR - imageW, y, { width: imageW, height: imageH });
      pdf.rect(padR - imageW, y, imageW, 16).fill(NAVY);
      pdf
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor("white")
        .text(product.sku, padR - imageW + 4, y + 4, { width: imageW - 8 });
      break;
    }
  }

  const infoRows: [string, string][] = [
    ["SKU", product.sku],
    ["Brand", product.brand],
    ["Category", product.categoryName],
    ...(product.model ? [["Model", product.model] as [string, string]] : []),
    ["Price", `KES ${product.price.toLocaleString()}`],
    ["Stock status", product.stock > 0 ? `${product.stock.toLocaleString()} units available` : "Out of stock"],
  ];
  ensure(40 + infoRows.length * 16);
  const infoW = BODY_W - imageW - 14;
  let rowY = y;
  pdf.font("Helvetica-Bold").fontSize(9).fillColor(GRAY).text("PRODUCT SUMMARY", padL, rowY);
  rowY += 16;
  for (const [label, value] of infoRows) {
    pdf.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(label, padL, rowY, { width: 110 });
    pdf.font("Helvetica").fontSize(9.5).fillColor(INK).text(value, padL + 115, rowY, { width: infoW - 115 });
    rowY += 16;
  }
  y = Math.max(rowY + 8, y + imageH + 14);

  // ---- Key facts strip ----
  const facts = [
    ["CERTIFICATION", product.certification ?? "CE · ISO compliant"],
    ["STANDARD", product.standard ?? "EN ISO"],
    ["WARRANTY", product.warranty ?? "12-month KimSafety warranty"],
  ];
  ensure(40);
  const factW = BODY_W / facts.length;
  for (let i = 0; i < facts.length; i++) {
    const fx = padL + i * factW;
    pdf.rect(fx, y, factW - 10, 34).fill("#F3F4F6");
    pdf.rect(fx, y, 3, 34).fill(SAFETY);
    pdf
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .fillColor(GRAY)
      .text(facts[i][0], fx + 10, y + 5, { width: factW - 24 });
    pdf
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(NAVY)
      .text(facts[i][1], fx + 10, y + 15, { width: factW - 24 });
  }
  y += 48;

  // ---- Rich text layout machinery (same engine as letters) ----
  const tokenW = (t: Token) => pdf.font(t.font).fontSize(t.size).widthOfString(t.text);

  const wrap = (tokens: Token[], width: number): Token[][] => {
    const lines: Token[][] = [];
    let line: Token[] = [];
    let x = 0;
    const flush = () => {
      if (line.length) {
        while (line.length && /^\s+$/.test(line[line.length - 1].text)) line.pop();
        lines.push(line);
      }
      line = [];
      x = 0;
    };
    for (const t of tokens) {
      if (t.text === "\n") {
        flush();
        continue;
      }
      const w = tokenW(t);
      if (/^\s+$/.test(t.text)) {
        line.push(t);
        x += w;
        continue;
      }
      if (x + w > width && line.length > 0) {
        flush();
        line.push(t);
        x = w;
      } else {
        line.push(t);
        x += w;
      }
    }
    flush();
    return lines;
  };

  const drawLine = (line: Token[], x: number, yTop: number) => {
    let cx = x;
    for (const t of line) {
      const w = tokenW(t);
      const isSpace = /^\s+$/.test(t.text);
      if (!isSpace) {
        pdf.font(t.font).fontSize(t.size).fillColor(t.color);
        pdf.text(t.text, cx, yTop, { lineBreak: false });
        if (t.underline) pdf.rect(cx, yTop + t.size * 0.82, w, 0.7).fill(t.color);
        if (t.strike) pdf.rect(cx, yTop + t.size * 0.34, w, 0.6).fill(t.color);
      }
      cx += w;
    }
  };

  const wordize = (runs: TextRun[], size: number, color: string): Token[] => {
    const out: Token[] = [];
    for (const r of runs) {
      const font = runFont(r);
      for (const part of r.text.split(/(\n)/)) {
        if (!part) continue;
        if (part === "\n") {
          out.push({ text: "\n", font, size, color });
        } else {
          for (const seg of part.split(/(\s+)/)) {
            if (!seg) continue;
            out.push({ text: seg, font, size, color, underline: r.underline, strike: r.strike });
          }
        }
      }
    }
    return out;
  };

  const sectionHeading = (title: string, subtitle?: string) => {
    ensure(30);
    pdf.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text(title, padL, y);
    if (subtitle) {
      pdf.font("Helvetica").fontSize(9).fillColor(GRAY).text(subtitle, padL, y + 14, { width: BODY_W });
    }
    y += subtitle ? 30 : 20;
    pdf.rect(padL, y, BODY_W, 0.8).fill(SAFETY);
    y += 10;
  };

  const drawBlock = (b: Block) => {
    if (b.kind === "spacer") {
      y += 12;
      return;
    }
    if (b.kind === "h1" || b.kind === "h2" || b.kind === "h3") {
      const size = b.kind === "h1" ? 14 : b.kind === "h2" ? 12.5 : 11.5;
      const tokens = wordize(b.runs, size, NAVY).map((t) =>
        t.font === "Helvetica" ? { ...t, font: "Helvetica-Bold" } : t
      );
      const lines = wrap(tokens, BODY_W);
      const h = lines.length * lineH(size) + 8;
      ensure(h);
      for (const ln of lines) {
        drawLine(ln, padL, y);
        y += lineH(size);
      }
      y += 8;
      return;
    }
    if (b.kind === "quote") {
      const tokens = wordize(b.runs, 10, INK);
      const lines = wrap(tokens, BODY_W - 24);
      ensure(lines.length * lineH(10) + 8);
      pdf.rect(padL, y, 3, lines.length * lineH(10)).fill(SAFETY);
      for (const ln of lines) {
        drawLine(ln, padL + 12, y);
        y += lineH(10);
      }
      y += 8;
      return;
    }
    const isList = b.kind === "bullet" || b.kind === "number";
    const indent = isList ? 18 : 0;
    const prefix: Token | null =
      b.kind === "bullet"
        ? { text: "\u2022  ", font: "Helvetica-Bold", size: 10, color: GREEN }
        : b.kind === "number"
          ? { text: `${b.index}. `, font: "Helvetica-Bold", size: 10, color: GREEN }
          : null;
    const tokens = isList && prefix ? [prefix, ...wordize(b.runs, 10, INK)] : wordize(b.runs, 10, INK);
    const lines = wrap(tokens, BODY_W - indent);
    ensure(lines.length * lineH(10) + (isList ? 4 : 12));
    for (const ln of lines) {
      drawLine(ln, padL + indent, y);
      y += lineH(10);
    }
    y += isList ? 4 : 12;
  };

  // ---- Description ----
  if (product.description?.trim()) {
    sectionHeading("Product Description");
    for (const block of htmlToBlocks(product.description)) drawBlock(block);
    y += 6;
  }

  // ---- Features ----
  if (product.features?.length) {
    sectionHeading("Key Features");
    for (const f of product.features) {
      drawBlock({ kind: "bullet", runs: [{ text: f }] });
    }
    y += 6;
  }

  // ---- Specifications table ----
  const specs = product.specs ?? [];
  if (specs.length > 0) {
    sectionHeading("Specifications", "Full technical specifications of this product");
    const specLabelW = 170;
    const specValueW = BODY_W - specLabelW;
    const rowH = 19;
    pdf.rect(padL, y, specLabelW, rowH).fill(NAVY);
    pdf.rect(padL + specLabelW, y, specValueW, rowH).fill(NAVY);
    pdf.font("Helvetica-Bold").fontSize(8).fillColor("white");
    pdf.text("SPECIFICATION", padL + 8, y + 5.5, { width: specLabelW - 16 });
    pdf.text("DETAIL", padL + specLabelW + 8, y + 5.5, { width: specValueW - 16 });
    y += rowH;
    specs.forEach((spec, i) => {
      if (ensure(rowH)) {
        pdf.rect(padL, y, specLabelW, rowH).fill(NAVY);
        pdf.rect(padL + specLabelW, y, specValueW, rowH).fill(NAVY);
        pdf.font("Helvetica-Bold").fontSize(8).fillColor("white");
        pdf.text("SPECIFICATION", padL + 8, y + 5.5, { width: specLabelW - 16 });
        pdf.text("DETAIL", padL + specLabelW + 8, y + 5.5, { width: specValueW - 16 });
        y += rowH;
      }
      const bg = i % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
      pdf.rect(padL, y, specLabelW, rowH).fill(bg);
      pdf.rect(padL + specLabelW, y, specValueW, rowH).fill(bg);
      pdf.font("Helvetica-Bold").fontSize(9).fillColor(NAVY);
      pdf.text(spec.label || "—", padL + 8, y + 5.5, { width: specLabelW - 16 });
      pdf.font("Helvetica").fontSize(9).fillColor(INK);
      pdf.text(spec.value || "—", padL + specLabelW + 8, y + 5.5, { width: specValueW - 16 });
      y += rowH;
    });
    y += 10;
  }

  // ---- Bulk pricing table ----
  const bulk = product.bulk ?? [];
  if (bulk.length > 0) {
    sectionHeading("Bulk Pricing", "Tiered pricing for volume orders");
    const cols: [string, number][] = [
      ["QUANTITY", 140],
      ["UNIT PRICE (KES)", 180],
      ["SAVINGS", BODY_W - 320],
    ];
    const rowH = 21;
    let cx = padL;
    pdf.rect(padL, y, BODY_W, rowH).fill(NAVY);
    pdf.font("Helvetica-Bold").fontSize(8).fillColor("white");
    for (const [label, w] of cols) {
      pdf.text(label, cx + 8, y + 6.5, { width: w - 16 });
      cx += w;
    }
    y += rowH;
    bulk.forEach((tier, i) => {
      if (ensure(rowH)) {
        pdf.rect(padL, y, BODY_W, rowH).fill(NAVY);
        pdf.font("Helvetica-Bold").fontSize(8).fillColor("white");
        cx = padL;
        for (const [label, w] of cols) {
          pdf.text(label, cx + 8, y + 6.5, { width: w - 16 });
          cx += w;
        }
        y += rowH;
      }
      const bg = i % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
      pdf.rect(padL, y, BODY_W, rowH).fill(bg);
      cx = padL;
      pdf.font("Helvetica-Bold").fontSize(9).fillColor(NAVY);
      pdf.text(tier.qty || "—", cx + 8, y + 6, { width: cols[0][1] - 16 });
      cx += cols[0][1];
      pdf.font("Helvetica").fontSize(9).fillColor(INK);
      pdf.text(tier.price || "—", cx + 8, y + 6, { width: cols[1][1] - 16 });
      cx += cols[1][1];
      pdf.font("Helvetica-Bold").fontSize(9).fillColor(GREEN);
      pdf.text(tier.savings && tier.savings !== "Standard" ? tier.savings : "—", cx + 8, y + 6, { width: cols[2][1] - 16 });
      y += rowH;
    });
    y += 10;
  }

  // ---- Closing + contact ----
  ensure(200);
  pdf.rect(padL, y, 3, 72).fill(GREEN);
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
  pdf.text("Certified genuine stock — quality inspected at our Nairobi warehouse.", padL + 14, y + 4, { width: BODY_W - 30 });
  pdf.font("Helvetica").fontSize(11).fillColor(INK);
  pdf.text(
    `For bulk orders, quotations or the official certificate of conformance for this product, contact our team at ${COMPANY.phone} or ${COMPANY.email}.`,
    padL + 14,
    y + 22,
    { width: BODY_W - 30 }
  );
  const productUrl = `https://${COMPANY.website}/product/${product.slug ?? product.sku}`;
  pdf.font("Helvetica-Bold").fontSize(10).fillColor(SAFETY);
  pdf.text(COMPANY.website + "/product/" + (product.slug ?? product.sku), padL + 14, y + 56, {
    width: BODY_W - 30,
    link: productUrl,
  });
  y += 86;

  // ---- Stamp on the last page ----
  const stampPath = path.join(process.cwd(), "public", "images", "logo", "stamp.png");
  if (fs.existsSync(stampPath)) {
    const stampW = 185;
    const stampBuf = fs.readFileSync(stampPath);
    const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
    const stampY = pageH - 66 - 24 - stampH;
    const range = pdf.bufferedPageRange();
    pdf.switchToPage(range.count - 1);
    pdf.image(stampPath, padR - stampW, stampY, { width: stampW });
    pdf
      .font("Courier-Bold")
      .fontSize(14)
      .fillColor("#DC2626")
      .text(fmtShortDate(new Date()), padR - stampW, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
  }

  pdf.end();
  const buffer = await new Promise<Buffer>((resolve) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename(product.sku, doc))}"`,
    },
  });
}
