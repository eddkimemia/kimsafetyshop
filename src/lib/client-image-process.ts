// Browser-side mirror of public/images/products/process_images.py
// (flood-fill cutout fallback + crop/center + KimSafety branding).
// Runs before upload so the same look is produced on Vercel, where the
// Python pipeline cannot run, and so the payload stays under Vercel's
// 4.5MB serverless request-body limit.

const SIZE = 1200;
const FILL_RATIO = 0.95;
const QUALITY = 0.92;
const MAX_WORKING = 2000;

export const CLIENT_WEBSITE = "www.kimsafety.co.ke";
export const CLIENT_CONTACT = "sales@kimsafety.co.ke · +254 715 135 141";

const NAVY = "rgb(15, 40, 71)";
const INK = "rgb(51, 65, 85)";
const PANEL_LINE = "rgb(226, 232, 240)";

const FONT_BOLD = 'bold 30px "Segoe UI", system-ui, -apple-system, sans-serif';
const FONT_REG = '21px "Segoe UI", system-ui, -apple-system, sans-serif';

export interface ClientProcessOptions {
  size?: number;
  quality?: number;
  logoUrl?: string;
  brand?: boolean;
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

function cropAndCenter(cutout: HTMLCanvasElement, size: number): HTMLCanvasElement {
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
  const right = Math.min(w, maxX + padX + 1);
  const bottom = Math.min(h, maxY + padY + 1);
  const cropW = right - left;
  const cropH = bottom - top;

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

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

async function brandImage(
  img: HTMLCanvasElement,
  logoUrl: string,
  website: string,
  contact: string
): Promise<HTMLCanvasElement> {
  const w = img.width;
  const h = img.height;
  const ctx = img.getContext("2d")!;
  const margin = Math.round(w * 0.02);
  const panelH = Math.round(w * 0.083);
  const radius = Math.round(w * 0.014);
  const panelY = h - margin - panelH;

  // Bottom-left: logo badge.
  const logo = await loadLogo(logoUrl);
  if (logo) {
    const maxLogoH = panelH - Math.round(w * 0.014);
    const maxLogoW = Math.round(w * 0.24);
    const ratio = logo.naturalHeight / Math.max(1, logo.naturalWidth);
    const logoH = Math.min(maxLogoH, Math.round(maxLogoW * ratio));
    const logoW = Math.max(1, Math.round(logoH / ratio));
    const panelW = logoW + Math.round(w * 0.04);
    ctx.save();
    roundedRect(ctx, margin, panelY, panelW, panelH, radius);
    ctx.fillStyle = "rgba(255,255,255,0.98)";
    ctx.fill();
    ctx.lineWidth = Math.max(1, w * 0.0016);
    ctx.strokeStyle = PANEL_LINE;
    ctx.stroke();
    ctx.drawImage(logo, margin + Math.round(w * 0.02), panelY + (panelH - logoH) / 2, logoW, logoH);
    ctx.restore();
  }

  // Bottom-right: website + contact text panel.
  ctx.save();
  ctx.font = FONT_BOLD;
  const line1W = ctx.measureText(website).width;
  ctx.font = FONT_REG;
  const line2W = ctx.measureText(contact).width;
  const padX = Math.round(w * 0.02);
  const lineGap = Math.round(w * 0.007);
  const textW = Math.max(line1W, line2W);
  const panelW = Math.ceil(textW + padX * 2);
  const panelX = w - margin - panelW;
  roundedRect(ctx, panelX, panelY, panelW, panelH, radius);
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, w * 0.0016);
  ctx.strokeStyle = PANEL_LINE;
  ctx.stroke();
  ctx.font = FONT_BOLD;
  ctx.textBaseline = "top";
  ctx.fillStyle = NAVY;
  ctx.fillText(website, panelX + padX, panelY + Math.round(w * 0.018));
  ctx.font = FONT_REG;
  ctx.fillStyle = INK;
  ctx.fillText(
    contact,
    panelX + padX,
    panelY + Math.round(w * 0.018) + 30 + lineGap
  );
  ctx.restore();
  return img;
}

export async function processImageInBrowser(
  file: File,
  opts: ClientProcessOptions = {}
): Promise<File> {
  const size = opts.size ?? SIZE;
  const quality = opts.quality ?? QUALITY;
  const logoUrl = opts.logoUrl ?? "/images/logo/logoy.jpg";
  const brand = opts.brand ?? true;

  const ext = (file.name.match(/\.[^.]+$/) ?? [""])[0].toLowerCase();
  if (ext === ".gif" || (!file.type.startsWith("image/") && !ext)) {
    throw new Error("Unsupported format");
  }

  const original = await loadImage(file);
  const cutout = cutoutCanvas(original);
  let result = cropAndCenter(cutout, size);
  if (brand) result = await brandImage(result, logoUrl, CLIENT_WEBSITE, CLIENT_CONTACT);

  const isPng = ext === ".png";
  const mime = isPng ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const blob = (await canvasToBlob(result, mime, quality)) ?? (await canvasToBlob(result, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode image");

  const name = file.name.replace(/\.[^.]+$/, "") + (mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], name, { type: mime });
}
