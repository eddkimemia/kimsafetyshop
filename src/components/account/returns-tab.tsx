"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderItem = { productId: string; name?: string; qty: number };
type Order = { id: string; items: OrderItem[]; status: string; created_at: string };
type ReturnRequest = {
  id: string;
  order_id: string;
  product_name: string;
  qty: number;
  reason: string;
  status: string;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

const STATUS_STYLES: Record<string, string> = {
  Requested: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-danger",
  Completed: "bg-navy-900/5 text-navy-900",
};

export function ReturnsTab() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ order_id: "", product_name: "", qty: 1, reason: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/returns").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ])
      .then(([d1, d2]) => {
        setReturns(d1.returns ?? []);
        setOrders(d2.orders ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const itemsFor = (orderId: string) => orders.find((o) => o.id === orderId)?.items ?? [];

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not submit return request");
      setReturns([d.return, ...returns]);
      setOpen(false);
      setForm({ order_id: "", product_name: "", qty: 1, reason: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit return request");
    } finally {
      setSaving(false);
    }
  };

  const eligibleOrders = orders.filter((o) => ["Processing", "In transit", "Delivered"].includes(o.status));

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy-900">Returns &amp; refunds</h2>
          <p className="text-xs text-gray-400">Items may be returned within 7 days of delivery, unopened and in original packaging.</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={eligibleOrders.length === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Request return
        </button>
      </div>

      {eligibleOrders.length === 0 && orders.length > 0 && (
        <p className="mb-4 rounded-xl bg-surface px-4 py-3 text-xs text-gray-500">
          Return requests are only available for orders that are Processing, In transit or Delivered.
        </p>
      )}

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

      {open && (
        <div className="mb-6 rounded-2xl border border-safety-200 bg-safety-50/40 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-navy-900">
              Order
              <select
                value={form.order_id}
                onChange={(e) => setForm({ order_id: e.target.value, product_name: "", qty: 1, reason: "" })}
                className={cn(inputCls, "mt-1.5")}
              >
                <option value="">Select an order…</option>
                {eligibleOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.items.length} item(s)
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Product
              <select
                value={form.product_name}
                onChange={(e) => {
                  const item = itemsFor(form.order_id).find((i) => (i.name ?? i.productId) === e.target.value);
                  setForm({ ...form, product_name: e.target.value, qty: item?.qty ?? 1 });
                }}
                disabled={!form.order_id}
                className={cn(inputCls, "mt-1.5 disabled:opacity-50")}
              >
                <option value="">Select item…</option>
                {itemsFor(form.order_id).map((i) => (
                  <option key={`${form.order_id}-${i.productId}-${i.name}`} value={i.name ?? i.productId}>
                    {i.name ?? i.productId} (ordered {i.qty})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Quantity
              <input
                type="number"
                min={1}
                max={itemsFor(form.order_id).find((i) => (i.name ?? i.productId) === form.product_name)?.qty ?? 1}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
                className={cn(inputCls, "mt-1.5")}
              />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Reason
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={cn(inputCls, "mt-1.5")}>
                <option value="">Select reason…</option>
                <option>Wrong item received</option>
                <option>Damaged in transit</option>
                <option>Defective product</option>
                <option>Changed my mind</option>
                <option>Other</option>
              </select>
            </label>
            {form.reason === "Other" && (
              <label className="block text-xs font-bold text-navy-900 sm:col-span-2">
                Describe the issue
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className={cn(inputCls, "mt-1.5")}
                />
              </label>
            )}
          </div>
          <button
            onClick={submit}
            disabled={saving || !form.order_id || !form.product_name || !form.reason || form.qty < 1}
            className="mt-4 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit return request"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading returns…</p>
      ) : returns.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No return requests yet.</p>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                    {r.id} <span className="text-xs font-semibold text-gray-400">· Order #{r.order_id}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.qty} × {r.product_name}
                  </p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold", STATUS_STYLES[r.status] ?? "bg-surface text-gray-600")}>
                  <Truck className="h-3 w-3" /> {r.status}
                </span>
              </div>
              <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-gray-600">
                <span className="font-bold text-navy-900">Reason:</span> {r.reason}
              </p>
              <p className="mt-2 text-[11px] text-gray-400">
                Requested {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} — our team will review within 1&ndash;2 working days.
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
