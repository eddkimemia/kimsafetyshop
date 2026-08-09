import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { brands } from "@/lib/data/catalog";
import { liveCatalog } from "@/lib/catalog";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const brand = brands.find((b) => b.slug === params.slug);
  if (!brand) return { title: "Brand not found" };
  const description = `Shop genuine ${brand.name} safety equipment in Kenya. ${brand.tagline}. Certified stock with full documentation.`;
  return {
    title: `${brand.name} — ${brand.tagline}`,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: {
      title: `${brand.name} — KimSafety Kenya`,
      description,
      type: "website",
      url: `/brands/${brand.slug}`,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${brand.name} safety equipment` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand.name} — KimSafety Kenya`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = brands.find((b) => b.slug === params.slug);
  if (!brand) return notFound();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${brand.name} Safety Equipment`,
    description: `${brand.tagline} — authorized KimSafety stock with certification documents.`,
    url: `/brands/${brand.slug}`,
    isPartOf: { "@type": "WebSite", name: "KimSafety", url: "/" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (await liveCatalog())
        .filter((p) => p.brand === brand.name)
        .slice(0, 30)
        .map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `/product/${p.slug}`,
          name: p.name,
        })),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
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
