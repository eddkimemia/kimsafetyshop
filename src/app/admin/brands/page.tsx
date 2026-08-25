"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";

type Brand = {
  slug: string;
  name: string;
  tagline: string;
  origin: string;
  image: string;
};

export default function AdminBrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/brands");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to load brands");
      setBrands(Array.isArray(json.brands) ? json.brands : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter((b) => `${b.name} ${b.slug} ${b.tagline} ${b.origin}`.toLowerCase().includes(q));
  }, [brands, query]);

  const handleDelete = async (b: Brand) => {
    if (!confirm(`Delete brand "${b.name}" (${b.slug})? This cannot be undone. Products using this brand will keep their brand name but the brand page will disappear.`)) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/brands?slug=${encodeURIComponent(b.slug)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");
      setNotice(`Brand "${b.name}" deleted`);
      await fetchBrands();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Brands</h1>
          <p className="text-sm text-gray-500">
            {brands.length} brands · manage logos, taglines & origins · changes appear on /brands and all brand pages
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/brands/new")}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
        >
          <Plus className="h-4 w-4" /> Add Brand
        </button>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard
        title="All Brands"
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search brands…"
              className={adminField}
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No brands match.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <div key={b.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4 p-5">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image} alt={`${b.name} logo`} className="h-full w-full object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-extrabold text-navy-900">{b.name}</h3>
                    <p className="truncate text-xs text-gray-500">{b.tagline || "—"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-400">
                      <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px]">{b.slug}</span> · {b.origin}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-1.5 border-t border-line bg-surface/50 p-3">
                  <a
                    href={`/brands/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on storefront"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-gray-500 hover:text-navy-900"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => router.push(`/admin/brands/${encodeURIComponent(b.slug)}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-surface"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/20 bg-red-50 text-danger hover:bg-danger hover:text-white"
                    title="Delete brand"
                    aria-label={`Delete ${b.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
