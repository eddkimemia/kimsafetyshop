# KimSafety — Work Log & Open Issues

## Fixed (2026-08-13)

### Security

- [x] **M-Pesa callback forgery (critical)** — `api/payments/mpesa/callback` now verifies the `Amount` recorded by Safaricom against the server-computed `order.total` before marking an order paid. A forged `ResultCode: 0` with no/incorrect amount is recorded as `amount_mismatch` and never flips the order to paid.
- [x] **`data/kimsafety.db` committed to git** — removed from the tree + gitignore (`/data/*.db*`); purged from git history (pack dropped from ~320 MB). `.env`/`.env.local` remain gitignored.
- [x] **Daily-orders cron unauthenticated** — `api/cron/daily-orders` now accepts **only** `Authorization: Bearer $CRON_SECRET`; the spoofable `x-vercel-cron` header is ignored and the endpoint refuses to run (503) when `CRON_SECRET` is unset. **Action: set `CRON_SECRET` in Vercel env** — Vercel then injects the bearer token automatically.
- [x] **Upload endpoints** — `api/uploads/documents` (public by design — customers upload POs) now **sniffs magic bytes** and rejects any file whose content doesn't match its extension; both `/uploads/documents/[file]` and `/documents/[file]` serve with `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`, and the served MIME comes from the bytes, never the client-supplied value (stored-XSS vector closed).
- [x] **`next.config.mjs` remotePatterns** — tightened to HTTPS-only (admin-entered image URLs are arbitrary, so a per-domain allowlist would break the admin console; the optimizer now refuses plain-HTTP sources).

### Broken features

- [x] Quote form now submits (server accepts custom lines instead of rejecting them as unknown products).
- [x] Contact form rebuilt (`components/contact/contact-form.tsx` + `api/contact` + admin Messages tab) — stored + staff email alert.
- [x] Un-awaited DB writes (`api/tickets`, `api/corporate/applications`, `api/addresses`, `api/posts/[slug]`) now `await` — responses no longer drop.
- [x] Admin guides can be deleted (`isStatic` read from the DB record, not merged-guides membership).
- [x] `api/admin/tickets` — `setTicketStatus` awaited.

### Missing features

- [x] **Guest order tracking** — public `/track` page (id + token), linked from checkout success, order/paid emails and the footer ("Track My Order").
- [x] **Admin returns workflow** — `/admin/returns` (view/enrich/update status) + customer email on status change.
- [x] **Staff alerting** — new tickets, returns, POs, corporate applications, quote requests → staff email; ticket replies, return status, order status, quote status → customer email (`src/lib/mailer.ts`).
- [x] **Referral codes** — auto-generated `KS-XXXXAAA` per user; register/checkout accept a code (`?ref=` prefills), orders store `referrer_code`; account dashboard shows share link + copy button; admin orders/users show referral info.
- [x] **Checkout consent + guest account** — marketing-consent checkbox (newsletter subscribe), "create an account with this checkout" (password → login provisioned + guest orders attached to the new account).
- [x] **Footer** — Track My Order → `/track`, Returns → `/account/returns`, social icons no longer `href="#"` (point to WhatsApp with a prefilled message; swap in real profile URLs when available).
- [x] **Product Q&A** — `/api/questions` + admin Q&A moderation + per-product Q&A tab (replaces the static FAQ).
- [x] **Fake reviews removed** — `STATIC_REVIEWS`, the fabricated rating bars (78/15/4/2/1) and dead "Helpful" buttons are gone; products with no real reviews show an honest empty state. `seed-reviews.mjs` now requires `--local`/`--remote` explicitly (never defaults to production).

### Cleanup / ops

- [x] `npm run build` no longer seeds demo data into production (seed script deleted; build = `next build`).
- [x] Stale scaffolding removed: `generated/prisma/` (starter Prisma client), `src/lib/prisma.ts`, `prisma/seed.ts`, `scripts/verify-prisma.ts`, `scripts/migrate-to-postgres.mjs`, `better-sqlite3` + `@types/better-sqlite3` deps. Prisma remains only as the migration runner (`npm run deploy:db`).
- [x] `.env.example` rewritten with every key documented.
- [x] README.md rewritten (setup, env table, Vercel email gotcha, deploy, cron, scripts).
- [x] `deploy.yml` — stale "no lockfile" comment removed (`npm ci`); migrations run exactly once per deploy (CI `deploy-db.mjs` only — build no longer runs `prisma migrate deploy`).
- [x] Stale `.env` entries removed (`MPESA_CALLBACK_URL` ngrok URL, duplicate placeholder `DATABASE_URL` that overrode the real one via dotenv last-wins).

### Paid invoice emails + delivery fee (earlier session)

- [x] Root cause of paid invoices not sending: fire-and-forget SMTP sends froze on Vercel serverless — every send is now awaited (all payment paths + invoice/quote/register/corporate emails).
- [x] Staff checkout now defaults to waived delivery fee + toggle in the order summary sidebar.

---

## OPEN — Action items for the owner

- [ ] **Set `CRON_SECRET` in Vercel env** — the daily-orders cron refuses to run until it exists.
- [ ] **M-Pesa: enable a real Daraja confirmation query** (optional hardening) — the amount check closes trivial forgery; querying the STK status API before marking paid would make it fully tamper-proof. Callbacks alone can still be replayed if a checkout ID ever leaks.
- [ ] **Admin-entered image URLs are the image-optimizer trust boundary** (`remotePatterns` is https-only wildcard because product/gallery images can be any URL pasted by staff). If this ever bothers you: proxy admin-entered URLs through `/api/uploads` instead.
- [ ] **Card rating/review counts on product cards/compare are admin-set display values** (`products.rating`/`reviews`), not derived from the reviews table — decide whether to compute them from real reviews.
- [ ] **Local dev**: `.env` in this repo contains live production secrets (Postgres URL, Paystack `sk_live_…`); keep it out of any shared export/backup. Vercel-hosted env remains the canonical config.

## Notes

- Delivery fee is hardcoded KES 350 (free over KES 10,000) — no admin setting. Staff waiver is enforced server-side for `["admin","superadmin"]` sessions only.
- M-Pesa paid orders: order flips to `paid=1` via the callback; STK resend has 30 s cooldown / 5-attempt cap.
- Daily orders email: `vercel.json` cron `0 20 * * *` UTC (23:00 EAT) → `/api/cron/daily-orders`; sends Excel to `DAILY_ORDERS_EMAIL` (default `edwinkimemia21@gmail.com`).
- Migration `20260816000000_features` (contact_messages, product_questions, referral columns) applies automatically on next CI deploy.