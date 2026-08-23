"use client";

import Link from "next/link";
import { Scale, ShoppingCart, X, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatKES } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { RatingStars } from "@/components/ui/rating";
import { PageHeader } from "@/components/layout/page-header";

export default function ComparePage() {
  const { compare, toggleCompare, addToCart, liveProduct } = useStore();
  const items = compare.map((id) => liveProduct(id)).filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-card">
          <Scale className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Nothing to compare</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Select up to 4 products with the compare button to see side-by-side specifications.
        </p>
        <Link
          href="/search"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-safety-600"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const rows: [string, (p: (typeof items)[number]) => React.ReactNode][] = [
    ["Brand", (p) => p!.brand],
    ["SKU", (p) => <span className="font-mono">{p!.sku}</span>],
    ["Model", (p) => p!.model ?? "—"],
    ["Price", (p) => (
      <div>
        <span className="block font-display text-lg font-extrabold text-navy-900">{formatKES(p!.price)}</span>
        {p!.oldPrice != null && p!.oldPrice > p!.price && (
          <span className="block text-xs text-gray-400 line-through">{formatKES(p!.oldPrice)}</span>
        )}
      </div>
    )],
    ["Rating", (p) => <RatingStars rating={p!.rating} reviews={p!.reviews} size="xs" />],
    ["Availability", (p) => (
      <span className={p!.stock > 0 ? "font-bold text-emerald-600" : "font-bold text-danger"}>
        {p!.stock > 0 ? `${p!.stock} in stock` : "Out of stock"}
      </span>
    )],
    ["Category", (p) => p!.categoryName],
    ["Material", (p) => p!.material ?? "—"],
    ["Size", (p) => p!.size ?? "—"],
    ["Weight", (p) => p!.weight ?? "—"],
    ["Certification", (p) => p!.certification ?? "—"],
    ["Standard", (p) => p!.standard ?? "—"],
    ["Country", (p) => p!.country ?? "—"],
    ["Warranty", (p) => p!.warranty ?? "—"],
  ];

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        title="Compare Products"
        subtitle={`Side-by-side specifications for ${items.length} of 4 slots`}
      />
      <div className="mx-auto max-w-shell overflow-x-auto px-4 pt-8 lg:px-8">
        <table className="w-full min-w-[640px] border-collapse overflow-hidden rounded-2xl border border-line bg-white text-sm shadow-card">
          <thead>
            <tr>
              <th className="w-40 bg-surface p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Attribute</th>
              {items.map((p) => (
                <th key={p!.id} className="min-w-56 p-4 align-top">
                  <button
                    onClick={() => toggleCompare(p!.id)}
                    className="mb-2 flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-danger"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                  <div className="overflow-hidden rounded-xl">
                    <ProductArt tags={p!.tags} categoryName={p!.categoryName} brand={p!.brand} sku={p!.sku} name={p!.name} className="aspect-video" src={(p!).image || undefined} />
                  </div>
                  <Link href={`/product/${p!.slug}`} className="mt-2 block font-display text-sm font-extrabold leading-snug text-navy-900 hover:text-safety-600">
                    {p!.name}
                  </Link>
                  <button
                    onClick={() => addToCart(p!.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 py-2 text-xs font-bold text-white hover:bg-safety-500"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, render], i) => (
              <tr key={label} className={i % 2 === 0 ? "bg-surface" : "bg-white"}>
                <th scope="row" className="bg-surface p-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  {label}
                </th>
                {items.map((p) => (
                  <td key={p!.id} className="p-4 align-top text-gray-600">
                    {render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
