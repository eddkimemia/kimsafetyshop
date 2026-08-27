-- Order fulfilment: signed delivery note (image→PDF) + KRA invoice + delivery audit.
-- Orders cannot be marked Delivered without a delivery note. Images uploaded as
-- delivery notes are converted to PDF server-side before saving.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_note_file TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kra_invoice_file TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TEXT;

-- Purchase orders (customer PO): track which staff member created/imported them.
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Corporate applications / accounts: track reviewer.
ALTER TABLE corporate_applications ADD COLUMN IF NOT EXISTS handled_by TEXT;
ALTER TABLE corporate_applications ADD COLUMN IF NOT EXISTS handled_by_name TEXT;
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE corporate_accounts ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Supplier orders already have created_by_id; add name for display.
ALTER TABLE supplier_orders ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- Quotes: track creator name for audit.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by_name TEXT;
