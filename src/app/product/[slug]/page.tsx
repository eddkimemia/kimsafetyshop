import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { products } from "@/lib/data/products";
import { liveGetBySlug, liveRelatedFor } from "@/lib/catalog";
import { ProductDetail } from "@/components/product/product-detail";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = liveGetBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  const meta = product.description.replace(/<[^>]+>/g, " ").trim().slice(0, 160);
  return {
    title: `${product.name} — ${product.brand}`,
    description: meta,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.name} — KimSafety Kenya`,
      description: meta,
      type: "website",
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = liveGetBySlug(params.slug);
  if (!product) return notFound();

  const related = liveRelatedFor(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
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
      seller: { "@type": "Organization", name: "KimSafety" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
