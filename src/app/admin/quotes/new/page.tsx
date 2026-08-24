"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Search, Trash2 } from "lucide-react";
import { useFetch, AdminCard, adminField } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type CatalogProduct = {
  sku: string;
  name: string;
  brand: string;
  price: number;
};

type Line = { sku: string; name: string; qty: number; price: number };

export default function AdminCreateQuotationPage() {
  const router = useRouter();
  const { data } = useFetch<{ products: CatalogProduct[] }>("/api/admin/products");
  const catalog = useMemo(() => data?.products ?? [], [data?.products]);

  const [customer, setCustomer] = useState({ name: "", company: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(14);
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setC = (patch: Partial<typeof customer>) => setCustomer((c) => ({ ...c, ...patch }));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog.filter((p) => `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q)).slice(0, 8);
  }, [catalog, query]);

  const addLine = (p: CatalogProduct) => {
    setLines((ls) => {
      const existing = ls.find((l) => l.sku === p.sku);
      if (existing) return ls.map((l) => (l.sku === p.sku ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { sku: p.sku, name: p.name, qty: 1, price: p.price }];
    });
    setQuery("");
  };

  const updateLine = (sku: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.sku === sku ? { ...l, ...patch } : l)));

  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);

  const save = async () => {
    if (!customer.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one product line.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          company: customer.company,
          email: customer.email,
          phone: customer.phone,
          items: lines.map((l) => ({ productId: l.sku, name: l.name, qty: l.qty, price: l.price })),
          notes: notes.trim() || undefined,
          validDays,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save quotation");
      router.push(`/admin/quotes?created=${encodeURIComponent(json.quote?.id ?? "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/quotes"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to quotes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Create quotation</h1>
            <p className="text-sm text-gray-500">Pick products from the catalog, set quantities & prices, then save the quote</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save quote"}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminCard title="Customer">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Customer name *</span>
                <input className={adminField} value={customer.name} onChange={(e) => setC({ name: e.target.value })} placeholder="e.g. Nairobi Water Co." />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Company</span>
                <input className={adminField} value={customer.company} onChange={(e) => setC({ company: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Email</span>
                <input type="email" className={adminField} value={customer.email} onChange={(e) => setC({ email: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Phone</span>
                <input className={adminField} value={customer.phone} onChange={(e) => setC({ phone: e.target.value })} />
              </label>
            </div>
          </AdminCard>

          <AdminCard
            title="Items"
            subtitle={`${lines.length} line${lines.length === 1 ? "" : "s"} · item names come from the catalog · click products below to add them`}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search products by name or SKU…"
                className={adminField}
                style={{ paddingLeft: "2.5rem" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {query.trim() && (
              <div className="mt-2 overflow-hidden rounded-xl border border-line">
                {matches.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No products match “{query}”.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {matches.map((p) => (
                      <li key={p.sku}>
                        <button onClick={() => addLine(p)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-safety-50">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-navy-900">{p.name}</span>
                            <span className="font-mono text-[11px] text-gray-400">{p.sku} · {p.brand}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-navy-900">
                            {formatKES(p.price)}
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-safety-500 text-white"><Plus className="h-3.5 w-3.5" /></span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {lines.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-line py-8 text-center text-sm text-gray-400">Search and add products to build the quotation.</p>
            ) : (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {lines.map((l) => (
                    <div key={l.sku} className="rounded-xl border border-line bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900">{l.name}</p>
                          <p className="font-mono text-[11px] text-gray-400">{l.sku}</p>
                        </div>
                        <button
                          onClick={() => setLines((ls) => ls.filter((x) => x.sku !== l.sku))}
                          aria-label={`Remove ${l.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Qty</span>
                          <input
                            type="number"
                            min={1}
                            value={l.qty}
                            onChange={(e) => updateLine(l.sku, { qty: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full rounded-lg border border-line px-2 py-1.5 text-center text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Unit price</span>
                          <input
                            type="number"
                            min={0}
                            value={l.price}
                            onChange={(e) => updateLine(l.sku, { price: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full rounded-lg border border-line px-2 py-1.5 text-right text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-right text-xs text-gray-500">
                        Amount: <span className="font-bold text-navy-900">{formatKES(l.price * l.qty)}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-2">Item name</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit price</th>
                        <th className="pb-2 text-right">Amount</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => (
                        <tr key={l.sku} className="border-b border-line/60 last:border-0">
                          <td className="py-2.5">
                            <p className="font-semibold text-navy-900">{l.name}</p>
                            <p className="font-mono text-[11px] text-gray-400">{l.sku}</p>
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="number"
                              min={1}
                              value={l.qty}
                              onChange={(e) => updateLine(l.sku, { qty: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-16 rounded-lg border border-line px-2 py-1.5 text-center text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                            />
                          </td>
                          <td className="py-2.5 text-right">
                            <input
                              type="number"
                              min={0}
                              value={l.price}
                              onChange={(e) => updateLine(l.sku, { price: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-28 rounded-lg border border-line px-2 py-1.5 text-right text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                            />
                          </td>
                          <td className="py-2.5 text-right font-bold text-navy-900">{formatKES(l.price * l.qty)}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => setLines((ls) => ls.filter((x) => x.sku !== l.sku))}
                              aria-label={`Remove ${l.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Options">
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Validity (days)</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={validDays}
                  onChange={(e) => setValidDays(Math.min(90, Math.max(1, Number(e.target.value) || 14)))}
                  className={adminField}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Notes</span>
                <textarea
                  rows={4}
                  className={adminField}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivery within 10 working days, excludes installation."
                />
              </label>
            </div>
          </AdminCard>

          <AdminCard title="Quotation summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Lines</dt>
                <dd>{lines.length}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Units</dt>
                <dd>{lines.reduce((n, l) => n + l.qty, 0)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-navy-900">
                <dt>Total</dt>
                <dd>{formatKES(total)}</dd>
              </div>
            </dl>
            <button
              onClick={save}
              disabled={saving || lines.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save quote"}
            </button>
            <p className="mt-3 text-center text-[11px] text-gray-400">Saved quotes can be downloaded as PDF from the quotes list.</p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
