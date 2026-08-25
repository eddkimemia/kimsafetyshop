import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { megaCategories, brands } from "@/lib/data/catalog";
import { products } from "@/lib/data/products";

import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sitemap — KimSafety Kenya",
  description: "Sitemap: all KimSafety pages — categories, brands, products & guides for easy navigation.",
  alternates: { canonical: `${siteUrl}/sitemap` },
  robots: { index: true, follow: true },
};

const topPages: [string, string][] = [
  ["Home", "/"],
  ["Shop All Products", "/search"],
  ["Blog & News", "/blog"],
  ["Knowledge Center", "/knowledge"],
  ["Corporate Solutions", "/corporate"],
  ["Government & Tenders", "/corporate"],
  ["About KimSafety", "/about"],
  ["Contact Us", "/contact"],
  ["Help Center", "/support"],
  ["Track My Order", "/account"],
  ["Request a Quote", "/quote"],
  ["Cart", "/cart"],
  ["Checkout", "/checkout"],
  ["Privacy Policy", "/privacy"],
  ["Terms & Conditions", "/terms"],
];

export default function SitemapPage() {
  return (
    <div className="bg-surface pb-20">
      <PageHeader bg="/images/hero/hero4.jpg" title="Sitemap">
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
          Every page on KimSafety, organised for easy navigation.
        </p>
      </PageHeader>

      <div className="mx-auto max-w-shell px-4 pt-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="font-display text-lg font-extrabold text-navy-900">Main pages</h2>
            <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              {topPages.map(([label, href]) => (
                <li key={label + href}>
                  <Link href={href} className="text-gray-600 transition-colors hover:text-safety-600">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-extrabold text-navy-900">Brands</h2>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link href={`/brands/${b.slug}`} className="text-gray-600 transition-colors hover:text-safety-600">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Shop by category</h2>
          <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {megaCategories.map((cat) => (
              <div key={cat.title}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{cat.title}</h3>
                <ul className="space-y-2 text-sm">
                  {cat.items.map((item) => (
                    <li key={item}>
                      <Link
                        href={`/search?q=${encodeURIComponent(item)}`}
                        className="text-gray-600 transition-colors hover:text-safety-600"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-lg font-extrabold text-navy-900">All products</h2>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.slug} className="min-w-0">
                <Link
                  href={`/product/${p.slug}`}
                  className="block truncate text-gray-600 transition-colors hover:text-safety-600"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
