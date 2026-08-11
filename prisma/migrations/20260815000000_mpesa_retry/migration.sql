-- M-Pesa push retry tracking + receipt capture:
-- Orders track how many STK pushes have been sent (cooldown + max attempts),
-- the last callback result (so the checkout screen can explain declines), and
-- the MpesaReceiptNumber from the successful callback (shown on paid invoices).
ALTER TABLE orders ADD COLUMN mpesa_push_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN mpesa_pushed_at TEXT;
ALTER TABLE orders ADD COLUMN mpesa_last_result TEXT;
ALTER TABLE orders ADD COLUMN mpesa_last_result_desc TEXT;
ALTER TABLE orders ADD COLUMN mpesa_transaction_id TEXT;