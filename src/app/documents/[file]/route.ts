export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStoredFile } from "@/lib/file-store";

const SAFE_NAME = /^[\w .-]+\.(pdf|jpe?g|png|webp|docx?|xlsx?|pptx?|zip|txt)$/i;

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  const stored = await getStoredFile(file).catch(() => undefined);
  if (!stored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const mime =
    stored.mime ??
    (/\.pdf$/i.test(file) ? "application/pdf"
    : /\.jpe?g$/i.test(file) ? "image/jpeg"
    : /\.png$/i.test(file) ? "image/png"
    : /\.webp$/i.test(file) ? "image/webp"
    : "application/octet-stream");
  return new NextResponse(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stored.data.length),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
