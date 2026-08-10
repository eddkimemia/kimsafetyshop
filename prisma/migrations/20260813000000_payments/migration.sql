-- Payment processing: M-Pesa (Daraja STK push) and Paystack cards.
-- Orders start unpaid and are flipped to paid by the payment callback/webhook
-- (or manually by an admin as a fallback).
ALTER TABLE orders ADD COLUMN payment_phone TEXT;
ALTER TABLE orders ADD COLUMN mpesa_checkout_id TEXT;
ALTER TABLE orders ADD COLUMN mpesa_merchant_id TEXT;
ALTER TABLE orders ADD COLUMN paystack_reference TEXT;
ALTER TABLE orders ADD COLUMN payment_token TEXT;
