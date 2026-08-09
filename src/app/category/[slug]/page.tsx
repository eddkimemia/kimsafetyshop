import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { categories } from "@/lib/data/catalog";
import { liveCatalog } from "@/lib/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return { title: "Category not found" };
  const title = `${category.name} Equipment`;
  return {
    title,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} — KimSafety Kenya`,
      description: category.description,
      type: "website",
      url: `/category/${category.slug}`,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} — KimSafety Kenya`,
      description: category.description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return notFound();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Equipment`,
    description: category.description,
    url: `/category/${category.slug}`,
    isPartOf: { "@type": "WebSite", name: "KimSafety", url: "/" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (await liveCatalog())
        .filter((p) => p.category === category.slug)
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
          title={`${category.name} Equipment`}
          subtitle={category.description}
          category={category.slug}
        />
      </Suspense>
    </>
  );
}
