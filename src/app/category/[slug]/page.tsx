import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { categories, productInCategory } from "@/lib/data/catalog";
import { liveCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

// ISR: category pages re-render at most every 5 minutes and are busted
// immediately by admin product saves (revalidatePath in /api/admin/products).
export const revalidate = 300;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return { title: "Category not found" };
  const title = `${category.name} Equipment in Kenya | ${category.tagline} | KimSafety`;
  const description = `${category.description} — Shop ${category.name.toLowerCase()} with bulk pricing, same-day Nairobi delivery & certification docs. Serving ${category.industries.join(", ")}.`;
  return {
    title,
    description: description.slice(0, 160),
    keywords: [category.name, `${category.name} Kenya`, `${category.tagline}`, `${category.slug} equipment`, `buy ${category.name.toLowerCase()} Nairobi`],
    alternates: { canonical: `${siteUrl}/category/${category.slug}` },
    openGraph: {
      title: `${category.name} Equipment — KimSafety Kenya`,
      description: description.slice(0, 160),
      type: "website",
      url: `${siteUrl}/category/${category.slug}`,
      siteName: "KimSafety",
      images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} — KimSafety Kenya`,
      description: description.slice(0, 160),
      images: [`${siteUrl}/og-image.jpg`],
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return notFound();
  // One fetch shared by the JSON-LD list and the grid — also guarantees both
  // show the same (deterministic) catalog order.
  const catalog = await liveCatalog();
  const filtered = catalog.filter((p) => productInCategory(p, category.slug)).slice(0, 30);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/category/${category.slug}#collection`,
    name: `${category.name} Equipment in Kenya`,
    description: category.description,
    url: `${siteUrl}/category/${category.slug}`,
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
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/search` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${siteUrl}/category/${category.slug}` },
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
          title={`${category.name} Equipment`}
          subtitle={category.description}
          category={category.slug}
          initialProducts={catalog}
        />
      </Suspense>
    </>
  );
}
