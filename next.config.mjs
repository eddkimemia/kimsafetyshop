/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // DB-backed document/logo uploads are stored under
        // /uploads/documents/<name> (the path returned by the upload API).
        // On serverless the public/ mirror doesn't exist, so rewrite these to
        // the dynamic route that serves them from Postgres. Keeps every
        // previously stored logo/PO path resolvable in production.
        source: "/uploads/documents/:name",
        destination: "/api/uploads/documents/:name",
      },
    ];
  },
  images: {
    remotePatterns: [
      // Admin-entered product/gallery/logo image URLs are arbitrary (stored in
      // the DB), so a per-domain allowlist would break them. Tightened to
      // HTTPS-only — the optimizer refuses plain-HTTP sources, and the only
      // people who can add remote URLs are staff via the admin console.
      { protocol: "https", hostname: "**" },
    ],
    // AVIF is ~30–50% smaller than WebP on modern browsers; WebP stays as the
    // fallback. All <Image> requests (product photos, heroes, logos) benefit.
    formats: ["image/avif", "image/webp"],
    // Keep optimized images cached for a week so repeat visits (and other
    // visitors hitting the same sizes) skip on-the-fly re-optimization.
    minimumCacheTTL: 604800,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
