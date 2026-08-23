import PDFDocument from "pdfkit";
import fs from "fs";
import { join } from "path";
import { readLogoBytes, getLogoSize } from "@/lib/logo";
import { htmlToBlocks, Block, TextRun } from "./html-blocks";

export type LetterInput = {
  id: string;
  type: string;
  recipient_name: string;
  recipient_title: string | null;
  recipient_company: string | null;
  recipient_address: string | null;
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  sender_name: string;
  sender_title: string | null;
  with_stamp: number;
  created_by: string;
  created_at: string;
};

export type LetterSettings = Record<string, string | undefined>;

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const GRAY = "#6B7280";
const INK = "#1F2937";

const FALLBACK_COMPANY = {
  name: "KimSafety Ltd",
  address: "KimSafety House, Enterprise Road,\nIndustrial Area, Nairobi, Kenya",
  phone: "+254 715135141",
  email: "sales@kimsafety.co.ke",
  website: "www.kimsafety.co.ke",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

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

export async function renderLetterPdf(letter: LetterInput, settings: LetterSettings): Promise<Buffer> {
  const COMPANY = {
    name: settings.site_name || FALLBACK_COMPANY.name,
    address: settings.address || FALLBACK_COMPANY.address,
    phone: settings.phone || FALLBACK_COMPANY.phone,
    email: settings.email || FALLBACK_COMPANY.email,
    website: FALLBACK_COMPANY.website,
  };

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
  const usableBottom = pageH - 66;

  // ---- Page chrome (top bar + footer) drawn on EVERY page ----
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
      .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, padL, pageH - 30, { width: 360 });
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#C7D2E0")
      .text(`Ref: ${letter.id}`, padR - 250, pageH - 48, { width: 250, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#93A5BE")
      .text(`Date: ${fmtDate(letter.created_at)}`, padR - 250, pageH - 37, { width: 250, align: "right" });
  };
  doc.on("pageAdded", drawPageChrome);
  drawPageChrome();

  // ---- Letterhead ----
  const logoBuf = await readLogoBytes(settings.logo);
  const logoHeight = 50;
  let logoWidth = 0;
  if (logoBuf) {
    doc.image(logoBuf, padL, 30, { height: logoHeight });
    const size = getLogoSize(logoBuf);
    logoWidth = size ? Math.round((size.width / size.height) * logoHeight) : logoHeight * 3.34;
  }
  const textLeft = padL + Math.max(logoWidth, 140) + 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(NAVY)
    .text(settings.tagline || "", textLeft, 34, { width: padR - textLeft });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(NAVY)
    .text(COMPANY.address.replace(/\n/g, ", "), textLeft, 50, { width: padR - textLeft });
  doc
    .fontSize(10)
    .fillColor(NAVY)
    .text(`${COMPANY.phone} · ${COMPANY.email} · ${COMPANY.website}`, textLeft, 64, { width: padR - textLeft });

  doc.rect(padL, 118, padR - padL, 1.5).fill(SAFETY);

  // ---- Meta row (ref + date only) ----
  let y = 132;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(NAVY)
    .text(`Ref: ${letter.id}`, padL, y, { width: 200 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(GRAY)
    .text(`Date: ${fmtDate(letter.created_at)}`, padR - 220, y, { width: 220, align: "right" });
  y += 28;

  // ---- Recipient ----
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor("#1F2937")
    .text(letter.recipient_name, padL, y);
  y += 14;
  const recipientLines = [letter.recipient_title, letter.recipient_company, letter.recipient_address].filter(Boolean);
  if (recipientLines.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#374151")
      .text(recipientLines.join("\n"), padL, y, { lineGap: 2 });
    y += recipientLines.join("\n").split("\n").length * 13 + 6;
  }
  y += 8;

  // ---- Subject (always uppercase, no underline) ----
  if (letter.subject.trim()) {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text(`RE: ${letter.subject.trim().toUpperCase()}`, padL, y, { width: padR - padL });
    y += 24;
  }

  // ---- Salutation ----
  doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(letter.salutation + ",", padL, y);
  y += 18;

  // ================= Rich text body =================
  const BODY_W = padR - padL;
  const LINE_GAP = 3;
  const lineH = (size: number) => size * 1.2 + LINE_GAP;

  const tokenW = (t: Token) => doc.font(t.font).fontSize(t.size).widthOfString(t.text);

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
        doc.font(t.font).fontSize(t.size).fillColor(t.color);
        doc.text(t.text, cx, yTop, { lineBreak: false });
        if (t.underline) doc.rect(cx, yTop + t.size * 0.82, w, 0.7).fill(t.color);
        if (t.strike) doc.rect(cx, yTop + t.size * 0.34, w, 0.6).fill(t.color);
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

  const drawBlock = (b: Block) => {
    if (b.kind === "spacer") {
      y += 14;
      return;
    }
    if (b.kind === "h1" || b.kind === "h2" || b.kind === "h3") {
      const size = b.kind === "h1" ? 15 : b.kind === "h2" ? 13.5 : 12;
      const tokens = wordize(b.runs, size, NAVY).map((t) =>
        t.font === "Helvetica" ? { ...t, font: "Helvetica-Bold" } : t
      );
      const lines = wrap(tokens, BODY_W);
      const h = lines.length * lineH(size) + (b.kind === "h1" ? 10 : 8);
      if (y + h > usableBottom) {
        doc.addPage();
        y = 56;
      }
      for (const ln of lines) {
        drawLine(ln, padL, y);
        y += lineH(size);
      }
      y += b.kind === "h1" ? 10 : 8;
      return;
    }
    if (b.kind === "quote") {
      const tokens = wordize(b.runs, 10.5, INK);
      const lines = wrap(tokens, BODY_W - 24);
      const h = lines.length * lineH(10.5) + 8;
      if (y + h > usableBottom) {
        doc.addPage();
        y = 56;
      }
      doc.rect(padL, y, 3, lines.length * lineH(10.5)).fill(SAFETY);
      for (const ln of lines) {
        drawLine(ln, padL + 12, y);
        y += lineH(10.5);
      }
      y += 8;
      return;
    }
    const isList = b.kind === "bullet" || b.kind === "number";
    const indent = isList ? 18 : 0;
    const prefix: Token | null =
      b.kind === "bullet"
        ? { text: "\u2022  ", font: "Helvetica-Bold", size: 10.5, color: INK }
        : b.kind === "number"
          ? { text: `${b.index}. `, font: "Helvetica-Bold", size: 10.5, color: INK }
          : null;
    const tokens = isList && prefix ? [prefix, ...wordize(b.runs, 10.5, INK)] : wordize(b.runs, 10.5, INK);
    const lines = wrap(tokens, BODY_W - indent);
    const h = lines.length * lineH(10.5) + (isList ? 4 : 12);
    if (y + h > usableBottom) {
      doc.addPage();
      y = 56;
    }
    for (const ln of lines) {
      drawLine(ln, padL + indent, y);
      y += lineH(10.5);
    }
    y += isList ? 4 : 12;
  };

  for (const block of htmlToBlocks(letter.body)) drawBlock(block);

  // ---- Closing ----
  if (y + 120 > usableBottom) {
    doc.addPage();
    y = 56;
  }
  y += 6;
  doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(letter.closing + ",", padL, y);
  y += 46;

  // ---- Signatory: signature line, sender name, then their department below ----
  doc
    .moveTo(padL, y)
    .lineTo(padL + 160, y)
    .lineWidth(0.9)
    .strokeColor(GRAY)
    .stroke();
  y += 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(NAVY)
    .text(letter.sender_name, padL, y);
  if (letter.sender_title) {
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(GRAY)
      .text(letter.sender_title, padL, y + 15);
  }

  // ---- Stamp on the last page, above the footer ----
  if (letter.with_stamp === 1) {
    const stampPath = join(process.cwd(), "public", "images", "logo", "stamp.png");
    if (fs.existsSync(stampPath)) {
      const stampW = 185;
      const stampBuf = fs.readFileSync(stampPath);
      const stampH = stampW * (stampBuf.readUInt32BE(20) / stampBuf.readUInt32BE(16));
      const stampY = pageH - 66 - 24 - stampH;
      const range = doc.bufferedPageRange();
      doc.switchToPage(range.count - 1);
      doc.image(stampPath, padR - stampW, stampY, { width: stampW });
      const dateStr = new Date(letter.created_at)
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase();
      doc
        .font("Courier-Bold")
        .fontSize(14)
        .fillColor("#DC2626")
        .text(dateStr, padR - stampW, stampY + (stampH - 16) / 2, { width: stampW, align: "center" });
    }
  }

  doc.end();
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
