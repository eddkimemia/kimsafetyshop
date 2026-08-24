"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, FileStack, Search, CheckSquare, Square } from "lucide-react";
import { useFetch, AdminCard, adminField } from "@/components/admin/ui";
import { ProductArt } from "@/components/product/product-art";
import { formatKES } from "@/lib/utils";

type AdminProduct = {
  sku: string;
  slug?: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  stock: number;
  lowStockAt: number;
  tags: string[];
  description?: string;
  image?: string;
  static?: boolean;
};

export default function AdminDatasheetsPage() {
  const { data, loading } = useFetch<{ products: AdminProduct[] }>("/api/admin/products");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const all = useMemo(() => data?.products ?? [], [data]);

  const brands = useMemo(() => Array.from(new Set(all.map((p) => p.brand).filter(Boolean))).sort(), [all]);
  const categories = useMemo(() => Array.from(new Set(all.map((p) => p.categoryName).filter(Boolean))).sort(), [all]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)) &&
        (brand === "all" || p.brand === brand) &&
        (category === "all" || p.categoryName === category)
    );
  }, [all, query, brand, category]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.sku));
  const selectedCount = selected.size;

  const toggleOne = (sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.sku));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.sku));
        return next;
      });
    }
  };

  const clearSelection = () => setSelected(new Set());

  const triggerDownload = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/datasheets", { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `kimsafety-datasheets-all-${new Date().toISOString().slice(0, 10)}.pdf`;
      await triggerDownload(blob, filename);
      setNotice(`Downloaded datasheets for all ${all.length} products as one PDF.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed — try again.");
    } finally {
      setDownloadingAll(false);
    }
  };

  const downloadSelected = async () => {
    if (selectedCount === 0) {
      setError("Select at least one product to export.");
      return;
    }
    setDownloadingSelected(true);
    setNotice(null);
    setError(null);
    try {
      const skus = Array.from(selected);
      const res = await fetch("/api/admin/products/datasheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to generate PDF");
      }
      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `kimsafety-datasheets-${skus.length}-selected.pdf`;
      await triggerDownload(blob, filename);
      setNotice(`Downloaded datasheets for ${skus.length} selected ${skus.length === 1 ? "product" : "products"} as one PDF.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed — try again.");
    } finally {
      setDownloadingSelected(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/products"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-navy-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Product Datasheets</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Each product&apos;s official datasheet on its own page. Use the checkboxes to pick only what you need, or download the
            entire catalog as a single merged PDF.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {filtered.length} of {all.length} products shown
            {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={downloadAll}
            disabled={downloadingAll || downloadingSelected || all.length === 0}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 shadow-sm hover:bg-surface disabled:opacity-60"
            title="One PDF containing every product datasheet (with cover page)"
          >
            <FileStack className="h-4 w-4 text-safety-500" />
            {downloadingAll ? "Building PDF…" : `Download all (${all.length})`}
          </button>

          <button
            onClick={downloadSelected}
            disabled={downloadingSelected || downloadingAll || selectedCount === 0}
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-safety-500 disabled:opacity-60"
            title={selectedCount === 0 ? "Select products first" : `One PDF with ${selectedCount} datasheets`}
          >
            <FileText className="h-4 w-4" />
            {downloadingSelected ? "Building PDF…" : selectedCount === 0 ? "Download selected" : `Download selected (${selectedCount})`}
          </button>
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-safety-200 bg-safety-50 px-4 py-3">
          <p className="text-sm font-semibold text-safety-800">
            {selectedCount} {selectedCount === 1 ? "product" : "products"} selected — they&apos;ll be merged into one PDF in catalog order.
          </p>
          <div className="flex gap-2">
            <button onClick={clearSelection} className="rounded-xl border border-safety-200 bg-white px-3 py-1.5 text-xs font-bold text-safety-700 hover:bg-safety-100">
              Clear selection
            </button>
            <button
              onClick={downloadSelected}
              disabled={downloadingSelected}
              className="rounded-xl bg-navy-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export selected as one PDF
              </span>
            </button>
          </div>
        </div>
      )}

      <AdminCard
        title="Catalog"
        subtitle="Tick the rows you want in the merged datasheet. Filters apply only to the list — 'Download all' always exports the full catalog."
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search products…"
              className={adminField}
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-2.5 border-b border-line pb-4 sm:grid-cols-3 lg:grid-cols-4">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={adminField} aria-label="Filter by brand">
            <option value="all">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={adminField} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAllFiltered}
              disabled={filtered.length === 0}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface disabled:opacity-50"
            >
              {allFilteredSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {allFilteredSelected ? "Deselect filtered" : `Select filtered (${filtered.length})`}
            </button>
          </div>
          <div className="hidden items-center justify-end gap-2 text-xs font-semibold text-gray-500 lg:flex">
            <span className="hidden xl:inline">Tip: each datasheet includes price, specs & description</span>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading products…</p>
        ) : (
          <>
            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {filtered.map((p) => {
                const isChecked = selected.has(p.sku);
                return (
                  <label
                    key={p.sku}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${isChecked ? "border-safety-300 bg-safety-50" : "border-line bg-white"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(p.sku)}
                      className="mt-1 h-4 w-4 shrink-0 accent-safety-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-navy-900">{p.name}</span>
                          <span className="block text-[11px] text-gray-500">
                            {p.brand} · {p.categoryName}
                          </span>
                          <span className="block font-mono text-[11px] text-gray-400">{p.sku}</span>
                        </span>
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} name={p.name} className="h-full w-full" />
                        </span>
                      </span>
                      <span className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-900">{formatKES(p.price)}</span>
                        <a
                          href={`/api/documents/datasheet?sku=${encodeURIComponent(p.sku)}`}
                          download={`kimsafety-datasheet-${p.sku}.pdf`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-navy-900 hover:border-safety-300 hover:text-safety-600"
                        >
                          <Download className="h-3 w-3" /> Datasheet
                        </a>
                      </span>
                    </span>
                  </label>
                );
              })}
              {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No products match the filters.</p>}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="w-10 pb-3">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        disabled={filtered.length === 0}
                        aria-label="Select all filtered products"
                        className="h-4 w-4 accent-safety-500"
                      />
                    </th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Brand</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3 text-right">Datasheet</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const isChecked = selected.has(p.sku);
                    return (
                      <tr key={p.sku} className={`border-b border-line/60 last:border-0 ${isChecked ? "bg-safety-50/60" : ""}`}>
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(p.sku)}
                            aria-label={`Select ${p.name}`}
                            className="h-4 w-4 accent-safety-500"
                          />
                        </td>
                        <td className="py-3">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleOne(p.sku)}
                              className="sr-only"
                              tabIndex={-1}
                            />
                            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                              <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} name={p.name} className="h-full w-full" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-navy-900">{p.name}</span>
                              <span className="text-[11px] text-gray-400">{p.categoryName}</span>
                            </span>
                          </label>
                        </td>
                        <td className="py-3 text-gray-600">{p.brand}</td>
                        <td className="py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                        <td className="py-3 font-bold text-navy-900">{formatKES(p.price)}</td>
                        <td className="py-3">
                          <div className="flex justify-end">
                            <a
                              href={`/api/documents/datasheet?sku=${encodeURIComponent(p.sku)}`}
                              download={`kimsafety-datasheet-${p.sku}.pdf`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:border-safety-300 hover:text-safety-600"
                              title={`Download datasheet for ${p.name}`}
                            >
                              <Download className="h-3.5 w-3.5" /> Datasheet
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                        No products match the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-gray-500">
              <p>
                Merged PDF includes a cover page (when more than one product) + one datasheet page per product. Content matches the single-product datasheet at{" "}
                <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">/api/documents/datasheet?sku=...</code>.
              </p>
              <p className="font-semibold text-gray-600">{selectedCount} selected · {filtered.length} shown · {all.length} total</p>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
