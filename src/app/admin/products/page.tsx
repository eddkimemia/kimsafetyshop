"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

type SortKey = "name" | "brand" | "sku" | "price" | "stock";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const sortOptions: { key: SortKey; dir: "asc" | "desc"; label: string }[] = [
  { key: "name", dir: "asc", label: "Name (A–Z)" },
  { key: "name", dir: "desc", label: "Name (Z–A)" },
  { key: "brand", dir: "asc", label: "Brand (A–Z)" },
  { key: "sku", dir: "asc", label: "SKU (A–Z)" },
  { key: "price", dir: "asc", label: "Price (low → high)" },
  { key: "price", dir: "desc", label: "Price (high → low)" },
  { key: "stock", dir: "asc", label: "Stock (low → high)" },
  { key: "stock", dir: "desc", label: "Stock (high → low)" },
];

export default function AdminProductsPage() {
  const { data, loading, refresh } = useFetch<{ products: AdminProduct[] }>("/api/admin/products");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "name", dir: "asc" });
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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
        (category === "all" || p.categoryName === category) &&
        (!lowOnly || p.stock <= p.lowStockAt)
    );
  }, [all, query, brand, category, lowOnly]);

  const products = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const k = sort.key;
      const dir = sort.dir === "asc" ? 1 : -1;
      if (k === "price" || k === "stock") return (a[k] - b[k]) * dir;
      return String(a[k]).localeCompare(String(b[k]), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
    return arr;
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const remove = async (p: AdminProduct) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const res = await fetch(`/api/admin/products?sku=${encodeURIComponent(p.sku)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Deleted ${p.name}` : json.error ?? "Delete failed");
    refresh();
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/products/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const match = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "kimsafety-products.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice(`Exported ${all.length} products to Excel.`);
    } catch {
      setNotice("Export failed — try again.");
    } finally {
      setExporting(false);
    }
  };

  const SortTh = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th className={`pb-3 ${className}`}>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-navy-900"
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        {sort.key === k ? (
          sort.dir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} of {all.length} catalog items · click a product to open the full editor</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportExcel}
            disabled={exporting || all.length === 0}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-surface disabled:opacity-60"
          >
            <Download className="h-4 w-4 text-emerald-600" /> {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <button
            onClick={() => router.push("/admin/products/new")}
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>
      )}

      <AdminCard
        title="Catalog"
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
        <div className="mb-4 grid grid-cols-2 gap-2.5 border-b border-line pb-4 sm:grid-cols-3 lg:grid-cols-5">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={adminField} aria-label="Filter by brand">
            <option value="all">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={adminField} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":") as [SortKey, "asc" | "desc"];
              setSort({ key, dir });
            }}
            className={adminField}
            aria-label="Sort products"
          >
            {sortOptions.map((o) => (
              <option key={o.label} value={`${o.key}:${o.dir}`}>Sort: {o.label}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="h-4 w-4 accent-safety-500"
            />
            Low stock only
          </label>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {products.map((p) => (
                <div key={p.sku} className="rounded-xl border border-line bg-white p-4">
                  <button
                    onClick={() => router.push(`/admin/products/${encodeURIComponent(p.sku)}`)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                      <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy-900">{p.name}</span>
                      <span className="text-[11px] text-gray-400">{p.brand} · {p.categoryName}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-gray-400">{p.sku}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-bold text-navy-900">{formatKES(p.price)}</span>
                      <span className={`mt-0.5 block text-[11px] font-bold ${p.stock <= p.lowStockAt ? "text-danger" : "text-emerald-600"}`}>
                        {p.stock} in stock
                      </span>
                    </span>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.static ? "bg-slate-100 text-slate-600" : "bg-safety-50 text-safety-700"}`}>
                      {p.static ? "Seed" : "Custom"}
                    </span>
                    <div className="flex gap-1.5">
                      <a
                        href={`/product/${encodeURIComponent(p.slug ?? p.sku)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${p.name} on the shop`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => router.push(`/admin/products/${encodeURIComponent(p.sku)}`)}
                        aria-label={`Edit ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!p.static && (
                        <button
                          onClick={() => remove(p)}
                          aria-label={`Delete ${p.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400">No products match.</p>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <SortTh label="Product" k="name" />
                    <SortTh label="Brand" k="brand" />
                    <SortTh label="SKU" k="sku" />
                    <SortTh label="Price" k="price" />
                    <SortTh label="Stock" k="stock" />
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.sku} className="border-b border-line/60 last:border-0">
                      <td className="py-3">
                        <button
                          onClick={() => router.push(`/admin/products/${encodeURIComponent(p.sku)}`)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                            <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} className="h-full w-full" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-navy-900 group-hover:text-safety-600">{p.name}</span>
                            <span className="text-[11px] text-gray-400">{p.categoryName}</span>
                          </span>
                        </button>
                      </td>
                      <td className="py-3 text-gray-600">{p.brand}</td>
                      <td className="py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="py-3">
                        <p className="font-bold text-navy-900">{formatKES(p.price)}</p>
                        {p.oldPrice && <p className="text-[11px] text-gray-400 line-through">{formatKES(p.oldPrice)}</p>}
                      </td>
                      <td className="py-3">
                        <span className={p.stock <= p.lowStockAt ? "font-bold text-danger" : "font-semibold text-emerald-600"}>
                          {p.stock}
                        </span>
                        <span className="text-[11px] text-gray-400"> / low at {p.lowStockAt}</span>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.static ? "bg-slate-100 text-slate-600" : "bg-safety-50 text-safety-700"}`}>
                          {p.static ? "Seed" : "Custom"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1.5">
                          <a
                            href={`/product/${encodeURIComponent(p.slug ?? p.sku)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${p.name} on the shop`}
                            title="View on the shop"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => router.push(`/admin/products/${encodeURIComponent(p.sku)}`)}
                            aria-label={`Edit ${p.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {!p.static && (
                            <button
                              onClick={() => remove(p)}
                              aria-label={`Delete ${p.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">No products match.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
