export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/api-helpers";
import { processProductImage } from "@/lib/image-processor";
import { saveStoredFile, listStoredFiles, localFileFor } from "@/lib/file-store";

const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 8 * 1024 * 1024;
// Postgres error code 42P01 = undefined_table.
const isMissingTable = (err: unknown) => (err as { code?: string })?.code === "42P01";
const MISSING_TABLE_MSG =
  "Database migration needed: the upload_files table does not exist on this database. Run the deploy pipeline (it applies `prisma migrate deploy`), then try again.";

function listDir(relative: string): string[] {
  const dir = path.join(process.cwd(), "public", "images", relative);
  const local = (() => {
    try {
      return fs
        .readdirSync(dir)
        .filter((f) => IMAGE_RE.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    } catch {
      return [] as string[];
    }
  })();
  return local;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const [products, hero, logo] = await Promise.all([listDir("products"), listDir("hero"), listDir("logo")]);
  // DB-backed uploads are the source of truth on serverless (Vercel). If the
  // upload_files table doesn't exist yet (migrations not applied), fall back to
  // the disk library so committed images still show in the picker.
  let storedImages: string[] = [];
  try {
    storedImages = (await listStoredFiles()).filter((f) => IMAGE_RE.test(f));
  } catch (err) {
    // Missing table (42P01) — disk images still work; uploads will report the issue.
    // Other DB errors are real failures — surface them.
    if (!isMissingTable(err)) throw err;
  }
  const all = Array.from(new Set([...storedImages, ...products]));
  return NextResponse.json({
    products: all,
    hero,
    logo,
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
  const dir = path.join(process.cwd(), "public", "images", "products");
  const base = safeBase || "image";

  // Keep the original file name so downloads save as the uploader named the file.
  // On serverless the disk is empty, so also check the DB-backed library.
  let filename = `${base}${ext}`;
  {
    let storedNames: string[] = [];
    try {
      storedNames = await listStoredFiles();
    } catch (err) {
      if (isMissingTable(err)) {
        return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
      }
      console.error("[admin/images] listStoredFiles failed:", err);
      throw err;
    }
    const existing = new Set([...storedNames, ...listDir("products")].map((f) => f.toLowerCase()));
    let n = 1;
    while (existing.has(filename.toLowerCase())) {
      // Use a dash suffix ("file-1.jpg") instead of the classic " (1)" pattern
      // so generated names stay clean and consistently servable.
      filename = `${base}-${n}${ext}`;
      n++;
    }
  }
  const dest = path.join(dir, filename);

  const data = Buffer.from(await file.arrayBuffer());
  try {
    // Persist in the DB first (source of truth on serverless), then mirror to disk locally.
    await saveStoredFile(filename, data, file.type);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dest, data);
    } catch {
      // Disk write failed (read-only filesystem) — the DB copy is what matters.
    }
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ error: MISSING_TABLE_MSG }, { status: 500 });
    }
    console.error("[admin/images] save failed:", err);
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  // Auto-process: background-removed product on the KimSafety product template.
  // When the client already processed the image in the browser (processed=1),
  // skip the Python pipeline entirely — it cannot run on serverless anyway.
  const clientProcessed = form.get("processed") === "1";
  const processed =
    !clientProcessed && fs.existsSync(localFileFor("images/products", filename))
      ? await processProductImage(filename)
      : clientProcessed;

  return NextResponse.json(
    { path: `/api/uploads/${encodeURIComponent(filename)}`, processed },
    { status: 201 }
  );
}
