export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStoredFile, sniffType } from "@/lib/file-store";

const SAFE_NAME = /^[\w .-]+\.(pdf|jpe?g|png|webp)$/i;

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  const stored = await getStoredFile(file).catch(() => undefined);
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Content-Type comes from the actual bytes (sniffed), never from a
  // client-supplied MIME — and files are served as an attachment so nothing
  // stored here can ever execute inline in a browser.
  const sniffed = sniffType(Buffer.from(stored.data));
  const mime = sniffed === "pdf" ? "application/pdf"
    : sniffed === "jpg" ? "image/jpeg"
    : sniffed === "png" ? "image/png"
    : sniffed === "webp" ? "image/webp"
    : "application/octet-stream";
  return new NextResponse(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stored.data.length),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
