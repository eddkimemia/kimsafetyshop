import type PDFDocument from "pdfkit";
import { htmlToBlocks, type TextRun, type Block } from "@/lib/html-blocks";

export const NAVY = "#0F2847";
export const SAFETY = "#F57C00";
export const GREEN = "#1A9A5E";
export const GRAY = "#6B7280";
export const INK = "#1F2937";
export const LIGHT = "#C7D2E0";
export const SOFT = "#93A5BE";

// PDFKit supports only JPEG and PNG — anything else must be skipped.
export function isSupportedImage(buf: Buffer | undefined | null): boolean {
  if (!buf || buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  return false;
}

export function safeImage(
  pdf: InstanceType<typeof PDFDocument>,
  buf: Buffer,
  x: number,
  y: number,
  opts: Record<string, unknown>
): boolean {
  if (!isSupportedImage(buf)) return false;
  try {
    (pdf as unknown as { image: (b: Buffer, a: number, b2: number, c: unknown) => void }).image(buf, x, y, opts);
    return true;
  } catch {
    return false;
  }
}

type Token = {
  text: string;
  font: string;
  size: number;
  color: string;
  underline?: boolean;
  strike?: boolean;
};

const runFont = (r: TextRun) => {
  if (r.font) return r.font;
  const n = `${r.bold ? "Bold" : ""}${r.italic ? "Oblique" : ""}`;
  return n ? `Helvetica-${n}` : "Helvetica";
};

export type EngineCtx = {
  padL: number;
  BODY_W: number;
  usableBottom: number;
  yRef: { value: number };
};

/**
 * Shared rich-text layout engine for generated PDFs (same engine as the
 * product datasheet) operating on a mutable y reference so callers keep
 * control of pagination state.
 */
export function createTextEngine(pdf: InstanceType<typeof PDFDocument>, ctx: EngineCtx) {
  const LINE_GAP = 3;
  const lineH = (size: number) => size * 1.2 + LINE_GAP;

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

  const ensure = (h: number) => {
    if (ctx.yRef.value + h > ctx.usableBottom) {
      pdf.addPage();
      ctx.yRef.value = 56;
      return true;
    }
    return false;
  };

  const sectionHeading = (title: string, subtitle?: string) => {
    ensure(30);
    const y = ctx.yRef.value;
    pdf.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text(title, ctx.padL, y);
    if (subtitle) {
      pdf.font("Helvetica").fontSize(9).fillColor(GRAY).text(subtitle, ctx.padL, y + 14, { width: ctx.BODY_W });
    }
    ctx.yRef.value += subtitle ? 30 : 20;
    pdf.rect(ctx.padL, ctx.yRef.value, ctx.BODY_W, 0.8).fill(SAFETY);
    ctx.yRef.value += 10;
  };

  const drawBlock = (b: Block) => {
    const yRef = ctx.yRef;
    if (b.kind === "spacer") {
      yRef.value += 12;
      return;
    }
    if (b.kind === "h1" || b.kind === "h2" || b.kind === "h3") {
      const size = b.kind === "h1" ? 14 : b.kind === "h2" ? 12.5 : 11.5;
      const tokens = wordize(b.runs, size, NAVY).map((t) =>
        t.font === "Helvetica" ? { ...t, font: "Helvetica-Bold" } : t
      );
      const lines = wrap(tokens, ctx.BODY_W);
      const h = lines.length * lineH(size) + 8;
      ensure(h);
      for (const ln of lines) {
        drawLine(ln, ctx.padL, yRef.value);
        yRef.value += lineH(size);
      }
      yRef.value += 8;
      return;
    }
    if (b.kind === "quote") {
      const tokens = wordize(b.runs, 10, INK);
      const lines = wrap(tokens, ctx.BODY_W - 24);
      ensure(lines.length * lineH(10) + 8);
      pdf.rect(ctx.padL, yRef.value, 3, lines.length * lineH(10)).fill(SAFETY);
      for (const ln of lines) {
        drawLine(ln, ctx.padL + 12, yRef.value);
        yRef.value += lineH(10);
      }
      yRef.value += 8;
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
    const lines = wrap(tokens, ctx.BODY_W - indent);
    ensure(lines.length * lineH(10) + (isList ? 4 : 12));
    for (const ln of lines) {
      drawLine(ln, ctx.padL + indent, yRef.value);
      yRef.value += lineH(10);
    }
    yRef.value += isList ? 4 : 12;
  };

  return { ensure, lineH, sectionHeading, drawBlock, wordize, wrap };
}

export { htmlToBlocks };
export type { Block, TextRun };
