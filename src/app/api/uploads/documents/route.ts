import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { saveStoredFile, sniffType } from "@/lib/file-store";

export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|jpe?g|png|webp)$/i;

function safeName(name: string): string {
  const stripped = name.replace(/[/\\?%#*:|"<>]/g, "-").replace(/[\x00-\x1f]/g, "").trim();
  return stripped || `document-${Date.now().toString(36)}`;
}

function uniqueName(dir: string, name: string): string {
  const safe = safeName(name);
  const ext = path.extname(safe).toLowerCase();
  const base = path.basename(safe, ext);
  let candidate = safe;
  let i = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base} (${i})${ext}`;
    i++;
  }
  return candidate;
}

export async function POST(req: Request) {
  // Deliberately public: customers upload PO files during checkout, quotes and
  // corporate applications. Security relies on strict magic-byte sniffing
  // below (extension is never trusted) plus attachment-only serving.
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
    const data = Buffer.from(await file.arrayBuffer());
    // Verify the content matches the claimed extension — a renamed HTML/JS
    // payload named "report.pdf" is rejected outright.
    if (sniffType(data) === null) {
      return NextResponse.json({ error: `File content does not match ${path.extname(file.name)}: ${file.name}` }, { status: 400 });
    }
    const name = uniqueName(dir, file.name);
    const dest = path.join(dir, name);
    await saveStoredFile(name, data, file.type);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dest, data);
    } catch {
      // Disk write failed (read-only filesystem) — the DB copy is what matters.
    }
    urls.push(`/uploads/documents/${name}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
