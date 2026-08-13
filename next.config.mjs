/** @type {import('next').NextConfig} */
const nextConfig = {
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
