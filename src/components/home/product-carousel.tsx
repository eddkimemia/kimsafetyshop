"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { products } from "@/lib/data/products";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

export function ProductCarousel({
  title,
  kicker,
  filter,
  href,
  showTabs,
}: {
  title: string;
  kicker?: string;
  filter: "featured" | "bestSeller" | "new" | "deals" | "all";
  href: string;
  showTabs?: boolean;
}) {
  const { catalog } = useStore();
  const [tab, setTab] = useState("All");
  const scroller = useRef<HTMLDivElement>(null);

  const tabs = ["All", "Medical Safety", "Industrial Safety", "PPE", "Fire Safety", "Road Safety"];

  const list = (catalog.length ? catalog : products).filter((p) => {
    const base =
      filter === "all" ||
      (filter === "deals" ? p.oldPrice != null && p.oldPrice > p.price : p[filter] === true);
    if (!base) return false;
    if (tab === "All") return true;
    return p.categoryName === tab;
  });

  const scroll = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="bg-white py-16 lg:py-20" aria-label={title}>
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {kicker && (
              <span className="text-xs font-bold uppercase tracking-widest text-safety-600">{kicker}</span>
            )}
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-900 lg:text-4xl">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {showTabs && (
              <div className="mr-2 hidden items-center gap-1 rounded-full border border-line bg-surface p-1 md:flex">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                      tab === t ? "bg-navy-900 text-white" : "text-gray-500 hover:text-navy-900"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-navy-900 transition-colors hover:bg-surface"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-navy-900 transition-colors hover:bg-surface"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={scroller} className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2">
          {list.map((p) => (
            <div key={p.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
              <ProductCard product={p} compact />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
          >
            View All {title} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
