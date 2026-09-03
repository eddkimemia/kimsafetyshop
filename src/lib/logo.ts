import fs from "fs";
import { join } from "path";
import { getStoredFile } from "@/lib/file-store";

/**
 * Single source of truth for the branded logo across the whole app.
 *
 * The logo is a site setting (Admin → Settings → Branding). Never hardcode the
 * path in a component — resolve it through this module so a settings change
 * propagates everywhere: storefront header/footer, admin panel, email HTML,
 * PDF letterheads and structured data.
 */

export const DEFAULT_LOGO = "/images/logo/logoy.png";

/** Public URL/path for the configured logo (falls back to the bundled default). */
export function resolveLogoUrl(settings?: Partial<Record<string, string>> | null): string {
  const v = settings?.logo;
  return v && v.trim() ? v.trim() : DEFAULT_LOGO;
}

/**
 * Fetch the configured logo as bytes for embedding in PDFs.
 *
 * Uploaded logos are persisted in the DB (BYTEA — the source of truth on
 * serverless) and only mirrored to disk locally, so this checks the DB first,
 * then the local public directory, then falls back to the bundled default
 * (never <blank> in a generated document).
 */
export async function readLogoBytes(logoUrl?: string | null): Promise<Buffer | undefined> {
  const wanted = logoUrl && logoUrl.trim() ? logoUrl.trim() : DEFAULT_LOGO;

  // An absolute remote URL entered manually in settings.
  if (/^https?:\/\//i.test(wanted)) {
    try {
      const res = await fetch(wanted, { cache: "no-store" });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length) return buf;
      }
    } catch {
      // unreachable / invalid — fall through to the bundled default
    }
    return readLocalOrDb(DEFAULT_LOGO);
  }

  const direct = await readLocalOrDb(wanted);
  if (direct) return direct;

  // Configured logo is missing/corrupt — never render a blank header.
  if (wanted !== DEFAULT_LOGO) return readLocalOrDb(DEFAULT_LOGO);
  return undefined;
}

async function readLocalOrDb(publicPath: string): Promise<Buffer | undefined> {
  if (!publicPath.startsWith("/")) return undefined;
  // Uploads & admin documents live in the DB first (serverless-safe), then as a
  // local disk mirror under public/ for local inspection.
  if (
    publicPath.startsWith("/uploads/") ||
    publicPath.startsWith("/documents/") ||
    publicPath.startsWith("/api/uploads/")
  ) {
    const filename = decodeURIComponent(publicPath.split("/").pop() ?? "");
    const stored = await getStoredFile(filename).catch(() => undefined);
    if (stored?.data) return stored.data;
  }
  const local = join(process.cwd(), "public", decodeURIComponent(publicPath).replace(/^\/+/, ""));
  if (fs.existsSync(local)) return fs.readFileSync(local);
  return undefined;
}

/**
 * Minimal intrinsic dimension reader (PNG / JPEG / WebP / GIF) used to size the
 * logo in letterhead PDF layouts without guessing an aspect ratio.
 */
export function getLogoSize(buf: Buffer): { width: number; height: number } | null {
  if (!buf || buf.length < 16) return null;

  // PNG — IHDR width/height at fixed offsets.
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // GIF87a / GIF89a
  if (buf.length >= 10 && buf.readUInt32BE(0) === 0x47494638) {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // WebP (RIFF....WEBP)
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const tag = buf.toString("ascii", 12, 16);
    if (tag === "VP8X" && buf.length >= 30) {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    }
    if (tag === "VP8 " && buf.length >= 30) {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (tag === "VP8L" && buf.length >= 25) {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  // JPEG — walk markers to the first SOF.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      while (offset < buf.length && buf[offset] !== 0xff) offset++;
      while (offset < buf.length && buf[offset] === 0xff) offset++;
      if (offset + 1 >= buf.length) break;
      const marker = buf[offset];
      offset += 1;
      // Standalone markers carry no payload.
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buf.length) break;
      const len = buf.readUInt16BE(offset);
      offset += 2;
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        if (offset + 5 > buf.length) break;
        return { height: buf.readUInt16BE(offset), width: buf.readUInt16BE(offset + 2) };
      }
      if (len < 2) break;
      offset += len - 2;
    }
  }
  return null;
}