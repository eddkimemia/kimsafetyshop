// Canonical site URL. kimsafety.co.ke is the live production domain and must
// be the ONLY domain that appears in emails, invoices, receipts, OG tags,
// sitemaps and payment callback URLs. Override with NEXT_PUBLIC_SITE_URL only
// for local/staging testing.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://kimsafety.co.ke";
