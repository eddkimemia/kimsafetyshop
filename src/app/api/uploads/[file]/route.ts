export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStoredFile } from "@/lib/file-store";

// Allow parentheses/brackets/commas/&/@ etc. — many real uploads contain them
// (e.g. the old dedupe suffix "file (1).jpg"). No slashes, so path traversal is
// impossible; the explicit ".." check below is extra defence.
const SAFE_NAME = /^[\w .\-()\[\],&'@+]+\.(jpe?g|png|webp|gif)$/i;

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  let file: string;
  try {
    file = decodeURIComponent(params.file);
  } catch {
    file = params.file;
  }
  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  // DB-stored uploads first (source of truth on serverless platforms).
  try {
    const stored = await getStoredFile(file);
    if (stored) {
      const type =
        /\.jpe?g$/i.test(file) ? "image/jpeg"
        : /\.png$/i.test(file) ? "image/png"
        : /\.webp$/i.test(file) ? "image/webp"
        : "image/gif";
      return new NextResponse(new Uint8Array(stored.data), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(stored.data.length),
        },
      });
    }
  } catch {
    // Fall through to filesystem.
  }

  // Local filesystem fallback (committed images + local dev uploads).
  const dir = path.join(process.cwd(), "public", "images", "products");
  const dest = path.join(dir, file);
  if (!dest.startsWith(dir)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  try {
    const data = fs.readFileSync(dest);
    const type =
      /\.jpe?g$/i.test(file) ? "image/jpeg"
      : /\.png$/i.test(file) ? "image/png"
      : /\.webp$/i.test(file) ? "image/webp"
      : "image/gif";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
