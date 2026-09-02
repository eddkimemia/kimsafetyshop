/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.paystack.co https://api.paystack.co",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: wss:",
              "frame-src https://js.paystack.co",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "sharp"],
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
