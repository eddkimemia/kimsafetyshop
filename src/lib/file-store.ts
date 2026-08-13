import fs from "fs";
import path from "path";
import { q1, qr, qe } from "@/lib/db";

// Uploads live in the database (BYTEA) so they persist on serverless platforms
// (Vercel) where the filesystem is read-only and ephemeral. Locally we still
// write to disk so files can be inspected, but the DB copy is the source of
// truth when serving.

export type StoredFile = { filename: string; data: Buffer; mime: string | null; size: number };

/** Magic-byte sniff — the extension and any client-supplied MIME are never trusted. */
export function sniffType(data: Buffer): string | null {
  if (data.length >= 4 && data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) return "pdf";
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "jpg";
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "png";
  if (
    data.length >= 12 &&
    data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
    data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50
  ) return "webp";
  return null;
}

export async function saveStoredFile(filename: string, data: Buffer, mime?: string | null): Promise<void> {
  await qe(
    "INSERT INTO upload_files (filename, data, mime, size, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(filename) DO UPDATE SET data = excluded.data, mime = excluded.mime, size = excluded.size",
    filename,
    data,
    mime ?? null,
    data.length,
    new Date().toISOString()
  );
}

export async function getStoredFile(filename: string): Promise<StoredFile | undefined> {
  const row = (await q1("SELECT filename, data, mime, size FROM upload_files WHERE filename = ?", filename)) as
    | { filename: string; data: Buffer; mime: string | null; size: number }
    | undefined;
  return row;
}

export async function deleteStoredFile(filename: string): Promise<void> {
  await qe("DELETE FROM upload_files WHERE filename = ?", filename);
}

export async function listStoredFiles(): Promise<string[]> {
  const rows = (await qr("SELECT filename FROM upload_files ORDER BY created_at DESC")) as { filename: string }[];
  return rows.map((r) => r.filename);
}

/** Resolve a public path (e.g. "/api/uploads/foo.jpg") to a Buffer, checking the DB first. */
export async function readPublicFile(publicPath: string): Promise<Buffer | undefined> {
  if (!publicPath.startsWith("/")) return undefined;
  if (publicPath.startsWith("/api/uploads/")) {
    const filename = decodeURIComponent(path.basename(publicPath));
    const stored = await getStoredFile(filename);
    if (stored) return stored.data;
    const local = localFileFor("products", filename);
    if (local && fs.existsSync(local)) return fs.readFileSync(local);
    return undefined;
  }
  if (publicPath.startsWith("/uploads/")) {
    const filename = decodeURIComponent(path.basename(publicPath));
    const stored = await getStoredFile(filename);
    if (stored) return stored.data;
    const local = localFileFor("uploads/documents", filename);
    if (local && fs.existsSync(local)) return fs.readFileSync(local);
    return undefined;
  }
  if (publicPath.startsWith("/images/")) {
    const local = path.join(process.cwd(), "public", decodeURIComponent(publicPath).replace(/^\//, ""));
    if (fs.existsSync(local)) return fs.readFileSync(local);
    return undefined;
  }
  if (publicPath.startsWith("/documents/")) {
    // Admin document uploads (src/app/api/admin/documents) persist in the DB and
    // return /documents/<name> paths. Check the DB first (source of truth on
    // serverless), then the local disk mirror.
    const filename = decodeURIComponent(path.basename(publicPath));
    const stored = await getStoredFile(filename);
    if (stored) return stored.data;
    const local = localFileFor("documents", filename);
    if (local && fs.existsSync(local)) return fs.readFileSync(local);
    return undefined;
  }
  return undefined;
}

/** Absolute filesystem path under public/ for a given relative dir + filename. */
export function localFileFor(relativeDir: string, filename: string): string {
  return path.join(process.cwd(), "public", relativeDir, filename);
}
