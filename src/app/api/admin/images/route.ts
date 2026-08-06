export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/api-helpers";
import { processProductImage } from "@/lib/image-processor";

const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 8 * 1024 * 1024;

function listDir(relative: string): string[] {
  const dir = path.join(process.cwd(), "public", "images", relative);
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_RE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch {
    return [];
  }
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    products: listDir("products"),
    hero: listDir("hero"),
    logo: listDir("logo"),
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided (field: file)" }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — maximum 8 MB" }, { status: 413 });
  }
  const ext = MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported format — use JPG, PNG, WEBP or GIF" }, { status: 415 });
  }

  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const stamp = Date.now().toString(36);
  const filename = `${safeBase || "image"} ${stamp}${ext}`;
  const dir = path.join(process.cwd(), "public", "images", "products");
  const dest = path.join(dir, filename);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  // Auto-process: white background + KimSafety logo/contact branding
  // (runs the same pipeline as public/images/products/process_images.py)
  const processed = await processProductImage(filename);

  return NextResponse.json(
    { path: `/api/uploads/${encodeURIComponent(filename)}`, processed },
    { status: 201 }
  );
}
