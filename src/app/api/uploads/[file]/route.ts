export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAFE_NAME = /^[\w .-]+\.(jpe?g|png|webp|gif)$/i;

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const file = params.file;
  if (!SAFE_NAME.test(file) || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
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
