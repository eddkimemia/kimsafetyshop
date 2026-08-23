# KimSafety — Work Log & Open Issues

## Fixed (2026-08-13)

### Paid invoice emails not sending automatically (M-Pesa + Paystack) — ROOT CAUSE FOUND

The email code was correct; the **fire-and-forget send pattern was broken on Vercel**: every handler called
`sendPaidInvoiceEmail(order).catch(...)` without awaiting, then returned its response. Vercel serverless freezes
the event loop the moment the handler responds, so the SMTP send never completes. (Emails that DID work — cron
digest, password reset, admin newsletter — were all awaited.) Paystack/admin paths also emailed the **stale
pre-payment row**, so the PDF/email omitted the transaction reference.

- [x] **`src/app/api/payments/mpesa/callback/route.ts`** — `sendPaidInvoiceEmail` is now **awaited** (Safaricom tolerates the extra ~2-4 s before the `"0"`); keeps the fresh-row re-fetch so the PDF carries the receipt number.
- [x] **`src/app/api/payments/paystack/webhook/route.ts`** — awaited + re-fetch fresh row after `setOrderPaid` (was: stale row, un-awaited).
- [x] **`src/app/api/payments/paystack/verify/route.ts`** — awaited + re-fetch fresh row.
- [x] **`src/app/api/admin/orders/route.ts`** (mark-paid PATCH) — awaited + re-fetch fresh row; still only emails on the unpaid→paid transition.
- [x] Same latent bug fixed in the other un-awaited sends: `api/orders` (customer invoice + staff alert), `api/quotes` (confirmation + staff alert), `api/auth/register` (welcome), `api/admin/corporate` + `api/admin/corporate/accounts` (corporate welcome).
- [x] All sends now `try/await/catch` with `console.error` — failures are visible in Vercel function logs.

### Delivery fee for staff checkout — still charged despite waiver

- [x] Server waiver verified working live (superadmin session + `delivery_fee: false` → `shipping: 0`). The bug was UX: the toggle was buried in checkout step 1 and **defaulted to charging the fee** (`src/app/checkout/page.tsx`).
- [x] Staff checkouts now **default to fee waived** (`setWaiveFee(true)` when role is admin/superadmin).
- [x] Toggle moved into the sticky **Order Summary sidebar** (visible on every step) + "Delivery fee" row added to the Review step.

---

## OPEN — Security (fix first)

- [ ] **M-Pesa callback payment forgery (critical)** — `api/payments/mpesa/callback` is unsigned, `checkoutId` is returned to the client, and **no amount/order verification** exists. A customer could POST a forged `ResultCode: 0` callback and mark an order paid for free. Fix: verify amount server-side against `order.total` (and ideally a real Daraja confirmation/query), never trust the callback alone.
- [ ] **`data/kimsafety.db` committed to git** — old SQLite with real users/password hashes. Remove from repo + history. (`.env`/`.env.local` are gitignored, but `.env:1` holds the live Postgres URL and `.env:54` a live Paystack `sk_live_…` key — keep them out of any shared exports.)
- [ ] **Daily-orders cron effectively unauthenticated** — `api/cron/daily-orders` accepts the spoofable `x-vercel-cron: 1` header and `CRON_SECRET` is never set. Set `CRON_SECRET` in Vercel env and require the bearer token.
- [ ] **Public upload endpoint** (`api/uploads/documents`) — unauthenticated, no rate limit, served inline with client-spoofed MIME (`uploads/documents/[file]`) → stored-XSS vector. Restrict to staff, sniff content, force `attachment`.
- [ ] **`next.config.mjs` `images.remotePatterns: "**"`** — allowlist domains (SSRF/abuse surface).

## OPEN — Broken features

- [ ] **Quote form always fails** — `quote-form.tsx` sends fake `productId: "quote-request"`, `api/quotes` rejects it ("One or more products could not be found"). Align the form with the API (real product ids + free-text description field).
- [ ] **Contact form is dead** — `src/app/contact/page.tsx` has uncontrolled inputs and no `onSubmit`; nothing is sent/stored/emailed.
- [ ] **Un-awaited DB writes return `{}`** — `api/tickets` (`createTicket`), `api/corporate/applications` (`createCorporateApplication`), `api/addresses` (`createAddress`), `api/posts/[slug]` (`getPostBySlug`). Client flows break/drop response data.
- [ ] **Admin guides can't be deleted** — `api/admin/content` computes `isStatic` from `mergedGuides()` which is always true, so DELETE is blocked for admin-created guides.
- [ ] **`api/admin/tickets`** — `setTicketStatus` not awaited.

## OPEN — Missing features

- [ ] **Guest order tracking** — guest orders (`user_id: null`) are untrackable and never attach to a later account, but emails/success page link to login-gated `/account`. Add token-based tracking (order already has a one-time `payment_token`).
- [ ] **No admin workflow for returns** — `listAllReturns`/`setReturnStatus` exist in `db.ts` but are dead; no admin returns page/route → customer returns unactionable.
- [ ] **No staff alerting for support channels** — new tickets, returns, POs, corporate applications → no staff email. No order status-change emails to customers. Quote status changes don't email.
- [ ] **No referral codes** anywhere (register/checkout/account/admin).
- [ ] **Checkout lacks** marketing-consent checkbox and guest password creation.
- [ ] **Footer social icons** are `href="#"` placeholders; "Track My Order" points to login-only `/account`.
- [ ] **Product Q&A tab is a static FAQ** — no customer questions/admin moderation.

## OPEN — Cleanup / ops

- [ ] **`npm run build` seeds demo data into production** — `prisma db seed` upserts `alice@/brian@/carol@example.com` + starter posts, and can crash the build where the starter `User` table was never created. Remove seed from the build script.
- [ ] **Remove stale scaffolding**: `generated/prisma/` (starter Prisma client), `data/kimsafety.db` (committed SQLite), broken `scripts/migrate-to-postgres.mjs`, unused `better-sqlite3` dep.
- [ ] **`.env.example` is empty** — document the real keys (`DATABASE_URL`, `AUTH_SECRET`, `SMTP_*`, `PAYSTACK_SECRET_KEY`, `MPESA_*`, `CRON_SECRET`, `DAILY_ORDERS_EMAIL`, `NEXT_PUBLIC_GA_ID`, `PYTHON`).
- [ ] **README.md is boilerplate** — document setup, env, cron, deploy.
- [ ] **Stale comments**: `.github/workflows/deploy.yml` "No lockfile is committed" (lockfile IS tracked); `MPESA_CALLBACK_URL` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env` are never read by code.
- [ ] **Migrations run twice per deploy** — `deploy-db.mjs` (CI) + `prisma migrate deploy` in `package.json` build.
- [ ] **Local dev**: `.env:10` placeholder `DATABASE_URL` (host:5432) overrides the real URL at `.env:1` (dotenv last-wins) — local scripts must pass the URL explicitly; local Postgres is missing migrated columns (e.g. `payment_phone`).

## Notes

- Delivery fee is hardcoded KES 350 (free over KES 10,000) — no admin setting. Staff waiver is enforced server-side for `["admin","superadmin"]` sessions only.
- M-Pesa paid orders: order flips to `paid=1` via the callback; STK resend has 30 s cooldown / 5-attempt cap.
- Daily orders email: `vercel.json` cron `0 20 * * *` UTC (23:00 EAT) → `/api/cron/daily-orders`; sends Excel to `DAILY_ORDERS_EMAIL` (default `edwinkimemia21@gmail.com`).
