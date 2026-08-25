import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { liveCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

// ISR with on-demand busting from admin product saves (revalidatePath in
// /api/admin/products). Keeps listing pages fresh without a DB hit per view.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shop All Safety Equipment in Kenya — 185+ Products | KimSafety",
  description:
    "Browse KimSafety's full catalogue — 185+ certified PPE, medical, fire, road, lab and emergency safety products with bulk pricing, same-day Nairobi delivery & corporate procurement support.",
  keywords: ["safety equipment Kenya", "shop safety equipment Nairobi", "PPE Kenya", "buy safety helmets Kenya"],
  alternates: { canonical: `${siteUrl}/search` },
  openGraph: {
    title: "Shop All Safety Equipment — KimSafety Kenya",
    description: "185+ certified safety products with bulk pricing & same-day delivery across Kenya.",
    type: "website",
    url: `${siteUrl}/search`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Shop Safety Equipment Kenya — KimSafety" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop All Safety Equipment — KimSafety Kenya",
    description: "185+ certified PPE, fire, medical & lab safety products.",
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: { index: true, follow: true },
};

export default async function SearchPage() {
  const catalog = await liveCatalog();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/search#collection`,
    name: "All Safety Equipment — KimSafety Kenya",
    description: "Browse 185+ certified PPE, medical, fire, road, lab and emergency safety products.",
    url: `${siteUrl}/search`,
    isPartOf: { "@type": "WebSite", name: "KimSafety", url: siteUrl },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: Math.min(catalog.length, 30),
      itemListElement: catalog.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}/product/${p.slug}`,
        name: p.name,
        image: `${siteUrl}/images/products/${p.sku}.jpg`,
      })),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/search` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView title="All Safety Products" initialProducts={catalog} />
      </Suspense>
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="bg-surface pb-20">
      <div className="relative overflow-hidden bg-navy-900">
        <div className="mx-auto max-w-shell px-4 py-14 lg:px-8 lg:py-16">
          <div className="h-4 w-40 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-9 w-72 animate-pulse rounded-lg bg-white/20" />
        </div>
      </div>
      <div className="mx-auto grid max-w-shell grid-cols-2 gap-5 px-4 pt-6 sm:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
