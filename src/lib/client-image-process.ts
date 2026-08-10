// Browser-side mirror of public/images/products/process_images.py
// (flood-fill cutout fallback + crop/center + KIM SAFETY ad layout).
// Runs before upload so the same look is produced on Vercel, where the
// Python pipeline cannot run, and so the payload stays under Vercel's
// 4.5MB serverless request-body limit.
//
// The ad layout enhances PRESENTATION only — the physical product is never
// filtered or recoloured, only cropped/resized to fit the composition.

const SIZE = 1200;
const FILL_RATIO = 0.95;
const QUALITY = 0.92;
const MAX_WORKING = 2000;

export const CLIENT_WEBSITE = "www.kimsafety.co.ke";
export const CLIENT_EMAIL = "sales@kimsafety.co.ke";
export const CLIENT_PHONE = "+254 715 135 141";
export const CLIENT_CONTACT = `${CLIENT_EMAIL} · ${CLIENT_PHONE}`;

// Brand palette (matches tailwind.config.ts + process_images.py)
const NAVY = "#0F2847"; // deep/royal blue — primary
const ORANGE = "#F57C00"; // orange — secondary
const RED = "#EF4444"; // red — limited accent
const LIGHT_BLUE = "#E0EAF6"; // subtle blue graphic tint
const HAIRLINE = "#E1E9F4";
const FOOTER_BLUE = "#9FB3CF";
const FOOTER_LINE = "#1F3C61";

export interface ClientProcessOptions {
  size?: number;
  quality?: number;
  logoUrl?: string;
  brand?: boolean;
  title?: string;
  website?: string;
  email?: string;
  phone?: string;
}

function cleanTitle(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)\s*$/, "").trim().toUpperCase();
}

function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      cur = test;
    } else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [text];
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r0 = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r0, y);
  ctx.arcTo(x + w, y, x + w, y + h, r0);
  ctx.arcTo(x + w, y + h, x, y + h, r0);
  ctx.arcTo(x, y + h, x, y, r0);
  ctx.arcTo(x, y, x + w, y, r0);
  ctx.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadImage(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_WORKING / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas;
  } finally {
    bitmap.close();
  }
}

function floodCutout(data: Uint8ClampedArray, w: number, h: number, threshold = 60): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(w * h).fill(255);
  const corner = [data[0], data[1], data[2]];
  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const push = (i: number) => {
    if (!visited[i]) {
      visited[i] = 1;
      stack[sp++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (sp > 0) {
    const i = stack[--sp];
    const r = data[i * 4] - corner[0];
    const g = data[i * 4 + 1] - corner[1];
    const b = data[i * 4 + 2] - corner[2];
    if (Math.abs(r) + Math.abs(g) + Math.abs(b) > threshold) continue;
    alpha[i] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }
  return alpha;
}

function feather(mask: Uint8ClampedArray, w: number, h: number, passes = 2): Uint8ClampedArray {
  let src = mask;
  for (let p = 0; p < passes; p++) {
    const dst = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          const r = yy * w;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            sum += src[r + xx];
            n++;
          }
        }
        dst[row + x] = sum / n;
      }
    }
    src = dst;
  }
  return src;
}

function cutoutCanvas(original: HTMLCanvasElement): HTMLCanvasElement {
  const w = original.width;
  const h = original.height;
  const ctx = original.getContext("2d", { willReadFrequently: true })!;
  const data = ctx.getImageData(0, 0, w, h);
  const mask = feather(floodCutout(data.data, w, h), w, h);
  for (let i = 0; i < mask.length; i++) data.data[i * 4 + 3] = mask[i];
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.putImageData(data, 0, 0);
  return out;
}

function productBBox(cutout: HTMLCanvasElement): { left: number; top: number; width: number; height: number } {
  const w = cutout.width;
  const h = cutout.height;
  const ctx = cutout.getContext("2d")!;
  const alpha = ctx.getImageData(0, 0, w, h).data.filter((_, i) => i % 4 === 3);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (alpha[row + x] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }
  const padX = Math.max(1, Math.round((maxX - minX) * 0.04));
  const padY = Math.max(1, Math.round((maxY - minY) * 0.04));
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  return {
    left,
    top,
    width: Math.min(w, maxX + padX + 1) - left,
    height: Math.min(h, maxY + padY + 1) - top,
  };
}

function cropProduct(cutout: HTMLCanvasElement): HTMLCanvasElement {
  // Crop to the product bounding box — does NOT paste onto a white canvas,
  // so the ad layout keeps the product's natural aspect ratio.
  const { left, top, width, height } = productBBox(cutout);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  out.getContext("2d")!.drawImage(cutout, left, top, width, height, 0, 0, width, height);
  return out;
}

function cropAndCenter(cutout: HTMLCanvasElement, size: number): HTMLCanvasElement {
  // Plain white-square fallback (used when branding is disabled).
  const { left, top, width: cropW, height: cropH } = productBBox(cutout);

  const target = Math.round(size * FILL_RATIO);
  const scale = Math.min(1, target / Math.max(cropW, cropH));
  const drawW = Math.max(1, Math.round(cropW * scale));
  const drawH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx2 = canvas.getContext("2d")!;
  ctx2.fillStyle = "#ffffff";
  ctx2.fillRect(0, 0, size, size);
  ctx2.drawImage(cutout, left, top, cropW, cropH, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  return canvas;
}

async function loadLogo(url: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo load failed"));
    });
    return img;
  } catch {
    return null;
  }
}

async function composeAdLayout(
  img: HTMLCanvasElement,
  size: number,
  logoUrl: string,
  website: string,
  email: string,
  phone: string,
  title: string
): Promise<HTMLCanvasElement> {
  const S = size;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const r = (n: number) => Math.round(S * n);

  // ---- White canvas ----
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);

  // ---- Main area: only two subtle graphic accents (minimal on purpose) ----
  // Light-blue ring, top-right.
  ctx.lineWidth = Math.max(6, r(0.0092));
  ctx.strokeStyle = LIGHT_BLUE;
  ctx.beginPath();
  ctx.arc(r(0.8667), r(0.275), r(0.0733), 0, Math.PI * 2);
  ctx.stroke();
  // Orange dot, bottom-left.
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(r(0.1375), r(0.7333), r(0.0125), 0, Math.PI * 2);
  ctx.fill();

  // ---- Product: LARGE and dominant (presentation only, never filtered) ----
  const zoneTop = r(0.225);
  const zoneBottom = S - r(0.2167);
  const zoneCy = Math.round((zoneTop + zoneBottom) / 2);
  const pw = img.width;
  const ph = img.height;
  const maxW = r(0.6);
  const maxH = r(0.5333);
  const scale = Math.min(maxW / Math.max(pw, 1), maxH / Math.max(ph, 1));
  const dw = Math.max(1, Math.round(pw * scale));
  const dh = Math.max(1, Math.round(ph * scale));
  const px = Math.round((S - dw) / 2);
  const py = Math.round(zoneCy - dh / 2);
  ctx.save();
  ctx.shadowColor = "rgba(15,40,71,0.24)";
  ctx.shadowBlur = Math.max(6, r(0.016));
  ctx.shadowOffsetY = r(0.0108);
  ctx.drawImage(img, px, py, dw, dh);
  ctx.restore();

  // ---- Top header: centered KIM SAFETY SOLUTIONS logo ----
  const headerH = r(0.105);
  const logo = await loadLogo(logoUrl);
  if (logo) {
    let logoW = r(0.2667);
    let logoH = Math.max(1, Math.round((logoW * logo.naturalHeight) / Math.max(logo.naturalWidth, 1)));
    if (logoH > headerH - r(0.012)) {
      logoH = headerH - r(0.012);
      logoW = Math.max(1, Math.round((logoH * logo.naturalWidth) / Math.max(logo.naturalHeight, 1)));
    }
    ctx.drawImage(logo, Math.round((S - logoW) / 2), Math.round((headerH - logoH) / 2), logoW, logoH);
  }
  // Divider rule: full-width hairline + centered orange segment + red dots
  const dividerY = r(0.1);
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = Math.max(2, r(0.002));
  ctx.beginPath();
  ctx.moveTo(0, dividerY);
  ctx.lineTo(S, dividerY);
  ctx.stroke();
  const segW = r(0.09);
  const segH = Math.max(3, r(0.0042));
  const segX0 = Math.round((S - segW) / 2);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(segX0, dividerY - segH, segW, segH);
  const dotR = Math.max(3, r(0.0035));
  const dotY = dividerY - Math.floor(segH / 2);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(segX0, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(segX0 + segW, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Title band: bold navy product name + orange underline ----
  ctx.textBaseline = "top";
  const font = (weight: string, px: number) =>
    `${weight} ${px}px "Segoe UI", system-ui, -apple-system, sans-serif`;
  const titleX = r(0.0667);
  const maxTitleW = r(0.62);
  if (title) {
    ctx.font = font("bold", r(0.035));
    let lines = wrapTitle(ctx, title, maxTitleW);
    let titlePx = r(0.035);
    if (lines.length > 2) {
      titlePx = r(0.03);
      ctx.font = font("bold", titlePx);
      lines = wrapTitle(ctx, title, maxTitleW);
    }
    if (lines.length > 2) {
      lines = lines.slice(0, 2);
    }
    // Ellipsis-truncate any line that still exceeds the max width
    // (e.g. a single overlong word with no spaces).
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (ctx.measureText(line).width > maxTitleW) {
        while (line.length > 1 && ctx.measureText(line + "…").width > maxTitleW) {
          line = line.slice(0, -1);
        }
        lines[i] = line + "…";
      }
    }
    ctx.fillStyle = NAVY;
    let y = r(0.14);
    for (const line of lines) {
      ctx.fillText(line, titleX, y);
      y += titlePx + r(0.004);
    }
    ctx.fillStyle = ORANGE;
    ctx.fillRect(titleX, y + r(0.008), r(0.07), r(0.0042));
  }

  // ---- Bottom footer: deep navy with orange accent lines ----
  const footerY = S - r(0.2167);
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, footerY, S, S - footerY);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, footerY, S, r(0.005));
  ctx.fillStyle = FOOTER_LINE;
  ctx.fillRect(0, footerY + r(0.005), S, r(0.0025));

  // Left block: brand identity
  const leftX = r(0.0667);
  const companyY = footerY + r(0.0533);
  ctx.font = font("bold", r(0.025));
  ctx.fillStyle = "#ffffff";
  ctx.fillText("KIM SAFETY SOLUTIONS", leftX, companyY);
  const underlineY = companyY + r(0.025) + r(0.005);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(leftX, underlineY, r(0.06), r(0.0042));
  const tagY = underlineY + r(0.014);
  const tagSize = Math.max(6, r(0.0075));
  ctx.fillStyle = RED;
  ctx.fillRect(leftX, tagY + r(0.002), tagSize, tagSize);
  ctx.fillStyle = FOOTER_BLUE;
  ctx.font = font("400", r(0.015));
  // Slight letter-spacing, mirroring the Python pipeline's tracked text.
  const spaced = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  spaced.letterSpacing = `${Math.max(1, r(0.0017))}px`;
  ctx.fillText("PPE · WORKWEAR · SAFETY EQUIPMENT", leftX + tagSize + r(0.01), tagY);
  spaced.letterSpacing = "0px";

  // Vertical divider between left brand block and right CTA block
  const dvX = r(0.4833);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dvX, footerY + r(0.055));
  ctx.lineTo(dvX, footerY + r(0.19));
  ctx.stroke();

  // Right block: ORDER NOW CTA button (orange) with the phone inside
  const btnW = r(0.3);
  const btnH = r(0.1);
  const btnX0 = S - r(0.05) - btnW;
  const btnY0 = footerY + r(0.05);
  ctx.fillStyle = ORANGE;
  roundedRect(ctx, btnX0, btnY0, btnW, btnH, r(0.012));
  ctx.fill();
  ctx.textAlign = "center";
  const btnCx = btnX0 + btnW / 2;
  ctx.fillStyle = "#ffffff";
  ctx.font = font("bold", r(0.0267));
  ctx.fillText("ORDER NOW", btnCx, btnY0 + r(0.0225));
  ctx.font = font("bold", r(0.02));
  ctx.fillText(phone, btnCx, btnY0 + r(0.0625));
  ctx.textAlign = "left";

  // website · email, right-aligned beneath the CTA
  ctx.fillStyle = FOOTER_BLUE;
  ctx.font = font("400", r(0.0133));
  ctx.textAlign = "right";
  ctx.fillText(`${website}  ·  ${email}`, btnX0 + btnW, btnY0 + btnH + r(0.015));
  ctx.textAlign = "left";

  return canvas;
}

export async function processImageInBrowser(
  file: File,
  opts: ClientProcessOptions = {}
): Promise<File> {
  const size = opts.size ?? SIZE;
  const quality = opts.quality ?? QUALITY;
  const logoUrl = opts.logoUrl ?? "/images/logo/logoy.jpg";
  const brand = opts.brand ?? true;
  const website = opts.website ?? CLIENT_WEBSITE;
  const email = opts.email ?? CLIENT_EMAIL;
  const phone = opts.phone ?? CLIENT_PHONE;

  const ext = (file.name.match(/\.[^.]+$/) ?? [""])[0].toLowerCase();
  if (ext === ".gif" || (!file.type.startsWith("image/") && !ext)) {
    throw new Error("Unsupported format");
  }

  const original = await loadImage(file);
  const cutout = cutoutCanvas(original);
  let result: HTMLCanvasElement;
  if (brand) {
    const title = opts.title ?? cleanTitle(file.name);
    result = await composeAdLayout(cropProduct(cutout), size, logoUrl, website, email, phone, title);
  } else {
    result = cropAndCenter(cutout, size);
  }

  const isPng = ext === ".png";
  const mime = isPng ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const blob = (await canvasToBlob(result, mime, quality)) ?? (await canvasToBlob(result, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode image");

  const name = file.name.replace(/\.[^.]+$/, "") + (mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], name, { type: mime });
}
