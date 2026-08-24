-- Real gateway transaction identifiers:
-- paystack_transaction_id stores the transaction ID Paystack assigns at charge
-- time (data.id, e.g. 6487002679 — the ID shown in the Paystack dashboard),
-- captured from the verify response / charge.success webhook. The internal
-- paystack_reference (KSxxxxx-<ts>, generated at initialization) is still used
-- to match webhooks and prevent replay; this column carries the gateway's own
-- code for reconciliation, receipts and invoices.
ALTER TABLE orders ADD COLUMN paystack_transaction_id TEXT;
