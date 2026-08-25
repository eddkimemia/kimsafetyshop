import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { liveCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { getLiveBrands, getLiveBrand } from "@/lib/brands";

export async function generateStaticParams() {
  const brands = await getLiveBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = await getLiveBrand(params.slug);
  if (!brand) return { title: "Brand not found" };
  const description = `Shop genuine ${brand.name} safety equipment in Kenya. ${brand.tagline}. Certified stock with full documentation, bulk pricing & same-day Nairobi delivery.`;
  return {
    title: `Buy ${brand.name} Safety Equipment in Kenya — ${brand.tagline} | KimSafety`,
    description,
    keywords: [brand.name, `${brand.name} Kenya`, `${brand.name} safety equipment`, `buy ${brand.name} Nairobi`, brand.tagline],
    alternates: { canonical: `${siteUrl}/brands/${brand.slug}` },
    openGraph: {
      title: `${brand.name} — KimSafety Kenya`,
      description,
      type: "website",
      url: `${siteUrl}/brands/${brand.slug}`,
      siteName: "KimSafety",
      images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: `${brand.name} safety equipment Kenya` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — KimSafety Kenya`,
      description,
      images: [`${siteUrl}/og-image.jpg`],
    },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await getLiveBrand(params.slug);
  if (!brand) return notFound();
  const catalog = await liveCatalog();
  const filtered = catalog.filter((p) => p.brand === brand.name).slice(0, 30);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/brands/${brand.slug}#collection`,
    name: `${brand.name} Safety Equipment in Kenya`,
    description: `${brand.tagline} — authorized KimSafety stock with certification documents.`,
    url: `${siteUrl}/brands/${brand.slug}`,
    isPartOf: { "@type": "WebSite", name: "KimSafety", url: siteUrl },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filtered.length,
      itemListElement: filtered.map((p, i) => ({
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
      { "@type": "ListItem", position: 2, name: "Brands", item: `${siteUrl}/brands` },
      { "@type": "ListItem", position: 3, name: brand.name, item: `${siteUrl}/brands/${brand.slug}` },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <CatalogView
          title={`${brand.name} Safety Equipment`}
          subtitle={`${brand.tagline} — authorized KimSafety stock with certification documents.`}
          brand={brand.slug}
          hideBrandFilter
        />
      </Suspense>
    </>
  );
}
