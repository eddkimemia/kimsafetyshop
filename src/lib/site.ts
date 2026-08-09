// Canonical site URL. The custom domain (kimsafety.co.ke) is not always
// connected — metadataBase, OG images and sitemap must resolve to a domain
// that actually serves the site, otherwise social platforms cannot fetch
// the share image. Override with NEXT_PUBLIC_SITE_URL when the custom
// domain is live.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://kimsafetyshop4.vercel.app");
