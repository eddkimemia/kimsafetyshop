import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { products } from "@/lib/data/products";
import { productImages } from "@/lib/data/product-images";
import { liveGetBySlug, liveRelatedFor } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { ProductDetail } from "@/components/product/product-detail";

// ISR: product pages render once and refresh every 30s, so repeat visits don't
// re-run the full merge/DB lookup per request. Admin price changes still reach
// buyers quickly because cart/checkout re-fetch the live catalog client-side.
export const revalidate = 30;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await liveGetBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  const meta = product.description.replace(/<[^>]+>/g, " ").trim().slice(0, 160);
  // Main image: admin override -> committed product photo -> SKU fallback.
  const mainImage =
    product.image ||
    productImages[product.sku] ||
    `/images/products/${product.sku}.jpg`;
  const images = [{ url: mainImage, alt: product.name }];
  return {
    title: `${product.name} — ${product.brand}`,
    description: meta,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} — KimSafety Kenya`,
      description: meta,
      type: "website",
      url: `/product/${product.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} — KimSafety Kenya`,
      description: meta,
      images,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await liveGetBySlug(params.slug);
  if (!product) return notFound();

  const related = await liveRelatedFor(product);
  const mainImage =
    product.image ||
    productImages[product.sku] ||
    `/images/products/${product.sku}.jpg`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: mainImage,
    url: `${siteUrl}/product/${product.slug}`,
    brand: { "@type": "Brand", name: product.brand },
    description: product.description.replace(/<[^>]+>/g, " ").trim(),
    category: product.categoryName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/product/${product.slug}`,
      seller: { "@type": "Organization", name: "KimSafety" },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/search" },
      { "@type": "ListItem", position: 3, name: product.categoryName, item: `/category/${product.category}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `/product/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BreadcrumbTrail product={product} />
      <ProductDetail product={product} related={related} />
    </>
  );
}

function BreadcrumbTrail({ product }: { product: (typeof products)[number] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-line bg-white">
      <div className="mx-auto max-w-shell px-4 py-3 lg:px-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
          <li>
            <Link href="/" className="font-medium transition-colors hover:text-safety-600">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3 w-3" />
          </li>
          <li>
            <Link href="/search" className="font-medium transition-colors hover:text-safety-600">
              Shop
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3 w-3" />
          </li>
          <li>
            <Link
              href={`/category/${product.category}`}
              className="font-medium transition-colors hover:text-safety-600"
            >
              {product.categoryName}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3 w-3" />
          </li>
          <li className="max-w-[40ch] truncate font-semibold text-navy-900" aria-current="page">
            {product.name}
          </li>
        </ol>
      </div>
    </nav>
  );
}
