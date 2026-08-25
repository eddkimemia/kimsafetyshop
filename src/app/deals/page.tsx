import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { liveCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

// ISR with on-demand busting from admin product saves.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Deals & Discounts — Up to 35% Off Safety Equipment in Kenya | KimSafety",
  description:
    "Limited-time deals on safety equipment in Kenya. Up to 35% off helmets, gloves, boots, respirators, fire extinguishers and first aid kits. Bulk pricing & same-day delivery.",
  keywords: ["safety equipment deals Kenya", "PPE discounts Nairobi", "cheap safety helmets Kenya", "safety boots deal"],
  alternates: { canonical: `${siteUrl}/deals` },
  openGraph: {
    title: "Deals & Discounts — KimSafety Kenya",
    description: "Up to 35% off helmets, gloves, boots, respirators & fire extinguishers — while stock lasts.",
    type: "website",
    url: `${siteUrl}/deals`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Deals & Discounts — KimSafety Kenya" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deals & Discounts — KimSafety Kenya",
    description: "Up to 35% off safety equipment — limited time.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default async function DealsPage() {
  const catalog = await liveCatalog();
  const dealsList = catalog.filter((p) => p.oldPrice && p.oldPrice > p.price).slice(0, 30);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/deals#collection`,
    name: "Deals & Discounts — KimSafety Kenya",
    description: "Limited-time deals on safety equipment — up to 35% off.",
    url: `${siteUrl}/deals`,
    isPartOf: { "@type": "WebSite", name: "KimSafety", url: siteUrl },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: dealsList.length,
      itemListElement: dealsList.map((p, i) => ({
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
      { "@type": "ListItem", position: 2, name: "Deals", item: `${siteUrl}/deals` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={null}>
        <CatalogView
          title="Deals & Discounts"
          subtitle="Limited-time offers on certified safety equipment — while stock lasts."
          deals
          initialProducts={catalog}
        />
      </Suspense>
    </>
  );
}
