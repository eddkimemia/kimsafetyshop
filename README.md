# KimSafety — PPE & Safety Equipment Storefront (Kenya)

Next.js 14 (App Router) storefront for KimSafety Ltd — certified industrial PPE, medical safety,
fire safety and laboratory equipment. Postgres-backed with M-Pesa (Daraja) and Paystack payments.

## Stack

- **Framework:** Next.js 14 App Router, React 18, Tailwind CSS
- **Database:** PostgreSQL via `pg` (`src/lib/db.ts` — hand-written SQL; Prisma is used only as the migration runner)
- **Auth:** NextAuth (credentials/JWT)
- **Payments:** M-Pesa Lipa Na M-Pesa (STK push) + Paystack (cards)
- **Email:** Nodemailer SMTP — **every send is awaited** (see "Emails on Vercel" below)
- **Deploy:** Vercel via GitHub Actions (`.github/workflows/deploy.yml`) + `vercel.json` cron

## Local setup

```bash
npm install
cp .env.example .env          # fill in real values (see .env.example comments)
npm run dev                   # http://localhost:3000
```

The application reads `DATABASE_URL` (Postgres). Note `.env` is loaded last-wins by dotenv —
if you keep multiple `DATABASE_URL` lines, only the last one is used.

Run migrations against the current `DATABASE_URL`:

```bash
npm run deploy:db             # adopts raw-SQL databases, then prisma migrate deploy
```

## Environment variables

Documented in `.env.example` — `DATABASE_URL`, `NEXTAUTH_SECRET`, `SMTP_*`, `MPESA_*`,
`PAYSTACK_SECRET_KEY`, `CRON_SECRET`, `DAILY_ORDERS_EMAIL`, `NEXT_PUBLIC_GA_ID`.

Required in production:

| Var | Why |
| --- | --- |
| `DATABASE_URL` | Postgres connection (app + migrations) |
| `NEXTAUTH_SECRET` | Session signing |
| `SMTP_HOST/PORT/USER/PASS/FROM` | All transactional email (invoice, quote, tickets, alerts, newsletter) |
| `MPESA_ENV/CONSUMER_KEY/CONSUMER_SECRET/PASSKEY/SHORTCODE` | STK push |
| `PAYSTACK_SECRET_KEY` | Card payments |
| `CRON_SECRET` | Daily-orders cron auth (endpoint refuses to run without it) |

## Emails on Vercel (important)

Vercel serverless **freezes the event loop the moment a handler returns** — a fire-and-forget
`sendEmail(...).catch()` never completes. Every email send in this codebase is therefore
`await`ed inside `try/catch`. When adding new emails, always `await` them.

## Deploy

Push to `master` → GitHub Actions deploys to Vercel. The workflow:

1. `vercel pull` (production env → `.vercel/.env.production.local`)
2. `npm run deploy:db` — adopts the DB for Prisma if needed, then applies pending migrations (fail-closed)
3. `vercel build --prod` then `vercel deploy --prebuilt --prod`

Because migrations run in CI (not in the build script), direct dashboard deploys will **not**
migrate — run `npm run deploy:db` first or use the CI path.

## Cron

`vercel.json` schedules `GET /api/cron/daily-orders` at `0 20 * * *` UTC (23:00 EAT) — a daily
Excel digest of the day's orders to `DAILY_ORDERS_EMAIL`. The endpoint only accepts
`Authorization: Bearer $CRON_SECRET` (injected by Vercel when `CRON_SECRET` is set).

## Scripts (scripts/)

| Script | Purpose |
| --- | --- |
| `deploy-db.mjs` | Adopt raw-SQL DB for Prisma + apply migrations (used by CI) |
| `seed-reviews.mjs` | Seed fabricated demo reviews — **requires `--local`/`--remote` explicitly**; `--remote` writes to production, use with care |
| `seed-blog.cjs`, `rebuild-products.cjs`, `gen-product-images.cjs` | Content/image tooling |
| `test-smtp.ts` | Verify SMTP credentials (pass `DATABASE_URL` explicitly when running locally) |

## Notes

- Delivery fee is KES 350, free over KES 10,000; staff checkouts can waive it (server-enforced for admin/superadmin sessions).
- Guest orders get a one-time `payment_token` used for `/track` status checks and payment initiation — the token is the only way to view a guest order.
- Order status changes, quote status changes, tickets, returns, POs and corporate applications all email both the customer and/or staff — see `src/lib/mailer.ts`.