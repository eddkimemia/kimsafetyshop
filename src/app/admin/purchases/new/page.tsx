"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type LineItem = { name: string; qty: number; unitPrice: number };

const emptyItem = (): LineItem => ({ name: "", qty: 1, unitPrice: 0 });

export default function AdminNewPurchasePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    supplier: "",
    contact_name: "",
    phone: "",
    email: "",
    expected_date: "",
    shipping: 0,
    notes: "",
  });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const setItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const subtotal = items.reduce((sum, i) => sum + (i.qty || 0) * (i.unitPrice || 0), 0);
  const shipping = Math.max(0, Math.round(Number(form.shipping) || 0));
  const total = subtotal + shipping;

  const save = async () => {
    if (!form.supplier.trim()) {
      setError("Supplier name is required.");
      return;
    }
    const validItems = items
      .map((i) => ({ name: i.name.trim(), qty: Math.floor(i.qty) || 0, unitPrice: Math.round(i.unitPrice) || 0 }))
      .filter((i) => i.name && i.qty > 0);
    if (validItems.length === 0) {
      setError("Add at least one item with a name and quantity.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/supplier-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, shipping, items: validItems }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/purchases");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/purchases"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to purchase orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">New Purchase Order</h1>
            <p className="text-sm text-gray-500">Issue a purchase order to a supplier for stock</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Create Purchase Order"}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Supplier details">
        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Supplier name *</span>
            <input className={adminField} value={form.supplier} onChange={(e) => set({ supplier: e.target.value })} placeholder="e.g. SafetyFirst Suppliers Ltd" />
          </label>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Contact person</span>
              <input className={adminField} value={form.contact_name} onChange={(e) => set({ contact_name: e.target.value })} placeholder="e.g. Jane Wanjiru" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Phone</span>
              <input className={adminField} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07XX XXX XXX" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Email</span>
              <input type="email" className={adminField} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="sales@supplier.co.ke" />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Expected delivery date</span>
              <input type="date" className={adminField} value={form.expected_date} onChange={(e) => set({ expected_date: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Delivery / freight (KES)</span>
              <input type="number" min={0} className={adminField} value={form.shipping || ""} onChange={(e) => set({ shipping: Number(e.target.value) || 0 })} placeholder="0" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Notes</span>
            <textarea rows={2} className={adminField} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Payment terms, delivery instructions, reference numbers…" />
          </label>
        </div>
      </AdminCard>

      <AdminCard
        title="Items"
        subtitle="Products and quantities being purchased from the supplier"
        action={
          <button
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface"
          >
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>
        }
      >
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_90px_130px_40px] items-center gap-2.5">
              <input
                placeholder="Item name (e.g. 3M 6500QL Respirator)"
                className={adminField}
                value={item.name}
                onChange={(e) => setItem(i, { name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                placeholder="Qty"
                className={adminField}
                value={item.qty || ""}
                onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
              />
              <input
                type="number"
                min={0}
                placeholder="Unit price (KES)"
                className={adminField}
                value={item.unitPrice || ""}
                onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
              />
              <button
                onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                aria-label={`Remove item ${i + 1}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="font-bold text-navy-900">{formatKES(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Delivery / freight</dt><dd className="font-bold text-navy-900">{formatKES(shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="font-bold text-navy-900">Total</dt>
              <dd className="font-display text-lg font-extrabold text-navy-900">{formatKES(total)}</dd>
            </div>
          </dl>
        </div>
      </AdminCard>
    </div>
  );
}
