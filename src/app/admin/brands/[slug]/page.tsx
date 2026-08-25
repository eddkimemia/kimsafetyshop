"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Package, Pencil } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type Brand = {
  slug: string;
  name: string;
  tagline: string;
  origin: string;
  image: string;
};

type CatalogProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  price: number;
  stock: number;
};

/** Brand overview: details, every product carrying this brand, catalog export. */
export default function AdminBrandDetailsPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = decodeURIComponent(params.slug ?? "");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/brands");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load brand");
        const brands: Brand[] = Array.isArray(json.brands) ? json.brands : [];
        const found = brands.find((b) => b.slug === rawSlug) ?? null;
        if (!cancelled) {
          setBrand(found);
          if (!found) setError(`Brand "${rawSlug}" not found`);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load brand");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawSlug]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && Array.isArray(j.products)) setCatalog(j.products as CatalogProduct[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const brandProducts = useMemo(
    () => (brand ? catalog.filter((p) => p.brand === brand.name) : []),
    [catalog, brand]
  );

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Loading…</p>;

  if (error || !brand) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/brands"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold text-navy-900 hover:bg-surface"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Brands
        </Link>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error ?? "Brand not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/brands"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to brands"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">{brand.name}</h1>
            <p className="text-sm text-gray-500">{brandProducts.length} product{brandProducts.length === 1 ? "" : "s"} · /brands/{brand.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/documents/brand-catalog?slug=${encodeURIComponent(brand.slug)}`}
            download={`kimsafety-brand-${brand.slug}-catalog.pdf`}
            className="inline-flex items-center gap-2 rounded-xl bg-safety-50 px-5 py-3 text-sm font-bold text-safety-700 ring-1 ring-safety-200 transition-colors hover:bg-safety-100"
            title="Download a branded PDF catalog of every product in this brand"
          >
            <Download className="h-4 w-4" /> Download Catalog (PDF)
          </a>
          <Link
            href={`/admin/brands/${encodeURIComponent(brand.slug)}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
          >
            <Pencil className="h-4 w-4" /> Edit Brand
          </Link>
        </div>
      </div>

      <AdminCard title="Brand details" subtitle="Shown on /brands cards and the public brand page">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.image} alt={`${brand.name} logo`} className="h-full w-full object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          </span>
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Name</dt>
              <dd className="font-bold text-navy-900">{brand.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Slug</dt>
              <dd className="font-mono text-navy-900">{brand.slug}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tagline</dt>
              <dd className="text-gray-600">{brand.tagline || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Origin</dt>
              <dd className="text-gray-600">{brand.origin || "—"}</dd>
            </div>
          </dl>
          <a
            href={`/brands/${brand.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-gray-500 hover:text-navy-900"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View on storefront
          </a>
        </div>
      </AdminCard>

      <AdminCard
        title={`Products in this brand (${brandProducts.length})`}
        subtitle="Every catalog product carrying this brand name — the same list included in the downloadable PDF catalog"
      >
        {brandProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No products use the brand name &quot;{brand.name}&quot; yet. Set this exact brand name on products to group them here.
          </p>
        ) : (
          <div className="divide-y divide-line/60 rounded-xl border border-line">
            {brandProducts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">{p.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-gray-400">{p.sku} · {p.categoryName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="block text-sm font-extrabold text-navy-900">{formatKES(p.price)}</span>
                    <span className={`block text-[11px] font-bold ${p.stock > 0 ? "text-emerald-600" : "text-danger"}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                    </span>
                  </span>
                  <a
                    href={`/admin/products/${encodeURIComponent(p.sku)}`}
                    title="Edit product"
                    aria-label={`Edit ${p.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                  >
                    <Package className="h-4 w-4" />
                  </a>
                  <a
                    href={`/product/${encodeURIComponent(p.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on storefront"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-gray-500 hover:text-navy-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
