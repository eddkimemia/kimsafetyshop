# Today's Work — Implemented

## 1. Price changes propagate everywhere (product page, cart, checkout, orders)

- **Verified end-to-end** (production build, real Postgres): `/api/catalog` reflects admin price edits within ~5s; cart/checkout/search/home re-sync on mount via `refreshCatalog()`.
- **`src/components/product/product-detail.tsx`** — product page now re-resolves price, stock and bulk tiers from the live catalog on mount (`liveProduct(product.id) ?? product`), so admin edits show up immediately instead of waiting for the ISR revalidation window (~35s). All displayed price/stock/savings fields now read the live values.
- Order totals, confirmation emails and invoice PDFs were already computed server-side via `liveGetProduct` + fixed `bulkUnitPrice` — confirmed consistent with the storefront.

## 2. Bulk prices follow the base price automatically (admin)

- **`src/app/admin/products/[sku]/page.tsx`** — changing the price always rescales every bulk tier, keeping each tier's exact % discount relative to the old price (qty ranges and savings labels preserved). Products without custom tiers get the standard 5%/9%/13% pattern.
- Fixed a keystroke-corruption bug: rescaling now anchors to a **pristine reference** (`refPrice` + `refBulk`) that only advances on blur/enter/manual tier edit/save, so typing `1200 → 1500` keystroke-by-keystroke can never destroy the discount pattern. `save()` also re-syncs if the price was never committed. Manual tier edits anchor the new percentages from the current price.
- Verified by keystroke simulation: `1200→1500` yields `1,500 / 1,365 / 1,305 / 1,245` (9/13/17% preserved); repeated rescaling has no drift.

## 3. Deleted the admin login page

- **`src/app/admin/login/`** removed — admins sign in via the normal `/login` page (which already routes staff to `/admin`).
- **`src/middleware.ts`** — unauthenticated `/admin/*` redirects to `/login?callbackUrl=…`.
- **`src/app/admin/layout.tsx`** — removed the admin-login special case; redirects to `/login` when signed out.
- **`admin-shell.tsx`** — sign out now returns to `/login`.

## 4. Checkout thank-you page "Ksh 0" bug

- **`src/app/checkout/page.tsx`** — the STK-push message showed `Ksh 0` because the total was derived from the live cart, which is cleared right after placing the order. The authoritative server total is now pinned into `placedTotal` **before** `clearCart()`.

## 5. M-Pesa payment failure → "Resend STK push" (new)

- **`prisma/migrations/20260815000000_mpesa_retry/migration.sql`** — new `orders` columns: `mpesa_push_count`, `mpesa_pushed_at`, `mpesa_last_result`, `mpesa_last_result_desc`, `mpesa_transaction_id`.
- **`src/lib/db.ts`** — `DbOrder` extended; `recordMpesaPushAttempt`, `recordMpesaResult`, `setMpesaTransaction`.
- **`src/app/api/payments/initiate/route.ts`** — doubles as the resend endpoint: token-gated, 30s cooldown between pushes and a 5-attempt cap (`429` with `retryAfterMs`); clears the previous decline on a fresh push.
- **`src/app/api/payments/mpesa/callback/route.ts`** — ignores callbacks from superseded pushes; records declines (`ResultCode`/`ResultDesc`) so the UI can explain them; captures the `MpesaReceiptNumber` on success.
- **`src/app/api/orders/status/route.ts`** — exposes push count, last result, `canResend` and `retryAfterMs` for the checkout screen.
- **`src/app/checkout/page.tsx`** — polling now stops early on a decline with a human-readable reason (ResultCode map), shows a "Resend STK push" box with a live countdown, attempt counter (`x/5`), and "contact us" state after the cap; resend restarts the poll.

## 6. Paid invoices include the transaction ID

- **`src/lib/invoice-pdf.ts`** — paid invoices print the reference on the payment-method line: M-Pesa receipt number, Paystack reference, or PO reference (`· Ref XXX`).
- **`src/lib/mailer.ts`** — "Payment received" email summary card includes the same `· Ref XXX`.
- **`src/app/api/payments/mpesa/callback/route.ts`** — re-fetches the order after storing the receipt so the emailed PDF carries it.

## 7. Invoice email failure now logged (diagnosability)

- **`src/app/api/orders/route.ts`** — the order-creation invoice email previously swallowed errors silently; failures are now logged (`invoice email failed for <id>: …`) so "paid invoices not getting sent" can be traced in the server logs (SMTP config issues surface immediately).

---

### Notes / follow-ups
- **Delivery fee setting**: the codebase currently has **no** admin-configurable delivery fee — checkout and the orders route use a hardcoded `KES 350` (free over 10,000). If a delivery-fee setting is desired, it needs to be built (settings key + checkout/orders usage).
- Local dev Postgres is missing the earlier `payment_phone` column (migrations not applied locally) — checkout inserts fail there; production applies migrations via `prisma migrate deploy` in the build.