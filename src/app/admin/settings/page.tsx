"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, Settings as SettingsIcon, Phone, Mail, MapPin, Clock, MessageCircle, Smartphone } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { fetchSettings, invalidateClientSettings } from "@/lib/settings";

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((s) => {
        if (alive) setIsSuperAdmin(s?.user?.role === "superadmin");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => setForm({ ...DEFAULT_SETTINGS, ...(json.settings ?? {}) }))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch("/api/uploads/documents", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Upload failed");
    set("logo", json.urls?.[0]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      // Propagate instantly: drop this tab's memo, bump the version so other
      // tabs (storage event) and branding asset cache-busters pick the new
      // logo/details up without waiting for the TTL.
      invalidateClientSettings();
      try {
        localStorage.setItem("kimsafety-settings-version", String(Date.now()));
      } catch {
        /* private mode */
      }
      await fetchSettings(true).catch(() => {});
      setNotice("Settings saved — logo, name and contact details now apply across the storefront and PDFs.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Loading…</p>;
  if (!isSuperAdmin)
    return (
      <AdminCard title="Restricted">
        <p className="py-6 text-center text-sm text-gray-400">Only the super admin can access settings.</p>
      </AdminCard>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
            <SettingsIcon className="h-5 w-5 text-safety-600" /> Settings
          </h1>
          <p className="text-sm text-gray-500">Branding and contact details used across the storefront and printed documents</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Branding" subtitle="Site name and logo — used in the header, footer and on invoices, delivery notes and quotations">
        <div className="space-y-4">
          <div>
            <label htmlFor="site_name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Site name
            </label>
            <input id="site_name" value={form.site_name} onChange={(e) => set("site_name", e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="tagline" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Tagline
            </label>
            <input id="tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo} alt="Current logo" className="max-h-full max-w-full object-contain" />
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 transition-colors hover:bg-surface">
                <ImagePlus className="h-4 w-4 text-safety-600" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogo(f).catch((err) => setError(err.message));
                  }}
                />
                Upload new logo
              </label>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">JPG, PNG or WEBP — recommended wide banner format. Applies to storefront and all PDFs.</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Contact & notifications" subtitle="Shown in the footer, top bar and printed documents; used for order and quote alerts">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Phone
              </label>
              <input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="whatsapp" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                WhatsApp number (digits only, e.g. 254715135141)
              </label>
              <input id="whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d]/g, ""))} className={field} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Email
              </label>
              <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="purchases_email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Purchases email (purchase orders)
              </label>
              <input id="purchases_email" type="email" value={form.purchases_email} onChange={(e) => set("purchases_email", e.target.value)} className={field} />
              <p className="mt-1 text-[11px] text-gray-400">Receives staff alerts for new orders and is printed on supplier order PDFs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="address" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Address
              </label>
              <textarea id="address" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} className={field} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="hours" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Working hours
              </label>
              <input id="hours" value={form.hours} onChange={(e) => set("hours", e.target.value)} className={field} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone className="mt-2.5 h-4 w-4 shrink-0 text-safety-600" />
            <div className="flex-1">
              <label htmlFor="mpesa_till" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
                M-Pesa Till Number (manual fallback payments)
              </label>
              <input id="mpesa_till" value={form.mpesa_till ?? ""} onChange={(e) => set("mpesa_till", e.target.value.replace(/\D/g, ""))} className={field} />
              <p className="mt-1 text-[11px] text-gray-400">Backup manual payment — printed on unpaid invoices only, for clients whose M-Pesa STK push or card (Paystack) checkout failed.</p>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Delivery" subtitle="Delivery fee and free-delivery threshold applied at checkout — changes take effect immediately for new orders">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="delivery_fee" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Delivery fee (KES)
            </label>
            <input
              id="delivery_fee"
              inputMode="numeric"
              value={form.delivery_fee ?? ""}
              onChange={(e) => set("delivery_fee", e.target.value.replace(/[^\d]/g, ""))}
              className={field}
              placeholder="350"
            />
          </div>
          <div>
            <label htmlFor="free_delivery_threshold" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Free delivery from (KES subtotal)
            </label>
            <input
              id="free_delivery_threshold"
              inputMode="numeric"
              value={form.free_delivery_threshold ?? ""}
              onChange={(e) => set("free_delivery_threshold", e.target.value.replace(/[^\d]/g, ""))}
              className={field}
              placeholder="10000"
            />
            <p className="mt-1 text-[11px] text-gray-400">Set 0 to disable free delivery.</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
