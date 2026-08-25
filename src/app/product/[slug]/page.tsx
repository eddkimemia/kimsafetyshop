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
  const cleanDesc = product.description.replace(/<[^>]+>/g, " ").trim();
  const title = `Buy ${product.name} — ${product.brand} in Kenya | KimSafety`;
  const description = `${cleanDesc.slice(0, 120)} — KES ${product.price.toLocaleString()} · ${product.stock > 0 ? `${product.stock} in stock` : "Out of stock"} · ${product.rating}★ (${product.reviews} reviews) · Same-day Nairobi delivery & bulk discounts.`;
  // Main image: admin override -> committed product photo -> SKU fallback. Make absolute for OG crawlers.
  const mainImageRaw =
    product.image ||
    productImages[product.sku] ||
    `/images/products/${product.sku}.jpg`;
  const mainImage = mainImageRaw.startsWith("http") ? mainImageRaw : `${siteUrl}${mainImageRaw.startsWith("/") ? "" : "/"}${mainImageRaw}`;
  const images = [{ url: mainImage, width: 1200, height: 630, alt: product.name }];
  return {
    title,
    description: description.slice(0, 160),
    keywords: [
      product.name,
      `${product.brand} ${product.name}`,
      `${product.categoryName} Kenya`,
      `${product.sku} KimSafety`,
      `${product.brand} Kenya`,
      `buy ${product.name} Nairobi`,
    ],
    alternates: { canonical: `${siteUrl}/product/${product.slug}` },
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "website",
      url: `${siteUrl}/product/${product.slug}`,
      siteName: "KimSafety",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
      images: [mainImage],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await liveGetBySlug(params.slug);
  if (!product) return notFound();

  const related = await liveRelatedFor(product);
  const mainImageRaw =
    product.image ||
    productImages[product.sku] ||
    `/images/products/${product.sku}.jpg`;
  const mainImage = mainImageRaw.startsWith("http") ? mainImageRaw : `${siteUrl}${mainImageRaw.startsWith("/") ? "" : "/"}${mainImageRaw}`;
  const cleanDesc = product.description.replace(/<[^>]+>/g, " ").trim();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteUrl}/product/${product.slug}#product`,
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    image: [mainImage],
    url: `${siteUrl}/product/${product.slug}`,
    brand: { "@type": "Brand", name: product.brand },
    description: cleanDesc,
    category: product.categoryName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "KES",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "KimSafety", url: siteUrl },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/search` },
      { "@type": "ListItem", position: 3, name: product.categoryName, item: `${siteUrl}/category/${product.category}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${siteUrl}/product/${product.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the price of ${product.name} in Kenya?`,
        acceptedAnswer: { "@type": "Answer", text: `${product.name} costs KES ${product.price.toLocaleString()} ${product.oldPrice && product.oldPrice > product.price ? `(was KES ${product.oldPrice.toLocaleString()})` : ""} at KimSafety. Bulk discounts apply for 10+ units.` },
      },
      {
        "@type": "Question",
        name: `Is ${product.name} in stock?`,
        acceptedAnswer: { "@type": "Answer", text: product.stock > 0 ? `Yes — ${product.stock} units in stock at KimSafety's Nairobi warehouse. Same-day dispatch in Nairobi on orders before 3 PM, 24–72 hours countrywide.` : `Currently out of stock. Join the restock notification on the product page to be emailed when ${product.name} is back.` },
      },
      {
        "@type": "Question",
        name: "Do you provide certification and bulk pricing?",
        acceptedAnswer: { "@type": "Answer", text: "Every KimSafety product ships with certification documentation (CE, KEBS, EN, ISO as applicable) and a datasheet PDF. Tiered bulk pricing: 1–9 standard, 10–49, 50–199, 200+ with up to ~17% off. Corporate quotations at /quote or /corporate/purchase." },
      },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
