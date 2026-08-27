-- Quotes: track creator name for audit.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by_name TEXT;
