import type { MetadataRoute } from "next";
import { products } from "@/lib/data/products";
import { categories, brands } from "@/lib/data/catalog";
import { guides } from "@/lib/data/content";

const base = "https://kimsafety.co.ke";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/search",
    "/deals",
    "/brands",
    "/corporate",
    "/knowledge",
    "/about",
    "/contact",
    "/support",
    "/privacy",
    "/terms",
    "/cart",
    "/checkout",
    "/compare",
    "/wishlist",
    "/account",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const brandRoutes = brands.map((b) => ({
    url: `${base}/brands/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const guideRoutes = guides.map((g) => ({
    url: `${base}/knowledge/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...brandRoutes,
    ...guideRoutes,
  ];
}
