import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { products } from "@/lib/data/products";
import { siteUrl } from "@/lib/site";
import { getLiveBrands } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Shop by Brand — 3M, Honeywell, Ansell & More in Kenya | KimSafety",
  description:
    "Authorized KimSafety stockist for 3M, Honeywell, Ansell, Uvex, MSA, Dräger, Kimberly-Clark, DuPont, Karam and Delta Plus safety equipment in Kenya. Certified stock, bulk pricing.",
  keywords: ["3M Kenya", "Honeywell Kenya", "Ansell Kenya", "safety brands Nairobi", "buy 3M safety equipment Kenya"],
  alternates: { canonical: `${siteUrl}/brands` },
  openGraph: {
    title: "Shop by Brand — KimSafety Kenya",
    description: "Authorized stockist for 3M, Honeywell, Ansell, Uvex, MSA & more — certified safety equipment with bulk pricing.",
    type: "website",
    url: `${siteUrl}/brands`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "Shop by Brand — KimSafety Kenya" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop by Brand — KimSafety Kenya",
    description: "3M, Honeywell, Ansell, Uvex & more — certified stock with bulk pricing.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default async function BrandsPage() {
  const brands = await getLiveBrands();
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        title="Shop by Brand"
        subtitle="Every KimSafety product is sourced through authorized channels and quality-inspected before dispatch — never gray-market, never counterfeit."
      />
      <div className="mx-auto grid max-w-shell grid-cols-1 gap-5 px-4 pt-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {brands.map((brand) => {
          const count = products.filter((p) => p.brand === brand.name).length;
          return (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group flex items-center gap-5 rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            >
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white p-3">
                <Image
                  src={brand.image}
                  alt={`${brand.name} logo`}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-extrabold text-navy-900 group-hover:text-safety-600">
                  {brand.name}
                </h2>
                <p className="truncate text-xs text-gray-400">{brand.tagline}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> {count} authorized product{count === 1 ? "" : "s"} · {brand.origin}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-safety-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
