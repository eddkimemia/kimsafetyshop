"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  county: string;
  is_default: number;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

export function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ label: "Home", name: "", phone: "", address_line: "", city: "", county: "" });

  const load = useCallback(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d) => {
        const raw = d.addresses;
        setAddresses(Array.isArray(raw) ? raw : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not save address");
      setAddresses([...addresses, d.address]);
      setOpen(false);
      setForm({ label: "Home", name: "", phone: "", address_line: "", city: "", county: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const r = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (r.ok) load();
  };

  const makeDefault = async (id: string) => {
    const r = await fetch(`/api/addresses/${id}`, { method: "PATCH" });
    if (r.ok) load();
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-navy-900">Saved addresses</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Cancel" : "Add address"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

      {open && (
        <div className="mb-6 rounded-2xl border border-safety-200 bg-safety-50/40 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-navy-900">
              Label
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={cn(inputCls, "mt-1.5")}>
                <option>Home</option>
                <option>Office</option>
                <option>Site</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Full name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Wanjiku" className={cn(inputCls, "mt-1.5")} />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0712 345 678" className={cn(inputCls, "mt-1.5")} />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Street address
              <input value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} placeholder="Building, street, area" className={cn(inputCls, "mt-1.5")} />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              City / town
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Nairobi" className={cn(inputCls, "mt-1.5")} />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              County
              <input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="e.g. Nairobi County" className={cn(inputCls, "mt-1.5")} />
            </label>
          </div>
          <button
            onClick={submit}
            disabled={saving || !form.name || !form.address_line}
            className="mt-4 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save address"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No saved addresses yet. Add your delivery and billing addresses for faster checkout.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-xl border border-line p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-900">
                  <MapPin className="h-3 w-3" /> {a.label}
                </span>
                {a.is_default === 1 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-[10px] font-bold text-safety-700">
                    <Star className="h-3 w-3" /> Default
                  </span>
                ) : (
                  <button onClick={() => makeDefault(a.id)} className="text-[11px] font-bold text-safety-600 hover:underline">
                    Set default
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-navy-900">{a.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{a.address_line}</p>
              <p className="text-xs text-gray-500">{[a.city, a.county].filter(Boolean).join(", ") || "—"}</p>
              {a.phone && <p className="mt-0.5 text-xs text-gray-500">{a.phone}</p>}
              <button
                onClick={() => remove(a.id)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-danger hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
