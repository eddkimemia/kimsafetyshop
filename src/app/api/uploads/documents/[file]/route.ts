export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStoredFile } from "@/lib/file-store";

// Same safety profile as /api/uploads/[file] — no slashes, explicit ".." guard.
const SAFE_NAME = /^[\w .\-()\[\],&'@+]+\.(jpe?g|png|webp|pdf)$/i;

/**
 * Serves DB-stored document uploads (logos, PO files) by filename.
 *
 * Uploads are persisted to Postgres (BYTEA) because the Vercel filesystem is
 * ephemeral — the local public/uploads/documents mirror only exists in dev.
 * Without this route an uploaded logo resolves fine locally but 404s (blank
 * logo) in production. Images render inline; PDFs download as attachments.
 */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  try {
    const stored = await getStoredFile(file);
    if (stored) {
      const isPdf = /\.pdf$/i.test(file);
      const type =
        isPdf ? "application/pdf"
        : /\.jpe?g$/i.test(file) ? "image/jpeg"
        : /\.png$/i.test(file) ? "image/png"
        : /\.webp$/i.test(file) ? "image/webp"
        : "application/octet-stream";
      return new NextResponse(new Uint8Array(stored.data), {
        headers: {
          "Content-Type": type,
          // PDFs inline so they open in a new tab; other images also inline.
          "Content-Disposition": `inline; filename="${file.replace(/"/g, "")}"`,
          // Immutable per filename — uploads never change content in place.
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(stored.data.length),
        },
      });
    }
  } catch {
    // Fall through to filesystem.
  }

  const dir = path.join(process.cwd(), "public", "uploads", "documents");
  const dest = path.join(dir, file);
  if (!dest.startsWith(dir)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  try {
    const data = fs.readFileSync(dest);
    const isPdf = /\.pdf$/i.test(file);
    return new NextResponse(data, {
      headers: {
        "Content-Type":
          isPdf ? "application/pdf"
          : /\.jpe?g$/i.test(file) ? "image/jpeg"
          : /\.png$/i.test(file) ? "image/png"
          : /\.webp$/i.test(file) ? "image/webp"
          : "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.replace(/"/g, "")}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
