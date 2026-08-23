// Browser-side mirror of public/images/products/process_images.py
// (flood-fill cutout fallback + crop + product_template.jpg background layout).
// Runs before upload so the same look is produced on Vercel, where the
// Python pipeline cannot run, and so the payload stays under Vercel's
// 4.5MB serverless request-body limit.
//
// The layout enhances PRESENTATION only — the physical product is never
// filtered or recoloured, only cropped/resized to fit the composition.

const SIZE = 1920;
const FILL_RATIO = 0.95;
const QUALITY = 0.95;
// Working resolution for background removal. Must stay comfortably ABOVE the
// output size (1920) so the composed image is never upsampled; 3200 keeps
// fine product detail (textures, labels) through the cutout + crop stages
// without exhausting browser memory on large uploads.
const MAX_WORKING = 3200;
const TEMPLATE_URL = "/images/products/product_template.jpg";

export const CLIENT_WEBSITE = "www.kimsafety.co.ke";
export const CLIENT_EMAIL = "sales@kimsafety.co.ke";
export const CLIENT_PHONE = "+254 715 135 141";
export const CLIENT_CONTACT = `${CLIENT_EMAIL} · ${CLIENT_PHONE}`;

export interface ClientProcessOptions {
  size?: number;
  quality?: number;
  templateUrl?: string;
  brand?: boolean;
}

/**
 * Draws `img` into the destination rect with high-quality resampling.
 * Canvas2D defaults to imageSmoothingQuality "low" in some browsers, which is
 * a major source of blurry product photos after processing. For large
 * downscale factors we also step down by halves — single-pass big downscales
 * alias and soften; halving keeps edges crisp.
 */
function drawImageHQ(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const sw = Number((img as HTMLCanvasElement).width ?? (img as HTMLImageElement).naturalWidth ?? dw);
  const sh = Number((img as HTMLCanvasElement).height ?? (img as HTMLImageElement).naturalHeight ?? dh);
  let cw = sw;
  let ch = sh;
  if (dw < sw / 2 || dh < sh / 2) {
    // Step down by halves on an offscreen canvas until close to target.
    let stage: HTMLCanvasElement | CanvasImageSource = img;
    while (cw / 2 >= dw && ch / 2 >= dh && cw > 2 && ch > 2) {
      const half = document.createElement("canvas");
      half.width = Math.max(1, Math.floor(cw / 2));
      half.height = Math.max(1, Math.floor(ch / 2));
      const hctx = half.getContext("2d")!;
      hctx.imageSmoothingEnabled = true;
      hctx.imageSmoothingQuality = "high";
      hctx.drawImage(stage as CanvasImageSource, 0, 0, half.width, half.height);
      stage = half;
      cw = half.width;
      ch = half.height;
    }
    ctx.drawImage(stage, dx, dy, dw, dh);
    return;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Pixel-exact 1:1 extraction of a sub-region (no resampling — lossless).
 */
function cropHQ(cutout: HTMLCanvasElement, left: number, top: number, width: number, height: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(cutout, left, top, width, height, 0, 0, width, height);
  return out;
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
    drawImageHQ(ctx, bitmap, 0, 0, w, h);
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
  // so the layout keeps the product's natural aspect ratio.
  const { left, top, width, height } = productBBox(cutout);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  drawImageHQ(out.getContext("2d")!, cutout, 0, 0, width, height);
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
  drawImageHQ(ctx2, cutout, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
  return canvas;
}

async function composeTemplateLayout(
  img: HTMLCanvasElement,
  size: number,
  templateUrl: string
): Promise<HTMLCanvasElement> {
  const S = size;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // product_template.jpg fills the whole canvas (no drawn header/footer/CTA).
  const tpl = new Image();
  tpl.src = templateUrl;
  await new Promise<void>((resolve, reject) => {
    tpl.onload = () => resolve();
    tpl.onerror = () => reject(new Error("template load failed"));
  });
  drawImageHQ(ctx, tpl, 0, 0, S, S);

  // Product keeps its natural aspect ratio, is centered and gets a soft shadow.
  const pw = img.width;
  const ph = img.height;
  const maxW = Math.round(S * 0.8);
  const maxH = Math.round(S * 0.66);
  const scale = Math.min(maxW / Math.max(pw, 1), maxH / Math.max(ph, 1));
  const dw = Math.max(1, Math.round(pw * scale));
  const dh = Math.max(1, Math.round(ph * scale));
  const px = Math.round((S - dw) / 2);
  const py = Math.round((S - dh) / 2);

  ctx.save();
  ctx.shadowColor = "rgba(15,40,71,0.16)";
  ctx.shadowBlur = Math.max(6, Math.round(S * 0.014));
  ctx.shadowOffsetY = Math.round(S * 0.012);
  drawImageHQ(ctx, img, px, py, dw, dh);
  ctx.restore();

  return canvas;
}

export async function processImageInBrowser(
  file: File,
  opts: ClientProcessOptions = {}
): Promise<File> {
  const size = opts.size ?? SIZE;
  const quality = opts.quality ?? QUALITY;
  const brand = opts.brand ?? true;
  const templateUrl = opts.templateUrl ?? TEMPLATE_URL;

  const ext = (file.name.match(/\.[^.]+$/) ?? [""])[0].toLowerCase();
  if (ext === ".gif" || (!file.type.startsWith("image/") && !ext)) {
    throw new Error("Unsupported format");
  }

  const original = await loadImage(file);
  const cutout = cutoutCanvas(original);
  let result: HTMLCanvasElement;
  if (brand) {
    result = await composeTemplateLayout(cropProduct(cutout), size, templateUrl);
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
