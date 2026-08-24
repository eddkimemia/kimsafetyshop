import type { MetadataRoute } from "next";
import { liveCatalog } from "@/lib/catalog";
import { categories, brands } from "@/lib/data/catalog";
import { guides } from "@/lib/data/content";
import { listPosts } from "@/lib/db";
import { siteUrl } from "@/lib/site";

const base = siteUrl;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    { url: `${base}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/deals`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/brands`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/knowledge`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/corporate`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/corporate/purchase`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/support`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly" as const, priority: 0.2 },
  ].map((r) => ({ ...r, lastModified: new Date() }));

  let products: Awaited<ReturnType<typeof liveCatalog>> = [];
  try {
    products = await liveCatalog();
  } catch (err) {
    console.error("[sitemap] liveCatalog failed, using seed:", (err as Error).message);
    const { products: seed } = await import("@/lib/data/products");
    const { productImages } = await import("@/lib/data/product-images");
    products = seed.map((p) => ({ ...p, image: productImages[p.sku] ?? `/images/products/${p.sku}.jpg` })) as typeof products;
  }
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

  let postRows: Awaited<ReturnType<typeof listPosts>> = [];
  try {
    postRows = await listPosts();
  } catch (err) {
    console.error("[sitemap] listPosts failed, returning empty:", (err as Error).message);
    postRows = [];
  }
  const postRoutes = postRows.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at ?? p.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...brandRoutes,
    ...guideRoutes,
    ...postRoutes,
  ];
}
