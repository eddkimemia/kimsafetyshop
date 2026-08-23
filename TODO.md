# KimSafety — Work Log & Open Issues

Last reviewed: 2026-08-23

## OPEN — High priority

### Inventory management
- [x] **Stock decremented on sale** — `adjustProductStock()` in `db.ts`, called from order creation: atomic per-row JSONB decrement of `stock` / increment of `sold`; creates a minimal override row for seed products whose only stock is in-code; floors at 0 (business prefers taking the order over rejecting it when two buyers race).
- [ ] Cancellation does NOT auto-restore stock yet — admin restocks manually after "Cancelled". Add restore-on-cancel if desired.
- [ ] No server-side quantity cap — checkout can request more units than exist; consider rejecting when qty > available stock.

### Reliability & observability
- [ ] **No error monitoring** — everything is `console.error` into Vercel logs; a failed payment callback is invisible unless someone goes looking. Add Sentry (or similar).
- [ ] **No tests at all** — no runner, no files. Priority targets: payment callbacks (M-Pesa/Paystack), order total computation, auth/RBAC gating.

## OPEN — Medium priority

### Security hardening
- [ ] `next.config.mjs` `images.remotePatterns: "**"` — restrict the hostname allowlist (SSRF/abuse surface).
- [ ] No security headers — add CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options` via `next.config.mjs` headers().
- [ ] Password-reset tokens are reusable within their 1h TTL — invalidate after successful use if strict single-use is wanted.
- [ ] Register endpoint returns 409 "account exists" → email enumeration (standard trade-off; decide).

### Ops / config
- [ ] **Migrations run twice per deploy** — CI `deploy-db.mjs` AND `prisma migrate deploy` in package.json build. Keep one path.
- [ ] `.env` has a duplicate `DATABASE_URL`: real URL at top, placeholder lower down (dotenv last-wins). Remove the placeholder so local scripts don't need workarounds. (Local dev currently works only because `.env.local` overrides both.)
- [ ] Verify hosted Postgres backups exist and a restore has actually been tested (all customers/orders/upload BYTEAs live there).
- [ ] GA4: `NEXT_PUBLIC_GA_ID` env key exists but no gtag script is wired in `layout.tsx`.
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.example` is read by nothing (inline JS not used).
- [ ] Rate limiter is per-serverless-instance (in-memory Map). Fine for blunting abuse; swap for Upstash Redis if global precision is ever needed — call sites stay identical.

### Feature ideas (not started)
- [ ] Discount coupons/vouchers (only bulk-tier pricing + referral codes exist today)

---

## DONE — do not redo (verified 2026-08-23)

### Payments (both gateways hardened)
- ✅ M-Pesa callback forgery fixed: amount checked against `order.total`, stale callbacks ignored by checkout-id match; late callback backfills the receipt number.
- ✅ Active Daraja STK-status query fallback in `/api/orders/status` (~20s after push, 15s throttle) so payment is picked up even if the callback URL is unreachable.
- ✅ Paystack: verify endpoint binds the reference to the order's stored `paystack_reference` + kobo amount check; webhook validates amount; both re-fetch fresh row and AWAIT the paid-invoice email.
- ✅ `MPESA_CALLBACK_URL` is now honored by code (`mpesaCallbackUrl()`); local testing points at ngrok `/api/payments/mpesa/callback`.
- ✅ Orders snapshot authoritative per-item prices server-side at creation (bulk-tier aware); invoices/receipts/emails/order history/cron Excel render FROZEN purchase-time prices instead of live catalog prices.

### Storefront staleness bugs (edited products showed old pics/prices)
- ✅ Client image-override cache now stale-while-revalidate with 30s TTL (was fetch-once-per-session).
- ✅ `/api/products/image-overrides` module-level 5-min cache removed; accepts external https URLs; `Cache-Control: no-store`.
- ✅ Product cards/detail pass the merged catalog's edited `image`; store refreshes catalog on tab focus/visibility + every 60s.

### Security fixes
- ✅ Rate limiting on all public POST endpoints (`src/lib/rate-limit.ts`, per-IP fixed window): register/contact/quotes/reviews/questions 5·10min, newsletter 5·1min, orders 10·10min, uploads 10·10min, forgot-password 3·15min, reset-password & verify token-guess guards.
- ✅ Contact form verified functional end-to-end (form component → `/api/contact` → DB + staff email alert) — earlier "dead form" report was a false positive; the form lives in `components/contact/contact-form.tsx`, not the page file.
- ✅ Guest invoice/receipt IDOR closed — order ids are guessable (KS-#####); now require the checkout payment token, owning session, or admin. Guest links embed the token.
- ✅ Blog HTML rendered raw → now passed through `sanitizePostHtml()`.
- ✅ `updateReview()` column names come from a fixed allowlist (was interpolated object keys).
- ✅ Daily-orders cron requires `Authorization: Bearer $CRON_SECRET` (spoofable `x-vercel-cron` rejected).
- ✅ Committed `data/kimsafety.db` + `generated/prisma` removed from git.

### Accounts & UX
- ✅ Abandoned-cart recovery: checkout snapshots the cart when the contact step completes (`/api/cart/track`, keyed by email, cleared on order placement); daily cron `/api/cron/abandoned-carts` (11:00 EAT, CRON_SECRET auth) emails one reminder per cart idle >24h — skips sold-out items.
- ✅ "Notify me when back in stock": out-of-stock products show an email form on the detail page (`/api/products/restock-notify`); admin saving the product with stock > 0 fires branded alerts to all pending subscribers and marks them notified. Migration `20260823000000_cart_recovery` adds both tables.
- ✅ Delivery fee + free-delivery threshold are admin settings (Settings → Delivery; superadmin). Server totals, cart page and checkout all read them via `/api/settings`; legacy KES 350 / 10,000 remain the defaults.
- ✅ Email verification flow: register sends branded verify link (HMAC-signed, 48h, purpose-tagged) → `/verify` page auto-confirms → `/api/auth/verify` sets verified=1 idempotently. Login is NOT blocked while unverified (SMTP-failure safe); admin can still manually verify.
- ✅ Guest order tracking via one-time payment token (`/track?id=…&token=…`).
- ✅ Referral codes end-to-end (register ?ref=, checkout capture, users table, admin visibility).
- ✅ Checkout marketing-consent checkbox + guest password creation.
- ✅ Staff alerts: new tickets, returns, POs, corporate applications; customer order-status + quote-status emails.
- ✅ Admin returns workflow page; product Q&A API + admin moderation.
- ✅ Footer placeholders cleaned (no `href="#"` socials remain).

### Ops cleanup
- ✅ Demo-data seed removed from build; broken migrate-to-postgres script + better-sqlite3 dep gone.
- ✅ `.env.example` documents the real keys; README rewritten.
- ✅ All transactional email sends are `try/await/catch` (Vercel serverless freeze bug fixed everywhere).
- ✅ Admin order detail page restored after being accidentally emptied (369 lines recovered from git).

## Notes
- Delivery fee hardcoded KES 350 (free ≥ KES 10,000); staff-only waiver enforced server-side for `admin`/`superadmin` sessions.
- M-Pesa STK resend: 30s cooldown, 5-attempt cap per order.
- Daily orders cron: `0 20 * * *` UTC (23:00 EAT) → Excel to `DAILY_ORDERS_EMAIL`.
