# KimSafety Fix & Feature Checklist

Status legend: [x] DONE — verified; [~] IN PROGRESS — fix applied, waiting on deploy/verify

1. [x] check why upload is not working on vercel — fixed: uploads now persist in the DB (`upload_files` BYTEA, `src/lib/file-store.ts`) and upload/download routes serve DB-first; migration applied and committed
2. [x] single order page in admin show this error Application error: a client-side exception has occurred (see the browser console for more information). with no info on console, error is on vercel and locally — fixed: `withItems(order)` was not awaited in the order route; order page now renders with product images
3. [x] products in vercel are rendering with original images instead the updated ones locally and pushed to repo, this also affects the product datasheet, ipdated images dont show — fixed: product images resolved via `src/lib/data/product-images.ts` (static map by SKU) merged with admin overrides (`admin_products` JSON `image`/`gallery`), used by product page and datasheet
4. [x] in admin/users in staff section, instead of showing company it should be department — labels changed
5. [x] in letters in the in the Sender / signatory, in sender title there should be default ie staffs's department — session now carries `department`; letter sender title defaults to it
6. [x] in admin dashboard in recent orders add arrow the that takes to single order page, add a sort filter to recent orders, also in customer section counter show only customers dont include staff — done
7. [~] on vercel some products and category page are not loading, other are giving erors while trying to load individual product/category, give an error then load later or load when tried on a diffrent tab — root cause (Vercel logs): `error: too many connections for role "prisma_migration"` (code 53300) — the shared hosted Postgres has a tiny connection limit; product page render + `/api/catalog` + `/api/products/image-overrides` each run in a separate serverless lambda and opened their own DB pools, and cold-start bursts blew the limit. Fixes applied:
   - `src/lib/db.ts`: pool hardened (`connectionTimeoutMillis: 8000`, `idleTimeoutMillis: 15000`)
   - `src/lib/catalog.ts`: single shared cached admin-rows read (`getCachedAdminRows()`, 20s TTL + 10s failure backoff) that NEVER throws — on DB failure it returns null and the catalog falls back to the static product list, so product/category pages render instead of 500ing; cache invalidated on admin product POST/PATCH/DELETE
   - `src/lib/admin-products.ts` (admin catalog), `src/app/api/products/image-overrides/route.ts` (storefront image overrides → static images on outage), `src/app/api/admin/stats/route.ts` (admin stats tolerant) all now share the same cached read
   - PENDING: deploy to Vercel and confirm product/category pages load on first hit without connection errors
8. [x] my blog post are locally not on vercel, push them to vercel same to knowledge content — done: `node scripts/sync-remote.mjs` copies posts + `admin_guides` from local DB to the hosted DB (10 posts pushed; run it again before deploying whenever local content changes)
9. [x] in admin blog and content page in each post and an arrow button that takes to each post page — ExternalLink buttons added (rows + mobile cards)
10. [x] in the product, in bulk pricing, when next bulk pice is unlocked chanhe price of item to that bulk price — price display switches to the active bulk tier (strikethrough base + "Bulk price unlocked — Ksh X off per unit (Y% off)")
11. [x] in the product page in the order via whatsapp button, should include price of item, quantity etc, in small device the button doesnt have proper padding, so the wishlist button and compare buttons, reduce their size by removing words wishlist and compare in small devises to just show the heart and scales icon, so the order to whatsapp button takes the space, also the button should be whatsapp color green text awhatsapp icon white — done: message = name/sku/qty/unit (bulk-aware)/total; solid WhatsApp green; wishlist/compare icon-only on mobile
12. [x] the floating whatsapp button in product page should thake details of the page where necessary eg product etc — rewritten as client component; on product pages it fetches `/api/catalog?slug=` and includes product name/sku/price
13. [x] configure reviews section, only account who have puchased the product can add reviews, in admin see reviews add, admin can edit, delete etc — full reviews system: `reviews` table, public API (purchase-gated), admin API + `/admin/reviews` page (approve/hide/edit/delete), storefront reviews tab with star rating form
14. [x] the question and answer section below product, make it full width — Q&A tab now full width (2-col question grid + WhatsApp CTA banner)
15. [x] anything edited in admin section in vercel doesnt change anything eg marketing, campaings — fixed: settings route was not awaiting the DB write (`useSettings` bug)
16. [x] in the anouncement bar in the whatspp button add filler message — `Hello {site_name}! I'd like to know more about your safety equipment and current offers.`
17. [x] in checkout page theres an error in getting saved name and address both locally and vercel — root cause: un-awaited `listAddressesForUser` serialized a Promise as `{}`; fixed + `Array.isArray` guards in checkout and account
18. [x] in single order page in product show the product image — order page renders product images (with fallback icon)
19. [x] downloading image from site should saving using original name — admin uploads keep the original filename (` (1)` suffix on collision, checked against DB + disk)
20. [x] staff can delete and quotations and purchase orders made by them only, but can see all purchase orders and quotes made superadmin and delete and edit all — ownership rules implemented (`created_by_id`)
21. [x] use the og-image.jpg image as social preview thumbnail or Open Graph image for home page and other pages, for product page use product image — `public/og-image.jpg` restored (copied from `public/uploads/documents/og-image.jpg`); all pages reference `/og-image.jpg`; product pages use the product image
22. [x] in footer there is sitemap url its currently opens to blank page — created `/sitemap` page (main pages, brands, categories, all products)

---

## Remaining
- #7: deploy to Vercel, confirm product/category pages load on first hit, confirm admin product edits still show within the cache window
- Post-deploy spot checks: reviews flow, OG image preview, WhatsApp buttons, /sitemap
- Remember: if local blog/guide content changes again, re-run `node scripts/sync-remote.mjs` before deploying
