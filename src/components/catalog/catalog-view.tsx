"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { products, matchesQuery } from "@/lib/data/products";
import { categories, brands, productInCategory } from "@/lib/data/catalog";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCard } from "@/components/product/product-card";
import { ProductRow } from "./product-row";
import { cn } from "@/lib/utils";

type CatalogProps = {
  title: string;
  subtitle?: string;
  search?: string;
  category?: string;
  brand?: string;
  deals?: boolean;
  hideBrandFilter?: boolean;
};

const SORTS = [
  ["featured", "Most Popular"],
  ["newest", "Newest"],
  ["best", "Best Selling"],
  ["rating", "Highest Rated"],
  ["price-asc", "Lowest Price"],
  ["price-desc", "Highest Price"],
] as const;

const FILTER_FIELDS = [
  ["category", "Category", "select"],
  ["brand", "Brand", "select"],
  ["availability", "Availability", "select"],
  ["rating", "Rating", "select"],
  ["price-min", "Min Price", "number"],
  ["price-max", "Max Price", "number"],
  ["discount", "On Sale", "checkbox"],
] as const;

const PAGE_SIZE = 12;

export function CatalogView({ title, subtitle, search, category, brand, deals, hideBrandFilter }: CatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { catalog: liveCatalogItems } = useStore();
  const [grid, setGrid] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);

  const q = search ?? searchParams.get("q") ?? "";
  const cat = category ?? searchParams.get("category") ?? "all";
  const br = brand ?? searchParams.get("brand") ?? "all";
  const availability = searchParams.get("availability") ?? "all";
  const rating = searchParams.get("rating") ?? "all";
  const minPrice = searchParams.get("price-min") ?? "";
  const maxPrice = searchParams.get("price-max") ?? "";
  const onSale = (searchParams.get("discount") ?? "") === "1";
  const sort = searchParams.get("sort") ?? "featured";
  const sortExplicit = searchParams.has("sort");

  useEffect(() => {
    setPage(1);
    setHasFiltered(Boolean(q || cat !== "all" || (!hideBrandFilter && br !== "all") || availability !== "all" || rating !== "all" || minPrice || maxPrice || onSale));
  }, [q, cat, br, availability, rating, minPrice, maxPrice, onSale, hideBrandFilter]);

  const results = useMemo(() => {
    let list = [...(liveCatalogItems.length ? liveCatalogItems : products)];
    if (deals) list = list.filter((p) => p.oldPrice);
    if (q) list = list.filter((p) => matchesQuery(p, q));
    if (cat !== "all") list = list.filter((p) => productInCategory(p, cat));
    if (br !== "all") list = list.filter((p) => p.brand.toLowerCase() === br.toLowerCase());
    if (availability === "in") list = list.filter((p) => p.stock > 0);
    if (availability === "low") list = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt);
    if (availability === "out") list = list.filter((p) => p.stock <= 0);
    if (rating !== "all") list = list.filter((p) => p.rating >= Number(rating));
    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
    if (onSale) list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
    if (sortExplicit) {
      switch (sort) {
        case "newest":
          list.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0) || b.sku.localeCompare(a.sku));
          break;
        case "best":
          list.sort((a, b) => b.sold - a.sold);
          break;
        case "rating":
          list.sort((a, b) => b.rating - a.rating);
          break;
        case "price-asc":
          list.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          list.sort((a, b) => b.price - a.price);
          break;
        default:
          list.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || b.sold - a.sold);
      }
    }
    return list;
  }, [q, cat, br, availability, rating, minPrice, maxPrice, onSale, sort, sortExplicit, deals, liveCatalogItems]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const activeFilters = searchParams.toString();

  const activeCount = [
    cat !== "all",
    !hideBrandFilter && br !== "all",
    availability !== "all",
    rating !== "all",
    Boolean(minPrice),
    Boolean(maxPrice),
    onSale,
  ].filter(Boolean).length;

  const priceOptions: [string, string][] = [
    ["", "Any price"],
    ["500", "Under KES 500"],
    ["1000", "KES 500 – 1,000"],
    ["3000", "KES 1,000 – 3,000"],
    ["10000", "KES 3,000 – 10,000"],
    ["10001", "Over KES 10,000"],
  ];

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        title={q ? <>Results for “{q}”</> : title}
        subtitle={
          subtitle ??
          `${results.length.toLocaleString()} certified products · Nationwide delivery · Bulk discounts available`
        }
        breadcrumb={
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <a href="/" className="hover:text-white">
                Home
              </a>
            </li>
            <li aria-hidden>/</li>
            {cat !== "all" && (
              <>
                <li>
                  <a href="/search" className="hover:text-white">
                    Shop
                  </a>
                </li>
                <li aria-hidden>/</li>
              </>
            )}
            <li className="font-semibold text-white" aria-current="page">
              {category ? categories.find((c) => c.slug === cat)?.name ?? "Shop" : "Shop"}
            </li>
          </ol>
        }
      />

      <div className="mx-auto max-w-shell px-4 pt-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMobileFilters(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-navy-900 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-safety-500 px-1 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-sm font-bold text-navy-900">Filters:</span>
            {FILTER_FIELDS.slice(0, 4)
              .filter(([key]) => !(hideBrandFilter && key === "brand"))
              .map(([key, label, type]) =>
              type === "checkbox" ? null : (
                <label key={key} className="relative">
                  <span className="sr-only">{label}</span>
                  {key === "category" ? (
                    <select
                      value={cat}
                      onChange={(e) => updateParam("category", e.target.value)}
                      className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy-900 outline-none focus:border-safety-400"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  ) : key === "brand" ? (
                    <select
                      value={br}
                      onChange={(e) => updateParam("brand", e.target.value)}
                      className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy-900 outline-none focus:border-safety-400"
                    >
                      <option value="all">All Brands</option>
                      {brands.map((b) => (
                        <option key={b.slug} value={b.slug}>{b.name}</option>
                      ))}
                    </select>
                  ) : key === "availability" ? (
                    <select
                      value={availability}
                      onChange={(e) => updateParam("availability", e.target.value)}
                      className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy-900 outline-none focus:border-safety-400"
                    >
                      <option value="all">Any availability</option>
                      <option value="in">In stock</option>
                      <option value="low">Low stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                  ) : (
                    <select
                      value={rating}
                      onChange={(e) => updateParam("rating", e.target.value)}
                      className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-sm font-semibold text-navy-900 outline-none focus:border-safety-400"
                    >
                      <option value="all">Any rating</option>
                      <option value="4.5">4.5★ & up</option>
                      <option value="4">4★ & up</option>
                      <option value="3">3★ & up</option>
                    </select>
                  )}
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </label>
              )
            )}
            <button
              onClick={() => updateParam("discount", onSale ? "" : "1")}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                onSale
                  ? "border-danger bg-danger/5 text-danger"
                  : "border-line bg-white text-navy-900 hover:border-danger/40"
              )}
            >
              <Check className={cn("h-4 w-4", onSale ? "block" : "hidden")} /> On Sale
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
              <button
                onClick={() => setGrid("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  grid === "grid" ? "bg-navy-900 text-white" : "text-gray-400"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGrid("list")}
                aria-label="List view"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  grid === "list" ? "bg-navy-900 text-white" : "text-gray-400"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <label className="relative">
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="h-11 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-10 text-sm font-bold text-navy-900 outline-none focus:border-safety-400"
              >
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </label>
          </div>
        </div>

        {hasFiltered && (
          <div className="mb-5 flex items-center gap-2">
            <button
              onClick={() => router.replace(pathname)}
              className="flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-navy-800"
            >
              <X className="h-3 w-3" /> Clear all filters
            </button>
            <span className="text-xs text-gray-500">
              {results.length} product{results.length === 1 ? "" : "s"} found
            </span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilters + grid}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "grid gap-5",
              grid === "grid"
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            {pageItems.map((p) =>
              grid === "list" ? <ProductRow key={p.id} productId={p.id} /> : (
                <ProductCard key={p.id} product={p} />
              )
            )}
          </motion.div>
        </AnimatePresence>

        {pageItems.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line bg-white p-16 text-center">
            {q ? (
              <>
                <p className="font-display text-lg font-extrabold text-navy-900">
                  No products found for “{q}”
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Check the spelling or try one of these popular searches
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {["Nitrile Gloves", "Safety Helmet", "3M", "Fire Extinguisher", "Coveralls"].map((s) => (
                    <button
                      key={s}
                      onClick={() => router.replace(`${pathname}?q=${encodeURIComponent(s)}`)}
                      className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-navy-800 transition-colors hover:border-safety-400 hover:bg-safety-50 hover:text-safety-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => router.replace(pathname)}
                  className="mt-6 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white hover:bg-safety-600"
                >
                  Browse all products
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-extrabold text-navy-900">No products match your filters</p>
                <p className="mt-1 text-sm text-gray-500">Try clearing filters or searching differently.</p>
                <button
                  onClick={() => router.replace(pathname)}
                  className="mt-5 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white hover:bg-safety-600"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy-900 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition-colors",
                  page === i + 1
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-line bg-white text-navy-900 hover:border-safety-300"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy-900 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <MobileFilters
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        cat={cat}
        br={br}
        hideBrandFilter={hideBrandFilter}
        availability={availability}
        rating={rating}
        minPrice={minPrice}
        onSale={onSale}
        updateParam={updateParam}
        priceOptions={priceOptions}
      />
    </div>
  );
}

function MobileFilters({
  open,
  onClose,
  cat,
  br,
  hideBrandFilter,
  availability,
  rating,
  minPrice,
  onSale,
  updateParam,
  priceOptions,
}: {
  open: boolean;
  onClose: () => void;
  cat: string;
  br: string;
  hideBrandFilter?: boolean;
  availability: string;
  rating: string;
  minPrice: string;
  onSale: boolean;
  updateParam: (key: string, value: string) => void;
  priceOptions: [string, string][];
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-navy-900">Filters</h2>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line" aria-label="Close filters">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5">
              <FilterGroup label="Category">
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={cat === "all"} onClick={() => updateParam("category", "")}>All</FilterChip>
                  {categories.map((c) => (
                    <FilterChip key={c.slug} active={cat === c.slug} onClick={() => updateParam("category", cat === c.slug ? "" : c.slug)}>
                      {c.name}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>
              {!hideBrandFilter && (
                <FilterGroup label="Brand">
                  <div className="flex flex-wrap gap-2">
                    <FilterChip active={br === "all"} onClick={() => updateParam("brand", "")}>All</FilterChip>
                    {brands.map((b) => (
                      <FilterChip key={b.slug} active={br === b.slug} onClick={() => updateParam("brand", br === b.slug ? "" : b.slug)}>
                        {b.name}
                      </FilterChip>
                    ))}
                  </div>
                </FilterGroup>
              )}
              <FilterGroup label="Price">
                <div className="grid grid-cols-2 gap-2">
                  {priceOptions.map(([value, label]) => (
                    <FilterChip
                      key={label}
                      active={Boolean(value) && (minPrice ?? "") === value}
                      onClick={() => updateParam("price-min", value)}
                    >
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>
              <FilterGroup label="Availability">
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={availability === "all"} onClick={() => updateParam("availability", "")}>All</FilterChip>
                  <FilterChip active={availability === "in"} onClick={() => updateParam("availability", "in")}>In stock</FilterChip>
                  <FilterChip active={availability === "low"} onClick={() => updateParam("availability", "low")}>Low stock</FilterChip>
                  <FilterChip active={availability === "out"} onClick={() => updateParam("availability", "out")}>Out of stock</FilterChip>
                </div>
              </FilterGroup>
              <FilterGroup label="Rating">
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={rating === "all"} onClick={() => updateParam("rating", "")}>Any</FilterChip>
                  {["4.5", "4", "3"].map((r) => (
                    <FilterChip key={r} active={rating === r} onClick={() => updateParam("rating", r)}>
                      <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" />
                      {r}+ & up
                    </FilterChip>
                  ))}
                </div>
              </FilterGroup>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-4">
                <span className="text-sm font-bold text-navy-900">On sale only</span>
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={() => updateParam("discount", onSale ? "" : "1")}
                  className="h-5 w-5 accent-safety-500"
                />
              </label>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-navy-900 py-3.5 text-sm font-bold text-white"
            >
              Show Results
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-400">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-line bg-white text-navy-800 hover:border-navy-300"
      )}
    >
      {children}
    </button>
  );
}
