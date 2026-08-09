-- DB-backed file storage so uploads persist on serverless (Vercel) where the
-- filesystem is read-only/ephemeral. Files are served by /api/uploads/[file]
-- with a fallback to the filesystem (local dev + committed images).
CREATE TABLE IF NOT EXISTS upload_files (
  filename   TEXT PRIMARY KEY,
  data       BYTEA NOT NULL,
  mime       TEXT,
  size       BIGINT NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Track which staff member created quotes / supplier purchase orders so staff
-- can only delete their own while superadmins manage everything.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS created_by_id TEXT;
