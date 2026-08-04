import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/checkout", "/account", "/api/"],
      },
    ],
    sitemap: "https://kimsafety.co.ke/sitemap.xml",
  };
}
