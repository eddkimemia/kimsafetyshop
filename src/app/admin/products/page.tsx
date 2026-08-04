"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Search } from "lucide-react";
import { useFetch, AdminCard, adminField } from "@/components/admin/ui";
import { ProductArt } from "@/components/product/product-art";
import { formatKES } from "@/lib/utils";

type AdminProduct = {
  sku: string;
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

export default function AdminProductsPage() {
  const { data, loading, refresh } = useFetch<{ products: AdminProduct[] }>("/api/admin/products");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const products = (data?.products ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
  );

  const remove = async (p: AdminProduct) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const res = await fetch(`/api/admin/products?sku=${encodeURIComponent(p.sku)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Deleted ${p.name}` : json.error ?? "Delete failed");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} of {data?.products?.length ?? 0} catalog items · click a product to open the full editor</p>
        </div>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>
      )}

      <AdminCard title="Catalog" action={
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
      }>
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
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock</th>
                    <th className="hidden pb-3 lg:table-cell">Type</th>
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
                            <span className="text-[11px] text-gray-400">{p.brand} · {p.categoryName}</span>
                          </span>
                        </button>
                      </td>
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
                      <td className="hidden py-3 lg:table-cell">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.static ? "bg-slate-100 text-slate-600" : "bg-safety-50 text-safety-700"}`}>
                          {p.static ? "Seed" : "Custom"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1.5">
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
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No products match.</td></tr>
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
