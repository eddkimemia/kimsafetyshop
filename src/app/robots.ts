import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/compare",
          "/wishlist",
          "/account",
          "/account/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://kimsafety.co.ke/sitemap.xml",
  };
}
