/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "**" },
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
