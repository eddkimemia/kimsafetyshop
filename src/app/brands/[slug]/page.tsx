import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { brands } from "@/lib/data/catalog";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const brand = brands.find((b) => b.slug === params.slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: `${brand.name} — ${brand.tagline}`,
    description: `Shop genuine ${brand.name} safety equipment in Kenya. ${brand.tagline}. Certified stock with full documentation.`,
  };
}

export default function BrandPage({ params }: { params: { slug: string } }) {
  const brand = brands.find((b) => b.slug === params.slug);
  if (!brand) return notFound();
  return (
    <Suspense fallback={null}>
      <CatalogView
        title={`${brand.name} Safety Equipment`}
        subtitle={`${brand.tagline} — authorized KimSafety stock with certification documents.`}
        brand={brand.slug}
        hideBrandFilter
      />
    </Suspense>
  );
}
