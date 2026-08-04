import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|jpe?g|png|webp)$/i;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "documents");
  fs.mkdirSync(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.test(file.name)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.name}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (max 10MB): ${file.name}` }, { status: 400 });
    }
    const ext = path.extname(file.name).toLowerCase();
    const name = `${randomUUID()}${ext}`;
    const dest = path.join(dir, name);
    fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/documents/${name}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
