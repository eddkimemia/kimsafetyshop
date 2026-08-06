export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/api-helpers";

const ALLOWED_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/zip": ".zip",
  "text/plain": ".txt",
};
const MAX_BYTES = 20 * 1024 * 1024;

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
    return NextResponse.json({ error: "File too large — maximum 20 MB" }, { status: 413 });
  }
  const ext = ALLOWED_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported format — use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP or TXT" },
      { status: 415 }
    );
  }

  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const stamp = Date.now().toString(36);
  const filename = `${safeBase || "document"} ${stamp}${ext}`;
  const dir = path.join(process.cwd(), "public", "documents");
  const dest = path.join(dir, filename);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Could not save file" }, { status: 500 });
  }

  return NextResponse.json({ path: `/documents/${encodeURIComponent(filename)}` }, { status: 201 });
}
