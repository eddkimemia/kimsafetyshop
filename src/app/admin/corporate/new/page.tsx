"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { AdminCard, adminField, useFetch } from "@/components/admin/ui";

type StaffUser = { id: string; name: string; email: string; role: string };

const accountStatuses = ["Active", "Paused", "Closed"];

export default function AdminCorporateNewPage() {
  const router = useRouter();
  const { data: usersData } = useFetch<{ users: StaffUser[] }>("/api/admin/users?staff=1");
  const staff = (usersData?.users ?? []).filter((u) => u.role === "admin" || u.role === "superadmin");

  const [form, setForm] = useState({
    company: "",
    kra_pin: "",
    industry: "",
    contact_name: "",
    phone: "",
    email: "",
    password: "",
    create_login: true,
    discount_rate: 0,
    credit_terms: "30 days",
    account_manager: "",
    notes: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    if (!form.company.trim()) {
      setError("Company name is required");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    const res = await fetch("/api/admin/corporate/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: form.company,
        kra_pin: form.kra_pin || undefined,
        industry: form.industry || undefined,
        contact_name: form.contact_name || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        password: form.password || undefined,
        create_login: form.create_login,
        discount_rate: Number(form.discount_rate) || 0,
        credit_terms: form.credit_terms || "30 days",
        account_manager: form.account_manager || undefined,
        notes: form.notes || undefined,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Create failed");
      return;
    }
    if (json.tempPassword) {
      setNotice(`Account created for ${form.company}. Share this temporary password: ${json.tempPassword}`);
      setTimeout(() => {
        router.push(`/admin/corporate/${encodeURIComponent(json.account.id)}`);
        router.refresh();
      }, 1800);
    } else {
      router.push(`/admin/corporate/${encodeURIComponent(json.account.id)}`);
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/corporate" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900" aria-label="Back to corporate">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
            <Building2 className="h-5 w-5 text-safety-600" /> New corporate account
          </h1>
          <p className="text-sm text-gray-500">Company-based account with negotiated pricing and credit terms — company name is the primary identifier</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Company details" subtitle="Company name is the primary identifier — not the contact person">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Company name *</span>
            <input className={adminField} value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Acme Construction Ltd" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">KRA PIN</span>
            <input className={adminField} value={form.kra_pin} onChange={(e) => set({ kra_pin: e.target.value })} placeholder="P000000000X" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Industry</span>
            <input className={adminField} value={form.industry} onChange={(e) => set({ industry: e.target.value })} placeholder="e.g. Construction, Healthcare" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Contact person</span>
            <input className={adminField} value={form.contact_name} onChange={(e) => set({ contact_name: e.target.value })} placeholder="e.g. Jane Wanjiru — shown as secondary, not primary" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Phone</span>
            <input className={adminField} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+254 7…" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Email (for login & invoices)</span>
            <input type="email" className={adminField} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="procurement@acme.co.ke" />
          </label>
        </div>
      </AdminCard>

      <AdminCard title="Commercial terms" subtitle="Discount and credit applied at checkout for this company">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Discount %</span>
            <input type="number" min={0} max={100} className={adminField} value={form.discount_rate} onChange={(e) => set({ discount_rate: Number(e.target.value) })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Credit terms</span>
            <input className={adminField} value={form.credit_terms} onChange={(e) => set({ credit_terms: e.target.value })} placeholder="e.g. 30 days, 14 days" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Account manager — choose from existing staff</span>
            <select className={adminField} value={form.account_manager} onChange={(e) => set({ account_manager: e.target.value })}>
              <option value="">— No manager —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} — {s.email} ({s.role})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">Shows all admin/superadmin users. Custom name also allowed if not listed.</p>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Status</span>
            <select className={adminField} value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {accountStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-3">
            <span className="mb-1 block text-xs font-bold text-gray-500">Notes</span>
            <textarea className={adminField} rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Pricing notes, tender terms, delivery instructions…" />
          </label>
        </div>
      </AdminCard>

      <AdminCard title="Login">
        <div className="rounded-xl border border-line bg-surface p-4">
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={form.create_login} onChange={(e) => set({ create_login: e.target.checked })} className="mt-0.5 h-4 w-4 accent-navy-900" />
            <span className="text-xs font-semibold text-gray-600">Create a customer login for {form.email || "this email"} so they can order online</span>
          </label>
          {form.create_login && (
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Temporary password (leave blank to auto-generate)</span>
              <input className={adminField} value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="Min 6 characters" />
            </label>
          )}
        </div>
        <button onClick={submit} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Creating…" : "Create corporate account"}
        </button>
      </AdminCard>
    </div>
  );
}
