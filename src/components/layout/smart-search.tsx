"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, TrendingUp, PackageSearch } from "lucide-react";
import { searchProducts } from "@/lib/data/products";
import type { Product } from "@/lib/types";
import { formatKES, cn } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";

export function SmartSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => setResults(searchProducts(query)), 120);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 transition-all focus-within:border-safety-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-safety-500/10">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by product, brand, SKU, category or certification…"
            aria-label="Search products"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="hidden shrink-0 rounded-md bg-safety-500 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-safety-600 sm:block"
          >
            Search
          </button>
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          {results.length > 0 ? (
            <>
              <ul className="max-h-96 overflow-auto p-2">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.brand} · <span className="font-mono">{p.sku}</span>
                        </p>
                      </div>
                      <span className="text-sm font-bold text-navy-900">{formatKES(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 border-t border-line bg-surface py-3 text-xs font-bold text-safety-600 transition-colors hover:bg-safety-50"
              >
                See all results for “{query}” <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : query.trim().length >= 2 ? (
            <div className="p-6 text-center">
              <PackageSearch className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-semibold text-navy-900">No products found</p>
              <p className="text-xs text-gray-500">Try a brand, SKU or category name</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <TrendingUp className="h-3.5 w-3.5" /> Trending searches
              </p>
              <div className="flex flex-wrap gap-2 p-1">
                {["Nitrile gloves", "Safety helmet", "3M", "Fire extinguisher", "Goggles", "HiVis vest"].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      router.push(`/search?q=${encodeURIComponent(s)}`);
                      setOpen(false);
                    }}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-safety-400 hover:bg-safety-50 hover:text-safety-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
